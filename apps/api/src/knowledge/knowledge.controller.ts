import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { KnowledgeService } from './knowledge.service';

@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('topics')
  async getTopics(@CurrentUser() user: any) {
    return this.knowledgeService.getTopics(user.userId);
  }

  @Get('entities')
  async getEntities(@CurrentUser() user: any) {
    return this.knowledgeService.getEntities(user.userId);
  }

  @Get('graph')
  async getGraph(@CurrentUser() user: any) {
    return this.knowledgeService.getGraph(user.userId);
  }

  @Get('artifacts')
  async getArtifacts(@CurrentUser() user: any) {
    return this.knowledgeService.getArtifacts(user.userId);
  }

  @Get('collections')
  async getCollections(@CurrentUser() user: any) {
    return this.knowledgeService.getCollections(user.userId);
  }

  @Post('collections')
  async createCollection(@CurrentUser() user: any, @Body() body: { name: string }) {
    return this.knowledgeService.createCollection(user.userId, body.name);
  }

  @Post('artifacts/:id/collections')
  async addArtifactToCollection(@CurrentUser() user: any, @Param('id') artifactId: string, @Body() body: { collectionId: string }) {
    return this.knowledgeService.addArtifactToCollection(user.userId, artifactId, body.collectionId);
  }

  @Get('insights')
  async getInsights(@CurrentUser() user: any) {
    return this.knowledgeService.getInsights(user.userId);
  }

  @Post('insights/generate')
  async generateInsights(@CurrentUser() user: any) {
    return this.knowledgeService.generateInsights(user.userId);
  }

  @Delete('wipe')
  async wipeKnowledgeBase(@CurrentUser() user: any) {
    return this.knowledgeService.wipeKnowledgeBase(user.userId);
  }
}
