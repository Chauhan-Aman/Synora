import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
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

  @Post(':id/explore')
  async exploreRecommendation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.discoveryService.exploreRecommendation(user.userId, id);
  }
}
