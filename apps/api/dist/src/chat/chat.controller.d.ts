import { PrismaService } from '../prisma/prisma.service';
export declare class ChatController {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    chat(query: string): Promise<{
        response: string;
        sources?: undefined;
    } | {
        response: any;
        sources: any[];
    }>;
}
