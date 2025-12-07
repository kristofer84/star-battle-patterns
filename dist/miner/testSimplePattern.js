/**
 * Test simple pattern generation to verify the solver works
 */
import { buildWindowBoard } from './boardBuilder.js';
import { applyFixedClues } from './boardBuilder.js';
import { verifyPattern } from './patternVerifier.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
import { CellState } from '../solver/exactSolver.js';
/**
 * Test a simple E1 pattern: a row with exactly 2 candidates and 2 stars needed
 */
export async function testSimpleE1Pattern() {
    const window = { width: 4, height: 4, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    // Create a simple structure: each row is a region
    for (let r = 0; r < 4; r++) {
        const cells = [];
        for (let c = 0; c < 4; c++) {
            cells.push(r * 4 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const baseState = buildWindowBoard(window, 10, 2, regionMap);
    // Create E1 scenario: row 0 needs 2 stars, has exactly 2 candidates
    // Place crosses in row 0, columns 0 and 1, leaving only columns 2 and 3 as candidates
    const forcedEmpties = [0, 1]; // First two cells of row 0
    const testState = applyFixedClues(baseState, [], forcedEmpties);
    console.log('Testing simple E1 pattern...');
    console.log('Row 0 cells:', testState.rows[0].cells);
    console.log('Row 0 cell states:', testState.rows[0].cells.map(c => testState.cellStates[c]));
    console.log('Row 0 stars required:', testState.rows[0].starsRequired);
    // Count candidates in row 0
    const row0Candidates = testState.rows[0].cells.filter(c => testState.cellStates[c] === CellState.Unknown);
    console.log('Row 0 candidates:', row0Candidates.length);
    // Try solving
    const analysis = enumerateAllCompletions(testState, 100, 5000);
    console.log('Total completions found:', analysis.totalCompletions);
    // Check if row 0 cells are forced stars
    const row0Forced = testState.rows[0].cells.filter(c => analysis.cellResults.get(c) === 'alwaysStar');
    console.log('Row 0 forced stars:', row0Forced);
    // Verify pattern
    const verification = await verifyPattern(testState, window, []);
    console.log('Pattern verified:', verification.verified);
    console.log('Deductions:', verification.actualDeductions);
    return verification.verified && verification.actualDeductions.length > 0;
}
//# sourceMappingURL=testSimplePattern.js.map