import { CreateService } from './create.service';
export declare class CreateController {
    private readonly createService;
    constructor(createService: CreateService);
    fetchContext(draft: string, user: any): Promise<{
        context: any[];
    }>;
    generateParagraph(draft: string, context: any[], user: any, model?: string): Promise<{
        nextParagraph: string;
    }>;
    rewriteParagraph(draft: string, suggestedParagraph: string, instructions: string, context: any[], user: any, model?: string): Promise<{
        nextParagraph: string;
    }>;
}
