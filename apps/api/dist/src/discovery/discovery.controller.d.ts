import { DiscoveryService } from './discovery.service';
export declare class DiscoveryController {
    private readonly discoveryService;
    constructor(discoveryService: DiscoveryService);
    getFeed(user: any): Promise<{
        id: string;
        title: string;
        type: string;
        status: string;
        createdAt: Date;
        userId: string;
        description: string;
        reasoning: string;
    }[]>;
    exploreRecommendation(id: string, user: any): Promise<{
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
