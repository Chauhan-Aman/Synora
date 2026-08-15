import { Controller, Post, Body, HttpException, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async chat(@Body('query') query: string, @CurrentUser() user: any) {
    if (!query) {
      throw new HttpException('Query is required', HttpStatus.BAD_REQUEST);
    }

    try {
      this.logger.log(`Embedding user query: "${query}"`);
      // 1. Embed the query using Nomic Embed
      const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          prompt: query,
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error('Failed to get embeddings from Ollama');
      }

      const embedData = await embeddingResponse.json();
      const vector = embedData.embedding;
      const vectorString = `[${vector.join(',')}]`;

      // 2. Perform Vector Search (Cosine Distance <=> or Euclidean <->)
      this.logger.log(`Searching vector database for relevant artifacts for user ${user.userId}...`);
      
      const relevantArtifacts = await this.prisma.$queryRaw<any[]>`
        SELECT id, content, "sourceUrl", 1 - (embedding <=> ${vectorString}::vector) as similarity
        FROM "Artifact"
        WHERE embedding IS NOT NULL AND "userId" = ${user.userId}
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT 3
      `;

      if (relevantArtifacts.length === 0) {
        return { response: "I couldn't find any relevant context in your knowledge graph to answer that question." };
      }

      // 3. Construct the RAG Prompt
      const contextText = relevantArtifacts
        .map((a, i) => `[Source ${i + 1}] (${a.sourceUrl || 'Text Snippet'}):\n${a.content}`)
        .join('\n\n');

      const prompt = `
You are Synora, an intelligent assistant. Answer the user's question using ONLY the provided context from their personal knowledge graph.
If the answer is not in the context, say you don't know. Be concise but highly helpful. Cite your sources using [Source 1], etc.

CONTEXT:
${contextText}

QUESTION:
${query}
`;

      this.logger.log(`Asking Ollama (llama3.2) with ${relevantArtifacts.length} sources...`);
      // 4. Generate the final answer using Llama
      const generateResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: prompt,
          stream: false,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate answer from Ollama');
      }

      const generationData = await generateResponse.json();
      
      return { 
        response: generationData.response,
        sources: relevantArtifacts.map(a => a.sourceUrl || 'Text Snippet')
      };

    } catch (error) {
      this.logger.error(`Chat error: ${(error as Error).message}`);
      throw new HttpException('Failed to communicate with local AI', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
