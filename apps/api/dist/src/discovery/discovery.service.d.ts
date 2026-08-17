import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';
export declare class DiscoveryService {
    private readonly prisma;
    private captureQueue;
    private readonly logger;
    private readonly OLLAMA_URL;
    private readonly OLLAMA_MODEL;
    constructor(prisma: PrismaService, captureQueue: Queue);
    getFeed(userId: string): Promise<{
        id: string;
        title: string;
        description: string;
        reasoning: string;
        type: string;
        status: string;
        userId: string;
        createdAt: Date;
    }[]>;
    private generateDailyFeed;
    exploreRecommendation(userId: string, id: string): Promise<{
        id: string;
        type: string;
        status: string;
        userId: string;
        createdAt: Date;
        sourceUrl: string | null;
        content: string | null;
        updatedAt: Date;
    }>;
}
