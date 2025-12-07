/**
 * Pattern verifier - verifies patterns using exact solver
 */

import type { Pattern, WindowSpec } from '../model/types.js';
import type { BoardState } from '../solver/exactSolver.js';
import { enumerateAllCompletions, CellState } from '../solver/exactSolver.js';

/**
 * Verify a pattern using exact solver
 * Returns verified deductions if pattern is valid
 */
export async function verifyPattern(
  state: BoardState,
  window: WindowSpec,
  expectedDeductions: Array<{ type: 'forceStar' | 'forceEmpty'; relativeCellIds: number[] }>
): Promise<{ verified: boolean; actualDeductions: Array<{ type: 'forceStar' | 'forceEmpty'; relativeCellIds: number[] }> }> {
  // Enumerate all completions
  const analysis = enumerateAllCompletions(state, 1000, 5000);
  
  if (analysis.totalCompletions === 0) {
    return { verified: false, actualDeductions: [] };
  }
  
  // Extract actual deductions from completion analysis
  // Only consider cells within the window
  const windowSize = window.width * window.height;
  const actualDeductions: Array<{ type: 'forceStar' | 'forceEmpty'; relativeCellIds: number[] }> = [];
  
  const forceStarCells: number[] = [];
  const forceEmptyCells: number[] = [];
  
  // Check cells in the window (relative coordinates)
  // The state size might be larger than window, so we only check window cells
  for (let i = 0; i < windowSize && i < state.cellStates.length; i++) {
    const result = analysis.cellResults.get(i);
    if (result === 'alwaysStar') {
      forceStarCells.push(i);
    } else if (result === 'alwaysEmpty') {
      forceEmptyCells.push(i);
    }
  }
  
  if (forceStarCells.length > 0) {
    actualDeductions.push({
      type: 'forceStar',
      relativeCellIds: forceStarCells,
    });
  }
  
  if (forceEmptyCells.length > 0) {
    actualDeductions.push({
      type: 'forceEmpty',
      relativeCellIds: forceEmptyCells,
    });
  }
  
  // Pattern is verified if we found any forced deductions
  const verified = actualDeductions.length > 0;
  
  return { verified, actualDeductions };
}

/**
 * Check if two patterns are equivalent (same shape, different position)
 */
export function arePatternsEquivalent(p1: Pattern, p2: Pattern): boolean {
  // Check if window sizes match
  if (p1.windowWidth !== p2.windowWidth || p1.windowHeight !== p2.windowHeight) {
    return false;
  }
  
  // Check if deductions match (normalized)
  if (p1.deductions.length !== p2.deductions.length) {
    return false;
  }
  
  // Simplified equivalence check
  // Full implementation would normalize coordinates and compare
  const p1Deductions = JSON.stringify(p1.deductions.sort());
  const p2Deductions = JSON.stringify(p2.deductions.sort());
  
  return p1Deductions === p2Deductions;
}
