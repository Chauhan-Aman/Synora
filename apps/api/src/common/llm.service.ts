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

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  public static readonly OLLAMA_URL = 'http://localhost:11434/api/generate';
  public static readonly OLLAMA_CHAT_URL = 'http://localhost:11434/api/chat';
  public static readonly EMBEDDING_URL = 'http://localhost:11434/api/embeddings';

  constructor(private readonly toolRegistry: ToolRegistryService) {}

  /**
   * Generates a single string response.
   */
  async generateText(req: OllamaRequest, timeoutMs = 120_000): Promise<string> {
    const targetModel = ModelRouter.getBestModel(req.modelType, req.modelParam);
    
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

    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
    
    const data = await res.json();
    return data.response;
  }

  /**
   * Streams generation to an Express Response using Server-Sent Events.
   */
  async streamToResponse(req: OllamaRequest, res: Response, timeoutMs = 180_000): Promise<void> {
    const targetModel = ModelRouter.getBestModel(req.modelType, req.modelParam);

    const generateResponse = await fetch(LlmService.OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel,
        prompt: req.prompt,
        stream: true,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!generateResponse.ok) {
      throw new Error(`Failed to reach Ollama: ${generateResponse.status}`);
    }

    if (generateResponse.body) {
      const reader = generateResponse.body.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.trim() !== '');
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                res.write(`data: ${JSON.stringify({ type: 'text', text: data.response })}\n\n`);
              }
            } catch (e) {
              // Ignore invalid JSON in chunks
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
  }

  /**
   * Agentic Loop: Chats using the native Ollama /api/chat endpoint with tools support.
   */
  async chatWithTools(
    modelType: 'REASONING' | 'EXTRACTION' | 'DRAFTING',
    modelParam: string | undefined,
    messages: ChatMessage[],
    res: Response,
    onToolCall?: (toolName: string, args: any) => void,
    onToolResult?: (toolName: string, result: string) => void,
  ): Promise<void> {
    const targetModel = ModelRouter.getBestModel(modelType, modelParam);
    const tools = this.toolRegistry.getAllOllamaTools();

    let loopSafety = 0;
    const maxLoops = 5;

    while (loopSafety < maxLoops) {
      loopSafety++;
      
      this.logger.log(`[Agent Loop ${loopSafety}] Calling Ollama API /api/chat`);
      
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
      
      messages.push(assistantMessage);

      // Check if the LLM decided to use a tool
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const args = toolCall.function.arguments;
          
          if (onToolCall) onToolCall(functionName, args);

          // Execute the tool
          const result = await this.toolRegistry.executeTool(functionName, args);
          
          if (onToolResult) onToolResult(functionName, result);

          // Push the tool result back into the conversation
          messages.push({
            role: 'tool',
            content: result,
          });
        }
        // Loop continues to let the LLM evaluate the tool results
      } else {
        // No tool calls means the LLM is giving the final answer!
        // We will send this final answer down the SSE stream.
        // (Since we used stream: false for the loop, we just push the whole chunk now, or we could stream the final response, but this is simpler for the agentic loop)
        res.write(`data: ${JSON.stringify({ type: "text", text: assistantMessage.content || "I apologize, but I could not formulate a response." })}\n\n`);
        break;
      }
    }
    
    if (loopSafety >= maxLoops) {
      res.write(`data: ${JSON.stringify({ type: 'text', text: '\n\n[Agent stopped to prevent infinite tool looping]' })}\n\n`);
    }
  }
}
