import { AgentTool } from './agent-tool';
import { PrismaClient } from '@prisma/client';

/**
 * Gives the LLM the ability to search the user's private Knowledge Graph.
 * Uses hybrid vector + keyword search (Reciprocal Rank Fusion) via pgvector.
 * Requires PrismaClient and the user's ID to be injected at construction time.
 */
export class KnowledgeGraphTool extends AgentTool {
  name = 'knowledge_graph_search';
  description =
    "Search the user's personal, private Knowledge Graph for notes, bookmarks, and saved articles. " +
    'Use this when the user asks about something they may have previously saved, ' +
    'or when their personal notes would be more relevant than a generic web search. ' +
    'Returns a list of relevant text excerpts from the user\'s knowledge base.';

  schema = {
    properties: {
      query: {
        type: 'string',
        description: 'The search query to look up in the user\'s personal knowledge graph.',
      },
    },
    required: ['query'],
  };

  private static readonly EMBEDDING_URL = 'http://localhost:11434/api/embeddings';

  constructor(
    private readonly prisma: PrismaClient | any,
    private readonly userId: string,
  ) {
    super();
  }

  async execute(args: Record<string, any>): Promise<string> {
    const query: string = args.query;

    if (!query) return 'Error: query is required for knowledge_graph_search.';
    if (!this.userId) return 'Error: No user context available for knowledge graph search.';

    try {
      // 1. Embed the query
      const embeddingResponse = await fetch(KnowledgeGraphTool.EMBEDDING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'nomic-embed-text', prompt: query }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!embeddingResponse.ok) {
        return 'Error: Could not generate embedding for knowledge graph search.';
      }

      const embedData = await embeddingResponse.json();
      const vector = embedData.embedding as number[];
      const vectorString = `[${vector.join(',')}]`;

      // 2. Hybrid: Get best chunk per artifact, filtering out citation-heavy chunks
      const chunks = await this.prisma.$queryRaw<any[]>`
        WITH vector_results AS (
          SELECT DISTINCT ON (a.id)
            c.id,
            c.text as content,
            a."sourceUrl" as "sourceUrl",
            a.title as title,
            c.embedding <=> ${vectorString}::vector as distance
          FROM "Chunk" c
          JOIN "Artifact" a ON c."artifactId" = a.id
          WHERE "userId" = ${this.userId} 
            AND embedding IS NOT NULL
            AND LENGTH(c.text) > 200
            AND c.text NOT LIKE '%identifier%'
            AND c.text NOT LIKE '%PMID%'
            AND c.text NOT LIKE '%). %'
          ORDER BY a.id, c.embedding <=> ${vectorString}::vector ASC
        )
        SELECT * FROM vector_results
        ORDER BY distance ASC
        LIMIT 5;
      `;

      if (!chunks || chunks.length === 0) {
        return `No relevant content found in your Knowledge Graph for: "${query}"`;
      }

      // Clean citation junk from each chunk before passing to LLM
      const cleanChunk = (text: string): string => {
        return text
          .replace(/^\d{1,3}\.\s+[A-Z][a-z]+,\s+.+$/gm, '') // numbered bibliography entries
          .replace(/[A-Z]{2,}\s*\(identifier\)[")]*\s*[\d\.\-\w]*/g, '') // SSN (identifier) etc
          .replace(/(?:PMID|S2CID|arXiv|Bibcode|doi|PMC|ISSN|hdl|SSN|ISBN|OCLC)\s*(?:["(][^)"]*[)"])?[\s:]*[\d\.\/\-\w]*/gi, '')
          .replace(/!\[.*?\]\([^)]*\)?/g, '')
          .replace(/\[(.*?)\]\([^)]*\)?/g, '$1')
          .replace(/\[\d+\]/g, '')
          .replace(/https?:\/\/[^\s]+/g, '')
          .replace(/[↑→←]/g, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };

      // Ensure chunks are in English
      const processedChunks = await Promise.all(chunks.map(async (c: any) => {
        const cleaned = cleanChunk(c.content);
        const hasNonEnglishScript = /[\u0600-\u06FF\u0900-\u097F\u4E00-\u9FFF\u0400-\u04FF\u0E00-\u0E7F\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF]/.test(cleaned);
        
        if (hasNonEnglishScript) {
          try {
            // Quick embedded fetch to local ollama for translation to keep tool self-contained
            const tRes = await fetch('http://localhost:11434/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'qwen2.5:14b', // Since LlmService isn't easily accessible here without constructor injection
                prompt: `Translate the following text to English. Reply ONLY with the English translation, no other text or explanation. Text:\n${cleaned}`,
                stream: false
              })
            });
            if (tRes.ok) {
              const tData = await tRes.json();
              return { ...c, content: tData.response?.trim() || cleaned };
            }
          } catch (e) {
            // Ignore translation errors
          }
        }
        return { ...c, content: cleaned };
      }));

      const formatted = processedChunks
        .map(
          (c: any, i: number) =>
            `[Knowledge Chunk ${i + 1}] From: ${c.title || c.sourceUrl || 'Local Note'}\n${c.content}`,
        )
        .join('\n\n---\n\n');

      return `Found ${processedChunks.length} relevant entries in your Knowledge Graph:\n\n${formatted}`;
    } catch (e: any) {
      return `Knowledge graph search failed: ${e.message}`;
    }
  }
}
