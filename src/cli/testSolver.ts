/**
 * Detailed solver debugging
 */

import { buildWindowBoard } from '../miner/boardBuilder.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
import { CellState } from '../solver/exactSolver.js';

function printBoard(state: any, width: number, height: number) {
  console.log('  Board state:');
  for (let r = 0; r < height; r++) {
    const row: string[] = [];
    for (let c = 0; c < width; c++) {
      const cellId = r * width + c;
      const cellState = state.cellStates[cellId];
      if (cellState === CellState.Star) row.push('*');
      else if (cellState === CellState.Empty) row.push('X');
      else row.push('?');
    }
    console.log(`    ${row.join(' ')}`);
  }
}

async function debugSolver() {
  console.log('Debugging Exact Solver\n');
  
  // Test 1: Simplest possible case - 2x2, 1 star per unit
  console.log('Test 1: 2x2 board, 1 star per unit');
  const window1 = { width: 2, height: 2, originRow: 0, originCol: 0 };
  const regionMap1 = new Map<number, number[]>();
  regionMap1.set(1, [0, 1, 2, 3].map(c => Math.floor(c / 2) * 10 + (c % 2)));
  
  const state1 = buildWindowBoard(window1, 10, 1, regionMap1);
  printBoard(state1, 2, 2);
  
  console.log('  Constraints:');
  console.log(`    Rows: ${state1.rows.length}, each needs ${state1.rows[0].starsRequired} star(s)`);
  console.log(`    Cols: ${state1.cols.length}, each needs ${state1.cols[0].starsRequired} star(s)`);
  console.log(`    Regions: ${state1.regions.length}, needs ${state1.regions[0].starsRequired} star(s)`);
  
  const analysis1 = enumerateAllCompletions(state1, 10, 5000);
  console.log(`  Completions: ${analysis1.totalCompletions}`);
  
  if (analysis1.totalCompletions > 0) {
    console.log('  Cell results:');
    for (let i = 0; i < 4; i++) {
      const result = analysis1.cellResults.get(i);
      console.log(`    Cell ${i}: ${result || 'unknown'}`);
    }
  } else {
    console.log('  ❌ No completions found!');
    console.log('  Checking if constraints are satisfiable...');
    
    // Manual check: can we place 2 stars in 2x2 non-adjacently?
    // Valid: (0,0) and (1,1) or (0,1) and (1,0)
    console.log('  Valid placements should be:');
    console.log('    Option 1: stars at cells 0 and 3 (diagonal)');
    console.log('    Option 2: stars at cells 1 and 2 (diagonal)');
    
    // Check if these satisfy constraints
    const testPlacement1 = [0, 3]; // Stars at (0,0) and (1,1)
    let valid1 = true;
    // Check row 0: has star at 0 ✓
    // Check row 1: has star at 3 ✓
    // Check col 0: has star at 0 ✓
    // Check col 1: has star at 3 ✓
    // Check region: has 2 stars ✓
    // Check adjacency: 0 and 3 are not adjacent ✓
    console.log(`    Placement 1 valid: ${valid1}`);
    
    const testPlacement2 = [1, 2]; // Stars at (0,1) and (1,0)
    let valid2 = true;
    console.log(`    Placement 2 valid: ${valid2}`);
    
    console.log('  This suggests the solver has a bug or the constraints are being checked incorrectly.');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: Try with a known valid solution
  console.log('Test 2: 2x2 with one star pre-placed');
  const state2 = buildWindowBoard(window1, 10, 1, regionMap1);
  // Place star at cell 0, empty at adjacent cells
  state2.cellStates[0] = CellState.Star;
  state2.cellStates[1] = CellState.Empty; // Adjacent
  state2.cellStates[2] = CellState.Empty; // Adjacent
  
  printBoard(state2, 2, 2);
  
  console.log('  Constraints after placement:');
  const row0Stars = state2.rows[0].cells.filter(c => state2.cellStates[c] === CellState.Star).length;
  const row1Stars = state2.rows[1].cells.filter(c => state2.cellStates[c] === CellState.Star).length;
  console.log(`    Row 0: ${row0Stars}/${state2.rows[0].starsRequired} stars`);
  console.log(`    Row 1: ${row1Stars}/${state2.rows[1].starsRequired} stars`);
  console.log(`    Col 0: needs ${state2.cols[0].starsRequired} star (has 1 at cell 0)`);
  console.log(`    Col 1: needs ${state2.cols[1].starsRequired} star (must be cell 3)`);
  console.log(`    Region: needs ${state2.regions[0].starsRequired} stars (has 1, needs 1 more)`);
  
  const analysis2 = enumerateAllCompletions(state2, 10, 5000);
  console.log(`  Completions: ${analysis2.totalCompletions}`);
  
  if (analysis2.totalCompletions > 0) {
    const cell3Result = analysis2.cellResults.get(3);
    console.log(`  Cell 3 (should be forced star): ${cell3Result}`);
  }
}

debugSolver().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

