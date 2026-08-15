import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LearnService } from './learn.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('learn')
export class LearnController {
  constructor(private readonly learnService: LearnService) {}

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
