/**
 * Step-by-step solver debugging
 */

import { buildWindowBoard } from '../miner/boardBuilder.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
import { CellState } from '../solver/exactSolver.js';

async function testSolverStepByStep() {
  console.log('Step-by-step solver test\n');
  
  const window = { width: 4, height: 4, originRow: 0, originCol: 0 };
  const regionMap = new Map<number, number[]>();
  
  for (let r = 0; r < 4; r++) {
    const cells: number[] = [];
    for (let c = 0; c < 4; c++) {
      cells.push(r * 10 + c);
    }
    regionMap.set(r + 1, cells);
  }
  
  const state = buildWindowBoard(window, 10, 1, regionMap);
  
  console.log('Initial state (all unknown):');
  console.log(`  Cells: ${state.cellStates.length}`);
  console.log(`  Unknown: ${state.cellStates.filter(s => s === CellState.Unknown).length}`);
  console.log(`  Rows: ${state.rows.length}, each needs ${state.rows[0].starsRequired} star`);
  console.log(`  Cols: ${state.cols.length}, each needs ${state.cols[0].starsRequired} star`);
  console.log(`  Regions: ${state.regions.length}, each needs ${state.regions[0].starsRequired} star\n`);
  
  console.log('Running solver...');
  const startTime = Date.now();
  const analysis = enumerateAllCompletions(state, 100, 10000);
  const elapsed = Date.now() - startTime;
  
  console.log(`\nResults (${elapsed}ms):`);
  console.log(`  Completions found: ${analysis.totalCompletions}`);
  
  if (analysis.totalCompletions > 0) {
    console.log('\n  Cell results:');
    const width = state.windowWidth || state.size;
    const height = state.windowHeight || state.size;
    for (let r = 0; r < height; r++) {
      const row: string[] = [];
      for (let c = 0; c < width; c++) {
        const cellId = r * width + c;
        const result = analysis.cellResults.get(cellId);
        if (result === 'alwaysStar') row.push('*');
        else if (result === 'alwaysEmpty') row.push('X');
        else row.push('?');
      }
      console.log(`    ${row.join(' ')}`);
    }
    return true;
  } else {
    console.log('\n  ⚠️  No completions found!');
    console.log('  This suggests the solver is not exploring the search space correctly.');
    console.log('  Possible issues:');
    console.log('    1. isValidPartialState is too strict');
    console.log('    2. The solver is timing out too early');
    console.log('    3. There\'s a bug in the backtracking logic');
    return false;
  }
}

testSolverStepByStep().then(result => {
  process.exit(result ? 0 : 1);
}).catch(console.error);

