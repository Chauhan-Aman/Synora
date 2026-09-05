import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModelRouter } from '../common/model-router';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { search, searchImages } from 'duck-duck-scrape';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly OLLAMA_URL = 'http://localhost:11434/api/generate';

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('capture-queue') private captureQueue: Queue
  ) {}

  async getFeed(userId: string) {
    // Check if there are UNREAD recommendations created today
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

  private async generateDailyFeed(userId: string) {
    // 1. Get user context
    const topTopics = await this.prisma.topic.findMany({
      where: { userId },
      include: { _count: { select: { artifacts: true } } },
      orderBy: { artifacts: { _count: 'desc' } },
      take: 10,
    });

    const recentSummaries = await this.prisma.summary.findMany({
      where: { userId },
      orderBy: { id: 'desc' }, // id is uuid, but createdAt on artifact is better. This is fast enough for now.
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
          model: ModelRouter.getBestModel('REASONING'),
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
          const imageRes = await searchImages(rec.title);
          if (imageRes.results && imageRes.results.length > 0) {
            imageUrl = imageRes.results[0].image;
          }
        } catch (imgErr) {
          this.logger.debug(`Could not fetch image for ${rec.title}, using fallback.`);
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
    } catch (error) {
      this.logger.error(`Failed to generate daily feed: ${(error as Error).message}`);
      return [];
    }
  }

  async exploreRecommendation(userId: string, id: string) {
    const recommendation = await this.prisma.recommendation.findUnique({
      where: { id, userId },
    });

    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    // Generate a real web search for the concept instead of hallucinating!
    let targetUrl = `synora://discovery/${recommendation.id}`;
    let content = '';

    try {
      const searchRes = await search(recommendation.title);
      if (searchRes.results && searchRes.results.length > 0) {
        targetUrl = searchRes.results[0].url;
      }
    } catch (e) {
      this.logger.warn(`Search failed for ${recommendation.title}`);
    }

    // Create an Artifact for the URL (CaptureService will scrape it)
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

    // Mark recommendation as SAVED
    await this.prisma.recommendation.update({
      where: { id },
      data: { status: 'SAVED' },
    });

    // Send to background queue for extraction
    await this.captureQueue.add('process-artifact', {
      artifactId: artifact.id,
    });

    return artifact;
  }

  async getTasteProfile(userId: string) {
    const topTopics = await this.prisma.topic.findMany({
      where: { userId },
      include: { _count: { select: { artifacts: true } } },
      orderBy: { artifacts: { _count: 'desc' } },
      take: 10,
    });
    
    if (topTopics.length === 0) return { profile: "We don't have enough data to determine your taste profile yet. Start capturing more knowledge!" };

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
        body: JSON.stringify({ model: ModelRouter.getBestModel('REASONING'), prompt, stream: false }),
      });
      const data = await response.json();
      return { profile: data.response };
    } catch (e) {
      this.logger.error("Failed to generate taste profile");
      return { profile: "An explorer of ideas, always seeking deeper connections across diverse domains." };
    }
  }

  async diveDeeper(userId: string, sourceRecommendationId: string) {
    const sourceRec = await this.prisma.recommendation.findUnique({
      where: { id: sourceRecommendationId, userId }
    });

    if (!sourceRec) throw new Error("Source recommendation not found");

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
        body: JSON.stringify({ model: ModelRouter.getBestModel('REASONING'), prompt, format: 'json', stream: false }),
      });

      if (!response.ok) throw new Error("Failed to dive deeper");

      const data = await response.json();
      const parsed = JSON.parse(data.response);

      const createdRecs = [];
      for (const rec of parsed.recommendations) {
        let imageUrl = null;
        try {
          const imageRes = await searchImages(rec.title);
          if (imageRes.results && imageRes.results.length > 0) imageUrl = imageRes.results[0].image;
        } catch (e) {}

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
    } catch (error) {
      this.logger.error("Failed to generate deeper dive", error);
      return [];
    }
  }
}
