/**
 * Board builder for pattern mining
 * Creates abstract board models for windows
 */
import { CellState } from '../solver/exactSolver.js';
/**
 * Build a minimal board state for a window
 * This creates an abstract board model restricted to the window
 * with simplified region/row/column structure
 */
export function buildWindowBoard(window, boardSize, starsPerUnit, regionMap // regionId -> cellIds in window
) {
    const { width, height, originRow, originCol } = window;
    // Create cell states (all unknown initially)
    const cellStates = new Array(width * height).fill(CellState.Unknown);
    // Build rows for the window
    const rows = [];
    for (let r = 0; r < height; r++) {
        const cells = [];
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
    const cols = [];
    for (let c = 0; c < width; c++) {
        const cells = [];
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
    const regions = [];
    if (regionMap && regionMap.size > 0) {
        for (const [regionId, cellIds] of regionMap.entries()) {
            // The cellIds are already in absolute coordinates from the full board
            // We need to map them to relative window coordinates
            const windowCellIds = [];
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
                // Calculate region quota based on how many rows it spans
                // In Star Battle, if a region spans N rows, it typically needs N * starsPerUnit stars
                // But we need to be careful - count unique rows in the region
                const rowsInRegion = new Set();
                for (const cellId of windowCellIds) {
                    const row = Math.floor(cellId / width);
                    rowsInRegion.add(row);
                }
                // If region covers entire window, quota = height * starsPerUnit
                // Otherwise, estimate based on rows spanned
                let regionQuota = starsPerUnit;
                if (windowCellIds.length === width * height) {
                    // Full window region
                    regionQuota = height * starsPerUnit;
                }
                else if (rowsInRegion.size > 1) {
                    // Multi-row region - use rows spanned
                    regionQuota = rowsInRegion.size * starsPerUnit;
                }
                else {
                    // Single-row region
                    regionQuota = starsPerUnit;
                }
                regions.push({
                    id: regionId,
                    cells: windowCellIds,
                    starsRequired: regionQuota,
                });
            }
        }
    }
    else {
        // Default: treat entire window as one region
        const allCells = [];
        for (let i = 0; i < width * height; i++) {
            allCells.push(i);
        }
        // Full window region needs quota = height * starsPerUnit (or width * starsPerUnit, should be same)
        regions.push({
            id: 1,
            cells: allCells,
            starsRequired: height * starsPerUnit,
        });
    }
    // For window boards, size should match the window dimensions
    // But we need to handle cell ID calculations correctly
    // Use the actual window size for the board
    const windowSize = Math.max(width, height);
    // For window boards, we use the window dimensions
    // Cell IDs are 0 to (width * height - 1), relative to window
    // The size should be at least as large as the largest dimension for neighbor calculations
    // But we need to ensure neighbor calculations work correctly
    // Use width for neighbor calculations (cells are laid out as r * width + c)
    const effectiveSize = Math.max(width, height);
    return {
        size: effectiveSize,
        starsPerLine: starsPerUnit,
        starsPerRegion: starsPerUnit,
        cellStates,
        regions,
        rows,
        cols,
        // Store window dimensions for correct neighbor calculations
        windowWidth: width,
        windowHeight: height,
    };
}
/**
 * Apply fixed clues to a board state (for pattern preconditions)
 */
export function applyFixedClues(state, forcedStars, forcedEmpties) {
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
//# sourceMappingURL=boardBuilder.js.map