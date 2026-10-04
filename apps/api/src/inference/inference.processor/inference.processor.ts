import { Processor, WorkerHost } from '@nestjs/bullmq';
import { YoutubeTranscript } from 'youtube-transcript';
import { Job } from 'bullmq';
import { ModelRouter } from '../../common/model-router';
import { LlmService } from '../../common/llm.service';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as Tesseract from 'tesseract.js';

@Processor('capture-processing')
export class InferenceProcessor extends WorkerHost {
  private readonly logger = new Logger(InferenceProcessor.name);

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
    const { artifactId, model } = job.data;
    const targetModel = ModelRouter.getBestModel('EXTRACTION', model);
    this.logger.log(`Processing job ${job.id} for artifact ${artifactId} using model ${targetModel}`);

    const artifact = await this.prisma.artifact.findUnique({
      where: { id: artifactId },
      include: { user: true }
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
        if (artifact.sourceUrl.includes('youtube.com') || artifact.sourceUrl.includes('youtu.be')) {
          this.logger.log(`Fetching YouTube transcript for: ${artifact.sourceUrl}`);
          try {
            let transcript;
            try {
              // Try forcing English first
              transcript = await YoutubeTranscript.fetchTranscript(artifact.sourceUrl, { lang: 'en' });
            } catch (e: any) {
              // If English isn't available, just get whatever the default is
              this.logger.log(`English transcript not found, falling back to default language...`);
              transcript = await YoutubeTranscript.fetchTranscript(artifact.sourceUrl);
            }
            contentToProcess = transcript.map(t => t.text).join(' ').replace(/\s+/g, ' ').trim();
          } catch (error: any) {
            throw new Error(`FATAL_FETCH_ERROR: Failed to fetch YouTube transcript: ${error.message}`);
          }
        } else {
          this.logger.log(`Fetching content from URL: ${artifact.sourceUrl}`);
          try {
            const response = await fetch(artifact.sourceUrl);
            const html = await response.text();

            // Extract clean article HTML using Readability
            const dom = new JSDOM(html, { url: artifact.sourceUrl });
            const reader = new Readability(dom.window.document);
            const article = reader.parse();
            
            let cleanHtml = article?.content || '';
            
            // Fallback to cheerio if Readability fails
            if (!cleanHtml) {
              const $ = cheerio.load(html);
              $('script, style, nav, footer, iframe, noscript, header, aside').remove();
              cleanHtml = $('body').html() || '';
            }

            const turndownService = new TurndownService({
              headingStyle: 'atx',
              codeBlockStyle: 'fenced'
            });
            contentToProcess = turndownService.turndown(cleanHtml);
          } catch (error: any) {
            throw new Error(`FATAL_FETCH_ERROR: Failed to fetch URL content: ${error.message}`);
          }
        }

        await this.prisma.artifact.update({
          where: { id: artifactId },
          data: { content: contentToProcess },
        });
      } else if (artifact.type === 'PDF' && artifact.content) {
        if (artifact.content.length < 500 && (artifact.content.toLowerCase().endsWith('.pdf') || artifact.content.includes('uploads'))) {
          this.logger.log(`Parsing PDF file: ${artifact.content}`);
          const dataBuffer = fs.readFileSync(artifact.content);
          const pdfParseLib = require('pdf-parse');
          const data = await pdfParseLib(dataBuffer);
          contentToProcess = data.text.replace(/\s+/g, ' ').trim();

          await this.prisma.artifact.update({
            where: { id: artifactId },
            data: { content: contentToProcess },
          });
        } else {
          // Already parsed in a previous attempt
          contentToProcess = artifact.content;
        }
      } else if (artifact.type === 'IMAGE' && artifact.content) {
        if (artifact.content.length < 500 && artifact.content.includes('uploads')) {
          this.logger.log(`Running llama3.2-vision on Image file: ${artifact.content}`);
          const imageBuffer = fs.readFileSync(artifact.content);
          const base64Image = imageBuffer.toString('base64');
          
          const visionRes = await fetch(LlmService.OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3.2-vision',
              prompt: 'Please transcribe all text in this image accurately. If it is a diagram, chart, or infographic, provide a detailed description of the concepts and structures shown.',
              images: [base64Image],
              stream: false
            })
          });
          
          if (visionRes.ok) {
            const visionData = await visionRes.json();
            contentToProcess = visionData.response.trim();
          } else {
            throw new Error('FATAL_FETCH_ERROR: Failed to process image with Vision model. Ensure you have run `ollama pull llama3.2-vision`');
          }

