import { Controller, Post, Body, HttpException, HttpStatus, Logger, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ModelRouter } from '../common/model-router';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CaptureService } from '../capture/capture.service';
import { WebSearchService } from './web-search.service';
import { LlmService } from '../common/llm.service';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly captureService: CaptureService,
    private readonly webSearch: WebSearchService,
    private readonly llmService: LlmService,
  ) {}

  @Post()
  async chat(
    @Body('query') query: string, 
    @Body('history') history: any[], 
    @CurrentUser() user: any,
    @Res() res: Response,
    @Body('forceWebSearch') forceWebSearch?: boolean,
    @Body('model') modelParam?: string
  ) {
    if (!query) {
      throw new HttpException('Query is required', HttpStatus.BAD_REQUEST);
    }

    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const sendLog = (action: string, status: string, message: string) => {
        res.write(`data: ${JSON.stringify({ type: 'log', log: { action, status, message } })}\n\n`);
      };

      let searchQuery = query;
      const agentLogs: { action: string; status: 'done' | 'error'; message: string }[] = [];

      if (history && history.length > 0) {
        const historyText = history.slice(-6).map(m => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`).join('\n');
        const rewritePrompt = `Given the following conversation history, rewrite the user's latest query to be a standalone search query. Replace pronouns (he, she, it, they) with the actual entities they refer to from the history. DO NOT answer the question, ONLY return the rewritten query text.
        
History:
${historyText}

Latest Query: ${query}

Rewritten Query:`;

        try {
          searchQuery = await this.llmService.generateText({
            modelType: 'REASONING',
            modelParam: modelParam,
            prompt: rewritePrompt
          });
          searchQuery = searchQuery.trim();
          this.logger.log(`Rewrote query for search: "${searchQuery}"`);
          const logMsg = { action: 'Query Rewrite', status: 'done', message: `Rewrote query to: "${searchQuery}"` };
          agentLogs.push(logMsg as any);
          sendLog(logMsg.action, logMsg.status, logMsg.message);
        } catch (e) {
          this.logger.error("Failed to rewrite query", e);
          const logMsg = { action: 'Query Rewrite', status: 'error', message: 'Failed to rewrite query.' };
          agentLogs.push(logMsg as any);
          sendLog(logMsg.action, logMsg.status, logMsg.message);
        }
      }

      this.logger.log(`Embedding user query: "${searchQuery}"`);
      // 1. Embed the query using Nomic Embed
      const embeddingResponse = await fetch(LlmService.EMBEDDING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          prompt: searchQuery,
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error('Failed to get embeddings from Ollama');
      }

      const embedData = await embeddingResponse.json();
      const vector = embedData.embedding;
      const vectorString = `[${vector.join(',')}]`;

      // 2. Perform Hybrid Search using Reciprocal Rank Fusion (RRF)
      this.logger.log(`Performing Hybrid Search (BM25 + Vector) for relevant chunks for user ${user.userId}...`);
      
      const relevantChunks = await this.prisma.$queryRaw<any[]>`
        WITH vector_results AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> ${vectorString}::vector) as vector_rank
          FROM "Chunk"
          WHERE "userId" = ${user.userId} AND embedding IS NOT NULL
          ORDER BY vector_rank
          LIMIT 20
        ),
        keyword_results AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank_cd("searchVector", plainto_tsquery('english', ${searchQuery})) DESC) as keyword_rank
          FROM "Chunk"
          WHERE "userId" = ${user.userId} AND "searchVector" @@ plainto_tsquery('english', ${searchQuery})
          ORDER BY keyword_rank
          LIMIT 20
        )
        SELECT 
          c.id, 
          c.text as content,
          a."sourceUrl" as "sourceUrl",
          COALESCE(1.0 / (60 + vr.vector_rank), 0.0) + COALESCE(1.0 / (60 + kr.keyword_rank), 0.0) as rrf_score
        FROM "Chunk" c
        JOIN "Artifact" a ON c."artifactId" = a.id
        LEFT JOIN vector_results vr ON c.id = vr.id
        LEFT JOIN keyword_results kr ON c.id = kr.id
        WHERE vr.id IS NOT NULL OR kr.id IS NOT NULL
        ORDER BY rrf_score DESC
        LIMIT 5;
      `;

      // 3. Construct the Initial Context
      let contextText = "";
      let sources: string[] = [];
      
      if (relevantChunks.length > 0) {
        contextText = relevantChunks
          .map((c, i) => `[Local Source ${i + 1}] (${c.sourceUrl || 'Text Snippet'}):\n${c.content}`)
          .join('\n\n');
        
        const allSources = relevantChunks.map(c => c.sourceUrl || 'Local Text Snippet');
        sources = [...new Set(allSources)];
      }

      // --- AGENTIC WEB SEARCH FALLBACK ---
      this.logger.log("Agent evaluating if local context is sufficient...");
      const logMsgEval = { action: 'Context Evaluation', status: 'done', message: 'Evaluating if local context is sufficient to answer the question...' };
      agentLogs.push(logMsgEval as any);
      sendLog(logMsgEval.action, logMsgEval.status, logMsgEval.message);
      
      const evalPrompt = `Does the following context contain sufficient information to answer the user's question?
