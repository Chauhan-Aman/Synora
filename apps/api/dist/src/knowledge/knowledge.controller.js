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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let KnowledgeController = class KnowledgeController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTopics() {
        const topics = await this.prisma.topic.findMany({
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
    async getEntities() {
        const entities = await this.prisma.entity.findMany({
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
    async getGraph() {
        const artifacts = await this.prisma.artifact.findMany({
            include: { topics: true, entities: true },
            where: { status: 'completed' }
        });
        const nodes = [];
        const links = [];
        const addedNodes = new Set();
        for (const artifact of artifacts) {
            if (!addedNodes.has(artifact.id)) {
                nodes.push({ id: artifact.id, name: artifact.sourceUrl || 'Artifact', group: 'artifact' });
                addedNodes.add(artifact.id);
            }
            for (const topic of artifact.topics) {
                if (!addedNodes.has(topic.id)) {
                    nodes.push({ id: topic.id, name: topic.name, group: 'topic' });
                    addedNodes.add(topic.id);
                }
                links.push({ source: artifact.id, target: topic.id });
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
};
exports.KnowledgeController = KnowledgeController;
__decorate([
    (0, common_1.Get)('topics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getTopics", null);
__decorate([
    (0, common_1.Get)('entities'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getEntities", null);
__decorate([
    (0, common_1.Get)('graph'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "getGraph", null);
exports.KnowledgeController = KnowledgeController = __decorate([
    (0, common_1.Controller)('knowledge'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KnowledgeController);
//# sourceMappingURL=knowledge.controller.js.map