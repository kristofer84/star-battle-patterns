/**
 * Debug why starsPerUnit = 2 produces empty files
 */
import { buildWindowBoard } from '../miner/boardBuilder.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
async function testWindowSizes() {
    console.log('Testing window solvability with starsPerUnit = 2\n');
    const boardSize = 10;
    const starsPerUnit = 2;
    const windowSizes = [
        { width: 6, height: 6 },
        { width: 7, height: 7 },
        { width: 8, height: 8 },
        { width: 9, height: 9 },
        { width: 10, height: 10 },
    ];
    for (const { width, height } of windowSizes) {
        const window = { width, height, originRow: 0, originCol: 0 };
        // Create simple region structure (each row is a region)
        const regionMap = new Map();
        for (let r = 0; r < height; r++) {
            const cells = [];
            for (let c = 0; c < width; c++) {
                cells.push(r * boardSize + c);
            }
            regionMap.set(r + 1, cells);
        }
        const state = buildWindowBoard(window, boardSize, starsPerUnit, regionMap);
        console.log(`${width}x${height} window:`);
        console.log(`  Rows: ${state.rows.length}, each needs ${state.rows[0].starsRequired} stars`);
        console.log(`  Cols: ${state.cols.length}, each needs ${state.cols[0].starsRequired} stars`);
        console.log(`  Regions: ${state.regions.length}, each needs ${state.regions[0].starsRequired} stars`);
        const totalStarsNeeded = state.rows.length * state.rows[0].starsRequired;
        console.log(`  Total stars needed: ${totalStarsNeeded}`);
        console.log(`  Total cells: ${width * height}`);
        const analysis = enumerateAllCompletions(state, 1, 5000);
        console.log(`  Completions: ${analysis.totalCompletions}`);
        if (analysis.totalCompletions === 0) {
            console.log(`  ❌ UNSOLVABLE`);
        }
        else {
            console.log(`  ✓ SOLVABLE`);
        }
        console.log('');
    }
}
testWindowSizes().catch(console.error);
//# sourceMappingURL=debugStars2.js.map