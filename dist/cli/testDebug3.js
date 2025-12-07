/**
 * Debug Test 3: Pattern verification
 */
import { buildWindowBoard } from '../miner/boardBuilder.js';
import { applyFixedClues } from '../miner/boardBuilder.js';
import { verifyPattern } from '../miner/patternVerifier.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
async function debugTest3() {
    const window = { width: 4, height: 4, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    for (let r = 0; r < 4; r++) {
        const cells = [];
        for (let c = 0; c < 4; c++) {
            cells.push(r * 10 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const baseState = buildWindowBoard(window, 10, 1, regionMap);
    // Place a star at (0,0) - this should force some empties
    const testState = applyFixedClues(baseState, [0], []);
    console.log('State with star at cell 0:');
    const width = 4;
    for (let r = 0; r < 4; r++) {
        const row = [];
        for (let c = 0; c < 4; c++) {
            const cellId = r * width + c;
            const s = testState.cellStates[cellId];
            row.push(s === 1 ? '*' : s === 0 ? 'X' : '?');
        }
        console.log(`  ${row.join(' ')}`);
    }
    console.log('\nRunning solver...');
    const analysis = enumerateAllCompletions(testState, 100, 10000);
    console.log(`Completions: ${analysis.totalCompletions}`);
    if (analysis.totalCompletions > 0) {
        console.log('\nCell results:');
        for (let r = 0; r < 4; r++) {
            const row = [];
            for (let c = 0; c < 4; c++) {
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
        // Adjacent cells to (0,0): 1, 4, 5
        console.log('\nAdjacent cells to (0,0):');
        console.log(`  Cell 1 (0,1): ${analysis.cellResults.get(1)}`);
        console.log(`  Cell 4 (1,0): ${analysis.cellResults.get(4)}`);
        console.log(`  Cell 5 (1,1): ${analysis.cellResults.get(5)}`);
    }
    console.log('\nRunning pattern verifier...');
    const verification = await verifyPattern(testState, window, []);
    console.log(`Verified: ${verification.verified}`);
    console.log(`Deductions: ${JSON.stringify(verification.actualDeductions, null, 2)}`);
}
debugTest3().catch(console.error);
//# sourceMappingURL=testDebug3.js.map