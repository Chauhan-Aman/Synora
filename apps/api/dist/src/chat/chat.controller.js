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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let ChatController = ChatController_1 = class ChatController {
    prisma;
    logger = new common_1.Logger(ChatController_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async chat(query, history, user) {
        if (!query) {
            throw new common_1.HttpException('Query is required', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            let searchQuery = query;
            if (history && history.length > 0) {
                const historyText = history.slice(-4).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
                const rewritePrompt = `Given the following conversation history, rewrite the user's latest query to be a standalone search query. Replace pronouns (he, she, it, they) with the actual entities they refer to from the history. DO NOT answer the question, ONLY return the rewritten query text.
        
History:
${historyText}

Latest Query: ${query}

Rewritten Query:`;
                try {
                    const rewriteRes = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: 'llama3.2', prompt: rewritePrompt, stream: false }),
                    });
                    if (rewriteRes.ok) {
                        const d = await rewriteRes.json();
                        searchQuery = d.response.trim();
                        this.logger.log(`Rewrote query for search: "${searchQuery}"`);
                    }
                }
                catch (e) {
                    this.logger.error("Failed to rewrite query", e);
                }
            }
            this.logger.log(`Embedding user query: "${searchQuery}"`);
            const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
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
            this.logger.log(`Searching vector database for relevant chunks for user ${user.userId}...`);
            const relevantChunks = await this.prisma.$queryRaw `
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
            let contextText = "No personal knowledge captured yet.";
            let sources = [];
            if (relevantChunks.length > 0) {
                contextText = relevantChunks
                    .map((c, i) => `[Source ${i + 1}] (${c.sourceUrl || 'Text Snippet'}):\n${c.content}`)
                    .join('\n\n');
                const allSources = relevantChunks.map(c => c.sourceUrl || 'Text Snippet');
                sources = [...new Set(allSources)];
            }
            let historyContext = "";
            if (history && history.length > 0) {
                historyContext = "CONVERSATION HISTORY:\n" + history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') + "\n\n";
            }
            const prompt = `
You are Synora, an intelligent and friendly personal assistant. 
You have access to the user's personal knowledge graph. 

If the user is just saying hello or asking a general conversational question, answer in a friendly, conversational manner.
If the user is asking a question that requires specific knowledge, answer it using ONLY the provided context below.
If the context does not contain the answer, politely state that you cannot find the answer in their knowledge graph.

${historyContext}
CONTEXT:
${contextText}

QUESTION:
${query}
`;
            this.logger.log(`Asking Ollama (llama3.2) with ${relevantChunks.length} sources...`);
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
        }
        catch (error) {
            this.logger.error(`Chat error: ${error.message}`);
            throw new common_1.HttpException('Failed to communicate with local AI', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)('query')),
    __param(1, (0, common_1.Body)('history')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "chat", null);
exports.ChatController = ChatController = ChatController_1 = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map