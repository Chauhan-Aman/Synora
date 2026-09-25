import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * ChatModule — provides the Synora AI chat endpoint.
 *
 * All tool orchestration (web search, scraping, knowledge graph, code execution)
 * is handled internally by the LlmService agentic loop via the ToolRegistryService,
 * both of which are globally exported from CommonModule.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [],
})
export class ChatModule {}
