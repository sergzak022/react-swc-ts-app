import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { SelectionPayload, CodeSnippet } from '../../src/shared/types';
import type { ResolutionResult, ResolverFn } from './types';
import { extractCodeSnippet } from './testIdResolver';

/**
 * Interface for Cursor CLI response.
 */
interface CursorCliResponse {
  filePath?: string;
  componentName?: string;
  lineNumber?: number;
}

/**
 * Call Cursor CLI with auto model to resolve component location.
 * Uses spawn for secure execution without shell injection vulnerabilities.
 */
async function callCursorCli(
  payload: SelectionPayload,
  cwd: string
): Promise<CursorCliResponse | null> {
  const TIMEOUT_MS = 60000; // 60 seconds
  const startTime = Date.now();

  // Build prompt for Cursor CLI
  const prompt = `Given this UI element selection from a React app:
- Selector: ${payload.selector}
- Text: ${payload.textSnippet}
- Classes: ${payload.classes.join(', ')}
- HTML snippet: ${payload.domOuterHtml.slice(0, 500)}

Find the React component file that renders this element. Search the codebase for matching patterns.

Return ONLY a valid JSON object with this exact structure:
{
  "filePath": "relative/path/to/file.tsx",
  "componentName": "ComponentName",
  "lineNumber": 123
}

If you cannot find a match, return:
{
  "filePath": "",
  "componentName": "",
  "lineNumber": null
}`;

  console.log('[ui-agent] Starting Cursor CLI resolver:', {
    selector: payload.selector,
    textSnippet: payload.textSnippet?.slice(0, 50),
    cwd,
    timeout: `${TIMEOUT_MS}ms`,
  });

  // Build the command for logging
  const command = 'cursor-agent';
  const args = ['-p', '--output-format', 'json', '--model', 'auto', prompt];
  const fullCommand = `${command} ${args.map(arg => {
    // Escape arguments that contain spaces or special characters for shell display
    if (arg.includes(' ') || arg.includes('\n') || arg.includes('"')) {
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
    return arg;
  }).join(' ')}`;

  console.log('[ui-agent] Executing Cursor CLI command:', {
    command: fullCommand,
    executable: command,
    args: args.map((arg, i) => i === args.length - 1 ? `[prompt: ${arg.length} chars]` : arg),
    promptLength: prompt.length,
    promptPreview: prompt.slice(0, 200) + (prompt.length > 200 ? '...' : ''),
  });

  return new Promise((resolve) => {
    let timeoutFired = false;
    let processEnded = false;
    let processStarted = false;

    // Use spawn for secure execution - no shell injection possible
    // Try auto model first, will fall back if not available
    const cliProcess = spawn(
      command,
      args,
      { 
        cwd,
        env: process.env, // Inherit environment variables (PATH, HOME, etc.)
        stdio: ['ignore', 'pipe', 'pipe'], // Close stdin, pipe stdout/stderr
      }
    );

    // Check if process actually started
    cliProcess.on('spawn', () => {
      processStarted = true;
      console.log('[ui-agent] Cursor CLI process spawned successfully');
    });

    let stdout = '';
    let stderr = '';

    cliProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    cliProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    cliProcess.on('error', (error) => {
      const elapsed = Date.now() - startTime;
      console.error('[ui-agent] Cursor CLI spawn error:', {
        error: error.message,
        code: (error as NodeJS.ErrnoException).code,
        elapsed: `${elapsed}ms`,
        processStarted,
        // Common error codes
        hint: (error as NodeJS.ErrnoException).code === 'ENOENT' 
          ? 'cursor-agent command not found. Install with: curl https://cursor.com/install -fsS | bash'
          : undefined,
      });
      resolve(null);
    });

    cliProcess.on('close', (code, signal) => {
      if (processEnded) return; // Prevent double resolution
      processEnded = true;

      const elapsed = Date.now() - startTime;

      if (timeoutFired) {
        console.warn('[ui-agent] Cursor CLI process terminated after timeout:', {
          exitCode: code,
          signal,
          elapsed: `${elapsed}ms`,
          timeout: `${TIMEOUT_MS}ms`,
          stdoutLength: stdout.length,
          stderrLength: stderr.length,
          processStarted,
          command: fullCommand,
        });
        if (stderr) {
          console.warn('[ui-agent] Cursor CLI stderr (timeout):', stderr.slice(0, 500));
        }
        if (stdout) {
          console.warn('[ui-agent] Cursor CLI stdout (timeout):', stdout.slice(0, 500));
        }
        resolve(null);
        return;
      }

      if (code !== 0) {
        // Exit code 143 = 128 + 15 (SIGTERM signal number)
        const exitCodeInfo =
          code === 143
            ? ' (process killed by SIGTERM - likely timeout)'
            : code === null
            ? ` (process terminated by signal: ${signal})`
            : '';
        
        console.warn('[ui-agent] Cursor CLI exited with non-zero code:', {
          exitCode: code,
          signal,
          exitCodeInfo,
          elapsed: `${elapsed}ms`,
          stdoutLength: stdout.length,
          stderrLength: stderr.length,
        });

        if (stderr && !stderr.includes('warning')) {
          console.warn('[ui-agent] Cursor CLI stderr:', stderr.slice(0, 1000));
        }
        if (stdout) {
          console.warn('[ui-agent] Cursor CLI stdout (partial):', stdout.slice(0, 500));
        }
        resolve(null);
        return;
      }

      // Parse JSON response
      try {
        const outerResponse = JSON.parse(stdout.trim());
        
        // cursor-agent returns a wrapper JSON with a "result" field
        // The actual JSON we want might be in the result field as a string
        let response: CursorCliResponse;
        
        if (outerResponse.result && typeof outerResponse.result === 'string') {
          // Extract JSON from markdown code block in result string
          // Try to find JSON in ```json ... ``` code block first
          const jsonCodeBlockMatch = outerResponse.result.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonCodeBlockMatch) {
            response = JSON.parse(jsonCodeBlockMatch[1].trim());
          } else {
            // Try to find any JSON object in the result string
            const jsonMatch = outerResponse.result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              response = JSON.parse(jsonMatch[0]);
            } else {
              // Try parsing the result string directly as JSON
              response = JSON.parse(outerResponse.result);
            }
          }
        } else if (outerResponse.filePath !== undefined) {
          // Direct JSON response (fallback - already in expected format)
          response = outerResponse as CursorCliResponse;
        } else {
          throw new Error('Unexpected response format from cursor-agent');
        }
        
        console.log('[ui-agent] Cursor CLI resolved successfully:', {
          filePath: response.filePath,
          componentName: response.componentName,
          lineNumber: response.lineNumber,
          elapsed: `${elapsed}ms`,
        });
        resolve(response);
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from markdown or other formats
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const response = JSON.parse(jsonMatch[0]);
            // Check if it's the wrapper format
            if (response.result && typeof response.result === 'string') {
              const innerJsonMatch = response.result.match(/```json\s*([\s\S]*?)\s*```/) ||
                                    response.result.match(/\{[\s\S]*\}/);
              if (innerJsonMatch) {
                const finalResponse = JSON.parse(innerJsonMatch[1] || innerJsonMatch[0]);
                console.log('[ui-agent] Cursor CLI resolved (extracted from nested JSON):', {
                  filePath: finalResponse.filePath,
                  componentName: finalResponse.componentName,
                  lineNumber: finalResponse.lineNumber,
                  elapsed: `${elapsed}ms`,
                });
                resolve(finalResponse);
                return;
              }
            }
            // Direct JSON response
            console.log('[ui-agent] Cursor CLI resolved (extracted JSON):', {
              filePath: response.filePath,
              componentName: response.componentName,
              lineNumber: response.lineNumber,
              elapsed: `${elapsed}ms`,
            });
            resolve(response);
          } catch (extractError) {
            console.error('[ui-agent] Failed to parse extracted JSON from Cursor CLI response:', {
              error: extractError instanceof Error ? extractError.message : String(extractError),
              originalError: parseError instanceof Error ? parseError.message : String(parseError),
              elapsed: `${elapsed}ms`,
              stdoutLength: stdout.length,
              stdoutPreview: stdout.slice(0, 500),
            });
            resolve(null);
          }
        } else {
          console.error('[ui-agent] No JSON found in Cursor CLI response:', {
            elapsed: `${elapsed}ms`,
            stdoutLength: stdout.length,
            stdoutPreview: stdout.slice(0, 500),
            stderrPreview: stderr.slice(0, 500),
          });
          resolve(null);
        }
      }
    });

    // Set timeout to kill process if it takes too long
    const timeoutId = setTimeout(() => {
      timeoutFired = true;
      const elapsed = Date.now() - startTime;
      console.warn('[ui-agent] Cursor CLI timeout reached, killing process:', {
        timeout: `${TIMEOUT_MS}ms`,
        elapsed: `${elapsed}ms`,
        stdoutLength: stdout.length,
        stderrLength: stderr.length,
        processStarted,
        command: fullCommand,
      });
      
      // Try graceful termination first
      cliProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (!processEnded) {
          console.warn('[ui-agent] Force killing Cursor CLI process (SIGKILL)');
          cliProcess.kill('SIGKILL');
        }
      }, 5000);
      
      resolve(null);
    }, TIMEOUT_MS);

    // Clear timeout if process completes
    cliProcess.on('close', () => {
      clearTimeout(timeoutId);
    });
  });
}

