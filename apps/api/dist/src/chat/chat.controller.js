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
let ChatController = ChatController_1 = class ChatController {
    prisma;
    logger = new common_1.Logger(ChatController_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async chat(query) {
        if (!query) {
            throw new common_1.HttpException('Query is required', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            this.logger.log(`Embedding user query: "${query}"`);
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
            this.logger.log('Searching vector database for relevant artifacts...');
            const relevantArtifacts = await this.prisma.$queryRaw `
        SELECT id, content, "sourceUrl", 1 - (embedding <=> ${vectorString}::vector) as similarity
        FROM "Artifact"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT 3
      `;
            if (relevantArtifacts.length === 0) {
                return { response: "I couldn't find any relevant context in your knowledge graph to answer that question." };
            }
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "chat", null);
exports.ChatController = ChatController = ChatController_1 = __decorate([
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map