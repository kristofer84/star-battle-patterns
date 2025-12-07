/**
 * Pattern deduplication utilities
 */
import type { Pattern } from '../model/types.js';
/**
 * Generate a canonical key for a pattern (for deduplication)
 */
export declare function getPatternKey(pattern: Pattern): string;
/**
 * Remove duplicate patterns
 */
export declare function deduplicatePatterns(patterns: Pattern[]): Pattern[];
//# sourceMappingURL=deduplicator.d.ts.map