/**
 * Schema precondition testers
 * Test if schema preconditions hold in a window
 */

import type { BoardState } from '../solver/exactSolver.js';
import type { WindowSpec } from '../model/types.js';
import { CellState } from '../solver/exactSolver.js';

/**
 * Check if a region is fully inside rows
 */
function regionFullyInsideRows(
  region: { cells: number[] },
  rows: number[],
  windowHeight: number,
  width: number
): boolean {
  for (const cellId of region.cells) {
    const row = Math.floor(cellId / width);
    if (!rows.includes(row)) {
      return false;
    }
  }
  return true;
}

/**
 * Get regions intersecting rows
 */
function getRegionsIntersectingRows(
  state: BoardState,
  rows: number[],
  width: number
): Array<{ id: number; cells: number[]; starsRequired: number }> {
  const rowSet = new Set(rows);
  const intersecting: Array<{ id: number; cells: number[]; starsRequired: number }> = [];
  
  for (const region of state.regions) {
    let hasCellInRows = false;
    for (const cellId of region.cells) {
      const row = Math.floor(cellId / width);
      if (rowSet.has(row)) {
        hasCellInRows = true;
        break;
      }
    }
    if (hasCellInRows) {
      intersecting.push(region);
    }
  }
  
  return intersecting;
}

/**
 * Get candidates in region and rows
 */
function getCandidatesInRegionAndRows(
  region: { cells: number[] },
  rows: number[],
  state: BoardState,
  width: number
): number[] {
  const rowSet = new Set(rows);
  const candidates: number[] = [];
  
  for (const cellId of region.cells) {
    const row = Math.floor(cellId / width);
    if (rowSet.has(row) && state.cellStates[cellId] === CellState.Unknown) {
      candidates.push(cellId);
    }
  }
  
  return candidates;
}

/**
 * Test if A1 (row-band region budget) preconditions hold
 * A1 requires:
 * - A row band (2+ rows)
 * - Multiple regions intersecting the band
 * - At least one region fully inside
 * - At least one partial region
 * - Other partial regions have known quotas (for mining, we'll set them up)
 */
export function testA1Preconditions(
  state: BoardState,
  window: WindowSpec
): { holds: boolean; data?: any } {
  if (window.height < 2) {
    return { holds: false };
  }
  
  // Need multiple regions
  if (state.regions.length < 2) {
    return { holds: false };
  }
  
  const rows = Array.from({ length: window.height }, (_, i) => i);
  const regions = getRegionsIntersectingRows(state, rows, window.width);
  
  if (regions.length < 2) {
    return { holds: false };
  }
  
  // Partition into full inside and partial
  const fullInside = regions.filter(r => 
    regionFullyInsideRows(r, rows, window.height, window.width)
  );
  const partial = regions.filter(r => 
    !regionFullyInsideRows(r, rows, window.height, window.width)
  );
  
  // A1 needs at least one full inside and one partial
  if (fullInside.length === 0 || partial.length === 0) {
    return { holds: false };
  }
  
  // Check if we have candidates in the partial regions
  let hasCandidates = false;
  for (const region of partial) {
    const candidates = getCandidatesInRegionAndRows(region, rows, state, window.width);
    if (candidates.length > 0) {
      hasCandidates = true;
      break;
    }
  }
  
  if (!hasCandidates) {
    return { holds: false };
  }
  
  return {
    holds: true,
    data: {
      row_band: rows,
      full_inside_regions: fullInside.map(r => r.id),
      partial_regions: partial.map(r => r.id),
      regions: regions.map(r => r.id),
    },
  };
}

/**
 * Test if A2 (col-band region budget) preconditions hold
 */
export function testA2Preconditions(
  state: BoardState,
  window: WindowSpec
): { holds: boolean; data?: any } {
  if (window.width < 2) {
    return { holds: false };
  }
  
  if (state.regions.length < 2) {
    return { holds: false };
  }
  
  const cols = Array.from({ length: window.width }, (_, i) => i);
  
  // Similar logic to A1 but for columns
  // For now, use simplified check
  const regions = getRegionsIntersectingRows(state, cols, window.width);
  
  if (regions.length < 2) {
    return { holds: false };
  }
  
  return {
    holds: true,
    data: {
      col_band: cols,
      regions: regions.map(r => r.id),
    },
  };
}

/**
 * Count valid 2x2 blocks in window
 */
function countValidBlocks(
  state: BoardState,
  window: WindowSpec
): number {
  let count = 0;
  const width = window.width;
  const height = window.height;
  
  // Enumerate 2x2 blocks
  for (let r = 0; r < height - 1; r++) {
    for (let c = 0; c < width - 1; c++) {
      const topLeft = r * width + c;
      const topRight = r * width + (c + 1);
      const bottomLeft = (r + 1) * width + c;
      const bottomRight = (r + 1) * width + (c + 1);
      
      // Check if block has at least one candidate
      const hasCandidate = 
        state.cellStates[topLeft] === CellState.Unknown ||
        state.cellStates[topRight] === CellState.Unknown ||
        state.cellStates[bottomLeft] === CellState.Unknown ||
        state.cellStates[bottomRight] === CellState.Unknown;
      
      if (hasCandidate) {
        count++;
      }
    }
  }
  
  return count;
}

/**
 * Test if C2 (cages vs region quota) preconditions hold
 * C2 requires:
 * - C1 condition: valid blocks === remaining stars in band
 * - Region intersecting band
 * - Region fully covering some blocks
 */
