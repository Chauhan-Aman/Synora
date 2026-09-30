import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('feed')
  async getFeed(@CurrentUser() user: any) {
    return this.discoveryService.getFeed(user.userId);
  }

  @Post('generate-more')
  async generateMore(@CurrentUser() user: any) {
    return this.discoveryService.generateMore(user.userId);
  }

  @Post('custom')
  async generateCustom(@CurrentUser() user: any, @Body('topic') topic: string) {
    return this.discoveryService.generateCustom(user.userId, topic);
  }

  @Post(':id/explore')
  async exploreRecommendation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.discoveryService.exploreRecommendation(user.userId, id);
  }

  @Get('taste-profile')
  async getTasteProfile(@CurrentUser() user: any) {
    return this.discoveryService.getTasteProfile(user.userId);
  }

  @Post(':id/dive-deeper')
  async diveDeeper(@Param('id') id: string, @CurrentUser() user: any) {
    return this.discoveryService.diveDeeper(user.userId, id);
  }
}
