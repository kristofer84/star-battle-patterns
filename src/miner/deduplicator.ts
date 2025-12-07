/**
 * Pattern deduplication utilities
 */

import type { Pattern } from '../model/types.js';

/**
 * Generate a canonical key for a pattern (for deduplication)
 */
export function getPatternKey(pattern: Pattern): string {
  // Sort deductions for consistent comparison
  const sortedDeductions = pattern.deductions
    .map(ded => ({
      type: ded.type,
      cells: [...ded.relativeCellIds].sort((a, b) => a - b),
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      if (a.cells.length !== b.cells.length) return a.cells.length - b.cells.length;
      for (let i = 0; i < a.cells.length; i++) {
        if (a.cells[i] !== b.cells[i]) return a.cells[i] - b.cells[i];
      }
      return 0;
    });

  return JSON.stringify({
    width: pattern.windowWidth,
    height: pattern.windowHeight,
    familyId: pattern.familyId,
    deductions: sortedDeductions,
  });
}

/**
 * Remove duplicate patterns
 */
export function deduplicatePatterns(patterns: Pattern[]): Pattern[] {
  const seen = new Set<string>();
  const unique: Pattern[] = [];

  for (const pattern of patterns) {
    const key = getPatternKey(pattern);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(pattern);
    }
  }

  return unique;
}

