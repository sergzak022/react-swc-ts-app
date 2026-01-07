import { spawn } from 'node:child_process';
import type { ComponentContext, SubmissionResponse } from '../../src/shared/types';

/**
 * Build structured prompt for Cursor agent.
 */
function buildPrompt(context: ComponentContext, userMessage: string): string {
  const codeSnippet = context.codeSnippet
    ? `\n# Current Code\n\`\`\`\n${context.codeSnippet.lines
        .map((line) => {
          const marker = line.isMatch ? '→ ' : '  ';
          return `${marker}${line.lineNumber} | ${line.content}`;
        })
        .join('\n')}\n\`\`\`\n`
    : '';

  return `# Component Context

File: ${context.filePath}${context.componentName ? `\nComponent: ${context.componentName}` : ''}${context.lineNumber ? `\nLine: ${context.lineNumber}` : ''}${codeSnippet}
# DOM Context

Selector: ${context.selectorSummary}
Element: ${context.domSummary}

# Request

${userMessage}

# Instructions

Please modify the code according to the request above.
Focus on the indicated file and line number.
Make the changes directly to the codebase.`;
}

/**
 * Execute Cursor agent CLI to modify code.
 */
export async function submitToAgent(
  context: ComponentContext,
  userMessage: string,
  cwd: string
): Promise<SubmissionResponse> {
  const TIMEOUT_MS = 120000; // 120 seconds
  const prompt = buildPrompt(context, userMessage);
  
  console.log('[ui-agent] Submitting to Cursor agent:', {
    filePath: context.filePath,
    lineNumber: context.lineNumber,
    messageLength: userMessage.length,
    promptLength: prompt.length,
  });

  return new Promise((resolve) => {
    const command = 'cursor-agent';
    const args = ['--model', 'auto', prompt];
    
    const agentProcess = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timeoutFired = false;
    let processEnded = false;

    agentProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    agentProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    agentProcess.on('error', (error) => {
      console.error('[ui-agent] Cursor agent spawn error:', error);
      resolve({
        success: false,
        message: `Failed to spawn cursor-agent: ${error.message}`,
      });
    });

    agentProcess.on('close', (code) => {
      if (processEnded) return;
      processEnded = true;

      if (timeoutFired) {
        resolve({
          success: false,
          message: 'Cursor agent timeout - operation took too long',
        });
        return;
      }

      if (code !== 0) {
        console.error('[ui-agent] Cursor agent failed:', {
          exitCode: code,
          stderr: stderr.slice(0, 500),
        });
        resolve({
          success: false,
          message: `Cursor agent exited with code ${code}`,
          agentOutput: stderr || stdout,
        });
        return;
      }

      console.log('[ui-agent] Cursor agent completed successfully');
      resolve({
        success: true,
        message: 'Changes applied successfully by Cursor agent',
        agentOutput: stdout,
      });
    });

    const timeoutId = setTimeout(() => {
      timeoutFired = true;
      console.warn('[ui-agent] Cursor agent timeout, killing process');
      agentProcess.kill('SIGTERM');
      
      setTimeout(() => {
        if (!processEnded) {
          agentProcess.kill('SIGKILL');
        }
      }, 5000);
    }, TIMEOUT_MS);

    agentProcess.on('close', () => {
      clearTimeout(timeoutId);
    });
  });
}