export function testC2Preconditions(
  state: BoardState,
  window: WindowSpec
): { holds: boolean; data?: any } {
  if (window.width < 2 || window.height < 2) {
    return { holds: false };
  }
  
  if (state.regions.length === 0) {
    return { holds: false };
  }
  
  // Count valid blocks
  const validBlocks = countValidBlocks(state, window);
  
  // Calculate remaining stars needed in window
  // Simplified: assume we need starsPerLine stars per row
  const rowsInWindow = window.height;
  const starsNeeded = rowsInWindow * state.starsPerLine;
  
  // Count existing stars
  let existingStars = 0;
  for (let i = 0; i < window.width * window.height && i < state.cellStates.length; i++) {
    if (state.cellStates[i] === CellState.Star) {
      existingStars++;
    }
  }
  
  const remainingStars = starsNeeded - existingStars;
  
  // C1 condition: valid blocks === remaining stars
  if (validBlocks !== remainingStars || validBlocks === 0) {
    return { holds: false };
  }
  
  // Check if a region fully covers some blocks
  // This is simplified - full implementation would check actual coverage
  return {
    holds: true,
    data: {
      valid_blocks: validBlocks,
      remaining_stars: remainingStars,
      regions: state.regions.map(r => r.id),
    },
  };
}

/**
 * Test if C1 (band exact cages) preconditions hold
 * C1 requires: valid blocks === remaining stars in band
 */
export function testC1Preconditions(
  state: BoardState,
  window: WindowSpec
): { holds: boolean; data?: any } {
  if (window.width < 2 || window.height < 2) {
    return { holds: false };
  }
  
  const validBlocks = countValidBlocks(state, window);
  
  // Calculate remaining stars
  const rowsInWindow = window.height;
  const starsNeeded = rowsInWindow * state.starsPerLine;
  
  let existingStars = 0;
  for (let i = 0; i < window.width * window.height && i < state.cellStates.length; i++) {
    if (state.cellStates[i] === CellState.Star) {
      existingStars++;
    }
  }
  
  const remainingStars = starsNeeded - existingStars;
  
  // C1 condition: valid blocks === remaining stars
  if (validBlocks !== remainingStars || validBlocks === 0) {
    return { holds: false };
  }
  
  return {
    holds: true,
    data: {
      valid_blocks: validBlocks,
      remaining_stars: remainingStars,
    },
  };
}

/**
 * Test if E1 (candidate deficit) preconditions hold
 * E1 requires: a group with exactly as many candidates as remaining stars
 */
export function testE1Preconditions(
  state: BoardState,
  window: WindowSpec
): { holds: boolean; data?: any } {
  // Check rows
  for (const row of state.rows) {
    let starCount = 0;
    let candidateCount = 0;
    for (const cellId of row.cells) {
      if (state.cellStates[cellId] === CellState.Star) {
        starCount++;
      } else if (state.cellStates[cellId] === CellState.Unknown) {
        candidateCount++;
      }
    }
    const remaining = row.starsRequired - starCount;
    if (remaining > 0 && candidateCount === remaining) {
      return {
        holds: true,
        data: {
          group_type: 'row',
          group_id: row.rowIndex,
          candidates: row.cells.filter(c => state.cellStates[c] === CellState.Unknown),
        },
      };
    }
  }
  
  // Check columns
  for (const col of state.cols) {
    let starCount = 0;
    let candidateCount = 0;
    for (const cellId of col.cells) {
      if (state.cellStates[cellId] === CellState.Star) {
        starCount++;
      } else if (state.cellStates[cellId] === CellState.Unknown) {
        candidateCount++;
      }
    }
    const remaining = col.starsRequired - starCount;
    if (remaining > 0 && candidateCount === remaining) {
      return {
        holds: true,
        data: {
          group_type: 'column',
          group_id: col.colIndex,
          candidates: col.cells.filter(c => state.cellStates[c] === CellState.Unknown),
        },
      };
    }
  }
  
  // Check regions
  for (const region of state.regions) {
    let starCount = 0;
    let candidateCount = 0;
    for (const cellId of region.cells) {
      if (state.cellStates[cellId] === CellState.Star) {
        starCount++;
      } else if (state.cellStates[cellId] === CellState.Unknown) {
        candidateCount++;
      }
    }
    const remaining = region.starsRequired - starCount;
    if (remaining > 0 && candidateCount === remaining) {
      return {
        holds: true,
        data: {
          group_type: 'region',
          group_id: region.id,
          candidates: region.cells.filter(c => state.cellStates[c] === CellState.Unknown),
        },
      };
    }
  }
  
  return { holds: false };
}

/**
 * Test if D1 (row × column intersection) preconditions hold
 * D1 requires: a row and column that intersect, with quota constraints
 */
export function testD1Preconditions(
  state: BoardState,
  window: WindowSpec
): { holds: boolean; data?: any } {
  if (state.rows.length === 0 || state.cols.length === 0) {
    return { holds: false };
  }
  
  // Check if any row/column pair has interesting intersection
  for (const row of state.rows) {
    for (const col of state.cols) {
      const intersection = row.cells.filter(c => col.cells.includes(c));
      if (intersection.length > 0) {
        const candidates = intersection.filter(c => state.cellStates[c] === CellState.Unknown);
        if (candidates.length > 0) {
          return {
            holds: true,
            data: {
              row: row.rowIndex,
              col: col.colIndex,
              intersection: candidates,
            },
          };
        }
      }
    }
  }
  
  return { holds: false };
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
      return testA2Preconditions(state, window);
    case 'C1_bandExactCages':
    case 'C1_band_exactCages':
      return testC1Preconditions(state, window);
    case 'C2_cages_regionQuota':
    case 'C2_cages_regionQuota':
      return testC2Preconditions(state, window);
    case 'E1_candidateDeficit':
      return testE1Preconditions(state, window);
    case 'D1_rowColIntersection':
      return testD1Preconditions(state, window);
    default:
      // For other families, do basic check
      return {
        holds: state.regions.length > 0,
        data: {},
      };
  }
}
