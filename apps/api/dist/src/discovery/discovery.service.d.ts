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
        type: string;
        status: string;
        createdAt: Date;
        userId: string;
        description: string;
        reasoning: string;
    }[]>;
    private generateDailyFeed;
    exploreRecommendation(userId: string, id: string): Promise<{
        id: string;
        title: string | null;
        sourceUrl: string | null;
        content: string | null;
        type: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
}
