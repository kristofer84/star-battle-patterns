/**
 * Debug E1_candidateDeficit with full family name
 */
import { buildWindowBoard } from '../miner/boardBuilder.js';
import { applyFixedClues } from '../miner/boardBuilder.js';
import { testSchemaPreconditions } from '../miner/schemaTesters.js';
import { verifyPattern } from '../miner/patternVerifier.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
import { CellState } from '../solver/exactSolver.js';
async function debugE1Full() {
    console.log('Debugging E1_candidateDeficit with 10x10 window\n');
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
        // Try different combinations
        let foundPattern = false;
        const maxAttempts = 30;
        for (let attempt = 0; attempt < maxAttempts && !foundPattern; attempt++) {
            const forcedEmpties = [];
            const step = Math.max(1, Math.floor(candidates.length / emptiesToPlace));
            for (let i = 0; i < emptiesToPlace; i++) {
                const idx = (attempt + i * step) % candidates.length;
                if (!forcedEmpties.includes(candidates[idx])) {
                    forcedEmpties.push(candidates[idx]);
                }
                if (forcedEmpties.length >= emptiesToPlace)
                    break;
            }
            while (forcedEmpties.length < emptiesToPlace && forcedEmpties.length < candidates.length) {
                for (const c of candidates) {
                    if (!forcedEmpties.includes(c)) {
                        forcedEmpties.push(c);
                        break;
                    }
                }
            }
            if (forcedEmpties.length !== emptiesToPlace)
                continue;
            const testState = applyFixedClues(baseState, [], forcedEmpties);
            const solvabilityCheck = enumerateAllCompletions(testState, 1, 3000);
            if (solvabilityCheck.totalCompletions === 0) {
                continue;
            }
            const e1Check = testSchemaPreconditions('E1_candidateDeficit', testState, window);
            if (!e1Check.holds) {
                continue;
            }
            const verification = await verifyPattern(testState, window, []);
            if (verification.verified && verification.actualDeductions.length > 0) {
                console.log(`✓ Found pattern on attempt ${attempt + 1}!`);
                console.log(`  Deductions: ${verification.actualDeductions.length}`);
                foundPattern = true;
                break;
            }
        }
        if (!foundPattern) {
            console.log(`❌ No pattern found after ${maxAttempts} attempts`);
        }
    }
}
debugE1Full().catch(console.error);
//# sourceMappingURL=debugE1Full.js.map