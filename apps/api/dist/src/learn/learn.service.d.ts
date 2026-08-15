import { PrismaService } from '../prisma/prisma.service';
export declare class LearnService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDueFlashcards(userId: string): Promise<{
        id: string;
        question: string;
        answer: string;
        nextReviewDate: Date;
        interval: number;
        easeFactor: number;
        repetitions: number;
        userId: string;
        artifactId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    reviewFlashcard(userId: string, flashcardId: string, score: number): Promise<{
        id: string;
        question: string;
        answer: string;
        nextReviewDate: Date;
        interval: number;
        easeFactor: number;
        repetitions: number;
        userId: string;
        artifactId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
