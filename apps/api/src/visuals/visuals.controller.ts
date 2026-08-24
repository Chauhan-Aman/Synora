import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { VisualsService } from './visuals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('visuals')
@UseGuards(JwtAuthGuard)
export class VisualsController {
  constructor(private readonly visualsService: VisualsService) {}

  @Post('diagram')
  async generateDiagram(@Body() body: { text: string; type?: string }, @Req() req: any) {
    return { diagram: await this.visualsService.generateDiagram(body.text, body.type || 'mindmap') };
  }

  @Post('cover-theme')
  async generateCoverTheme(@Body() body: { title: string; content: string }, @Req() req: any) {
    return await this.visualsService.generateCoverTheme(body.title, body.content);
  }
}
