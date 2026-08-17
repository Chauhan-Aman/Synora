import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LearnService } from './learn.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

import { LearnCronService } from './learn.cron.service';

@UseGuards(JwtAuthGuard)
@Controller('learn')
export class LearnController {
  constructor(
    private readonly learnService: LearnService,
    private readonly learnCronService: LearnCronService
  ) {}

  @Post('trigger-cron')
  async triggerCron() {
    // Fire it asynchronously so the request doesn't hang
    this.learnCronService.handleDailySpacedRepetition();
    return { status: 'Cron job triggered in background' };
  }

  @Get('due')
  async getDueFlashcards(@CurrentUser() user: any) {
    return this.learnService.getDueFlashcards(user.userId);
  }

  @Post('review/:id')
  async reviewFlashcard(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('score') score: number,
  ) {
    return this.learnService.reviewFlashcard(user.userId, id, score);
  }
}
