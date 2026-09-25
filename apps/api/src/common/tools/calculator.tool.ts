import { AgentTool } from './agent-tool';
import * as math from 'mathjs';

export class CalculatorTool extends AgentTool {
  name = 'calculator';
  description = 'Useful for evaluating complex mathematical expressions. Input should be a valid mathematical expression string.';
  schema = {
    properties: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to evaluate (e.g. 2 + 2 * 3, 100 / 4, 2^3)',
      },
    },
    required: ['expression'],
  };

  async execute(args: Record<string, any>): Promise<string> {
    try {
      if (!args.expression) {
        return 'Error: Expression missing';
      }
      // mathjs evaluates the expression safely
      const result = math.evaluate(args.expression);
      return String(result);
    } catch (e: any) {
      return `Error calculating expression: ${e.message}`;
    }
  }
}
