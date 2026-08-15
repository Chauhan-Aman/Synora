import { PrismaService } from '../prisma/prisma.service';
export declare class ChatController {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    chat(query: string, user: any): Promise<{
        response: any;
        sources: string[];
    }>;
}
