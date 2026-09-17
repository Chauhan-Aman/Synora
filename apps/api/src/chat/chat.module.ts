import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { WebSearchService } from './web-search.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CaptureModule } from '../capture/capture.module';

@Module({
  imports: [PrismaModule, CaptureModule],
  controllers: [ChatController],
  providers: [WebSearchService],
})
export class ChatModule {}
