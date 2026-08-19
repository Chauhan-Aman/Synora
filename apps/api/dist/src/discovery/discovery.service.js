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
var DiscoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const duck_duck_scrape_1 = require("duck-duck-scrape");
let DiscoveryService = DiscoveryService_1 = class DiscoveryService {
    prisma;
    captureQueue;
    logger = new common_1.Logger(DiscoveryService_1.name);
    OLLAMA_URL = 'http://localhost:11434/api/generate';
    OLLAMA_MODEL = 'llama3.2';
    constructor(prisma, captureQueue) {
        this.prisma = prisma;
        this.captureQueue = captureQueue;
    }
    async getFeed(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let recs = await this.prisma.recommendation.findMany({
            where: {
                userId,
                status: 'UNREAD',
                createdAt: { gte: today },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (recs.length === 0) {
            this.logger.log(`No recent recommendations for user ${userId}. Generating new ones...`);
            recs = await this.generateDailyFeed(userId);
        }
        return recs;
    }
    async generateDailyFeed(userId) {
        const topTopics = await this.prisma.topic.findMany({
            where: { userId },
            include: { _count: { select: { artifacts: true } } },
            orderBy: { artifacts: { _count: 'desc' } },
            take: 10,
        });
        const recentSummaries = await this.prisma.summary.findMany({
            where: { userId },
            orderBy: { id: 'desc' },
            take: 5,
        });
        const topicNames = topTopics.map(t => t.name).join(', ');
        const summaryTexts = recentSummaries.map(s => s.text).join('\n- ');
        const prompt = `
You are an intelligent discovery engine. The user has a personal knowledge graph with the following core interests (Top Topics):
[${topicNames}]

Recent things they learned about:
- ${summaryTexts || "No recent learnings"}

Your task is to expand their horizons based on their unique taste profile. You must generate exactly 4 recommendations:
1. Three "CONCEPT" recommendations: fascinating, deeply adjacent concepts they haven't explicitly captured but would love based on their interests.
2. One "SYNTHESIS" recommendation: a creative and surprising connection between two completely disparate topics from their interests.

Output ONLY a valid JSON object matching this schema. Do NOT wrap it in markdown block quotes.
{
  "recommendations": [
    {
      "title": "Name of the concept or synthesis",
      "description": "A compelling 2-sentence hook explaining what this is",
      "reasoning": "A 1-sentence explanation of why this was recommended based on their knowledge graph",
      "type": "CONCEPT" // or "SYNTHESIS"
    }
  ]
}
`;
        try {
            const generateResponse = await fetch(this.OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.OLLAMA_MODEL,
                    prompt,
                    format: 'json',
                    stream: false,
                }),
            });
            if (!generateResponse.ok) {
                throw new Error('Failed to generate discovery feed from Ollama');
            }
            const data = await generateResponse.json();
            const parsed = JSON.parse(data.response);
            const createdRecs = [];
            for (const rec of parsed.recommendations) {
                let imageUrl = null;
                try {
                    const imageRes = await (0, duck_duck_scrape_1.searchImages)(rec.title);
                    if (imageRes.results && imageRes.results.length > 0) {
                        imageUrl = imageRes.results[0].image;
                    }
                }
                catch (imgErr) {
                    this.logger.warn(`Failed to fetch image for ${rec.title}: ${imgErr.message}`);
                }
                const created = await this.prisma.recommendation.create({
                    data: {
                        title: rec.title || "Unknown Concept",
                        description: rec.description || "No description provided.",
                        reasoning: rec.reasoning || "Generated based on your interests.",
                        type: rec.type || 'CONCEPT',
                        imageUrl,
                        userId,
                    },
                });
                createdRecs.push(created);
            }
            return createdRecs;
        }
        catch (error) {
            this.logger.error(`Failed to generate daily feed: ${error.message}`);
            return [];
        }
    }
    async exploreRecommendation(userId, id) {
        const recommendation = await this.prisma.recommendation.findUnique({
            where: { id, userId },
        });
        if (!recommendation) {
            throw new Error('Recommendation not found');
        }
        let targetUrl = `synora://discovery/${recommendation.id}`;
        let content = '';
        try {
            const searchRes = await (0, duck_duck_scrape_1.search)(recommendation.title);
            if (searchRes.results && searchRes.results.length > 0) {
                targetUrl = searchRes.results[0].url;
            }
        }
        catch (e) {
            this.logger.warn(`Search failed for ${recommendation.title}`);
        }
        const artifact = await this.prisma.artifact.create({
            data: {
                userId,
                title: recommendation.title,
                type: targetUrl.startsWith('http') ? 'URL' : 'TEXT',
                status: 'pending',
                sourceUrl: targetUrl,
                content: targetUrl.startsWith('http') ? undefined : recommendation.description,
            },
        });
        await this.prisma.recommendation.update({
            where: { id },
            data: { status: 'SAVED' },
        });
        await this.captureQueue.add('process-artifact', {
            artifactId: artifact.id,
        });
        return artifact;
    }
    async getTasteProfile(userId) {
        const topTopics = await this.prisma.topic.findMany({
            where: { userId },
            include: { _count: { select: { artifacts: true } } },
            orderBy: { artifacts: { _count: 'desc' } },
            take: 10,
        });
        if (topTopics.length === 0)
            return { profile: "We don't have enough data to determine your taste profile yet. Start capturing more knowledge!" };
        const topicNames = topTopics.map(t => t.name).join(', ');
        const prompt = `
You are an expert psychological profiler. Based on the following topics the user frequently explores:
[${topicNames}]

Write a 2-sentence summary of their intellectual "taste profile" and aesthetic. Keep it insightful, flattering, and punchy.
Do not use conversational filler or quotes. Just output the 2 sentences directly.
    `.trim();
        try {
            const response = await fetch(this.OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: this.OLLAMA_MODEL, prompt, stream: false }),
            });
            const data = await response.json();
            return { profile: data.response };
        }
        catch (e) {
            this.logger.error("Failed to generate taste profile");
            return { profile: "An explorer of ideas, always seeking deeper connections across diverse domains." };
        }
    }
    async diveDeeper(userId, sourceRecommendationId) {
        const sourceRec = await this.prisma.recommendation.findUnique({
            where: { id: sourceRecommendationId, userId }
        });
        if (!sourceRec)
            throw new Error("Source recommendation not found");
        const prompt = `
You are an intelligent discovery engine. The user has explicitly chosen to "Dive Deeper" into this specific concept:
TITLE: ${sourceRec.title}
DESCRIPTION: ${sourceRec.description}

Your task is to generate exactly 3 new "CONCEPT" recommendations that represent deeper, more obscure, or highly specific sub-domains branching off of this concept.

Output ONLY a valid JSON object matching this schema. Do NOT wrap it in markdown block quotes.
{
  "recommendations": [
    {
      "title": "Name of the deeper concept",
      "description": "A compelling 2-sentence hook explaining what this is",
      "reasoning": "A 1-sentence explanation of why this was recommended",
      "type": "CONCEPT"
    }
  ]
}
    `.trim();
        try {
            const response = await fetch(this.OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: this.OLLAMA_MODEL, prompt, format: 'json', stream: false }),
            });
            if (!response.ok)
                throw new Error("Failed to dive deeper");
            const data = await response.json();
            const parsed = JSON.parse(data.response);
            const createdRecs = [];
            for (const rec of parsed.recommendations) {
                let imageUrl = null;
                try {
                    const imageRes = await (0, duck_duck_scrape_1.searchImages)(rec.title);
                    if (imageRes.results && imageRes.results.length > 0)
                        imageUrl = imageRes.results[0].image;
                }
                catch (e) { }
                const created = await this.prisma.recommendation.create({
                    data: {
                        title: rec.title,
                        description: rec.description,
                        reasoning: rec.reasoning,
                        type: 'CONCEPT',
                        imageUrl,
                        userId,
                    },
                });
                createdRecs.push(created);
            }
            return createdRecs;
        }
        catch (error) {
            this.logger.error("Failed to generate deeper dive", error);
            return [];
        }
    }
};
exports.DiscoveryService = DiscoveryService;
exports.DiscoveryService = DiscoveryService = DiscoveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('capture-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], DiscoveryService);
//# sourceMappingURL=discovery.service.js.map