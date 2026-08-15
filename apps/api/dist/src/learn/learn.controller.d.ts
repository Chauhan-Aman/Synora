import { LearnService } from './learn.service';
export declare class LearnController {
    private readonly learnService;
    constructor(learnService: LearnService);
    getDueFlashcards(user: any): Promise<{
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
    reviewFlashcard(user: any, id: string, score: number): Promise<{
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
