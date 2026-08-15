import { PrismaService } from '../prisma/prisma.service';
export declare class KnowledgeController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getTopics(): Promise<{
        id: string;
        name: string;
        count: number;
    }[]>;
    getEntities(): Promise<{
        id: string;
        name: string;
        type: string;
        count: number;
    }[]>;
    getGraph(): Promise<{
        nodes: {
            id: string;
            name: string;
            group: string;
        }[];
        links: {
            source: string;
            target: string;
        }[];
    }>;
}
