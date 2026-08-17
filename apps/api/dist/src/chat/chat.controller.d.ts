import { PrismaService } from '../prisma/prisma.service';
import { CaptureService } from '../capture/capture.service';
export declare class ChatController {
    private readonly prisma;
    private readonly captureService;
    private readonly logger;
    constructor(prisma: PrismaService, captureService: CaptureService);
    chat(query: string, history: any[]): Promise<{
        response: any;
        sources: string[];
    }>;
}
