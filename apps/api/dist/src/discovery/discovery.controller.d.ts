import { DiscoveryService } from './discovery.service';
export declare class DiscoveryController {
    private readonly discoveryService;
    constructor(discoveryService: DiscoveryService);
    getFeed(user: any): Promise<{
        id: string;
        title: string;
        description: string;
        reasoning: string;
        type: string;
        imageUrl: string | null;
        status: string;
        userId: string;
        createdAt: Date;
    }[]>;
    exploreRecommendation(id: string, user: any): Promise<{
        id: string;
        title: string | null;
        type: string;
        status: string;
        userId: string;
        createdAt: Date;
        sourceUrl: string | null;
        content: string | null;
        updatedAt: Date;
    }>;
    getTasteProfile(user: any): Promise<{
        profile: any;
    }>;
    diveDeeper(id: string, user: any): Promise<{
        id: string;
        title: string;
        description: string;
        reasoning: string;
        type: string;
        imageUrl: string | null;
        status: string;
        userId: string;
        createdAt: Date;
    }[]>;
}
