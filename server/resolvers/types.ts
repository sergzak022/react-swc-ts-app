import type { SelectionPayload, CodeSnippet } from '../../src/shared/types';

/**
 * Result of a resolution attempt.
 */
export interface ResolutionResult {
  confidence: 'high' | 'medium' | 'low';
  verified: boolean;
  filePath: string;
  lineNumber?: number;
  codeSnippet?: CodeSnippet;
}

/**
 * Options passed to resolvers.
 */
export interface ResolverOptions {
  /** Working directory to search in */
  cwd: string;
}

/**
 * A resolver function attempts to resolve a SelectionPayload to a source location.
 * Returns null if it cannot handle this payload.
 */
export type ResolverFn = (
  payload: SelectionPayload,
  options: ResolverOptions
) => Promise<ResolutionResult | null>;

