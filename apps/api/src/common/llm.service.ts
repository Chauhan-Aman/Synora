import { Injectable, Logger } from '@nestjs/common';
import { ModelRouter } from './model-router';
import type { Response } from 'express';

export interface OllamaRequest {
  modelType: 'REASONING' | 'EXTRACTION' | 'DRAFTING';
  modelParam?: string;
  prompt: string;
  stream?: boolean;
  format?: string;
  images?: string[];
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  public static readonly OLLAMA_URL = 'http://localhost:11434/api/generate';
  public static readonly EMBEDDING_URL = 'http://localhost:11434/api/embeddings';

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
}
