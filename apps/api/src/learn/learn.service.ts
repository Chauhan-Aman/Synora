import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LearnService {
  constructor(private readonly prisma: PrismaService) {}

  async getDueFlashcards(userId: string) {
    const today = new Date();
    
    // Fetch flashcards where nextReviewDate <= now
    return this.prisma.flashcard.findMany({
      where: {
        userId,
        nextReviewDate: {
          lte: today,
        },
      },
      orderBy: {
        nextReviewDate: 'asc',
      },
      take: 20, // Limit to 20 per session to prevent overwhelm
    });
  }

  async reviewFlashcard(userId: string, flashcardId: string, score: number) {
    // Score must be between 0 and 5
    // 0: Complete blackout
    // 1: Incorrect, but remembered the answer upon seeing it
    // 2: Incorrect, but it seemed easy to recall
    // 3: Correct, but with serious difficulty
    // 4: Correct, after a hesitation
    // 5: Perfect response

    const card = await this.prisma.flashcard.findUnique({
      where: { id: flashcardId },
    });

    if (!card || card.userId !== userId) {
      throw new NotFoundException('Flashcard not found');
    }

    let { interval, easeFactor, repetitions } = card;

    if (score >= 3) {
      // Correct response
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      // Incorrect response
      repetitions = 0;
      interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return this.prisma.flashcard.update({
      where: { id: flashcardId },
      data: {
        interval,
        easeFactor,
        repetitions,
        nextReviewDate,
      },
    });
  }
}
