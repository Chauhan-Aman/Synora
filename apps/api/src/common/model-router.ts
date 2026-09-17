import { Logger } from '@nestjs/common';

export type TaskCategory = 
  | 'REASONING'   // Deep thinking, chat, insights
  | 'EXTRACTION'  // Simple metadata, topic, entity extraction
  | 'CODING'      // Code generation or technical content
  | 'DRAFTING'    // Fast text generation (blog posts, emails)
  | 'VISION';     // Image analysis

export class ModelRouter {
  private static readonly logger = new Logger(ModelRouter.name);
  
  // Default fallback if a specific model isn't configured
  private static readonly FALLBACK_MODEL = 'llama3.1';

  /**
   * Returns the best model for a given task type, unless the user explicitly overrode it.
   * @param taskCategory The type of task being performed
   * @param userRequestedModel The model string requested by the user (e.g., from frontend config)
   */
  static getBestModel(taskCategory: TaskCategory, userRequestedModel?: string): string {
    // 1. If user explicitly chose a specific model (not 'auto'), respect their choice
    // unless they chose 'auto', 'null', or undefined.
    if (userRequestedModel && userRequestedModel.toLowerCase() !== 'auto' && userRequestedModel !== 'null') {
      this.logger.debug(`[ModelRouter] User explicitly requested model: ${userRequestedModel} for task: ${taskCategory}`);
      return userRequestedModel;
    }

    // 2. Automatic routing based on task category
    let selectedModel = this.FALLBACK_MODEL;
    
    switch (taskCategory) {
      case 'REASONING':
        // qwen2.5:14b has excellent deep reasoning and instruction following
        selectedModel = 'qwen2.5:14b';
        break;
      case 'EXTRACTION':
        // Extraction is simpler — llama3.1 is fast and accurate enough
        selectedModel = 'llama3.1'; 
        break;
      case 'CODING':
        // qwen2.5-coder:14b is purpose-built for code tasks
        selectedModel = 'qwen2.5-coder:14b';
        break;
      case 'DRAFTING':
        // qwen2.5:14b produces high-quality long-form text
        selectedModel = 'qwen2.5:14b';
        break;
      case 'VISION':
        // llama3.2-vision if available, otherwise fallback
        selectedModel = 'llama3.2-vision';
        break;
      default:
        selectedModel = this.FALLBACK_MODEL;
    }

    this.logger.debug(`[ModelRouter] Automatically routed ${taskCategory} task to model: ${selectedModel}`);
    return selectedModel;
  }
}
