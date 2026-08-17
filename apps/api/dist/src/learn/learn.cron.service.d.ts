import { PrismaService } from '../prisma/prisma.service';
export declare class LearnCronService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleDailySpacedRepetition(): Promise<void>;
}
