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

      // 2. Hybrid Reciprocal Rank Fusion search
      const chunks = await this.prisma.$queryRaw<any[]>`
        WITH vector_results AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> ${vectorString}::vector) as vector_rank
          FROM "Chunk"
          WHERE "userId" = ${this.userId} AND embedding IS NOT NULL
          ORDER BY vector_rank
          LIMIT 20
        ),
        keyword_results AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank_cd("searchVector", plainto_tsquery('english', ${query})) DESC) as keyword_rank
          FROM "Chunk"
          WHERE "userId" = ${this.userId} AND "searchVector" @@ plainto_tsquery('english', ${query})
          ORDER BY keyword_rank
          LIMIT 20
        )
        SELECT 
          c.id,
          c.text as content,
          a."sourceUrl" as "sourceUrl",
          a.title as title,
          COALESCE(1.0 / (60 + vr.vector_rank), 0.0) + COALESCE(1.0 / (60 + kr.keyword_rank), 0.0) as rrf_score
        FROM "Chunk" c
        JOIN "Artifact" a ON c."artifactId" = a.id
        LEFT JOIN vector_results vr ON c.id = vr.id
        LEFT JOIN keyword_results kr ON c.id = kr.id
        WHERE vr.id IS NOT NULL OR kr.id IS NOT NULL
        ORDER BY rrf_score DESC
        LIMIT 5;
      `;

      if (!chunks || chunks.length === 0) {
        return `No relevant content found in your Knowledge Graph for: "${query}"`;
      }

      const formatted = chunks
        .map(
          (c: any, i: number) =>
            `[Knowledge Chunk ${i + 1}] From: ${c.title || c.sourceUrl || 'Local Note'}\n${c.content}`,
        )
        .join('\n\n---\n\n');

      return `Found ${chunks.length} relevant entries in your Knowledge Graph:\n\n${formatted}`;
    } catch (e: any) {
      return `Knowledge graph search failed: ${e.message}`;
    }
  }
}
