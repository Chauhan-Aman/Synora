import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as Tesseract from 'tesseract.js';


@Processor('capture-processing')
export class InferenceProcessor extends WorkerHost {
  private readonly logger = new Logger(InferenceProcessor.name);
  private readonly OLLAMA_URL = 'http://localhost:11434/api/generate';
  private readonly OLLAMA_MODEL = 'llama3.2'; // Default model

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.substring(i, i + chunkSize));
      i += chunkSize - overlap;
    }
    return chunks;
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
      } else if (artifact.type === 'PDF' && artifact.content) {
        this.logger.log(`Parsing PDF file: ${artifact.content}`);
        const dataBuffer = fs.readFileSync(artifact.content);
        const pdfParseLib = require('pdf-parse');
        const data = await pdfParseLib(dataBuffer);
        contentToProcess = data.text.replace(/\s+/g, ' ').trim();

        await this.prisma.artifact.update({
          where: { id: artifactId },
          data: { content: contentToProcess.substring(0, 5000) },
        });
      } else if (artifact.type === 'IMAGE' && artifact.content) {
        this.logger.log(`Running OCR on Image file: ${artifact.content}`);
        const { data: { text } } = await Tesseract.recognize(artifact.content, 'eng');
        contentToProcess = text.replace(/\s+/g, ' ').trim();

        await this.prisma.artifact.update({
          where: { id: artifactId },
          data: { content: contentToProcess.substring(0, 5000) },
        });
      }

      this.logger.log(`Sending to Ollama (${this.OLLAMA_MODEL}) for extraction...`);

      const prompt = `
        You are a highly capable AI specialized in extracting structured knowledge graphs from text.
        Extract the most important topics, named entities, a short summary, and 3 Question & Answer flashcards to test the user's knowledge on this text.
        
        TEXT TO ANALYZE:
        "${contentToProcess.substring(0, 4000)}"
        
        Respond ONLY with a valid JSON object matching this exact schema. DO NOT just copy the example text in the schema, you must GENERATE REAL content based on the TEXT TO ANALYZE:
        {
          "title": "A short, catchy, 3 to 6 word title for this document",
          "summary": "A 2-3 sentence summary of the text",
          "topics": ["Real Topic 1", "Real Topic 2", "Real Topic 3"],
          "entities": [
            {"name": "Real Entity Name", "type": "PERSON | ORGANIZATION | TECHNOLOGY | LOCATION | CONCEPT"}
          ],
          "flashcards": [
            {"question": "A real question testing a specific fact from the text", "answer": "The real factual answer from the text"}
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

      // Save Title if present
      if (extractedData.title) {
        await this.prisma.artifact.update({
          where: { id: artifactId },
          data: { title: extractedData.title }
        });
      }

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

      // Save Flashcards
      if (Array.isArray(extractedData.flashcards)) {
        this.logger.log(`Saving ${extractedData.flashcards.length} flashcards...`);
        for (const card of extractedData.flashcards) {
          if (card.question && card.answer) {
            await this.prisma.flashcard.create({
              data: {
                question: card.question,
                answer: card.answer,
                userId: artifact.userId,
                artifactId: artifactId,
              }
            });
          }
        }
      }

      this.logger.log('Generating vector embeddings for chunks...');
      const chunks = this.chunkText(contentToProcess);

      for (const chunkText of chunks) {
        if (!chunkText.trim()) continue;

        try {
          const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'nomic-embed-text',
              prompt: chunkText
            })
          });

          if (embeddingResponse.ok) {
            const embedData = await embeddingResponse.json();
            const vector = embedData.embedding;
            const vectorString = `[${vector.join(',')}]`;

            const newChunk = await this.prisma.chunk.create({
              data: {
                text: chunkText,
                userId: artifact.userId,
                artifactId: artifactId,
              }
            });

            await this.prisma.$executeRaw`UPDATE "Chunk" SET embedding = ${vectorString}::vector, "searchVector" = to_tsvector('english', ${chunkText}) WHERE id = ${newChunk.id}`;
          } else {
            this.logger.warn(`Failed to generate embedding: ${embeddingResponse.statusText}`);
          }
        } catch (err) {
          this.logger.warn(`Failed to connect to Ollama for embeddings: ${(err as Error).message}`);
        }
      }
      this.logger.log(`Created ${chunks.length} chunks with vector embeddings!`);

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
