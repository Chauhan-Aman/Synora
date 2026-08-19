import { PrismaService } from '../prisma/prisma.service';
export declare class CreateService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    fetchContext(draftText: string, userId: string): Promise<any[]>;
    generateParagraph(draftText: string, contextArtifacts: any[]): Promise<string>;
    rewriteParagraph(draftText: string, suggestedParagraph: string, instructions: string, contextArtifacts: any[]): Promise<string>;
}
