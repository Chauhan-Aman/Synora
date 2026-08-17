import { LearnService } from './learn.service';
import { LearnCronService } from './learn.cron.service';
export declare class LearnController {
    private readonly learnService;
    private readonly learnCronService;
    constructor(learnService: LearnService, learnCronService: LearnCronService);
    triggerCron(): Promise<{
        status: string;
    }>;
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