          await this.prisma.artifact.update({
            where: { id: artifactId },
            data: { content: contentToProcess },
          });
        } else {
          // Already parsed in a previous attempt
          contentToProcess = artifact.content;
        }
      }

      this.logger.log(`Sending to Ollama (${targetModel}) for extraction...`);

      const userPreferences = artifact.user?.preferences ? `\nUSER CUSTOM INSTRUCTIONS:\n${artifact.user.preferences}\n` : '';

      const prompt = `
        You are an expert Knowledge Graph AI. Your ONLY job is to extract MEANINGFUL, ACCURATE structured data from the given text.
        ${userPreferences}
        STRICT RULES — READ CAREFULLY:
        
        For "topics" (array of strings):
        - ONLY extract the core academic, technical, or professional subjects discussed.
        - Prioritize specific domains (e.g. "Computer Vision", "Microservices Architecture", "Machine Learning", "Backend Engineering") over generic terms.
        - Topics must be 2-5 words and read like Wikipedia article titles.
        - DO NOT extract: speaker names, channel names, platform names, single letters, generic words, or conversational context.
        - Maximum 5 topics. Focus on the most dominant and specialized themes.

        For "entities" (array of objects):
        - ONLY extract SPECIFIC, REAL-WORLD named entities that are CENTRAL to the text's subject matter.
        - Valid entity types: PERSON (real historical/technical figures), ORGANIZATION (real companies/institutions), TECHNOLOGY (specific programming languages/tools/frameworks), CONCEPT (well-defined academic concepts).
        - DO NOT extract: variable names, social media platforms, TV shows, or anything not directly relevant to the core topic.
        - If unsure, leave it out. Empty array is better than wrong entities.

        TEXT TO ANALYZE:
        "${contentToProcess.substring(0, 12000)}"
        
        Respond ONLY with a valid JSON object. No markdown, no code blocks, just raw JSON:
        {
          "title": "3-6 word descriptive title of the TOPIC. NEVER USE '...', DO NOT truncate the summary. Invent a REAL short title.",
          "summary": "2-3 sentences summarizing the core technical/academic content only",
          "topics": ["Core Technical Topic 1", "Algorithm or Concept 2"],
          "entities": [
            {"name": "Specific Named Entity", "type": "PERSON | ORGANIZATION | TECHNOLOGY | CONCEPT"}
          ],
          "flashcards": [
            {"question": "Specific technical question about the core subject", "answer": "Precise factual answer from the text"}
          ]
        }
      `;

      let extractedData;

      try {
        const ollamaResponse = await fetch(LlmService.OLLAMA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: targetModel,
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

      if (extractedData.title) {
        await this.prisma.artifact.update({
          where: { id: artifactId },
          data: { title: extractedData.title }
        });
      }

      if (extractedData.summary) {
        await this.prisma.summary.upsert({
          where: { artifactId: artifactId },
          update: { text: extractedData.summary },
          create: {
            text: extractedData.summary,
            artifactId: artifactId,
            userId: artifact.userId,
          },
        });
      }

      if (Array.isArray(extractedData.topics)) {
        for (const topic of extractedData.topics) {
          await this.prisma.topic.upsert({
            where: { name_userId: { name: topic, userId: artifact.userId } },
            update: { artifacts: { connect: { id: artifactId } } },
            create: { name: topic, userId: artifact.userId, artifacts: { connect: { id: artifactId } } },
          });
        }
      }

      if (Array.isArray(extractedData.entities)) {
        for (const entity of extractedData.entities) {
          await this.prisma.entity.upsert({
            where: { name_type_userId: { name: entity.name, type: entity.type, userId: artifact.userId } },
            update: { artifacts: { connect: { id: artifactId } } },
            create: { name: entity.name, type: entity.type, userId: artifact.userId, artifacts: { connect: { id: artifactId } } },
          });
        }
      }

      // Clear old flashcards and chunks if this is an update
      await this.prisma.flashcard.deleteMany({ where: { artifactId } });
      await this.prisma.chunk.deleteMany({ where: { artifactId } });

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
          const embeddingResponse = await fetch(LlmService.EMBEDDING_URL, {
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
      const errMsg = (error as Error).message;
      this.logger.error(`Failed to process job ${job.id}: ${errMsg}`);
      
      if (errMsg.includes('FATAL_FETCH_ERROR')) {
        await this.prisma.artifact.delete({ where: { id: artifactId } }).catch(() => {});
      } else {
        await this.prisma.artifact.update({
          where: { id: artifactId },
          data: { status: 'failed' },
        }).catch(() => {});
      }
      
      throw error;
    }
  }
}
