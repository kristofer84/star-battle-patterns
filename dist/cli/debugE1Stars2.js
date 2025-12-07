/**
 * Debug E1 with starsPerUnit = 2
 */
import { buildWindowBoard } from '../miner/boardBuilder.js';
import { applyFixedClues } from '../miner/boardBuilder.js';
import { testSchemaPreconditions } from '../miner/schemaTesters.js';
import { verifyPattern } from '../miner/patternVerifier.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
import { CellState } from '../solver/exactSolver.js';
async function debugE1Stars2() {
    console.log('Debugging E1 with starsPerUnit = 2\n');
    const boardSize = 10;
    const starsPerUnit = 2;
    const window = { width: 8, height: 8, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    for (let r = 0; r < 8; r++) {
        const cells = [];
        for (let c = 0; c < 8; c++) {
            cells.push(r * boardSize + c);
        }
        regionMap.set(r + 1, cells);
    }
    const baseState = buildWindowBoard(window, boardSize, starsPerUnit, regionMap);
    console.log(`Base board: ${baseState.rows.length} rows, each needs ${baseState.rows[0].starsRequired} stars`);
    const baseCheck = enumerateAllCompletions(baseState, 1, 5000);
    console.log(`Base solvability: ${baseCheck.totalCompletions} completions\n`);
    if (baseCheck.totalCompletions === 0) {
        console.log('Base board is unsolvable!');
        return;
    }
    // Try creating E1 for row 0
    const row = baseState.rows[0];
    const candidates = row.cells.filter(c => baseState.cellStates[c] === CellState.Unknown);
    console.log(`Row 0: ${candidates.length} candidates, needs ${row.starsRequired} stars`);
    if (candidates.length > row.starsRequired) {
        const emptiesToPlace = candidates.length - row.starsRequired;
        console.log(`Need to place ${emptiesToPlace} empties to create E1 condition\n`);
        // Try first combination
        const forcedEmpties = candidates.slice(0, emptiesToPlace);
        console.log(`Trying empties at cells: ${forcedEmpties.slice(0, 5).join(', ')}... (${forcedEmpties.length} total)`);
        const testState = applyFixedClues(baseState, [], forcedEmpties);
        const solvabilityCheck = enumerateAllCompletions(testState, 1, 5000);
        console.log(`After placing empties: ${solvabilityCheck.totalCompletions} completions`);
        if (solvabilityCheck.totalCompletions === 0) {
            console.log('❌ Board became unsolvable after placing empties');
            console.log('This is why E1 finds 0 patterns with starsPerUnit = 2');
            return;
        }
        const e1Check = testSchemaPreconditions('E1_candidateDeficit', testState, window);
        console.log(`E1 condition holds: ${e1Check.holds}`);
        if (e1Check.holds) {
            const verification = await verifyPattern(testState, window, []);
            console.log(`Pattern verified: ${verification.verified}`);
            console.log(`Deductions: ${verification.actualDeductions.length}`);
        }
    }
}
debugE1Stars2().catch(console.error);
//# sourceMappingURL=debugE1Stars2.js.map