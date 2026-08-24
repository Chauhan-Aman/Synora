import { PrismaService } from '../prisma/prisma.service';
export declare class KnowledgeController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getTopics(user: any): Promise<{
        id: string;
        name: string;
        count: number;
    }[]>;
    getEntities(user: any): Promise<{
        id: string;
        name: string;
        type: string;
        count: number;
    }[]>;
    getGraph(user: any): Promise<{
        nodes: ({
            id: string;
            name: string;
            group: string;
            details: string | undefined;
            sourceUrl: string | null;
        } | {
            id: string;
            name: string;
            group: string;
            details?: undefined;
            sourceUrl?: undefined;
        })[];
        links: {
            source: string;
            target: string;
        }[];
    }>;
    getArtifacts(user: any): Promise<{
        id: string;
        title: string | null;
        sourceUrl: string | null;
        type: string;
        status: string;
        content: string | null;
        summary: string | undefined;
        createdAt: Date;
        topics: {
            id: string;
            name: string;
        }[];
        collections: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            name: string;
        }[];
    }[]>;
    getCollections(user: any): Promise<({
        artifacts: {
            id: string;
            title: string | null;
            sourceUrl: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        name: string;
    })[]>;
    createCollection(user: any, body: {
        name: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        name: string;
    }>;
    addArtifactToCollection(user: any, artifactId: string, body: {
        collectionId: string;
    }): Promise<{
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
    getInsights(user: any): Promise<{
        id: string;
        title: string;
        type: string;
        createdAt: Date;
        userId: string;
        description: string;
        sources: string[];
    }[]>;
    generateInsights(user: any): Promise<{
        id: string;
        title: string;
        type: string;
        createdAt: Date;
        userId: string;
        description: string;
        sources: string[];
    }[]>;
}
