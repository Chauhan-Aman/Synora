export abstract class AgentTool {
  abstract name: string;
  abstract description: string;
  abstract schema: Record<string, any>; // JSON Schema format for Ollama parameters

  abstract execute(args: Record<string, any>): Promise<string>;

  toOllamaFormat() {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: this.schema.properties,
          required: this.schema.required || [],
        },
      },
    };
  }
}
