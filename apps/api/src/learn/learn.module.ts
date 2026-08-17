import { Module } from '@nestjs/common';
import { LearnController } from './learn.controller';
import { LearnService } from './learn.service';
import { PrismaModule } from '../prisma/prisma.module';

import { LearnCronService } from './learn.cron.service';

@Module({
  imports: [PrismaModule],
  controllers: [LearnController],
  providers: [LearnService, LearnCronService]
})
export class LearnModule {}
