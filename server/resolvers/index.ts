import type { SelectionPayload } from '../../src/shared/types';
import type { ResolutionResult, ResolverOptions, ResolverFn } from './types';
import { testIdResolver } from './testIdResolver';

export type { ResolutionResult, ResolverOptions, ResolverFn } from './types';

/**
 * Ordered list of resolvers to try.
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
};

/**
 * Run resolvers in chain until one returns a result.
 *
 * @param payload - The selection payload from frontend
 * @param options - Resolver options (cwd, etc.)
 * @returns Resolution result from first successful resolver, or default low-confidence result
 */
export async function resolveSelection(
  payload: SelectionPayload,
  options: ResolverOptions
): Promise<ResolutionResult> {
  for (const resolver of resolvers) {
    try {
      const result = await resolver(payload, options);
      if (result !== null) {
        return result;
      }
    } catch (error) {
      console.error('[ui-agent] Resolver failed:', error);
      // Continue to next resolver
    }
  }

  return DEFAULT_RESULT;
}

