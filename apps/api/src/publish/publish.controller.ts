import { Controller, Post, Body, HttpStatus, Logger, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ModelRouter } from '../common/model-router';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('publish')
export class PublishController {
  private readonly logger = new Logger(PublishController.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getKnowledgeContext(userId: string, topicIds: string[], artifactIds: string[]): Promise<string> {
    const chunks: string[] = [];

    if (topicIds && topicIds.length > 0) {
      // Get artifacts linked to the selected topics
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

  private async streamFromOllama(prompt: string, res: Response, modelParam?: string): Promise<void> {
    const targetModel = ModelRouter.getBestModel('DRAFTING', modelParam);
    const generateResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: targetModel, prompt, stream: true }),
    });

    if (!generateResponse.ok) throw new Error('Failed to reach Ollama');

    if (generateResponse.body) {
      const reader = generateResponse.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim() !== '');
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              res.write(`data: ${JSON.stringify({ type: 'text', text: data.response })}\n\n`);
            }
          } catch (e) {}
        }
      }
    }
  }

  @Post('blog')
  async generateBlog(
    @Body('topicIds') topicIds: string[],
    @Body('artifactIds') artifactIds: string[],
    @Body('style') style: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating blog post for user ${user.userId}`);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const context = await this.getKnowledgeContext(user.userId, topicIds || [], artifactIds || []);
      const toneMap: Record<string, string> = {
        professional: 'authoritative and professional',
        conversational: 'conversational and engaging, using "you" and "we"',
        academic: 'formal and analytical, citing key concepts',
      };
      const tone = toneMap[style] || 'conversational and engaging';

      const prompt = `You are an expert blog writer. Write a complete, well-structured blog post based on the following knowledge base content.

KNOWLEDGE BASE:
${context || 'General knowledge on the selected topics.'}

INSTRUCTIONS:
- Write in a ${tone} tone.
- Write in first person as the author sharing their personal knowledge.
- Use markdown formatting: # for main title, ## for sections, **bold** for key terms.
- Include an engaging introduction, 3-5 well-developed sections, and a strong conclusion.
- Target length: 600-900 words.
- Do NOT include any preamble or meta-commentary. Start directly with the # title.

Begin the blog post now:`;

      await this.streamFromOllama(prompt, res, model);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error) {
      this.logger.error('Blog generation error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate blog post' })}\n\n`);
      res.end();
    }
  }

  @Post('linkedin')
  async generateLinkedIn(
    @Body('topicIds') topicIds: string[],
    @Body('artifactIds') artifactIds: string[],
    @Body('style') style: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating LinkedIn post for user ${user.userId}`);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const context = await this.getKnowledgeContext(user.userId, topicIds || [], artifactIds || []);
      const prompt = `You are an expert LinkedIn content creator. Write a high-engagement LinkedIn post based on the following knowledge.

KNOWLEDGE BASE:
${context || 'General knowledge on the selected topics.'}

INSTRUCTIONS:
- Write in first person, sharing genuine insight.
- Start with a compelling hook sentence (no generic openers like "I'm excited to share").
- Use short paragraphs (1-2 sentences max) for readability.
- Include 3-5 relevant emojis naturally placed.
- End with a thought-provoking question to drive comments.
- Add 5-8 relevant hashtags on the last line.
- Target length: 200-300 words.
- Do NOT use markdown headers. Output plain text with line breaks.

Begin the LinkedIn post now:`;

      await this.streamFromOllama(prompt, res, model);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error) {
      this.logger.error('LinkedIn generation error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate LinkedIn post' })}\n\n`);
      res.end();
    }
  }

  @Post('twitter')
  async generateTwitter(
    @Body('topicIds') topicIds: string[],
    @Body('artifactIds') artifactIds: string[],
    @Body('style') style: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating Twitter thread for user ${user.userId}`);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const context = await this.getKnowledgeContext(user.userId, topicIds || [], artifactIds || []);
      const prompt = `You are an expert Twitter/X thread writer. Create a high-engagement tweet thread based on the following knowledge.

KNOWLEDGE BASE:
${context || 'General knowledge on the selected topics.'}

INSTRUCTIONS:
- Write exactly 6 tweets numbered as 1/, 2/, 3/, 4/, 5/, 6/.
- Tweet 1/ must be a powerful hook that makes people want to read on.
- Each tweet MUST be under 260 characters (leave room for the number).
- Each tweet should be on its own line, separated by a blank line.
- The last tweet (6/) should be a call-to-action or summary.
- Add 2-3 relevant hashtags only on the last tweet.
- Do NOT use markdown. Output plain numbered tweets only.

Begin the Twitter thread now:`;

      await this.streamFromOllama(prompt, res, model);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error) {
      this.logger.error('Twitter generation error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate Twitter thread' })}\n\n`);
      res.end();
    }
  }
}
