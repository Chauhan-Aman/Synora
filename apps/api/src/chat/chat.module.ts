import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

/**
 * ChatModule — provides the Synora AI chat endpoint.
 *
 * All tool orchestration (web search, scraping, knowledge graph, code execution)
 * is handled internally by the LlmService agentic loop via the ToolRegistryService,
 * both of which are globally exported from CommonModule.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ChatController],
  providers: [OptionalJwtAuthGuard],
})
export class ChatModule {}
