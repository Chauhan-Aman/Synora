"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CreateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CreateService = CreateService_1 = class CreateService {
    prisma;
    logger = new common_1.Logger(CreateService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async fetchContext(draftText, userId) {
        if (!draftText.trim())
            return [];
        try {
            this.logger.log(`Embedding draft text snippet for context search...`);
            const recentContext = draftText.slice(-500);
            const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
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
            const artifacts = await this.prisma.$queryRaw `
        SELECT 
          a.id, 
          a.title, 
          a."sourceUrl", 
          c.text as summary, 
          1 - (c.embedding <=> ${vectorString}::vector) as similarity 
        FROM "Chunk" c
        JOIN "Artifact" a ON c."artifactId" = a.id
        WHERE c."userId" = ${userId} AND c.embedding IS NOT NULL
        ORDER BY c.embedding <=> ${vectorString}::vector ASC
        LIMIT 5
      `;
            return artifacts;
        }
        catch (err) {
            this.logger.error("Failed to fetch context", err);
            return [];
        }
    }
    async generateParagraph(draftText, contextArtifacts, model) {
        try {
            const contextString = contextArtifacts.map(a => `[Title: ${a.title || 'Unknown'}]\n${a.summary || ''}`).join('\n\n');
            const prompt = `
You are an advanced autocomplete engine. Your task is to output ONLY the next logical paragraph that continues the user's current draft, utilizing the provided knowledge context.

CRITICAL RULES:
1. Output ONLY the raw paragraph text.
2. DO NOT include any conversational filler (e.g., "Here is the next paragraph" or "I'd be happy to help").
3. DO NOT wrap your output in quotation marks.
4. Match the exact tone and style of the existing draft.

KNOWLEDGE CONTEXT:
${contextString}

CURRENT DRAFT:
${draftText}
      `.trim();
            const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model || 'llama3.2',
                    prompt,
                    stream: false
                })
            });
            if (!ollamaResponse.ok) {
                throw new Error('Ollama generation failed');
            }
            const resData = await ollamaResponse.json();
            return resData.response;
        }
        catch (err) {
            this.logger.error("Failed to generate paragraph", err);
            return "*(Failed to generate paragraph. Please ensure Ollama is running and try again.)*";
        }
    }
    async rewriteParagraph(draftText, suggestedParagraph, instructions, contextArtifacts, model) {
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
            const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model || 'llama3.2',
                    prompt,
                    stream: false
                })
            });
            if (!ollamaResponse.ok) {
                throw new Error('Ollama generation failed');
            }
            const resData = await ollamaResponse.json();
            return resData.response;
        }
        catch (err) {
            this.logger.error("Failed to rewrite paragraph", err);
            return "*(Failed to rewrite paragraph. Please try again.)*";
        }
    }
};
exports.CreateService = CreateService;
exports.CreateService = CreateService = CreateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreateService);
//# sourceMappingURL=create.service.js.map