/**
 * Exact solver for pattern verification in pattern miner
 * Adapted from star-battle-solver's exact solver
 */
export declare enum CellState {
    Unknown = 0,
    Star = 1,
    Empty = 2
}
export interface BoardState {
    size: number;
    starsPerLine: number;
    starsPerRegion: number;
    cellStates: CellState[];
    regions: Array<{
        id: number;
        cells: number[];
        starsRequired: number;
    }>;
    rows: Array<{
        rowIndex: number;
        cells: number[];
        starsRequired: number;
    }>;
    cols: Array<{
        colIndex: number;
        cells: number[];
        starsRequired: number;
    }>;
    windowWidth?: number;
    windowHeight?: number;
}
export interface CompletionAnalysis {
    cellResults: Map<number, 'alwaysStar' | 'alwaysEmpty' | 'variable'>;
    totalCompletions: number;
}
/**
 * Enumerate all completions of a partial board state
 */
export declare function enumerateAllCompletions(state: BoardState, maxCompletions?: number, timeoutMs?: number): CompletionAnalysis;
//# sourceMappingURL=exactSolver.d.ts.map