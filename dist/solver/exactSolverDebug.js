/**
 * Debug version of exact solver with detailed logging
 */
import { CellState } from './exactSolver.js';
import { enumerateAllCompletions } from './exactSolver.js';
export function debugSolve(state, maxDepth = 5) {
    console.log('=== Solver Debug ===\n');
    console.log('Initial state:');
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
    console.log('\nConstraints:');
    console.log(`  Rows: ${state.rows.map(r => `${r.starsRequired}`).join(', ')}`);
    console.log(`  Cols: ${state.cols.map(c => `${c.starsRequired}`).join(', ')}`);
    console.log(`  Regions: ${state.regions.map(r => `${r.starsRequired}`).join(', ')}`);
    console.log('\nRunning solver...');
    const analysis = enumerateAllCompletions(state, 10, 5000);
    console.log(`\nResults: ${analysis.totalCompletions} completions found`);
    if (analysis.totalCompletions === 0) {
        console.log('\n⚠️  No completions - checking why...');
        // Try to manually place stars and see what fails
        console.log('\nTrying manual placement:');
        const testState = { ...state, cellStates: [...state.cellStates] };
        // Try placing stars at (0,0), (1,2), (2,1) for 3x3
        if (width === 3 && height === 3) {
            testState.cellStates[0] = CellState.Star; // (0,0)
            testState.cellStates[7] = CellState.Star; // (2,1) = row 2, col 1 = 2*3+1 = 7
            testState.cellStates[5] = CellState.Star; // (1,2) = row 1, col 2 = 1*3+2 = 5
            console.log('  Placing stars at cells 0, 5, 7');
            console.log('  Board:');
            for (let r = 0; r < 3; r++) {
                const row = [];
                for (let c = 0; c < 3; c++) {
                    const cellId = r * 3 + c;
                    const s = testState.cellStates[cellId];
                    row.push(s === CellState.Star ? '*' : s === CellState.Empty ? 'X' : '?');
                }
                console.log(`    ${row.join(' ')}`);
            }
            // Check if this satisfies constraints
            let valid = true;
            for (const row of testState.rows) {
                const count = row.cells.filter(c => testState.cellStates[c] === CellState.Star).length;
                if (count !== row.starsRequired) {
                    console.log(`    Row ${row.rowIndex}: ${count}/${row.starsRequired} ✗`);
                    valid = false;
                }
                else {
                    console.log(`    Row ${row.rowIndex}: ${count}/${row.starsRequired} ✓`);
                }
            }
            for (const col of testState.cols) {
                const count = col.cells.filter(c => testState.cellStates[c] === CellState.Star).length;
                if (count !== col.starsRequired) {
                    console.log(`    Col ${col.colIndex}: ${count}/${col.starsRequired} ✗`);
                    valid = false;
                }
                else {
                    console.log(`    Col ${col.colIndex}: ${count}/${col.starsRequired} ✓`);
                }
            }
            for (const region of testState.regions) {
                const count = region.cells.filter(c => testState.cellStates[c] === CellState.Star).length;
                if (count !== region.starsRequired) {
                    console.log(`    Region ${region.id}: ${count}/${region.starsRequired} ✗`);
                    valid = false;
                }
                else {
                    console.log(`    Region ${region.id}: ${count}/${region.starsRequired} ✓`);
                }
            }
            console.log(`\n  Manual placement is ${valid ? 'VALID' : 'INVALID'}`);
        }
    }
    else {
        console.log('\n✓ Solver found completions!');
        console.log('Cell results:');
        for (let r = 0; r < height; r++) {
            const row = [];
            for (let c = 0; c < width; c++) {
                const cellId = r * width + c;
                const result = analysis.cellResults.get(cellId);
                if (result === 'alwaysStar')
                    row.push('*');
                else if (result === 'alwaysEmpty')
                    row.push('X');
                else
                    row.push('?');
            }
            console.log(`  ${row.join(' ')}`);
        }
    }
}
//# sourceMappingURL=exactSolverDebug.js.map