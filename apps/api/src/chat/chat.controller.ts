import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { LlmService } from '../common/llm.service';

import { PrismaService } from '../prisma/prisma.service';

/**
 * ChatController — the primary entry point for the Synora AI chat interface.
 *
 * Architecture:
 * - Accepts a user query, conversation history, and optional model preference.
 * - Immediately opens an SSE stream to the frontend for real-time progress.
 * - Builds a rich system prompt and delegates ALL reasoning and tool orchestration
 *   to the LlmService agentic loop (chatWithTools).
 * - The LLM itself decides when to search the web, read URLs, query the knowledge
 *   graph, run code, or perform calculations — without any hardcoded branching here.
 *
 * This follows the "Thin Controller, Fat Service" architectural principle.
 */
//@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async chat(
    @Body('query') query: string,
    @Body('history') history: any[],
    @Body('sessionId') clientSessionId: string | undefined,
    @CurrentUser() user: any,
    @Res() res: Response,
    @Body('model') modelParam?: string,
  ) {
    if (!query?.trim()) {
      throw new HttpException('Query is required', HttpStatus.BAD_REQUEST);
    }

    const userId: string = user?.userId ?? 'anonymous';

    try {
      // --- Session Management ---
      let sessionId = clientSessionId;
      
      // We only save to DB if it's a real logged-in user
      if (userId !== 'anonymous') {
        if (!sessionId) {
          // Create a new session
          const newSession = await this.prisma.chatSession.create({
            data: { 
              userId,
              title: query.substring(0, 50) + (query.length > 50 ? '...' : '') 
            }
          });
          sessionId = newSession.id;
        }

        // Save the user's incoming message
        await this.prisma.chatMessage.create({
          data: {
            sessionId: sessionId!,
            role: 'user',
            content: query
          }
        });
      }

      // --- SSE Setup ---
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      
      // Tell frontend about the session ID so it can append future messages to it
      if (sessionId) {
        res.write(`data: ${JSON.stringify({ type: 'session_info', sessionId })}\n\n`);
      }

      const sendLog = (
        action: string,
        status: 'pending' | 'done' | 'error',
        message: string,
      ) => {
        res.write(
          `data: ${JSON.stringify({ type: 'log', log: { action, status, message } })}\n\n`,
        );
      };

      this.logger.log(`[Chat] User [${userId}] query: "${query}" (Session: ${sessionId || 'none'})`);

      // --- Build conversation messages ---
      // We still pass the frontend history for the LLM context to keep things fast,
      // but in the future we could load it from Prisma if we want.
      const historyMessages =
        history && history.length > 0
          ? history
              .slice(-8)
              .map((m: any) => ({ role: m.role, content: m.content ?? '' }))
          : [];

      const systemPrompt = `You are Synora, an intelligent personal assistant with access to a suite of powerful tools.

You have access to the following tools and you should use them proactively when needed:
- knowledge_graph_search: Search the user's private saved notes and bookmarks. ALWAYS try this first before searching the web.
- web_search: Search DuckDuckGo for current information. Use this if knowledge_graph_search is insufficient or the user needs fresh data.
- web_scrape: Read the full content of a specific URL. Use this after web_search to get more detailed information from a result.
- calculator: Evaluate mathematical expressions precisely.
- code_runner: Write and execute Python scripts for data analysis, computations, or any programming task.

Guidelines:
1. For personal questions ("what did I save about X"), ALWAYS call knowledge_graph_search first.
2. For current events or general knowledge, call web_search, then web_scrape the most relevant result.
3. For mathematical or computational tasks, use calculator or code_runner.
4. Chain tools naturally — search first, scrape to get details, then synthesize the answer.
5. Be concise, helpful, and transparent about your sources.
6. If tools fail, answer from your general knowledge and note the limitation.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: query },
      ];

      sendLog('Thinking', 'done', 'Analyzed your query — selecting the best approach...');

      // --- Delegate to the Autonomous Agentic Loop ---
      const finalAssistantText = await this.llmService.chatWithTools(
        'REASONING',
        modelParam,
        messages as any,
        res,
        userId,
        {
          onToolCall: (toolName, args) => {
            this.logger.log(`[Agent] Calling tool: [${toolName}]`);
            const toolLabels: Record<string, string> = {
              web_search: `Searching the web for: "${args.query}"`,
              web_scrape: `Reading page: ${args.url}`,
              knowledge_graph_search: `Searching your knowledge graph for: "${args.query}"`,
              code_runner: 'Running Python script...',
              calculator: `Calculating: ${args.expression}`,
            };
            sendLog(
              this.formatToolName(toolName),
              'pending',
              toolLabels[toolName] ?? `Executing ${toolName}...`,
            );
          },
          onToolResult: (toolName, result) => {
            this.logger.log(
              `[Agent] Tool [${toolName}] returned ${result.length} chars.`,
            );
            sendLog(
              this.formatToolName(toolName),
              'done',
              `${this.formatToolName(toolName)} completed.`,
            );
          },
        },
      );

      // Save the assistant's final response to the database
      if (userId !== 'anonymous' && sessionId) {
        await this.prisma.chatMessage.create({
          data: {
            sessionId: sessionId,
            role: 'assistant',
            content: finalAssistantText
          }
        });
      }

      sendLog('Generating', 'done', 'Response complete.');

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      this.logger.log(`[Chat] Stream complete for user [${userId}].`);
    } catch (error: any) {
      this.logger.error(`[Chat] Error for user [${userId}]: ${error.message}`, error.stack);

      if (!res.headersSent) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Failed to communicate with local AI.' });
      } else {
        res.write(
          `data: ${JSON.stringify({
            type: 'text',
            text: '\n\n**System Error:** Failed to connect to the local AI. Please ensure Ollama is running (`ollama serve`) and the selected model has been pulled.',
          })}\n\n`,
        );
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
      }
    }
  }

  @Get('sessions')
  async getSessions(@CurrentUser() user: any) {
    if (!user?.userId) return [];
    
    return this.prisma.chatSession.findMany({
      where: { userId: user.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  @Get('sessions/:id')
  async getSessionMessages(@Param('id') sessionId: string, @CurrentUser() user: any) {
    if (!user?.userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session || session.userId !== user.userId) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    return session;
  }

  /**
   * Converts a snake_case tool name into a human-readable label for the UI.
   */
  private formatToolName(toolName: string): string {
    const labels: Record<string, string> = {
      web_search: 'Web Search',
      web_scrape: 'Web Scrape',
      knowledge_graph_search: 'Knowledge Graph',
      code_runner: 'Code Execution',
      calculator: 'Calculator',
    };
    return labels[toolName] ?? toolName;
  }
}
