/**
 * Window enumeration for pattern mining
 */

import type { WindowSpec } from '../model/types';

/**
 * Enumerate all windows of given size
 */
export function enumerateWindows(
  boardSize: number,
  windowWidth: number,
  windowHeight: number
): WindowSpec[] {
  const windows: WindowSpec[] = [];

  for (let r = 0; r <= boardSize - windowHeight; r++) {
    for (let c = 0; c <= boardSize - windowWidth; c++) {
      windows.push({
        width: windowWidth,
        height: windowHeight,
        originRow: r,
        originCol: c,
      });
    }
  }

  return windows;
}

/**
 * Normalize pattern by translating origin to (0,0)
 */
export function normalizePattern(window: WindowSpec, patternData: any): any {
  // Translate all coordinates to relative (0,0) origin
  // For cell IDs in deductions, they're already relative to window
  // For other data, normalize coordinates
  const normalized: any = { ...patternData };
  
  // If there are absolute coordinates, translate them
  if (normalized.originRow !== undefined) {
    normalized.originRow = 0;
  }
  if (normalized.originCol !== undefined) {
    normalized.originCol = 0;
  }
  
  return normalized;
}

/**
 * Canonicalize pattern (handle rotations/mirrors if applicable)
 */
export function canonicalizePattern(pattern: any): any {
  // For now, return pattern as-is
  // Full implementation would:
  // 1. Try all 8 D4 transformations (rotations + mirrors)
  // 2. Choose canonical form (e.g., lexicographically smallest)
  // 3. Transform deductions accordingly
  
  // Simple canonicalization: sort deductions by cell ID
  const canonical = {
    ...pattern,
    deductions: pattern.deductions.map((ded: any) => ({
      ...ded,
      relativeCellIds: [...ded.relativeCellIds].sort((a: number, b: number) => a - b),
    })),
  };
  
  return canonical;
}

