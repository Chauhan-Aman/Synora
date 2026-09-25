import { Injectable, Logger } from '@nestjs/common';
import { AgentTool } from './agent-tool';
import { CalculatorTool } from './calculator.tool';
import { CodeRunnerTool } from './code-runner.tool';

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private tools: Map<string, AgentTool> = new Map();

  constructor() {
    this.registerTool(new CalculatorTool());
    this.registerTool(new CodeRunnerTool());
  }

  registerTool(tool: AgentTool) {
    this.tools.set(tool.name, tool);
    this.logger.log(`Registered Agent Tool: ${tool.name}`);
  }

  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  getAllOllamaTools() {
    return Array.from(this.tools.values()).map(t => t.toOllamaFormat());
  }

  async executeTool(name: string, args: Record<string, any>): Promise<string> {
    const tool = this.getTool(name);
    if (!tool) {
      return `Error: Tool ${name} not found in registry.`;
    }
    
    this.logger.log(`Executing tool [${name}] with args: ${JSON.stringify(args)}`);
    try {
      const result = await tool.execute(args);
      return result;
    } catch (e: any) {
      this.logger.error(`Tool [${name}] execution failed`, e);
      return `Error executing tool: ${e.message}`;
    }
  }
}
