import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
export declare class InferenceProcessor extends WorkerHost {
    private readonly prisma;
    private readonly logger;
    private readonly OLLAMA_URL;
    private readonly OLLAMA_MODEL;
    constructor(prisma: PrismaService);
    private chunkText;
    process(job: Job<any, any, string>): Promise<any>;
}
