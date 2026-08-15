import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CaptureModule } from './capture/capture.module';

import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { InferenceModule } from './inference/inference.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    CaptureModule,
    PrismaModule,
    InferenceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
