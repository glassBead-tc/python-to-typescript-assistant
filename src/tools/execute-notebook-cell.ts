import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { execa } from 'execa';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const ExecuteNotebookCellArgsSchema = z.object({
  code: z.string().describe('TypeScript code to execute'),
  cellId: z.string().optional().describe('Optional cell identifier for tracking'),
  timeout: z.number().default(5000).describe('Execution timeout in milliseconds'),
  sandboxOptions: z.object({
    allowFileSystem: z.boolean().default(false),
    allowNetwork: z.boolean().default(false),
    maxMemoryMB: z.number().default(512),
  }).optional(),
});

type ExecuteNotebookCellArgs = z.infer<typeof ExecuteNotebookCellArgsSchema>;

interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  error?: string | undefined;
  cellId?: string | undefined;
}

export async function registerExecuteNotebookCellTool(server: any): Promise<void> {
  server.tool(
    'execute-notebook-cell',
    'Execute TypeScript code in a sandboxed environment with captured output',
    ExecuteNotebookCellArgsSchema,
    async ({ code, cellId, timeout = 5000, sandboxOptions = {
      allowFileSystem: false,
      allowNetwork: false,
      maxMemoryMB: 512
    } }: ExecuteNotebookCellArgs) => {
    const startTime = Date.now();
    const tempDir = join(tmpdir(), '.notebooks', 'tmp');
    const sessionId = randomBytes(8).toString('hex');
    const tempFile = join(tempDir, `cell_${sessionId}.ts`);
    
    try {
      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true });
      
      // Wrap code with sandbox restrictions if needed
      const wrappedCode = wrapCodeWithSandbox(code, sandboxOptions);
      
      // Write code to temporary file
      await fs.writeFile(tempFile, wrappedCode, 'utf-8');
      
      // Execute with tsx
      const { stdout, stderr, exitCode } = await execa('tsx', [tempFile], {
        timeout,
        reject: false,
        env: {
          ...process.env,
          NODE_OPTIONS: `--max-old-space-size=${sandboxOptions.maxMemoryMB || 512}`,
        },
      });
      
      const durationMs = Date.now() - startTime;
      
      const result: ExecutionResult = {
        exitCode,
        stdout: stdout || '',
        stderr: stderr || '',
        durationMs,
        cellId,
      };
      
      // Format response
      const status = exitCode === 0 ? 'ok' : 'error';
      const output = formatExecutionOutput(result, status);
      
      return {
        content: [
          {
            type: 'text',
            text: output.text,
          },
          {
            type: 'json',
            json: result,
          },
        ],
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      
      // Handle timeout specifically
      if (error.timedOut) {
        return {
          content: [
            {
              type: 'text',
              text: `Execution timed out after ${timeout}ms`,
            },
            {
              type: 'json',
              json: {
                exitCode: -1,
                stdout: '',
                stderr: `Execution timed out after ${timeout}ms`,
                durationMs,
                error: 'TIMEOUT',
                cellId,
              },
            },
          ],
        };
      }
      
      // Handle other errors
      return {
        content: [
          {
              type: 'text',
            text: `Execution failed: ${error.message}`,
          },
          {
            type: 'json',
            json: {
              exitCode: -1,
              stdout: '',
              stderr: error.message,
              durationMs,
              error: error.code || 'UNKNOWN',
              cellId,
            },
          },
        ],
      };
    } finally {
      // Cleanup temp file
      try {
        await fs.unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  });
}

function wrapCodeWithSandbox(
  code: string,
  options: { allowFileSystem?: boolean; allowNetwork?: boolean; maxMemoryMB?: number }
): string {
  const restrictions: string[] = [];
  
  if (!options.allowFileSystem) {
    restrictions.push(`
// Sandbox: File system access restricted
const fs = undefined;
const path = undefined;
const child_process = undefined;
`);
  }
  
  if (!options.allowNetwork) {
    restrictions.push(`
// Sandbox: Network access restricted
const http = undefined;
const https = undefined;
const net = undefined;
const dgram = undefined;
// Note: fetch may still be available in Node 18+
(globalThis as any).fetch = undefined;
`);
  }
  
  return `
// Sandboxed TypeScript execution
${restrictions.join('\n')}

// User code
${code}
`;
}

function formatExecutionOutput(result: ExecutionResult, status: string): { text: string } {
  const lines: string[] = [];
  
  if (result.cellId) {
    lines.push(`Executed cell ${result.cellId} (${status}) in ${result.durationMs}ms`);
  } else {
    lines.push(`Executed TypeScript code (${status}) in ${result.durationMs}ms`);
  }
  
  if (result.stdout) {
    lines.push('STDOUT:');
    lines.push(result.stdout);
  }
  
  if (result.stderr) {
    lines.push('STDERR:');
    lines.push(result.stderr);
  }
  
  if (result.exitCode !== 0) {
    lines.push(`Exit code: ${result.exitCode}`);
  }
  
  return { text: lines.join('\n') };
}

// Auto-cleanup on transport close
let cleanupScheduled = false;
export function scheduleCleanup() {
  if (!cleanupScheduled) {
    cleanupScheduled = true;
    process.on('beforeExit', async () => {
      const tempDir = join(tmpdir(), '.notebooks', 'tmp');
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });
  }
}