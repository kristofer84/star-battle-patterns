/**
 * Test with valid configurations that should work
 */
import { buildWindowBoard } from '../miner/boardBuilder.js';
import { applyFixedClues } from '../miner/boardBuilder.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
import { CellState } from '../solver/exactSolver.js';
/**
 * Test 3x3 with 1 star per unit - this should have valid completions
 * Key: need enough space to place stars non-adjacently
 */
async function test3x3Valid() {
    console.log('Test: 3x3 board, 1 star per unit\n');
    const window = { width: 3, height: 3, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    // Each row is a region
    for (let r = 0; r < 3; r++) {
        const cells = [];
        for (let c = 0; c < 3; c++) {
            cells.push(r * 10 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const state = buildWindowBoard(window, 10, 1, regionMap);
    console.log('Constraints:');
    console.log(`  Rows: ${state.rows.length}, each needs ${state.rows[0].starsRequired} star`);
    console.log(`  Cols: ${state.cols.length}, each needs ${state.cols[0].starsRequired} star`);
    console.log(`  Regions: ${state.regions.length}, each needs ${state.regions[0].starsRequired} star`);
    console.log(`  Total stars needed: ${state.rows.length * state.rows[0].starsRequired}\n`);
    const analysis = enumerateAllCompletions(state, 100, 5000);
    console.log(`Completions found: ${analysis.totalCompletions}`);
    if (analysis.totalCompletions > 0) {
        console.log('\nCell results:');
        for (let r = 0; r < 3; r++) {
            const row = [];
            for (let c = 0; c < 3; c++) {
                const cellId = r * 3 + c;
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
        return true;
    }
    return false;
}
/**
 * Test E1 pattern: row with exactly 1 candidate
 */
async function testE1Valid() {
    console.log('\nTest: E1 pattern - row with 1 candidate, needs 1 star\n');
    const window = { width: 4, height: 3, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    // Each row is a region
    for (let r = 0; r < 3; r++) {
        const cells = [];
        for (let c = 0; c < 4; c++) {
            cells.push(r * 10 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const baseState = buildWindowBoard(window, 10, 1, regionMap);
    // Row 0: place empties in cells 0, 1, 2, leaving only cell 3
    // Row 0 needs 1 star, has 1 candidate -> E1 applies
    const testState = applyFixedClues(baseState, [], [0, 1, 2]);
    console.log('Row 0 state:');
    const row0States = testState.rows[0].cells.map(c => {
        const s = testState.cellStates[c];
        return s === CellState.Star ? '*' : s === CellState.Empty ? 'X' : '?';
    });
    console.log(`  ${row0States.join(' ')}`);
    console.log(`  Candidates: ${testState.rows[0].cells.filter(c => testState.cellStates[c] === CellState.Unknown).length}`);
    console.log(`  Stars needed: ${testState.rows[0].starsRequired}\n`);
    const analysis = enumerateAllCompletions(testState, 100, 5000);
    console.log(`Completions: ${analysis.totalCompletions}`);
    if (analysis.totalCompletions > 0) {
        const cell3Result = analysis.cellResults.get(3);
        console.log(`Cell 3 (should be forced star): ${cell3Result}`);
        return cell3Result === 'alwaysStar';
    }
    return false;
}
async function main() {
    const test1 = await test3x3Valid();
    const test2 = await testE1Valid();
    console.log('\n' + '='.repeat(60));
    console.log(`Results: ${test1 && test2 ? 'PASS' : 'FAIL'}`);
    console.log(`  Test 1 (3x3): ${test1 ? 'PASS' : 'FAIL'}`);
    console.log(`  Test 2 (E1): ${test2 ? 'PASS' : 'FAIL'}`);
    process.exit(test1 && test2 ? 0 : 1);
}
main().catch(console.error);
//# sourceMappingURL=testValid.js.map