import { VisualsService } from './visuals.service';
export declare class VisualsController {
    private readonly visualsService;
    constructor(visualsService: VisualsService);
    generateDiagram(body: {
        text: string;
        type?: string;
    }, req: any): Promise<{
        diagram: string;
    }>;
    generateCoverTheme(body: {
        title: string;
        content: string;
    }, req: any): Promise<any>;
}
