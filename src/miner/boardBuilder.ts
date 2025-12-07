/**
 * Board builder for pattern mining
 * Creates abstract board models for windows
 */

import type { WindowSpec } from '../model/types';
import type { BoardState } from '../solver/exactSolver';
import { CellState } from '../solver/exactSolver';

/**
 * Build a minimal board state for a window
 * This creates an abstract board model restricted to the window
 * with simplified region/row/column structure
 */
export function buildWindowBoard(
  window: WindowSpec,
  boardSize: number,
  starsPerUnit: number,
  regionMap?: Map<number, number[]> // regionId -> cellIds in window
): BoardState {
  const { width, height, originRow, originCol } = window;
  
  // Create cell states (all unknown initially)
  const cellStates: CellState[] = new Array(width * height).fill(CellState.Unknown);
  
  // Build rows for the window
  const rows: Array<{ rowIndex: number; cells: number[]; starsRequired: number }> = [];
  for (let r = 0; r < height; r++) {
    const cells: number[] = [];
    for (let c = 0; c < width; c++) {
      const cellId = r * width + c;
      cells.push(cellId);
    }
    rows.push({
      rowIndex: r,
      cells,
      starsRequired: starsPerUnit, // Simplified: assume full quota
    });
  }
  
  // Build columns for the window
  const cols: Array<{ colIndex: number; cells: number[]; starsRequired: number }> = [];
  for (let c = 0; c < width; c++) {
    const cells: number[] = [];
    for (let r = 0; r < height; r++) {
      const cellId = r * width + c;
      cells.push(cellId);
    }
    cols.push({
      colIndex: c,
      cells,
      starsRequired: starsPerUnit,
    });
  }
  
  // Build regions for the window
  const regions: Array<{ id: number; cells: number[]; starsRequired: number }> = [];
  if (regionMap) {
    for (const [regionId, cellIds] of regionMap.entries()) {
      // Map absolute cell IDs to relative window cell IDs
      const windowCellIds: number[] = [];
      for (const absCellId of cellIds) {
        const absRow = Math.floor(absCellId / boardSize);
        const absCol = absCellId % boardSize;
        const relRow = absRow - originRow;
        const relCol = absCol - originCol;
        if (relRow >= 0 && relRow < height && relCol >= 0 && relCol < width) {
          const relCellId = relRow * width + relCol;
          windowCellIds.push(relCellId);
        }
      }
      if (windowCellIds.length > 0) {
        regions.push({
          id: regionId,
          cells: windowCellIds,
          starsRequired: starsPerUnit,
        });
      }
    }
  } else {
    // Default: treat entire window as one region
    const allCells: number[] = [];
    for (let i = 0; i < width * height; i++) {
      allCells.push(i);
    }
    regions.push({
      id: 1,
      cells: allCells,
      starsRequired: starsPerUnit,
    });
  }
  
  // For window boards, size should match the window dimensions
  // But we need to handle cell ID calculations correctly
  // Use the actual window size for the board
  const windowSize = Math.max(width, height);
  
  // For window boards, we use the window dimensions
  // Cell IDs are 0 to (width * height - 1), relative to window
  // But we need a "size" that's at least as large as the largest dimension
  // for neighbor calculations
  const effectiveSize = Math.max(width, height);
  
  return {
    size: effectiveSize,
    starsPerLine: starsPerUnit,
    starsPerRegion: starsPerUnit,
    cellStates,
    regions,
    rows,
    cols,
  };
}

/**
 * Apply fixed clues to a board state (for pattern preconditions)
 */
export function applyFixedClues(
  state: BoardState,
  forcedStars: number[],
  forcedEmpties: number[]
): BoardState {
  const newCellStates = [...state.cellStates];
  
  for (const cellId of forcedStars) {
    if (cellId >= 0 && cellId < newCellStates.length) {
      newCellStates[cellId] = CellState.Star;
    }
  }
  
  for (const cellId of forcedEmpties) {
    if (cellId >= 0 && cellId < newCellStates.length) {
      newCellStates[cellId] = CellState.Empty;
    }
  }
  
  return {
    ...state,
    cellStates: newCellStates,
  };
}

