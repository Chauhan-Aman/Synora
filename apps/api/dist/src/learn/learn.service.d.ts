import { PrismaService } from '../prisma/prisma.service';
export declare class LearnService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDueFlashcards(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        artifactId: string;
        question: string;
        answer: string;
        nextReviewDate: Date;
        interval: number;
        easeFactor: number;
        repetitions: number;
    }[]>;
    reviewFlashcard(userId: string, flashcardId: string, score: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        artifactId: string;
        question: string;
        answer: string;
        nextReviewDate: Date;
        interval: number;
        easeFactor: number;
        repetitions: number;
    }>;
}
