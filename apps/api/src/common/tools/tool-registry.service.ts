import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentTool } from './agent-tool';
import { CalculatorTool } from './calculator.tool';
import { CodeRunnerTool } from './code-runner.tool';
import { WebSearchTool } from './web-search.tool';
import { WebScrapeTool } from './web-scrape.tool';
import { KnowledgeGraphTool } from './knowledge-graph.tool';

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);

  /** Stateless tools that are always available regardless of user context */
  private readonly globalTools: Map<string, AgentTool> = new Map();

  constructor(private readonly prisma: PrismaService) {
    this.registerGlobalTool(new CalculatorTool());
    this.registerGlobalTool(new CodeRunnerTool());
    this.registerGlobalTool(new WebSearchTool());
    this.registerGlobalTool(new WebScrapeTool());
  }

  /**
   * Registers a stateless, user-agnostic tool into the global registry.
   */
  private registerGlobalTool(tool: AgentTool): void {
    this.globalTools.set(tool.name, tool);
    this.logger.log(`Registered global Agent Tool: [${tool.name}]`);
  }

  /**
   * Returns all Ollama-formatted tool definitions for a specific user session.
   * Combines global tools with user-scoped tools (e.g. KnowledgeGraphTool).
   */
  getOllamaToolsForUser(userId: string): any[] {
    const sessionTools = this.buildSessionTools(userId);
    const allTools = [...this.globalTools.values(), ...sessionTools.values()];
    return allTools.map((t) => t.toOllamaFormat());
  }

  /**
   * Executes a named tool, first checking session-scoped tools for the given
   * user, then falling back to global tools.
   */
  async executeToolForUser(
    name: string,
    args: Record<string, any>,
    userId: string,
  ): Promise<string> {
    // Check user-scoped tools first (e.g., KnowledgeGraphTool which needs userId)
    const sessionTools = this.buildSessionTools(userId);
    const tool = sessionTools.get(name) ?? this.globalTools.get(name);

    if (!tool) {
      return `Error: Tool "${name}" not found in registry. Available tools: ${[...this.globalTools.keys(), ...sessionTools.keys()].join(', ')}`;
    }

    this.logger.log(`Executing tool [${name}] for user [${userId}] with args: ${JSON.stringify(args)}`);
    try {
      return await tool.execute(args);
    } catch (e: any) {
      this.logger.error(`Tool [${name}] execution failed for user [${userId}]`, e);
      return `Error executing tool: ${e.message}`;
    }
  }

  /**
   * @deprecated Use getOllamaToolsForUser() for user-context-aware tool loading.
   * Kept for backward compatibility with non-user-scoped callers.
   */
  getAllOllamaTools(): any[] {
    return Array.from(this.globalTools.values()).map((t) => t.toOllamaFormat());
  }

  /**
   * @deprecated Use executeToolForUser() for user-context-aware tool execution.
   */
  async executeTool(name: string, args: Record<string, any>): Promise<string> {
    const tool = this.globalTools.get(name);
    if (!tool) {
      return `Error: Tool "${name}" not found in registry.`;
    }
    this.logger.log(`Executing tool [${name}] with args: ${JSON.stringify(args)}`);
    try {
      return await tool.execute(args);
    } catch (e: any) {
      this.logger.error(`Tool [${name}] execution failed`, e);
      return `Error executing tool: ${e.message}`;
    }
  }

  /**
   * Builds the set of user-scoped tools that require runtime context (userId, prisma).
   * These are constructed fresh per call — they are lightweight value objects.
   */
  private buildSessionTools(userId: string): Map<string, AgentTool> {
    const sessionTools = new Map<string, AgentTool>();
    sessionTools.set(
      'knowledge_graph_search',
      new KnowledgeGraphTool(this.prisma, userId),
    );
    return sessionTools;
  }
}
