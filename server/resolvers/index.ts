import type { SelectionPayload } from '../../src/shared/types';
import type { ResolutionResult, ResolverOptions, ResolverFn } from './types';
import { testIdResolver } from './testIdResolver';
import { cursorCliResolver } from './cursorCliResolver';

export type { ResolutionResult, ResolverOptions, ResolverFn } from './types';

/**
 * Ordered list of heuristic resolvers to try.
 * Each resolver returns null if it cannot handle the payload.
 * First resolver to return a result wins.
 *
 * To add a new resolver:
 * 1. Create resolver file (e.g., cssResolver.ts)
 * 2. Add to this array in priority order
 */
const resolvers: ResolverFn[] = [
  testIdResolver,
  // Future: cssResolver, componentNameResolver, etc.
];

/**
 * Default result when no resolver can handle the payload.
 */
const DEFAULT_RESULT: ResolutionResult = {
  confidence: 'low',
  verified: false,
  filePath: '',
  source: 'heuristic',
};

/**
 * Run resolvers in chain until one returns a result.
 * If all heuristics fail (low confidence or no result) and useAgentFallback is true, try agent as fallback.
 *
 * @param payload - The selection payload from frontend
 * @param options - Resolver options (cwd, useAgentFallback)
 * @returns Resolution result from first successful resolver, or agent fallback (if enabled), or default low-confidence result
 */
export async function resolveSelection(
  payload: SelectionPayload,
  options: ResolverOptions
): Promise<ResolutionResult> {
  let heuristicResult: ResolutionResult | null = null;

  // Try heuristic resolvers first
  for (const resolver of resolvers) {
    try {
      const result = await resolver(payload, options);
      if (result !== null) {
        heuristicResult = result;
        // If we have a high or medium confidence result, use it immediately
        if (result.confidence === 'high' || result.confidence === 'medium') {
          return result;
        }
        // If low confidence, continue to try Cursor CLI as fallback
        break;
      }
    } catch (error) {
      console.error('[ui-agent] Resolver failed:', error);
      // Continue to next resolver
    }
  }

  // Only try agent fallback if explicitly enabled
  if (options.useAgentFallback && (!heuristicResult || heuristicResult.confidence === 'low')) {
    try {
      console.log('[ui-agent] Heuristics failed or low confidence, trying agent fallback...');
      const agentResult = await cursorCliResolver(payload, options);
      if (agentResult !== null) {
        console.log('[ui-agent] Agent resolved:', agentResult.filePath);
        return agentResult;
      }
    } catch (error) {
      console.error('[ui-agent] Agent resolver failed:', error);
    }
  }

  // Return heuristic result if we have one, otherwise default
  return heuristicResult || DEFAULT_RESULT;
}

