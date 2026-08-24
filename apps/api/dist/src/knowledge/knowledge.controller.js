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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let KnowledgeController = class KnowledgeController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTopics(user) {
        const topics = await this.prisma.topic.findMany({
            where: { userId: user.userId },
            include: {
                _count: {
                    select: { artifacts: true }
                }
            },
            orderBy: {
                artifacts: {
                    _count: 'desc'
                }
            }
        });
        return topics.map(topic => ({
            id: topic.id,
            name: topic.name,
            count: topic._count.artifacts
        }));
    }
    async getEntities(user) {
        const entities = await this.prisma.entity.findMany({
            where: { userId: user.userId },
            include: {
                _count: {
                    select: { artifacts: true }
                }
            },
            orderBy: {
                artifacts: {
                    _count: 'desc'
                }
            }
        });
        return entities.map(entity => ({
            id: entity.id,
            name: entity.name,
            type: entity.type,
            count: entity._count.artifacts
        }));
    }
    async getGraph(user) {
        const artifacts = await this.prisma.artifact.findMany({
            where: {
                userId: user.userId,
                status: 'completed'
            },
            include: { topics: true, entities: true, summary: true }
        });
        const nodes = [];
        const links = [];
        const addedNodes = new Set();
        for (const artifact of artifacts) {
            let artifactName = 'Raw Text Snippet';
            if (artifact.summary && artifact.summary.text) {
                artifactName = artifact.summary.text.length > 35
                    ? artifact.summary.text.substring(0, 35) + '...'
                    : artifact.summary.text;
            }
            else if (artifact.sourceUrl) {
                try {
                    const url = new URL(artifact.sourceUrl);
                    artifactName = url.hostname;
                }
                catch {
                    artifactName = artifact.sourceUrl.length > 30 ? artifact.sourceUrl.substring(0, 30) + '...' : artifact.sourceUrl;
                }
            }
            if (!addedNodes.has(artifact.id)) {
                nodes.push({
                    id: artifact.id,
                    name: artifactName,
                    group: 'artifact',
                    details: artifact.summary?.text,
                    sourceUrl: artifact.sourceUrl
                });
                addedNodes.add(artifact.id);
            }
            for (const topic of artifact.topics) {
                if (!addedNodes.has(topic.id)) {
                    nodes.push({ id: topic.id, name: topic.name, group: 'topic' });
                    addedNodes.add(topic.id);
                }
                links.push({ source: topic.id, target: artifact.id });
            }
            for (const entity of artifact.entities) {
                if (!addedNodes.has(entity.id)) {
                    nodes.push({ id: entity.id, name: entity.name, group: 'entity' });
                    addedNodes.add(entity.id);
                }
                links.push({ source: artifact.id, target: entity.id });
            }
        }
        return { nodes, links };
    }
    async getArtifacts(user) {
        const artifacts = await this.prisma.artifact.findMany({
            where: { userId: user.userId },
            include: {
                summary: true,
                topics: { select: { id: true, name: true } },
                collections: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return artifacts.map(a => ({
            id: a.id,
            title: a.title,
            sourceUrl: a.sourceUrl,
            type: a.type,
            status: a.status,
            content: a.content,
            summary: a.summary?.text,
            createdAt: a.createdAt,
            topics: a.topics,
            collections: a.collections
        }));
    }
    async getCollections(user) {
        return this.prisma.collection.findMany({
            where: { userId: user.userId },
            include: {
                artifacts: { select: { id: true, title: true, sourceUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createCollection(user, body) {
        return this.prisma.collection.create({
            data: {
                name: body.name,
                userId: user.userId
            }
        });
    }
    async addArtifactToCollection(user, artifactId, body) {
        return this.prisma.artifact.update({
            where: { id: artifactId, userId: user.userId },
            data: {
                collections: {
                    connect: { id: body.collectionId }
                }
            }
        });
    }
    async getInsights(user) {
        return this.prisma.insight.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async generateInsights(user) {
        const topics = await this.prisma.topic.findMany({
            where: { userId: user.userId },
            take: 20,
            orderBy: { artifacts: { _count: 'desc' } }
        });
        const topicNames = topics.map(t => t.name).join(', ');
        const prompt = `
      You are an AI specialized in analyzing a user's knowledge graph to find GAPS and CONFLICTS.
      
      User's Top Topics: ${topicNames}

      Identify 2 Knowledge Gaps (topics the user should learn next to connect their existing knowledge) 
      and 1 Potential Conflict or Nuance (a complex intersection of these topics).

      Respond ONLY with a valid JSON array of objects matching this schema:
      [
        {
          "type": "GAP" | "CONFLICT",
          "title": "Short title",
          "description": "Detailed explanation of the gap or conflict",
          "sources": ["Topic 1", "Topic 2"]
        }
      ]
    `;
        try {
            const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3.2',
                    prompt: prompt,
                    stream: false,
                    format: 'json'
                })
            });
            if (!ollamaResponse.ok)
                throw new Error('Failed to generate insights');
            const data = await ollamaResponse.json();
            let responseText = data.response.trim();
            if (responseText.startsWith('```')) {
                const lines = responseText.split('\n');
                lines.shift();
                if (lines[lines.length - 1].startsWith('```')) {
                    lines.pop();
                }
                responseText = lines.join('\n');
            }
            let insightsList;
            try {
                insightsList = JSON.parse(responseText);
            }
            catch (e) {
                console.error("Failed to parse insights JSON:", responseText);
                insightsList = [];
            }
            if (!Array.isArray(insightsList)) {
                let extracted = [];
                for (const key in insightsList) {
                    if (Array.isArray(insightsList[key])) {
                        extracted.push(...insightsList[key]);
                    }
                }
                insightsList = extracted;
            }
            for (const insight of insightsList) {
                await this.prisma.insight.create({
                    data: {
                        type: insight.type || 'GAP',
                        title: insight.title || 'Untitled Insight',
                        description: insight.description || '',
                        sources: insight.sources || [],
                        userId: user.userId
                    }
                });
            }
            return this.getInsights(user);
        }
        catch (error) {
            console.error('Insights generation failed:', error);
            throw error;
        }
    }
};
exports.KnowledgeController = KnowledgeController;
__decorate([
    (0, common_1.Get)('topics'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getTopics", null);
__decorate([
    (0, common_1.Get)('entities'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getEntities", null);
__decorate([
    (0, common_1.Get)('graph'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getGraph", null);
__decorate([
    (0, common_1.Get)('artifacts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getArtifacts", null);
__decorate([
    (0, common_1.Get)('collections'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getCollections", null);
__decorate([
    (0, common_1.Post)('collections'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "createCollection", null);
__decorate([
    (0, common_1.Post)('artifacts/:id/collections'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "addArtifactToCollection", null);
__decorate([
    (0, common_1.Get)('insights'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getInsights", null);
__decorate([
    (0, common_1.Post)('insights/generate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "generateInsights", null);
exports.KnowledgeController = KnowledgeController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('knowledge'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KnowledgeController);
//# sourceMappingURL=knowledge.controller.js.map