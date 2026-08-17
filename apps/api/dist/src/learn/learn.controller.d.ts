import { LearnService } from './learn.service';
export declare class LearnController {
    private readonly learnService;
    constructor(learnService: LearnService);
    getDueFlashcards(user: any): Promise<{
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
    reviewFlashcard(user: any, id: string, score: number): Promise<{
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
