import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as cheerio from 'cheerio';

@Processor('capture-processing')
export class InferenceProcessor extends WorkerHost {
  private readonly logger = new Logger(InferenceProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { artifactId } = job.data;
    this.logger.log(`Processing job ${job.id} for artifact ${artifactId}`);

    // Fetch the artifact from the database
    const artifact = await this.prisma.artifact.findUnique({
      where: { id: artifactId },
    });

    if (!artifact) {
      this.logger.error(`Artifact ${artifactId} not found!`);
      throw new Error('Artifact not found');
    }

    // Update status to processing
    await this.prisma.artifact.update({
      where: { id: artifactId },
      data: { status: 'processing' },
    });

    try {
      let contentToProcess = artifact.content || '';

      // If it's a URL, we need to fetch the HTML and extract text
      if (artifact.type === 'URL' && artifact.sourceUrl) {
        this.logger.log(`Fetching content from URL: ${artifact.sourceUrl}`);
        const response = await fetch(artifact.sourceUrl);
        const html = await response.text();
        
        // Use cheerio to parse the text and remove scripts/styles
        const $ = cheerio.load(html);
        $('script, style, nav, footer, iframe').remove();
        contentToProcess = $('body').text().replace(/\s+/g, ' ').trim();
        
        // Save the extracted text back to the artifact for reference
        await this.prisma.artifact.update({
          where: { id: artifactId },
          data: { content: contentToProcess.substring(0, 5000) }, // limit to 5000 chars for MVP
        });
      }

      // --- MOCK AI EXTRACTION ---
      // In the future, we will send `contentToProcess` to OpenAI/Gemini here.
      this.logger.log('Running simulated AI extraction...');
      await new Promise((resolve) => setTimeout(resolve, 2500)); // 2.5s delay
      
      const mockSummary = "This is an AI-generated summary of the captured content, highlighting the most important key points.";
      const mockTopics = ["Technology", "System Design", "Artificial Intelligence"];
      const mockEntities = [
        { name: "Synora", type: "PRODUCT" },
        { name: "NestJS", type: "TECHNOLOGY" },
      ];
      // --------------------------

      // Save the Mock Extracted Data into the Knowledge Graph
      this.logger.log('Saving extracted metadata to the database...');
      
      // Save Summary
      await this.prisma.summary.create({
        data: {
          text: mockSummary,
          artifactId: artifactId,
        },
      });

      // Save Topics & Entities (upsert to avoid duplicates, then connect to artifact)
      for (const topic of mockTopics) {
        await this.prisma.topic.upsert({
          where: { name: topic },
          update: { artifacts: { connect: { id: artifactId } } },
          create: { name: topic, artifacts: { connect: { id: artifactId } } },
        });
      }

      for (const entity of mockEntities) {
        await this.prisma.entity.upsert({
          where: { name_type: { name: entity.name, type: entity.type } },
          update: { artifacts: { connect: { id: artifactId } } },
          create: { name: entity.name, type: entity.type, artifacts: { connect: { id: artifactId } } },
        });
      }

      // Mark the job as completely finished
      await this.prisma.artifact.update({
        where: { id: artifactId },
        data: { status: 'completed' },
      });

      this.logger.log(`Successfully completed job ${job.id} for artifact ${artifactId}`);
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}: ${(error as Error).message}`);
      await this.prisma.artifact.update({
        where: { id: artifactId },
        data: { status: 'failed' },
      });
      throw error;
    }
  }
}
