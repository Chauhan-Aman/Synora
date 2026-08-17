import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly OLLAMA_URL = 'http://localhost:11434/api/generate';
  private readonly OLLAMA_MODEL = 'llama3.2';

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
        const created = await this.prisma.recommendation.create({
          data: {
            title: rec.title,
            description: rec.description,
            reasoning: rec.reasoning,
            type: rec.type,
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

    // Generate a full article based on the recommendation
    const prompt = `
You are a master essayist and researcher.
Write a fascinating, comprehensive 500-word article about the following concept:
Title: ${recommendation.title}
Context: ${recommendation.description}

Write in a compelling, structured format suitable for saving into a personal knowledge graph.
`;

    const generateResponse = await fetch(this.OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
    });

    const data = await generateResponse.json();
    const articleContent = data.response.trim();

    // Create an Artifact
    const artifact = await this.prisma.artifact.create({
      data: {
        userId,
        title: recommendation.title,
        type: 'TEXT',
        status: 'pending',
        sourceUrl: `synora://discovery/${recommendation.id}`,
        content: articleContent,
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
      type: 'TEXT',
    });

    return artifact;
  }
}
