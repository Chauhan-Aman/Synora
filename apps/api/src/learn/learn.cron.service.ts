import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LearnCronService {
  private readonly logger = new Logger(LearnCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailySpacedRepetition() {
    this.logger.log('Running daily SM-2 Spaced Repetition Cron Job...');
    
    // In a real multi-tenant app, we'd loop through active users.
    // For this MVP, we find all flashcards that are due.
    const today = new Date();
    
    const dueFlashcards = await this.prisma.flashcard.findMany({
      where: {
        nextReviewDate: {
          lte: today
        }
      }
    });

    this.logger.log(`Found ${dueFlashcards.length} flashcards due for review.`);

    // Wait, the SM-2 logic updates the intervals WHEN the user answers the card.
    // The cron job's main purpose according to the roadmap is to:
    // "query the LLM to automatically generate Spaced-Repetition flashcards based on the user's Knowledge Graph topics."
    
    // So let's generate NEW flashcards for Topics that don't have enough cards.
    const users = await this.prisma.user.findMany();
    
    for (const user of users) {
      // Find a random topic for this user
      const topics = await this.prisma.topic.findMany({
        where: { userId: user.id },
        include: { artifacts: { include: { chunks: true } } }
      });
      
      if (topics.length === 0) continue;
      
      // Pick a random topic to reinforce today
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      this.logger.log(`Generating daily reinforcement flashcard for user ${user.id} on topic: ${randomTopic.name}`);
      
      // Gather context
      const contextText = randomTopic.artifacts
        .flatMap(a => a.chunks)
        .slice(0, 5) // max 5 chunks to avoid token limits
        .map(c => c.text)
        .join('\n\n');
        
      if (!contextText) continue;
      
      const prompt = `
        You are a tutor creating flashcards for spaced repetition.
        The user is studying the topic: "${randomTopic.name}".
        
        Using ONLY the following context, generate 1 highly specific Question & Answer flashcard to test their knowledge.
        DO NOT include markdown formatting outside the JSON.
        
        CONTEXT:
        ${contextText}
        
        Respond with ONLY a valid JSON object matching this schema:
        {
          "question": "A specific question",
          "answer": "The specific factual answer"
        }
      `;
      
      try {
        const ollamaRes = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2',
            prompt: prompt,
            stream: false,
            format: 'json'
          })
        });
        
        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          const parsed = JSON.parse(data.response);
          
          if (parsed.question && parsed.answer) {
            await this.prisma.flashcard.create({
              data: {
                question: parsed.question,
                answer: parsed.answer,
                userId: user.id,
                artifactId: randomTopic.artifacts[0].id // Just link to the first artifact
              }
            });
            this.logger.log(`Successfully generated new flashcard: ${parsed.question}`);
          }
        }
      } catch (err) {
        this.logger.error(`Failed to generate flashcard: ${(err as Error).message}`);
      }
    }
    
    this.logger.log('Daily Spaced Repetition Cron Job completed.');
  }
}
