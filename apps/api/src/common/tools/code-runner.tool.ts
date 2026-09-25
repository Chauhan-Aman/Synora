import { AgentTool } from './agent-tool';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export class CodeRunnerTool extends AgentTool {
  name = 'code_runner';
  description = 'Useful for executing Python scripts to crunch data, parse complex logic, or execute general python code. Input should be a valid Python script string.';
  schema = {
    properties: {
      script: {
        type: 'string',
        description: 'The complete Python script to execute. The output of the print() statements will be returned.',
      },
    },
    required: ['script'],
  };

  async execute(args: Record<string, any>): Promise<string> {
    try {
      if (!args.script) {
        return 'Error: Script missing';
      }
      
      // Save the script to a temporary file
      const tmpDir = path.join(process.cwd(), 'tmp');
      await fs.mkdir(tmpDir, { recursive: true });
      const tmpFile = path.join(tmpDir, `script_${Date.now()}.py`);
      await fs.writeFile(tmpFile, args.script);

      // Execute the script
      try {
        const { stdout, stderr } = await execAsync(`python "${tmpFile}"`, { timeout: 10000 });
        await fs.unlink(tmpFile).catch(() => {}); // cleanup
        
        if (stderr) {
          return `Execution finished with stderr: \n${stderr}\n\nstdout: \n${stdout}`;
        }
        return stdout || 'Script executed successfully with no output.';
      } catch (execError: any) {
        await fs.unlink(tmpFile).catch(() => {}); // cleanup
        return `Execution Error: ${execError.message}`;
      }
    } catch (e: any) {
      return `Error preparing script for execution: ${e.message}`;
    }
  }
}
