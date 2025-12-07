/**
 * Test isValidCompletion with manually constructed solutions
 */
import { buildWindowBoard } from '../miner/boardBuilder.js';
import { CellState } from '../solver/exactSolver.js';
// Import the validation function (we'll need to expose it or copy the logic)
function isValidCompletion(state) {
    // Check row quotas
    for (const row of state.rows) {
        const starCount = row.cells.filter((cellId) => state.cellStates[cellId] === CellState.Star).length;
        if (starCount !== row.starsRequired) {
            return false;
        }
    }
    // Check column quotas
    for (const col of state.cols) {
        const starCount = col.cells.filter((cellId) => state.cellStates[cellId] === CellState.Star).length;
        if (starCount !== col.starsRequired) {
            return false;
        }
    }
    // Check region quotas
    for (const region of state.regions) {
        const starCount = region.cells.filter((cellId) => state.cellStates[cellId] === CellState.Star).length;
        if (starCount !== region.starsRequired) {
            return false;
        }
    }
    // Check adjacency
    const width = state.windowWidth || state.size;
    const height = state.windowHeight || state.size;
    const totalCells = state.cellStates.length;
    for (let i = 0; i < totalCells; i++) {
        if (state.cellStates[i] === CellState.Star) {
            const row = Math.floor(i / width);
            const col = i % width;
            // Check 8 neighbors
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0)
                        continue;
                    const r = row + dr;
                    const c = col + dc;
                    if (r >= 0 && r < height && c >= 0 && c < width) {
                        const neighborId = r * width + c;
                        if (neighborId < totalCells && state.cellStates[neighborId] === CellState.Star) {
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
}
function printBoard(state) {
    const width = state.windowWidth || state.size;
    const height = state.windowHeight || state.size;
    for (let r = 0; r < height; r++) {
        const row = [];
        for (let c = 0; c < width; c++) {
            const cellId = r * width + c;
            const s = state.cellStates[cellId];
            row.push(s === CellState.Star ? '*' : s === CellState.Empty ? 'X' : '?');
        }
        console.log(`  ${row.join(' ')}`);
    }
}
async function test4x4Completion() {
    console.log('Test: 4x4 board with manually constructed solution\n');
    const window = { width: 4, height: 4, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    // Each row is a region
    for (let r = 0; r < 4; r++) {
        const cells = [];
        for (let c = 0; c < 4; c++) {
            cells.push(r * 10 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const state = buildWindowBoard(window, 10, 1, regionMap);
    // Manually construct a valid solution for 4x4
    // Stars at: (0,1), (1,3), (2,0), (3,2) - verified non-adjacent
    // Cell IDs: 1, 7, 8, 14
    const solution = { ...state, cellStates: [...state.cellStates] };
    solution.cellStates[1] = CellState.Star; // (0,1)
    solution.cellStates[7] = CellState.Star; // (1,3)
    solution.cellStates[8] = CellState.Star; // (2,0)
    solution.cellStates[14] = CellState.Star; // (3,2)
    // Mark all others as empty
    for (let i = 0; i < 16; i++) {
        if (solution.cellStates[i] === CellState.Unknown) {
            solution.cellStates[i] = CellState.Empty;
        }
    }
    console.log('Constructed solution:');
    printBoard(solution);
    console.log('\nChecking constraints:');
    // Check rows
    for (const row of solution.rows) {
        const count = row.cells.filter((c) => solution.cellStates[c] === CellState.Star).length;
        console.log(`  Row ${row.rowIndex}: ${count}/${row.starsRequired} ${count === row.starsRequired ? '✓' : '✗'}`);
    }
    // Check cols
    for (const col of solution.cols) {
        const count = col.cells.filter((c) => solution.cellStates[c] === CellState.Star).length;
        console.log(`  Col ${col.colIndex}: ${count}/${col.starsRequired} ${count === col.starsRequired ? '✓' : '✗'}`);
    }
    // Check regions
    for (const region of solution.regions) {
        const count = region.cells.filter((c) => solution.cellStates[c] === CellState.Star).length;
        console.log(`  Region ${region.id}: ${count}/${region.starsRequired} ${count === region.starsRequired ? '✓' : '✗'}`);
    }
    // Check adjacency
    console.log('\nAdjacency check:');
    const width = solution.windowWidth || solution.size;
    const height = solution.windowHeight || solution.size;
    let hasAdjacent = false;
    const starCells = [];
    for (let i = 0; i < 16; i++) {
        if (solution.cellStates[i] === CellState.Star) {
            starCells.push(i);
        }
    }
    for (const cellId of starCells) {
        const row = Math.floor(cellId / width);
        const col = cellId % width;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0)
                    continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < height && c >= 0 && c < width) {
                    const neighborId = r * width + c;
                    if (solution.cellStates[neighborId] === CellState.Star) {
                        console.log(`  ✗ Adjacent: cell ${cellId} (${row},${col}) and ${neighborId} (${r},${c})`);
                        hasAdjacent = true;
                    }
                }
            }
        }
    }
    if (!hasAdjacent) {
        console.log('  ✓ No adjacent stars');
    }
    const valid = isValidCompletion(solution);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`isValidCompletion result: ${valid ? 'VALID ✓' : 'INVALID ✗'}`);
    if (!valid && !hasAdjacent) {
        console.log('\n⚠️  Solution satisfies all constraints but isValidCompletion returns false!');
        console.log('    This indicates a bug in isValidCompletion.');
    }
    return valid;
}
test4x4Completion().then(result => {
    process.exit(result ? 0 : 1);
}).catch(console.error);
//# sourceMappingURL=testCompletion.js.map