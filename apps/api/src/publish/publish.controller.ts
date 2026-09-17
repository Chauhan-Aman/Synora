import { Controller, Post, Body, Logger, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PublishService } from './publish.service';

@UseGuards(JwtAuthGuard)
@Controller('publish')
export class PublishController {
  private readonly logger = new Logger(PublishController.name);

  constructor(private readonly publishService: PublishService) {}

  private setupSseHeaders(res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  }

  @Post('blog')
  async generateBlog(
    @Body('topicIds') topicIds: string[],
    @Body('artifactIds') artifactIds: string[],
    @Body('style') style: string,
    @Body('model') model: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating blog post for user ${user.userId}`);
    this.setupSseHeaders(res);

    const toneMap: Record<string, string> = {
      professional: 'authoritative and professional',
      conversational: 'conversational and engaging, using "you" and "we"',
      academic: 'formal and analytical, citing key concepts',
    };
    const tone = toneMap[style] || 'conversational and engaging';

    const promptFactory = (context: string) => `You are an expert blog writer. Write a complete, well-structured blog post based on the following knowledge base content.

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

    await this.publishService.streamPublish(user.userId, topicIds, artifactIds, promptFactory, res, model);
  }

  @Post('linkedin')
  async generateLinkedIn(
    @Body('topicIds') topicIds: string[],
    @Body('artifactIds') artifactIds: string[],
    @Body('style') style: string,
    @Body('model') model: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating LinkedIn post for user ${user.userId}`);
    this.setupSseHeaders(res);

    const promptFactory = (context: string) => `You are an expert LinkedIn content creator. Write a high-engagement LinkedIn post based on the following knowledge.

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

    await this.publishService.streamPublish(user.userId, topicIds, artifactIds, promptFactory, res, model);
  }

  @Post('twitter')
  async generateTwitter(
    @Body('topicIds') topicIds: string[],
    @Body('artifactIds') artifactIds: string[],
    @Body('style') style: string,
    @Body('model') model: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating Twitter thread for user ${user.userId}`);
    this.setupSseHeaders(res);

    const promptFactory = (context: string) => `You are an expert Twitter/X thread writer. Create a high-engagement tweet thread based on the following knowledge.

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

    await this.publishService.streamPublish(user.userId, topicIds, artifactIds, promptFactory, res, model);
  }

  @Post('newsletter')
  async generateNewsletter(
    @Body('topicIds') topicIds: string[],
    @Body('artifactIds') artifactIds: string[],
    @Body('style') style: string,
    @Body('model') model: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating Newsletter for user ${user.userId}`);
    this.setupSseHeaders(res);

    const promptFactory = (context: string) => `You are an expert newsletter writer. Create an engaging newsletter issue based on the following knowledge.

KNOWLEDGE BASE:
${context || 'General knowledge on the selected topics.'}

INSTRUCTIONS:
- Write a catchy subject line starting with "Subject: ".
- Include a friendly welcome paragraph.
- Break down the main points into 3-4 clearly separated sections with bold headings.
- Keep the tone conversational but informative.
- Add a brief conclusion and sign-off.
- Target length: 400-600 words.

Begin the Newsletter now:`;

    await this.publishService.streamPublish(user.userId, topicIds, artifactIds, promptFactory, res, model);
  }

  @Post('paper')
  async generatePaper(
    @Body('topicIds') topicIds: string[],
    @Body('artifactIds') artifactIds: string[],
    @Body('style') style: string,
    @Body('model') model: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    this.logger.log(`Generating Academic Paper for user ${user.userId}`);
    this.setupSseHeaders(res);

    const promptFactory = (context: string) => `You are an expert academic writer and researcher. Create a formal academic paper draft based on the following knowledge.

KNOWLEDGE BASE:
${context || 'General knowledge on the selected topics.'}

INSTRUCTIONS:
- Use formal, objective, academic language.
- Structure the paper with standard academic sections: Title, Abstract, Introduction, Main Body (divided by concepts), and Conclusion.
- Synthesize the knowledge logically.
- Target length: 800-1200 words.
- Use markdown for headers.

Begin the Academic Paper now:`;

    await this.publishService.streamPublish(user.userId, topicIds, artifactIds, promptFactory, res, model);
  }
}