/**
 * Validate that the file path exists and is within the project.
 */
function validateFilePath(filePath: string, cwd: string): boolean {
  if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
    return false;
  }

  // Normalize path and check if it exists
  const fullPath = join(cwd, filePath);
  return existsSync(fullPath);
}

/**
 * Cursor CLI resolver - fallback when heuristics fail.
 * Only runs when previous resolvers return low confidence or no result.
 */
export const cursorCliResolver: ResolverFn = async (payload, options) => {
  // Only run if we have some context to work with
  if (!payload.selector && !payload.textSnippet) {
    console.warn('[ui-agent] Cursor CLI resolver skipped: no selector or text snippet provided');
    return null;
  }

  try {
    const response = await callCursorCli(payload, options.cwd);

    if (!response) {
      console.warn('[ui-agent] Cursor CLI resolver: no response from CLI');
      return null;
    }

    if (!response.filePath || response.filePath.trim() === '') {
      console.warn('[ui-agent] Cursor CLI resolver: empty file path in response', {
        response: {
          filePath: response.filePath,
          componentName: response.componentName,
          lineNumber: response.lineNumber,
        },
      });
      return null;
    }

    // Validate file exists
    if (!validateFilePath(response.filePath, options.cwd)) {
      console.warn('[ui-agent] Cursor CLI returned invalid file path:', {
        filePath: response.filePath,
        cwd: options.cwd,
        fullPath: join(options.cwd, response.filePath),
      });
      return null;
    }

    // Extract code snippet if we have a line number
    let codeSnippet: CodeSnippet | undefined;
    if (response.lineNumber) {
      try {
        codeSnippet = await extractCodeSnippet(
          response.filePath,
          response.lineNumber,
          options.cwd
        );
      } catch (snippetError) {
        console.warn('[ui-agent] Failed to extract code snippet:', {
          filePath: response.filePath,
          lineNumber: response.lineNumber,
          error: snippetError instanceof Error ? snippetError.message : String(snippetError),
        });
        // Continue without code snippet
      }
    }

    // Return result with agent source
    // Confidence is medium if we have componentName and lineNumber, low otherwise
    const confidence =
      response.componentName && response.lineNumber ? 'medium' : 'low';

    console.log('[ui-agent] Cursor CLI resolver success:', {
      filePath: response.filePath,
      lineNumber: response.lineNumber,
      componentName: response.componentName,
      confidence,
      hasCodeSnippet: !!codeSnippet,
    });

    return {
      confidence,
      verified: false, // Always needs verification from AI
      filePath: response.filePath,
      lineNumber: response.lineNumber || undefined,
      codeSnippet,
      source: 'agent',
    };
  } catch (error) {
    console.error('[ui-agent] Cursor CLI resolver error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      selector: payload.selector,
      textSnippet: payload.textSnippet?.slice(0, 50),
    });
    return null;
  }
};

