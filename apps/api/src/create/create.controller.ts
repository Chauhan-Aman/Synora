import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CreateService } from './create.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('create')
export class CreateController {
  constructor(private readonly createService: CreateService) {}

  @Post('context')
  async fetchContext(
    @Body('draft') draft: string,
    @CurrentUser() user: any
  ) {
    const context = await this.createService.fetchContext(draft, user.userId);
    return { context };
  }

  @Post('generate')
  async generateParagraph(
    @Body('draft') draft: string,
    @Body('context') context: any[],
    @CurrentUser() user: any
  ) {
    const nextParagraph = await this.createService.generateParagraph(draft, context);
    return { nextParagraph };
  }

  @Post('rewrite')
  async rewriteParagraph(
    @Body('draft') draft: string,
    @Body('suggestedParagraph') suggestedParagraph: string,
    @Body('instructions') instructions: string,
    @Body('context') context: any[],
    @CurrentUser() user: any
  ) {
    const nextParagraph = await this.createService.rewriteParagraph(draft, suggestedParagraph, instructions, context);
    return { nextParagraph };
  }
}
