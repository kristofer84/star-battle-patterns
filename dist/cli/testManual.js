/**
 * Manual constraint checking to verify logic
 */
import { buildWindowBoard } from '../miner/boardBuilder.js';
import { CellState } from '../solver/exactSolver.js';
function checkConstraints(state, width, height) {
    console.log('Checking constraints manually...\n');
    // Test placement: stars at cells 0 and 3 (diagonal in 2x2)
    const testState = { ...state };
    testState.cellStates = [...state.cellStates];
    testState.cellStates[0] = CellState.Star;
    testState.cellStates[3] = CellState.Star;
    testState.cellStates[1] = CellState.Empty;
    testState.cellStates[2] = CellState.Empty;
    console.log('Test placement: stars at cells 0 and 3');
    console.log('  Board:');
    for (let r = 0; r < height; r++) {
        const row = [];
        for (let c = 0; c < width; c++) {
            const cellId = r * width + c;
            const s = testState.cellStates[cellId];
            row.push(s === CellState.Star ? '*' : s === CellState.Empty ? 'X' : '?');
        }
        console.log(`    ${row.join(' ')}`);
    }
    // Check row quotas
    console.log('\n  Row quotas:');
    for (const row of testState.rows) {
        const starCount = row.cells.filter((c) => testState.cellStates[c] === CellState.Star).length;
        const valid = starCount === row.starsRequired;
        console.log(`    Row ${row.rowIndex}: ${starCount}/${row.starsRequired} ${valid ? '✓' : '✗'}`);
        if (!valid)
            return false;
    }
    // Check column quotas
    console.log('\n  Column quotas:');
    for (const col of testState.cols) {
        const starCount = col.cells.filter((c) => testState.cellStates[c] === CellState.Star).length;
        const valid = starCount === col.starsRequired;
        console.log(`    Col ${col.colIndex}: ${starCount}/${col.starsRequired} ${valid ? '✓' : '✗'}`);
        if (!valid)
            return false;
    }
    // Check region quotas
    console.log('\n  Region quotas:');
    for (const region of testState.regions) {
        const starCount = region.cells.filter((c) => testState.cellStates[c] === CellState.Star).length;
        const valid = starCount === region.starsRequired;
        console.log(`    Region ${region.id}: ${starCount}/${region.starsRequired} ${valid ? '✓' : '✗'}`);
        if (!valid)
            return false;
    }
    // Check adjacency (8-directional including diagonals)
    console.log('\n  Adjacency check (8-directional):');
    const width2 = testState.windowWidth || testState.size;
    let hasAdjacent = false;
    const starCells = [];
    for (let i = 0; i < testState.cellStates.length; i++) {
        if (testState.cellStates[i] === CellState.Star) {
            starCells.push(i);
        }
    }
    for (let i = 0; i < starCells.length; i++) {
        const cellId = starCells[i];
        const row = Math.floor(cellId / width2);
        const col = cellId % width2;
        // Check 8 neighbors (including diagonals)
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0)
                    continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < height && c >= 0 && c < width) {
                    const neighborId = r * width + c;
                    if (testState.cellStates[neighborId] === CellState.Star) {
                        console.log(`    ✗ Adjacent stars: cell ${cellId} (${row},${col}) and cell ${neighborId} (${r},${c})`);
                        hasAdjacent = true;
                    }
                }
            }
        }
    }
    if (!hasAdjacent) {
        console.log('    ✓ No adjacent stars');
    }
    console.log(`\n  Note: In Star Battle, diagonals ARE considered adjacent (8-directional).`);
    console.log(`  For a 2x2 board with 1 star per row/col, this placement is ${hasAdjacent ? 'INVALID' : 'VALID'}.`);
    return !hasAdjacent;
}
async function main() {
    const window = { width: 2, height: 2, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    regionMap.set(1, [0, 1, 2, 3].map(c => Math.floor(c / 2) * 10 + (c % 2)));
    const state = buildWindowBoard(window, 10, 1, regionMap);
    console.log('State info:');
    console.log(`  Size: ${state.size}, Window: ${state.windowWidth}x${state.windowHeight}`);
    console.log(`  Rows: ${state.rows.length}, each needs ${state.rows[0].starsRequired} star(s)`);
    console.log(`  Cols: ${state.cols.length}, each needs ${state.cols[0].starsRequired} star(s)`);
    console.log(`  Regions: ${state.regions.length}, needs ${state.regions[0].starsRequired} star(s)\n`);
    const valid = checkConstraints(state, 2, 2);
    console.log('\n' + '='.repeat(60));
    if (valid) {
        console.log('✓ Manual check: Placement is VALID');
        console.log('  The solver should find this completion!');
    }
    else {
        console.log('✗ Manual check: Placement is INVALID');
    }
}
main().catch(console.error);
//# sourceMappingURL=testManual.js.map