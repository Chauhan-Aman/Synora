import { Module, Global } from '@nestjs/common';
import { LlmService } from './llm.service';
import { ToolRegistryService } from './tools/tool-registry.service';

@Global()
@Module({
  providers: [LlmService, ToolRegistryService],
  exports: [LlmService, ToolRegistryService]
})
export class CommonModule {}

