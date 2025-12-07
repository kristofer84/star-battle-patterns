/**
 * Board builder for pattern mining
 * Creates abstract board models for windows
 */
import type { WindowSpec } from '../model/types.js';
import type { BoardState } from '../solver/exactSolver.js';
/**
 * Build a minimal board state for a window
 * This creates an abstract board model restricted to the window
 * with simplified region/row/column structure
 */
export declare function buildWindowBoard(window: WindowSpec, boardSize: number, starsPerUnit: number, regionMap?: Map<number, number[]>): BoardState;
/**
 * Apply fixed clues to a board state (for pattern preconditions)
 */
export declare function applyFixedClues(state: BoardState, forcedStars: number[], forcedEmpties: number[]): BoardState;
//# sourceMappingURL=boardBuilder.d.ts.map