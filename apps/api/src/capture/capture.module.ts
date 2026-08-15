import { Module } from '@nestjs/common';
import { CaptureService } from './capture.service';
import { CaptureController } from './capture.controller';

import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'capture-processing',
    }),
  ],
  controllers: [CaptureController],
  providers: [CaptureService],
})
export class CaptureModule {}
