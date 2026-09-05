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
        // Llama 3.1 8B Instruct is great for deep reasoning
        selectedModel = 'llama3.1';
        break;
      case 'EXTRACTION':
        // Extraction is fast and simple, Llama 3.1 or Gemma 2 
        selectedModel = 'llama3.1'; 
        break;
      case 'CODING':
        // Coding tasks are best suited for deepseek coder
        selectedModel = 'deepseek-coder-v2';
        break;
      case 'DRAFTING':
        // Fast generation, qwen2.5 or llama3.1
        selectedModel = 'llama3.1';
        break;
      case 'VISION':
        // Only vision models can process images
        selectedModel = 'llama3.2-vision';
        break;
      default:
        selectedModel = this.FALLBACK_MODEL;
    }

    this.logger.debug(`[ModelRouter] Automatically routed ${taskCategory} task to model: ${selectedModel}`);
    return selectedModel;
  }
}
