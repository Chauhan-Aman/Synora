import { Injectable, Logger } from '@nestjs/common';
import { ModelRouter } from './model-router';
import type { Response } from 'express';
import { ToolRegistryService } from './tools/tool-registry.service';

export interface OllamaRequest {
  modelType: 'REASONING' | 'EXTRACTION' | 'DRAFTING';
  modelParam?: string;
  prompt: string;
  stream?: boolean;
  format?: string;
  images?: string[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
}

export interface AgentLoopCallbacks {
  /** Called immediately when the LLM requests a tool call (before execution). */
  onToolCall?: (toolName: string, args: any) => void;
  /** Called after a tool has been executed and a result is available. */
  onToolResult?: (toolName: string, result: string) => void;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  public static readonly OLLAMA_URL = `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/generate`;
  public static readonly OLLAMA_CHAT_URL = `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/chat`;
  public static readonly EMBEDDING_URL = `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/embeddings`;

  /** Maximum number of agent reasoning loops before forcing a response. */
  private static readonly MAX_AGENT_LOOPS = 8;

  constructor(private readonly toolRegistry: ToolRegistryService) {}

  /**
   * Generates a single text response from the LLM without streaming.
   * Suitable for quick extraction, routing, and evaluation tasks.
   */
  async generateText(req: OllamaRequest, timeoutMs = 300_000): Promise<string> {
    const targetModel = ModelRouter.getBestModel(req.modelType, req.modelParam);
    this.logger.log(`[generateText] Using model: ${targetModel} | task: ${req.modelType}`);

    const body: any = {
      model: targetModel,
      prompt: req.prompt,
      stream: false,
    };
    if (req.format) body.format = req.format;
    if (req.images) body.images = req.images;

    const res = await fetch(LlmService.OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => res.statusText);
      this.logger.error(`[generateText] Ollama error ${res.status}: ${errBody}`);
      throw new Error(`Ollama error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    return data.response ?? '';
  }

  /**
   * Streams token-by-token generation to an Express SSE Response.
   * Uses the /api/generate endpoint. Only suitable for simple generation
   * tasks that do not require tool calling.
   */
  async streamToResponse(
    req: OllamaRequest,
    res: Response,
    timeoutMs = 180_000,
  ): Promise<void> {
    const targetModel = ModelRouter.getBestModel(req.modelType, req.modelParam);
    this.logger.log(`[streamToResponse] Using model: ${targetModel}`);

    let generateResponse: globalThis.Response;
    try {
      generateResponse = await fetch(LlmService.OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: targetModel, prompt: req.prompt, stream: true }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err: any) {
      this.logger.error(`[streamToResponse] Fetch failed: ${err.message}`);
      res.write(`data: ${JSON.stringify({ type: 'error', text: 'Model unreachable. Please try again.' })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      return;
    }

    if (!generateResponse.ok) {
      const body = await generateResponse.text().catch(() => generateResponse.statusText);
      this.logger.error(`[streamToResponse] Ollama error ${generateResponse.status}: ${body}`);
      res.write(`data: ${JSON.stringify({ type: 'error', text: `Ollama error: ${body}` })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      return;
    }

    if (generateResponse.body) {
      const reader = generateResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          let result: ReadableStreamReadResult<Uint8Array>;
          try {
            result = await reader.read();
          } catch (streamErr: any) {
            // Ollama closed the stream unexpectedly (EOF) — this is non-fatal
            this.logger.warn(`[streamToResponse] Stream ended unexpectedly: ${streamErr.message}`);
            break;
          }

          if (result.done) break;

          buffer += decoder.decode(result.value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // keep incomplete last line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.response) {
                res.write(`data: ${JSON.stringify({ type: 'text', text: data.response })}\n\n`);
              }
            } catch {
              // Ignore malformed JSON chunks from the stream
            }
          }
        }
      } finally {
        reader.releaseLock();
        // Always send the done signal so the frontend unblocks
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      }
    }
  }

  /**
   * Fully autonomous Agentic Loop using Ollama's /api/chat with native tool calling.
   *
   * The LLM can autonomously call any registered tool (web_search, web_scrape,
   * knowledge_graph_search, code_runner, calculator) multiple times until it
   * has enough information to produce its final answer.
   *
   * The final answer is written to the SSE Response when the LLM stops calling tools.
   *
   * @param modelType     Task category for model routing
   * @param modelParam    Optional user-overridden model name
   * @param messages      Initial conversation array (system + history + user query)
   * @param res           Express Response for SSE streaming
   * @param userId        The authenticated user's ID, required for user-scoped tools
   * @param callbacks     Optional hooks for streaming tool call progress to the UI
   */
  async chatWithTools(
    modelType: 'REASONING' | 'EXTRACTION' | 'DRAFTING',
    modelParam: string | undefined,
    messages: ChatMessage[],
    res: Response,
    userId: string,
    callbacks: AgentLoopCallbacks = {},
  ): Promise<string> {
    const targetModel = ModelRouter.getBestModel(modelType, modelParam);
    const tools = this.toolRegistry.getOllamaToolsForUser(userId);

    this.logger.log(
      `[AgentLoop] Starting for user [${userId}] with model [${targetModel}] and ${tools.length} tools.`,
    );

    let loopCount = 0;

    while (loopCount < LlmService.MAX_AGENT_LOOPS) {
      loopCount++;
      this.logger.log(`[AgentLoop] Iteration ${loopCount}/${LlmService.MAX_AGENT_LOOPS}`);

      const chatResponse = await fetch(LlmService.OLLAMA_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          messages,
          tools: tools.length > 0 ? tools : undefined,
          stream: false,
        }),
        signal: AbortSignal.timeout(180_000),
      });

      if (!chatResponse.ok) {
        throw new Error(`Ollama chat error: ${chatResponse.statusText}`);
      }

      const data = await chatResponse.json();
      const assistantMessage = data.message;

      // Add the LLM's response to the conversation history
      messages.push(assistantMessage);

      const hasToolCalls =
        assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0;

      if (hasToolCalls) {
        // --- TOOL EXECUTION PHASE ---
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName: string = toolCall.function.name;
          const args: Record<string, any> = toolCall.function.arguments ?? {};

          if (callbacks.onToolCall) callbacks.onToolCall(functionName, args);

          const result = await this.toolRegistry.executeToolForUser(
            functionName,
            args,
            userId,
          );

          if (callbacks.onToolResult) callbacks.onToolResult(functionName, result);

          // Inject the tool result into the conversation so the LLM can reason over it
          messages.push({ role: 'tool', content: result });
        }
        // Continue the loop — the LLM will now reason over the tool results
      } else {
        // --- FINAL ANSWER PHASE ---
        // The LLM decided it has enough information and is giving the final response.
        const finalText =
          assistantMessage.content ||
          'I was unable to formulate a response. Please try rephrasing your question.';

        res.write(
          `data: ${JSON.stringify({ type: 'text', text: finalText })}\n\n`,
        );
        this.logger.log(`[AgentLoop] Completed after ${loopCount} iteration(s).`);
        return finalText;
      }
    }

    // Safety net: LLM hit the max loop limit without giving a final answer
    this.logger.warn(
      `[AgentLoop] Hit max loop limit (${LlmService.MAX_AGENT_LOOPS}) for user [${userId}]. Forcing completion.`,
    );
    const fallbackText = '\n\n[Agent reached its reasoning limit. Please try a simpler query or check tool availability.]';
    res.write(
      `data: ${JSON.stringify({ type: 'text', text: fallbackText })}\n\n`,
    );
    return fallbackText;
  }
}
