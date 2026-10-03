import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModelRouter } from '../common/model-router';
import { LlmService } from '../common/llm.service';

@Injectable()
export class CreateService {
  private readonly logger = new Logger(CreateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService
  ) {}

  async fetchContext(draftText: string, userId: string): Promise<any[]> {
    if (!draftText.trim()) return [];
    
    try {
      this.logger.log(`Embedding draft text snippet for context search...`);
      // Use the last 500 characters of the draft for context searching
      const recentContext = draftText.slice(-500);

      const embeddingResponse = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          prompt: recentContext
        })
      });

      if (!embeddingResponse.ok) {
        throw new Error('Failed to get embeddings from Ollama');
      }

      const embedData = await embeddingResponse.json();
      const vector = embedData.embedding;
      const vectorString = `[${vector.join(',')}]`;

      // Get the BEST (most similar) chunk per artifact using DISTINCT ON
      // Also filter out very short chunks that are likely pure citation/reference text
      const rawChunks = await this.prisma.$queryRaw<any[]>`
        SELECT DISTINCT ON (a.id)
          a.id, 
          a.title, 
          a."sourceUrl", 
          c.text as summary, 
          1 - (c.embedding <=> ${vectorString}::vector) as similarity 
        FROM "Chunk" c
        JOIN "Artifact" a ON c."artifactId" = a.id
        WHERE c."userId" = ${userId} 
          AND c.embedding IS NOT NULL
          AND LENGTH(c.text) > 200
          AND c.text NOT LIKE '%identifier%'
          AND c.text NOT LIKE '%PMID%'
          AND c.text NOT LIKE '%). %'
        ORDER BY a.id, c.embedding <=> ${vectorString}::vector ASC
        LIMIT 5
      `;

      const cleaned = rawChunks.map((a) => {
        let text = (a.summary || '');

        // ── Strip Wikipedia-style citations and bibliography text ──
        // Remove lines that look like numbered references: "87. Wang, Yuxuan; ..."
        text = text.replace(/^\d{1,3}\.\s+[A-Z][a-z]+,\s+.+$/gm, '');
        // Remove citation identifier blocks: SSN (identifier)") 0028-0836
        text = text.replace(/[A-Z]{2,}\s*\(identifier\)[")]*\s*[\d\.\-\w]*/g, '');
        // Remove known citation keys: PMID, S2CID, arXiv, doi, ISSN, hdl, PMC, Bibcode
        text = text.replace(/(?:PMID|S2CID|arXiv|Bibcode|doi|PMC|ISSN|hdl|SSN|ISBN|OCLC)\s*(?:["(][^)"]*[)"])?[\s:]*[\d\.\/\-\w]*/gi, '');
        // Remove markdown image tags
        text = text.replace(/!\[.*?\]\([^)]*\)?/g, '');
        // Convert markdown links to just their label text
        text = text.replace(/\[(.*?)\]\([^)]*\)?/g, '$1');
        // Remove footnote reference numbers: [61], [1], etc.
        text = text.replace(/\[\d+\]/g, '');
        // Remove raw URLs
        text = text.replace(/https?:\/\/[^\s]+/g, '');
        // Remove Wikipedia arrow / edit icons
        text = text.replace(/[↑→←]/g, '');
        // Remove residual HTML tags
        text = text.replace(/<[^>]*>/g, '');
        // Remove lines that are mostly punctuation/numbers (leftover citation lines)
        text = text.split('\n').filter((line: string) => {
          const stripped = line.replace(/[^a-zA-Z]/g, '');
          return stripped.length > 10; // skip lines with fewer than 10 real letters
        }).join(' ');
        // Collapse whitespace
        text = text.replace(/\s+/g, ' ').trim();

        return { ...a, summary: text };
      })
      // Skip chunks where the cleaned text is still too short to be meaningful
      .filter(a => a.summary.length > 40);

      // Translate non-English snippets (Arabic, Hindi, Thai, CJK, Cyrillic, etc) to English
      const translated = await Promise.all(cleaned.map(async (a) => {
        // Quick heuristic to detect non-Latin scripts
        const hasNonEnglishScript = /[\u0600-\u06FF\u0900-\u097F\u4E00-\u9FFF\u0400-\u04FF\u0E00-\u0E7F\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF]/.test(a.summary);
        
        if (hasNonEnglishScript) {
          this.logger.log(`Translating non-English snippet for artifact ${a.id}`);
          try {
            const translatedText = await this.llmService.generateText({
              modelType: 'EXTRACTION',
              prompt: `Translate the following text to English. Reply ONLY with the English translation, no other text or explanation. Text:\n${a.summary}`
            });
            return { ...a, summary: translatedText?.trim() || a.summary };
          } catch (e) {
            this.logger.error(`Failed to translate snippet for ${a.id}`, e);
            return a;
          }
        }
        return a;
      }));

      return translated;
    } catch (err) {
      this.logger.error("Failed to fetch context", err);
      return [];
    }
  }


  async generateParagraph(draftText: string, contextArtifacts: any[], model?: string): Promise<string> {
    try {
      const contextString = contextArtifacts.map(a => `[Title: ${a.title || 'Unknown'}]\n${a.summary || ''}`).join('\n\n');

      const prompt = `
You are an advanced autocomplete engine. Your task is to output ONLY the next logical paragraph that continues the user's current draft, utilizing the provided knowledge context.

CRITICAL RULES:
1. Output ONLY the new paragraph text that comes next. DO NOT repeat the user's existing draft.
2. If the user's draft ends mid-sentence or lacks punctuation, YOU MUST start your response with the appropriate punctuation (e.g., a period, comma, or space) so that when your text is directly appended, it forms perfect English.
3. If the user's draft ends mid-sentence, output ONLY the completion of that sentence and the subsequent sentences. Do not rewrite the beginning of the sentence.
4. DO NOT include any conversational filler (e.g., "Here is the next paragraph" or "I'd be happy to help").
5. DO NOT wrap your output in quotation marks.
6. Match the exact tone and style of the existing draft.

KNOWLEDGE CONTEXT:
${contextString}

CURRENT DRAFT:
${draftText}
      `.trim();

      const ollamaResponse = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ModelRouter.getBestModel('DRAFTING', model),
          prompt,
          stream: false
        })
      });

      if (!ollamaResponse.ok) {
        throw new Error('Ollama generation failed');
      }

      const resData = await ollamaResponse.json();
      return resData.response;
    } catch (err) {
      this.logger.error("Failed to generate paragraph", err);
      return "*(Failed to generate paragraph. Please ensure Ollama is running and try again.)*";
    }
  }

  async rewriteParagraph(draftText: string, suggestedParagraph: string, instructions: string, contextArtifacts: any[], model?: string): Promise<string> {
    try {
      const contextString = contextArtifacts.map(a => `[Title: ${a.title || 'Unknown'}]\n${a.summary || ''}`).join('\n\n');

      const prompt = `
You are an advanced text revision engine. Your task is to rewrite the "SUGGESTED PARAGRAPH" based EXACTLY on the "USER INSTRUCTIONS".

CRITICAL RULES:
1. Output ONLY the rewritten paragraph text.
2. DO NOT include any conversational filler (e.g., "Here is the revised paragraph").
3. DO NOT wrap your output in quotation marks.
4. Keep the context of the overall draft in mind.

USER INSTRUCTIONS:
${instructions}

KNOWLEDGE CONTEXT:
${contextString}

CURRENT DRAFT:
${draftText}

SUGGESTED PARAGRAPH TO REWRITE:
${suggestedParagraph}
      `.trim();

      const ollamaResponse = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ModelRouter.getBestModel('DRAFTING', model),
          prompt,
          stream: false
        })
      });

      if (!ollamaResponse.ok) {
        throw new Error('Ollama generation failed');
      }

      const resData = await ollamaResponse.json();
      return resData.response;
    } catch (err) {
      this.logger.error("Failed to rewrite paragraph", err);
      return "*(Failed to rewrite paragraph. Please try again.)*";
    }
  }

  async proofreadDocument(draftText: string, model?: string): Promise<string> {
    try {
      const prompt = `
You are an expert editor and proofreader. Your task is to correct any grammatical, spelling, capitalization, and punctuation errors in the provided draft document.

CRITICAL RULES:
1. ONLY output the corrected document. DO NOT include any conversational filler.
2. DO NOT change the core meaning, tone, or overall structure. Only fix objective errors or very awkward phrasing.
3. Keep ALL HTML formatting exactly intact. Do not remove or alter <p>, <h1>, <ul>, etc.
4. If the document is already perfect, just output the document exactly as it is.

DOCUMENT TO PROOFREAD:
${draftText}
      `.trim();

      const ollamaResponse = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ModelRouter.getBestModel('DRAFTING', model),
          prompt,
          stream: false
        })
      });

      if (!ollamaResponse.ok) {
        throw new Error('Ollama generation failed');
      }

      const resData = await ollamaResponse.json();
      return resData.response;
    } catch (err) {
      this.logger.error("Failed to proofread document", err);
      return draftText; // return original if it fails
    }
  }
}
