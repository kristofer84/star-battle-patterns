/**
 * Test if 10x10 window is solvable with 2 stars
 */
import { buildWindowBoard } from '../miner/boardBuilder.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
async function test10x10Solvability() {
    console.log('Testing 10x10 window solvability with 2 stars\n');
    const boardSize = 10;
    const starsPerUnit = 2;
    const window = { width: 10, height: 10, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    for (let r = 0; r < 10; r++) {
        const cells = [];
        for (let c = 0; c < 10; c++) {
            cells.push(r * boardSize + c);
        }
        regionMap.set(r + 1, cells);
    }
    const baseState = buildWindowBoard(window, boardSize, starsPerUnit, regionMap);
    console.log(`Base board: ${baseState.rows.length} rows, each needs ${baseState.rows[0].starsRequired} stars`);
    console.log('\nChecking solvability with 3000ms timeout...');
    const start1 = Date.now();
    const check1 = enumerateAllCompletions(baseState, 1, 3000);
    const elapsed1 = Date.now() - start1;
    console.log(`  Timeout 3000ms: ${check1.totalCompletions} completions (${elapsed1}ms)`);
    console.log('\nChecking solvability with 10000ms timeout...');
    const start2 = Date.now();
    const check2 = enumerateAllCompletions(baseState, 1, 10000);
    const elapsed2 = Date.now() - start2;
    console.log(`  Timeout 10000ms: ${check2.totalCompletions} completions (${elapsed2}ms)`);
    if (check1.totalCompletions === 0 && check2.totalCompletions > 0) {
        console.log('\n⚠️  Issue: 3000ms timeout is too short! Need at least 10000ms for 10x10 with 2 stars.');
    }
}
test10x10Solvability().catch(console.error);
//# sourceMappingURL=test10x10Solvability.js.map