import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as cheerio from 'cheerio';

@Processor('capture-processing')
export class InferenceProcessor extends WorkerHost {
  private readonly logger = new Logger(InferenceProcessor.name);
  private readonly OLLAMA_URL = 'http://localhost:11434/api/generate';
  private readonly OLLAMA_MODEL = 'llama3.2'; // Default model

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { artifactId } = job.data;
    this.logger.log(`Processing job ${job.id} for artifact ${artifactId}`);

    const artifact = await this.prisma.artifact.findUnique({
      where: { id: artifactId },
    });

    if (!artifact) {
      throw new Error('Artifact not found');
    }

    await this.prisma.artifact.update({
      where: { id: artifactId },
      data: { status: 'processing' },
    });

    try {
      let contentToProcess = artifact.content || '';

      if (artifact.type === 'URL' && artifact.sourceUrl) {
        this.logger.log(`Fetching content from URL: ${artifact.sourceUrl}`);
        const response = await fetch(artifact.sourceUrl);
        const html = await response.text();
        
        const $ = cheerio.load(html);
        $('script, style, nav, footer, iframe').remove();
        contentToProcess = $('body').text().replace(/\s+/g, ' ').trim();
        
        // Save the extracted text back to the artifact
        await this.prisma.artifact.update({
          where: { id: artifactId },
          data: { content: contentToProcess.substring(0, 5000) },
        });
      }

      this.logger.log(`Sending to Ollama (${this.OLLAMA_MODEL}) for extraction...`);
      
      const prompt = `
        You are a highly capable AI specialized in extracting structured knowledge graphs from text.
        Extract the most important topics, named entities, and provide a short summary of the following text.
        
        TEXT TO ANALYZE:
        "${contentToProcess.substring(0, 4000)}"
        
        Respond ONLY with a valid JSON object matching this exact schema, do not include markdown blocks or any other text:
        {
          "summary": "A 2-3 sentence summary of the text",
          "topics": ["Topic 1", "Topic 2", "Topic 3"],
          "entities": [
            {"name": "Entity Name", "type": "PERSON | ORGANIZATION | TECHNOLOGY | LOCATION | CONCEPT"}
          ]
        }
      `;

      let extractedData;

      try {
        const ollamaResponse = await fetch(this.OLLAMA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.OLLAMA_MODEL,
            prompt: prompt,
            stream: false,
            format: 'json'
          })
        });

        if (!ollamaResponse.ok) {
          throw new Error(`Ollama responded with status: ${ollamaResponse.status}`);
        }

        const data = await ollamaResponse.json();
        extractedData = JSON.parse(data.response);
      } catch (ollamaError) {
        this.logger.error(`Ollama Extraction Failed: ${(ollamaError as Error).message}`);
        this.logger.warn('Please ensure Ollama is installed and running on port 11434 with the llama3.2 model.');
        throw new Error('LLM Extraction Failed');
      }

      this.logger.log('Ollama extraction successful! Saving metadata to the database...');
      
      // Save Summary
      if (extractedData.summary) {
        await this.prisma.summary.create({
          data: {
            text: extractedData.summary,
            artifactId: artifactId,
            userId: artifact.userId,
          },
        });
      }

      // Save Topics
      if (Array.isArray(extractedData.topics)) {
        for (const topic of extractedData.topics) {
          await this.prisma.topic.upsert({
            where: { name_userId: { name: topic, userId: artifact.userId } },
            update: { artifacts: { connect: { id: artifactId } } },
            create: { name: topic, userId: artifact.userId, artifacts: { connect: { id: artifactId } } },
          });
        }
      }

      // Save Entities
      if (Array.isArray(extractedData.entities)) {
        for (const entity of extractedData.entities) {
          await this.prisma.entity.upsert({
            where: { name_type_userId: { name: entity.name, type: entity.type, userId: artifact.userId } },
            update: { artifacts: { connect: { id: artifactId } } },
            create: { name: entity.name, type: entity.type, userId: artifact.userId, artifacts: { connect: { id: artifactId } } },
          });
        }
      }

      this.logger.log('Generating vector embedding...');
      try {
        const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'nomic-embed-text',
            prompt: contentToProcess.substring(0, 4000)
          })
        });

        if (embeddingResponse.ok) {
          const embedData = await embeddingResponse.json();
          const vector = embedData.embedding;
          const vectorString = `[${vector.join(',')}]`;
          await this.prisma.$executeRaw`UPDATE "Artifact" SET embedding = ${vectorString}::vector WHERE id = ${artifactId}`;
          this.logger.log('Vector embedding saved successfully!');
        } else {
          this.logger.warn(`Failed to generate embedding: ${embeddingResponse.statusText}`);
        }
      } catch (err) {
        this.logger.warn(`Failed to connect to Ollama for embeddings: ${(err as Error).message}`);
      }

      await this.prisma.artifact.update({
        where: { id: artifactId },
        data: { status: 'completed' },
      });

      this.logger.log(`Successfully completed job ${job.id}`);
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
