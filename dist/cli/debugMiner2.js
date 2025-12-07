/**
 * More detailed debugging of E1 mining
 */
import { buildWindowBoard } from '../miner/boardBuilder.js';
import { applyFixedClues } from '../miner/boardBuilder.js';
import { testSchemaPreconditions } from '../miner/schemaTesters.js';
import { verifyPattern } from '../miner/patternVerifier.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
import { CellState } from '../solver/exactSolver.js';
async function debugE1Detailed() {
    console.log('Detailed E1 Mining Debug\n');
    const boardSize = 10;
    const starsPerUnit = 2;
    const window = { width: 6, height: 6, originRow: 0, originCol: 0 }; // Try 6x6 with 2 stars
    const regionMap = new Map();
    for (let r = 0; r < 6; r++) {
        const cells = [];
        for (let c = 0; c < 6; c++) {
            cells.push(r * boardSize + c);
        }
        regionMap.set(r + 1, cells);
    }
    const baseState = buildWindowBoard(window, boardSize, starsPerUnit, regionMap);
    console.log(`Base board: ${baseState.rows.length} rows, each needs ${baseState.rows[0].starsRequired} stars`);
    // Check base solvability
    console.log('\n1. Checking base board solvability...');
    const baseCheck = enumerateAllCompletions(baseState, 3, 5000);
    console.log(`   Completions: ${baseCheck.totalCompletions}`);
    if (baseCheck.totalCompletions === 0) {
        console.log('   ❌ Base board is unsolvable!');
        return;
    }
    // Try creating E1 for row 0
    const row = baseState.rows[0];
    const candidates = row.cells.filter(c => baseState.cellStates[c] === CellState.Unknown);
    console.log(`\n2. Row 0: ${candidates.length} candidates, needs ${row.starsRequired} stars`);
    if (candidates.length > row.starsRequired) {
        const emptiesToPlace = candidates.length - row.starsRequired;
        console.log(`   Need to place ${emptiesToPlace} empties to create E1 condition`);
        // Try first combination
        const forcedEmpties = candidates.slice(0, emptiesToPlace);
        console.log(`   Trying empties at cells: ${forcedEmpties.join(', ')}`);
        const testState = applyFixedClues(baseState, [], forcedEmpties);
        console.log('\n3. Checking solvability after placing empties...');
        const solvabilityCheck = enumerateAllCompletions(testState, 10, 10000);
        console.log(`   Completions: ${solvabilityCheck.totalCompletions}`);
        if (solvabilityCheck.totalCompletions === 0) {
            console.log('   ❌ Board became unsolvable after placing empties');
            console.log('   This is why no patterns are found!');
            return;
        }
        console.log('\n4. Checking E1 condition...');
        const e1Check = testSchemaPreconditions('E1_candidateDeficit', testState, window);
        console.log(`   E1 holds: ${e1Check.holds}`);
        if (e1Check.holds) {
            console.log(`   Group: ${e1Check.data?.group_type}, ID: ${e1Check.data?.group_id}`);
            console.log(`   Candidates: ${e1Check.data?.candidates?.length || 0}`);
        }
        if (e1Check.holds) {
            console.log('\n5. Verifying pattern...');
            const verification = await verifyPattern(testState, window, []);
            console.log(`   Verified: ${verification.verified}`);
            console.log(`   Deductions: ${JSON.stringify(verification.actualDeductions, null, 2)}`);
            if (!verification.verified) {
                console.log('\n6. Why no deductions? Checking cell results...');
                const remainingCandidates = row.cells.filter(c => testState.cellStates[c] === CellState.Unknown);
                console.log(`   Remaining candidates in row 0: ${remainingCandidates.length}`);
                for (const cellId of remainingCandidates) {
                    const result = solvabilityCheck.cellResults.get(cellId);
                    console.log(`     Cell ${cellId}: ${result || 'unknown'}`);
                }
            }
        }
    }
}
debugE1Detailed().catch(console.error);
//# sourceMappingURL=debugMiner2.js.map