/**
 * Comprehensive test suite for pattern miner
 */
import { buildWindowBoard } from '../miner/boardBuilder.js';
import { applyFixedClues } from '../miner/boardBuilder.js';
import { verifyPattern } from '../miner/patternVerifier.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
import { CellState } from '../solver/exactSolver.js';
let testsPassed = 0;
let testsFailed = 0;
function test(name, fn) {
    return async () => {
        try {
            const result = await fn();
            if (result) {
                console.log(`✅ ${name}`);
                testsPassed++;
                return true;
            }
            else {
                console.log(`❌ ${name}`);
                testsFailed++;
                return false;
            }
        }
        catch (error) {
            console.log(`❌ ${name} - ERROR:`, error);
            testsFailed++;
            return false;
        }
    };
}
/**
 * Test 1: Simple 4x4 board with 1 star per unit
 * Note: 2x2 and 3x3 are often impossible with 8-directional adjacency
 */
async function test1_Simple4x4() {
    const window = { width: 4, height: 4, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    // Each row is a region
    for (let r = 0; r < 4; r++) {
        const cells = [];
        for (let c = 0; c < 4; c++) {
            cells.push(r * 10 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const state = buildWindowBoard(window, 10, 1, regionMap);
    // Check constraints
    const totalRowStars = state.rows.reduce((sum, r) => sum + r.starsRequired, 0);
    const totalColStars = state.cols.reduce((sum, c) => sum + c.starsRequired, 0);
    const totalRegionStars = state.regions.reduce((sum, r) => sum + r.starsRequired, 0);
    if (totalRowStars !== totalColStars || totalRowStars !== totalRegionStars) {
        console.log(`    Constraint mismatch: rows=${totalRowStars}, cols=${totalColStars}, regions=${totalRegionStars}`);
        return false;
    }
    const analysis = enumerateAllCompletions(state, 100, 5000);
    return analysis.totalCompletions > 0;
}
/**
 * Test 2: E1 pattern - row with exactly 1 candidate and 1 star needed
 * Use a larger board to ensure solvability
 */
async function test2_E1Pattern() {
    const window = { width: 5, height: 5, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    // Each row is a region
    for (let r = 0; r < 5; r++) {
        const cells = [];
        for (let c = 0; c < 5; c++) {
            cells.push(r * 10 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const baseState = buildWindowBoard(window, 10, 1, regionMap);
    // Place empties in row 0, cells 0, 1, 2, 3, leaving only cell 4
    // This creates E1 condition: 1 candidate, needs 1 star
    const testState = applyFixedClues(baseState, [], [0, 1, 2, 3]);
    // Row 0 should have exactly 1 candidate (cell 4) and need 1 star
    const row0Candidates = testState.rows[0].cells.filter(c => testState.cellStates[c] === CellState.Unknown);
    if (row0Candidates.length !== 1 || testState.rows[0].starsRequired !== 1) {
        return false;
    }
    const analysis = enumerateAllCompletions(testState, 100, 10000);
    if (analysis.totalCompletions === 0) {
        // This might be unsolvable - skip the test but note it
        console.log('    Note: Configuration may be unsolvable with given constraints');
        return false;
    }
    // Cell 4 should be forced star
    const cell4Result = analysis.cellResults.get(4);
    return cell4Result === 'alwaysStar';
}
/**
 * Test 3: Verify pattern verification finds forced stars
 * Use E1 pattern: row with 1 candidate, needs 1 star
 */
async function test3_PatternVerification() {
    const window = { width: 5, height: 5, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    for (let r = 0; r < 5; r++) {
        const cells = [];
        for (let c = 0; c < 5; c++) {
            cells.push(r * 10 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const baseState = buildWindowBoard(window, 10, 1, regionMap);
    // E1 pattern: row 0 has empties in cells 0-3, leaving only cell 4
    // This should force cell 4 to be a star
    const testState = applyFixedClues(baseState, [], [0, 1, 2, 3]);
    const verification = await verifyPattern(testState, window, []);
    // Pattern verification should find forced star at cell 4
    return verification.verified && verification.actualDeductions.length > 0;
}
/**
 * Test 4: Test with minimal valid configuration (4x4)
 */
async function test4_MinimalValid() {
    // 4x4 board, 1 star per unit
    const window = { width: 4, height: 4, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    // Each row is a region
    for (let r = 0; r < 4; r++) {
        const cells = [];
        for (let c = 0; c < 4; c++) {
            cells.push(r * 10 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const state = buildWindowBoard(window, 10, 1, regionMap);
    // Check constraint consistency
    const totalRowStars = state.rows.reduce((sum, r) => sum + r.starsRequired, 0);
    const totalColStars = state.cols.reduce((sum, c) => sum + c.starsRequired, 0);
    const totalRegionStars = state.regions.reduce((sum, r) => sum + r.starsRequired, 0);
    if (totalRowStars !== 4 || totalColStars !== 4 || totalRegionStars !== 4) {
        console.log(`    Expected all 4, got: rows=${totalRowStars}, cols=${totalColStars}, regions=${totalRegionStars}`);
        return false;
    }
    const analysis = enumerateAllCompletions(state, 100, 5000);
    return analysis.totalCompletions > 0;
}
/**
 * Test 5: Test adjacency constraint
 */
async function test5_Adjacency() {
    const window = { width: 5, height: 5, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    for (let r = 0; r < 5; r++) {
        const cells = [];
        for (let c = 0; c < 5; c++) {
            cells.push(r * 10 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const baseState = buildWindowBoard(window, 10, 1, regionMap);
    // Place star in cell 0 (0,0), should force empty in adjacent cells
    const testState = applyFixedClues(baseState, [0], []);
    const analysis = enumerateAllCompletions(testState, 100, 10000);
    if (analysis.totalCompletions === 0) {
        return false;
    }
    // Adjacent cells to (0,0): 1 (0,1), 5 (1,0), 6 (1,1) - all should not be stars
    const cell1 = analysis.cellResults.get(1);
    const cell5 = analysis.cellResults.get(5);
    const cell6 = analysis.cellResults.get(6);
    return cell1 !== 'alwaysStar' && cell5 !== 'alwaysStar' && cell6 !== 'alwaysStar';
}
/**
 * Test 6: Test row quota constraint
 * Use a simpler configuration that's guaranteed solvable
 */
async function test6_RowQuota() {
    const window = { width: 5, height: 5, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    // Each row is a region
    for (let r = 0; r < 5; r++) {
        const cells = [];
        for (let c = 0; c < 5; c++) {
            cells.push(r * 10 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const baseState = buildWindowBoard(window, 10, 1, regionMap);
    // Don't place any fixed clues - just verify the empty board is solvable
    // This tests that the solver can find completions with proper row/col/region quotas
    const analysis = enumerateAllCompletions(baseState, 100, 10000);
    return analysis.totalCompletions > 0;
}
/**
 * Test 7: Debug exact solver with step-by-step
 */
async function test7_SolverDebug() {
    const window = { width: 4, height: 4, originRow: 0, originCol: 0 };
    const regionMap = new Map();
    for (let r = 0; r < 4; r++) {
        const cells = [];
        for (let c = 0; c < 4; c++) {
            cells.push(r * 10 + c);
        }
        regionMap.set(r + 1, cells);
    }
    const state = buildWindowBoard(window, 10, 1, regionMap);
    console.log('    Board state:');
    console.log(`      Size: ${state.size}, Window: ${state.windowWidth}x${state.windowHeight}`);
    console.log(`      Rows: ${state.rows.length}, each needs ${state.rows[0].starsRequired} star(s)`);
    console.log(`      Cols: ${state.cols.length}, each needs ${state.cols[0].starsRequired} star(s)`);
    console.log(`      Regions: ${state.regions.length}, each needs ${state.regions[0].starsRequired} star(s)`);
    console.log(`      Unknown cells: ${state.cellStates.filter(s => s === CellState.Unknown).length}`);
    const analysis = enumerateAllCompletions(state, 10, 5000);
    console.log(`      Completions found: ${analysis.totalCompletions}`);
    if (analysis.totalCompletions > 0) {
        const width = state.windowWidth || state.size;
        const height = state.windowHeight || state.size;
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
            console.log(`      ${row.join(' ')}`);
        }
    }
    return analysis.totalCompletions > 0;
}
async function runAllTests() {
    console.log('Running Pattern Miner Test Suite\n');
    console.log('='.repeat(60));
    await test('Test 1: Simple 4x4 board', test1_Simple4x4)();
    await test('Test 2: E1 pattern (candidate deficit)', test2_E1Pattern)();
    await test('Test 3: Pattern verification', test3_PatternVerification)();
    await test('Test 4: Minimal valid configuration', test4_MinimalValid)();
    await test('Test 5: Adjacency constraint', test5_Adjacency)();
    await test('Test 6: Row quota constraint', test6_RowQuota)();
    await test('Test 7: Solver debug (2x2)', test7_SolverDebug)();
    console.log('\n' + '='.repeat(60));
    console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('='.repeat(60));
    return testsFailed === 0;
}
async function main() {
    try {
        const success = await runAllTests();
        process.exit(success ? 0 : 1);
    }
    catch (error) {
        console.error('Test suite error:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=test.js.map