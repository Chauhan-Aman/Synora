import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CaptureModule } from './capture/capture.module';

import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { InferenceModule } from './inference/inference.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { LearnModule } from './learn/learn.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { VisualsModule } from './visuals/visuals.module';
import { PublishModule } from './publish/publish.module';

import { ScheduleModule } from '@nestjs/schedule';
import { CreateModule } from './create/create.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    CaptureModule,
    PrismaModule,
    InferenceModule,
    KnowledgeModule,
    ChatModule,
    AuthModule,
    LearnModule,
    DiscoveryModule,
    CreateModule,
    VisualsModule,
    PublishModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
