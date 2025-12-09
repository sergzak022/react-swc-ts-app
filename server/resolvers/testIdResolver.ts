import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import fg from 'fast-glob';
import type { TestIdInfo, CodeSnippet, CodeLine } from '../../src/shared/types';
import type { ResolutionResult, ResolverFn } from './types';

interface FileMatch {
  filePath: string;
  lineNumber: number;
  lineContent: string;
}

/**
 * Escape special regex characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get all source files in cwd (excludes tests, node_modules, etc.).
 */
async function getSourceFiles(cwd: string): Promise<string[]> {
  return fg(['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js'], {
    cwd,
    ignore: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'build/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/e2e/**',
    ],
    absolute: false,
  });
}

/**
 * Search files for a pattern and return matches.
 */
async function searchFiles(
  files: string[],
  pattern: RegExp,
  cwd: string
): Promise<FileMatch[]> {
  const matches: FileMatch[] = [];

  for (const file of files) {
    try {
      const content = await readFile(join(cwd, file), 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          matches.push({
            filePath: file,
            lineNumber: i + 1,
            lineContent: lines[i].trim(),
          });
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return matches;
}

/**
 * Phase 1: Search for literal data-testid="value" or data-testid='value'
 */
async function searchDirectTestId(testId: string, cwd: string): Promise<FileMatch[]> {
  const escaped = escapeRegex(testId);
  const pattern = new RegExp(`data-testid=["']${escaped}["']`);

  const files = await getSourceFiles(cwd);
  return searchFiles(files, pattern, cwd);
}

/**
 * Find the constant name that holds a given string value.
 * Looks for patterns like: const SOME_ID = 'value' or export const SOME_ID = "value"
 */
async function findConstantName(testId: string, cwd: string): Promise<string | null> {
  const escaped = escapeRegex(testId);
  const pattern = new RegExp(`(\\w+)\\s*=\\s*['"]${escaped}['"]`);

  const files = await getSourceFiles(cwd);

  for (const file of files) {
    try {
      const content = await readFile(join(cwd, file), 'utf-8');
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return null;
}

/**
 * Phase 2: Search for data-testid={CONSTANT_NAME}
 */
async function searchConstantTestId(constantName: string, cwd: string): Promise<FileMatch[]> {
  const escaped = escapeRegex(constantName);
  const pattern = new RegExp(`data-testid=\\{\\s*${escaped}\\s*\\}`);

  const files = await getSourceFiles(cwd);
  return searchFiles(files, pattern, cwd);
}

/**
 * Search for data-testid in source files.
 *
 * Two-phase approach:
 * 1. Search for literal: data-testid="value"
 * 2. If not found, search for constant pattern:
 *    - Find constant definition (const X = 'value')
 *    - Search for data-testid={X}
 */
async function searchDataTestId(testId: string, cwd: string): Promise<FileMatch[]> {
  // Phase 1: Direct literal search
  const directMatches = await searchDirectTestId(testId, cwd);
  if (directMatches.length > 0) {
    return directMatches;
  }

  // Phase 2: Constant pattern search
  const constantName = await findConstantName(testId, cwd);
  if (!constantName) {
    return [];
  }

  return searchConstantTestId(constantName, cwd);
}

/**
 * Extract code snippet around a specific line.
 */
async function extractCodeSnippet(
  filePath: string,
  matchLine: number,
  cwd: string,
  contextLines = 10
): Promise<CodeSnippet | undefined> {
  try {
    const content = await readFile(join(cwd, filePath), 'utf-8');
    const allLines = content.split('\n');

    const startLine = Math.max(1, matchLine - contextLines);
    const endLine = Math.min(allLines.length, matchLine + contextLines);

    const lines: CodeLine[] = [];
    for (let i = startLine; i <= endLine; i++) {
      lines.push({
        lineNumber: i,
        content: allLines[i - 1], // 0-indexed
        isMatch: i === matchLine,
      });
    }

    return { lines, startLine, endLine, matchLine };
  } catch {
    return undefined;
  }
}

/**
 * Determine confidence based on matches and testId relationship.
 */
function resolveFromMatches(matches: FileMatch[], testIdInfo: TestIdInfo): ResolutionResult {
  if (matches.length === 0) {
    return { confidence: 'low', verified: false, filePath: '' };
  }

  if (matches.length === 1) {
    const isDirectOrClose = testIdInfo.onSelf || testIdInfo.depth <= 2;
    return {
      confidence: isDirectOrClose ? 'high' : 'medium',
      verified: isDirectOrClose,
      filePath: matches[0].filePath,
      lineNumber: matches[0].lineNumber,
    };
  }

  const uniqueFiles = [...new Set(matches.map((m) => m.filePath))];

  if (uniqueFiles.length === 1) {
    return {
      confidence: 'medium',
      verified: false,
      filePath: matches[0].filePath,
      lineNumber: matches[0].lineNumber,
    };
  }

  return {
    confidence: 'low',
    verified: false,
    filePath: matches[0].filePath,
    lineNumber: matches[0].lineNumber,
  };
}

/**
 * TestId resolver - resolves data-testid to source files.
 * Returns null if payload has no testId (cannot handle).
 */
export const testIdResolver: ResolverFn = async (payload, options) => {
  if (!payload.testId) {
    return null; // Cannot handle - no testId
  }

  const matches = await searchDataTestId(payload.testId.value, options.cwd);
  const result = resolveFromMatches(matches, payload.testId);

  // Extract code snippet if we have a valid match
  if (result.filePath && result.lineNumber) {
    result.codeSnippet = await extractCodeSnippet(
      result.filePath,
      result.lineNumber,
      options.cwd
    );
  }

  return result;
};

