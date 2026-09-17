import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../common/llm.service';
import type { Response } from 'express';

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService
  ) {}

  async getKnowledgeContext(userId: string, topicIds: string[], artifactIds: string[]): Promise<string> {
    const chunks: string[] = [];

    if (topicIds && topicIds.length > 0) {
      const topics = await this.prisma.topic.findMany({
        where: { id: { in: topicIds }, userId },
        include: {
          artifacts: {
            include: { summary: true },
            take: 3,
          },
        },
        take: 10,
      });

      for (const topic of topics) {
        chunks.push(`## Topic: ${topic.name}`);
        for (const artifact of topic.artifacts) {
          if (artifact.summary?.text) {
            chunks.push(`  Source: ${artifact.title || 'Untitled'}\n  Summary: ${artifact.summary.text}`);
          } else if (artifact.content) {
            chunks.push(`  Source: ${artifact.title || 'Untitled'}\n  Content: ${artifact.content.substring(0, 500)}`);
          }
        }
      }
    }

    if (artifactIds && artifactIds.length > 0) {
      const artifacts = await this.prisma.artifact.findMany({
        where: { id: { in: artifactIds }, userId },
        include: { summary: true },
        take: 5,
      });

      for (const artifact of artifacts) {
        chunks.push(`## Source: ${artifact.title || 'Untitled'}`);
        if (artifact.summary?.text) chunks.push(`Summary: ${artifact.summary.text}`);
        if (artifact.content) chunks.push(`Content excerpt: ${artifact.content.substring(0, 800)}`);
      }
    }

    return chunks.join('\n\n');
  }

  async streamPublish(
    userId: string,
    topicIds: string[],
    artifactIds: string[],
    promptFactory: (context: string) => string,
    res: Response,
    modelParam?: string
  ) {
    try {
      const context = await this.getKnowledgeContext(userId, topicIds || [], artifactIds || []);
      const prompt = promptFactory(context);

      await this.llmService.streamToResponse(
        { modelType: 'DRAFTING', modelParam, prompt, stream: true },
        res
      );
      
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error: any) {
      this.logger.error(`Publish error: ${error.message}`);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate content' })}\n\n`);
      res.end();
    }
  }
}
