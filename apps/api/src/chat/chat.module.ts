import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CaptureModule } from '../capture/capture.module';

@Module({
  imports: [PrismaModule, CaptureModule],
  controllers: [ChatController]
})
export class ChatModule {}
