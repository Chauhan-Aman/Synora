import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaptureDto } from './dto/create-capture.dto';
export declare class CaptureService {
    private prisma;
    private captureQueue;
    private readonly logger;
    constructor(prisma: PrismaService, captureQueue: Queue);
    create(createCaptureDto: CreateCaptureDto, userId: string): Promise<{
        message: string;
        artifactId: string;
    }>;
}
