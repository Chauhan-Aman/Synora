import { Module, Global } from '@nestjs/common';
import { LlmService } from './llm.service';
import { ToolRegistryService } from './tools/tool-registry.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * CommonModule — globally provides the core AI infrastructure:
 * - LlmService: Handles all Ollama interactions and the agentic reasoning loop.
 * - ToolRegistryService: Manages the registry of all AgentTool classes.
 *
 * Both services are exported globally so all other modules can inject them
 * without explicitly importing CommonModule.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [LlmService, ToolRegistryService],
  exports: [LlmService, ToolRegistryService],
})
export class CommonModule {}
