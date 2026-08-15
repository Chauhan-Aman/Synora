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
      this.logger.log(`Searching vector database for relevant chunks for user ${user.userId}...`);
      
      const relevantChunks = await this.prisma.$queryRaw<any[]>`
        SELECT 
          c.id, 
          c.text as content, 
          a."sourceUrl" as "sourceUrl", 
          1 - (c.embedding <=> ${vectorString}::vector) as similarity
        FROM "Chunk" c
        JOIN "Artifact" a ON c."artifactId" = a.id
        WHERE c.embedding IS NOT NULL AND c."userId" = ${user.userId}
        ORDER BY c.embedding <=> ${vectorString}::vector
        LIMIT 5
      `;

      // 3. Construct the RAG Prompt
      let contextText = "No personal knowledge captured yet.";
      let sources: string[] = [];
      
      if (relevantChunks.length > 0) {
        contextText = relevantChunks
          .map((c, i) => `[Source ${i + 1}] (${c.sourceUrl || 'Text Snippet'}):\n${c.content}`)
          .join('\n\n');
        
        // Extract unique sources
        const allSources = relevantChunks.map(c => c.sourceUrl || 'Text Snippet');
        sources = [...new Set(allSources)];
      }

      const prompt = `
You are Synora, an intelligent and friendly personal assistant. 
You have access to the user's personal knowledge graph. 

If the user is just saying hello or asking a general conversational question, answer in a friendly, conversational manner.
If the user is asking a question that requires specific knowledge, answer it using ONLY the provided context below.
If the context does not contain the answer, politely state that you cannot find the answer in their knowledge graph.

CONTEXT:
${contextText}

QUESTION:
${query}
`;

      this.logger.log(`Asking Ollama (llama3.2) with ${relevantChunks.length} sources...`);
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
        sources: sources
      };

    } catch (error) {
      this.logger.error(`Chat error: ${(error as Error).message}`);
      throw new HttpException('Failed to communicate with local AI', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
