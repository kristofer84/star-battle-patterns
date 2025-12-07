/**
 * Schema precondition testers
 * Test if schema preconditions hold in a window
 */

import type { BoardState } from '../solver/exactSolver';
import type { WindowSpec } from '../model/types';

/**
 * Test if A1 (row-band region budget) preconditions hold
 */
export function testA1Preconditions(
  state: BoardState,
  window: WindowSpec
): { holds: boolean; data?: any } {
  // A1 requires:
  // - A row band
  // - Regions intersecting the band
  // - Some regions fully inside, some partial
  // - Known quotas for other partial regions
  
  // For mining, we'll test if we can construct such a scenario
  // This is simplified - full implementation would check actual board structure
  
  if (window.height < 2) {
    return { holds: false };
  }
  
  // Check if we have multiple regions
  if (state.regions.length < 2) {
    return { holds: false };
  }
  
  // Simplified: assume preconditions might hold if we have regions
  return {
    holds: true,
    data: {
      row_band: Array.from({ length: window.height }, (_, i) => i),
      regions: state.regions.map(r => r.id),
    },
  };
}

/**
 * Test if C2 (cages vs region quota) preconditions hold
 */
export function testC2Preconditions(
  state: BoardState,
  window: WindowSpec
): { holds: boolean; data?: any } {
  // C2 requires:
  // - C1 condition (valid blocks === remaining stars)
  // - Region intersecting band
  // - Region fully covering some blocks
  
  if (window.width < 2 || window.height < 2) {
    return { holds: false };
  }
  
  // Need at least one region
  if (state.regions.length === 0) {
    return { holds: false };
  }
  
  return {
    holds: true,
    data: {
      regions: state.regions.map(r => r.id),
    },
  };
}

/**
 * Test schema preconditions for a family
 */
export function testSchemaPreconditions(
  familyId: string,
  state: BoardState,
  window: WindowSpec
): { holds: boolean; data?: any } {
  switch (familyId) {
    case 'A1_rowBand_regionBudget':
      return testA1Preconditions(state, window);
    case 'A2_colBand_regionBudget':
      // Similar to A1 but for columns
      return testA1Preconditions(state, window);
    case 'C2_cages_regionQuota':
      return testC2Preconditions(state, window);
    default:
      // For other families, do basic check
      return {
        holds: state.regions.length > 0,
        data: {},
      };
  }
}

