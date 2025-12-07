/**
 * Exact solver for pattern verification in pattern miner
 * Adapted from star-battle-solver's exact solver
 */

export enum CellState {
  Unknown = 0,
  Star = 1,
  Empty = 2,
}

export interface BoardState {
  size: number;
  starsPerLine: number;
  starsPerRegion: number;
  cellStates: CellState[];
  regions: Array<{ id: number; cells: number[]; starsRequired: number }>;
  rows: Array<{ rowIndex: number; cells: number[]; starsRequired: number }>;
  cols: Array<{ colIndex: number; cells: number[]; starsRequired: number }>;
}

export interface CompletionAnalysis {
  cellResults: Map<number, 'alwaysStar' | 'alwaysEmpty' | 'variable'>;
  totalCompletions: number;
}

/**
 * Get 8-directional neighbors
 */
function getNeighbors8(cellId: number, size: number): Array<{ row: number; col: number }> {
  const row = Math.floor(cellId / size);
  const col = cellId % size;
  const neighbors: Array<{ row: number; col: number }> = [];
  
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        neighbors.push({ row: r, col: c });
      }
    }
  }
  
  return neighbors;
}

/**
 * Check if a completion is valid
 */
function isValidCompletion(state: BoardState): boolean {
  // Check row quotas
  for (const row of state.rows) {
    const starCount = row.cells.filter(cellId => state.cellStates[cellId] === CellState.Star).length;
    if (starCount !== row.starsRequired) {
      return false;
    }
  }
  
  // Check column quotas
  for (const col of state.cols) {
    const starCount = col.cells.filter(cellId => state.cellStates[cellId] === CellState.Star).length;
    if (starCount !== col.starsRequired) {
      return false;
    }
  }
  
  // Check region quotas
  for (const region of state.regions) {
    const starCount = region.cells.filter(cellId => state.cellStates[cellId] === CellState.Star).length;
    if (starCount !== region.starsRequired) {
      return false;
    }
  }
  
  // Check adjacency
  for (let i = 0; i < state.size * state.size; i++) {
    if (state.cellStates[i] === CellState.Star) {
      const neighbors = getNeighbors8(i, state.size);
      for (const neighbor of neighbors) {
        const neighborId = neighbor.row * state.size + neighbor.col;
        if (state.cellStates[neighborId] === CellState.Star) {
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Check if a partial state is valid
 */
function isValidPartialState(state: BoardState): boolean {
  // Check row quotas (not exceeded)
  for (const row of state.rows) {
    const starCount = row.cells.filter(cellId => state.cellStates[cellId] === CellState.Star).length;
    const emptyCount = row.cells.filter(cellId => state.cellStates[cellId] === CellState.Empty).length;
    const remaining = row.cells.length - starCount - emptyCount;
    if (starCount > row.starsRequired) return false;
    if (starCount + remaining < row.starsRequired) return false;
  }
  
  // Check column quotas
  for (const col of state.cols) {
    const starCount = col.cells.filter(cellId => state.cellStates[cellId] === CellState.Star).length;
    const emptyCount = col.cells.filter(cellId => state.cellStates[cellId] === CellState.Empty).length;
    const remaining = col.cells.length - starCount - emptyCount;
    if (starCount > col.starsRequired) return false;
    if (starCount + remaining < col.starsRequired) return false;
  }
  
  // Check region quotas
  for (const region of state.regions) {
    const starCount = region.cells.filter(cellId => state.cellStates[cellId] === CellState.Star).length;
    const emptyCount = region.cells.filter(cellId => state.cellStates[cellId] === CellState.Empty).length;
    const remaining = region.cells.length - starCount - emptyCount;
    if (starCount > region.starsRequired) return false;
    if (starCount + remaining < region.starsRequired) return false;
  }
  
  // Check adjacency
  for (let i = 0; i < state.size * state.size; i++) {
    if (state.cellStates[i] === CellState.Star) {
      const neighbors = getNeighbors8(i, state.size);
      for (const neighbor of neighbors) {
        const neighborId = neighbor.row * state.size + neighbor.col;
        if (state.cellStates[neighborId] === CellState.Star) {
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Clone state with a cell set to a specific value
 */
function cloneStateWithCell(state: BoardState, cellId: number, value: CellState): BoardState {
  const newCellStates = [...state.cellStates];
  newCellStates[cellId] = value;
  return {
    ...state,
    cellStates: newCellStates,
  };
}

/**
 * Enumerate all completions of a partial board state
 */
export function enumerateAllCompletions(
  state: BoardState,
  maxCompletions: number = 10000,
  timeoutMs: number = 10000
): CompletionAnalysis {
  const startTime = Date.now();
  const cellResults = new Map<number, Set<CellState>>();
  const size = state.size;
  
  // Initialize cell results tracking
  for (let i = 0; i < size * size; i++) {
    cellResults.set(i, new Set());
  }
  
  let completionCount = 0;
  
  // Backtracking solver
  function solve(currentState: BoardState, depth: number): void {
    // Timeout check
    if (Date.now() - startTime > timeoutMs) {
      return;
    }
    
    // Check if we've found enough completions
    if (completionCount >= maxCompletions) {
      return;
    }
    
    // Find next unknown cell
    let nextCell: number | null = null;
    for (let i = 0; i < size * size; i++) {
      if (currentState.cellStates[i] === CellState.Unknown) {
        nextCell = i;
        break;
      }
    }
    
    // If no unknown cells, check if this is a valid completion
    if (nextCell === null) {
      if (isValidCompletion(currentState)) {
        // Record this completion
        for (let i = 0; i < size * size; i++) {
          const cellState = currentState.cellStates[i];
          cellResults.get(i)!.add(cellState);
        }
        completionCount++;
      }
      return;
    }
    
    // Try placing star
    const stateWithStar = cloneStateWithCell(currentState, nextCell, CellState.Star);
    if (isValidPartialState(stateWithStar)) {
      solve(stateWithStar, depth + 1);
    }
    
    // Try placing empty
    const stateWithEmpty = cloneStateWithCell(currentState, nextCell, CellState.Empty);
    if (isValidPartialState(stateWithEmpty)) {
      solve(stateWithEmpty, depth + 1);
    }
  }
  
  // Start solving
  solve(state, 0);
  
  // Analyze results
  const analysis: CompletionAnalysis = {
    cellResults: new Map(),
    totalCompletions: completionCount,
  };
  
  for (let i = 0; i < size * size; i++) {
    const states = cellResults.get(i)!;
    if (states.size === 0) {
      analysis.cellResults.set(i, 'variable');
    } else if (states.size === 1) {
      const cellState = Array.from(states)[0];
      analysis.cellResults.set(i, cellState === CellState.Star ? 'alwaysStar' : 'alwaysEmpty');
    } else {
      // Check if it's always the same
      const hasStar = states.has(CellState.Star);
      const hasEmpty = states.has(CellState.Empty);
      if (hasStar && !hasEmpty) {
        analysis.cellResults.set(i, 'alwaysStar');
      } else if (hasEmpty && !hasStar) {
        analysis.cellResults.set(i, 'alwaysEmpty');
      } else {
        analysis.cellResults.set(i, 'variable');
      }
    }
  }
  
  return analysis;
}