Context:
${contextText || "No context provided."}

Question: ${searchQuery}

Reply with ONLY the word "YES" or "NO".`;

      let needsWebSearch = forceWebSearch || false; 
      
      if (!forceWebSearch && contextText) {
        try {
          const responseText = await this.llmService.generateText({
            modelType: 'REASONING',
            modelParam: modelParam,
            prompt: evalPrompt
          });
          const responseWord = responseText.trim().toUpperCase();
          needsWebSearch = responseWord.includes('NO');
          this.logger.log(`Agent evaluation result: ${responseWord} -> Needs Web Search: ${needsWebSearch}`);
          const msg2 = { action: 'Context Evaluation', status: 'done', message: `LLM decided local context is ${needsWebSearch ? 'insufficient' : 'sufficient'}.` };
          agentLogs.push(msg2 as any);
          sendLog(msg2.action, msg2.status, msg2.message);
        } catch(e) {
          this.logger.error("Failed to evaluate context", e);
        }
      } else if (!contextText) {
        needsWebSearch = true;
        const msg2 = { action: 'Context Evaluation', status: 'done', message: 'No local context found. Forcing web search.' };
        agentLogs.push(msg2 as any);
        sendLog(msg2.action, msg2.status, msg2.message);
      } else if (forceWebSearch) {
        const msg2 = { action: 'Context Evaluation', status: 'done', message: 'User explicitly forced a web search.' };
        agentLogs.push(msg2 as any);
        sendLog(msg2.action, msg2.status, msg2.message);
      }

      if (needsWebSearch) {
        this.logger.log(`Executing Autonomous Web Search for: "${searchQuery}"`);
        const msg3 = { action: 'Web Search', status: 'done', message: `Searching DuckDuckGo for "${searchQuery}"` };
        agentLogs.push(msg3 as any);
        sendLog(msg3.action, msg3.status, msg3.message);
        
        try {
          const webResults = await this.webSearch.search(searchQuery, 3);

          webResults.forEach((result, i) => {
            contextText += `\n\n[Web Result ${i + 1}] (${result.url}):\n${result.content}`;
            sources.push(result.url);

            const msg4 = { action: 'Web Scrape', status: 'done', message: `Read context from: ${result.title}` };
            agentLogs.push(msg4 as any);
            sendLog(msg4.action, msg4.status, msg4.message);

            // Asynchronously persist to Knowledge Graph
            this.captureService
              .create({ type: 'WEB_SEARCH', sourceUrl: result.url }, user.userId)
              .catch((e: any) =>
                this.logger.error(`Capture queue failed for ${result.url}: ${e.message}`),
              );
          });
        } catch (searchErr: any) {
          this.logger.error('Web search failed', searchErr);
          const msg6 = { action: 'Web Search', status: 'error', message: 'Web search failed — answering from memory.' };
          agentLogs.push(msg6 as any);
          sendLog(msg6.action, msg6.status, msg6.message);
        }
      }

      const prompt = `You are Synora, an intelligent and friendly personal assistant. 
You have access to the user's personal knowledge graph, and you can also autonomously search the web if needed.

If the user is just saying hello or asking a general conversational question, answer in a friendly, conversational manner.
If the user is asking a question that requires specific knowledge, try to answer it using the provided context below. 
If the context does not contain the answer, you may use your own general knowledge to answer, but please mention that you are doing so.

CONTEXT:
${contextText || "No context available."}

CONVERSATION HISTORY:
${history && history.length > 0 ? history.slice(-8).map(m => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`).join('\n') : ''}
USER: ${query}
ASSISTANT:`;

      this.logger.log(`Generating final answer...`);
      
      res.write(`data: ${JSON.stringify({ type: 'metadata', sources })}\n\n`);

      // 4. Generate the final answer using Llama (streaming)
      await this.llmService.streamToResponse({
        modelType: 'REASONING',
        modelParam: modelParam,
        prompt: prompt,
        stream: true
      }, res);
      
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      this.logger.log(`Stream complete for: "${searchQuery}"`);

    } catch (error) {
      this.logger.error(`Chat error: ${(error as Error).message}`);
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to communicate with local AI' });
      } else {
        res.end();
      }
    }
  }
}
