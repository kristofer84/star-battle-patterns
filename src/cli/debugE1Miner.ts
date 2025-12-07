/**
 * Debug why E1_candidateDeficit miner finds 0 patterns
 */

import { buildWindowBoard } from '../miner/boardBuilder.js';
import { applyFixedClues } from '../miner/boardBuilder.js';
import { testSchemaPreconditions } from '../miner/schemaTesters.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
import { enumerateWindows } from '../miner/windowEnumerator.js';
import { CellState } from '../solver/exactSolver.js';

async function debugE1Miner() {
  console.log('Debugging E1_candidateDeficit miner\n');
  
  const boardSize = 10;
  const starsPerUnit = 2;
  const familyId = 'E1_candidateDeficit';
  const window = { width: 10, height: 10, originRow: 0, originCol: 0 };
  
  // Create region structure
  const regionMap = new Map<number, number[]>();
  for (let r = 0; r < 10; r++) {
    const cells: number[] = [];
    for (let c = 0; c < 10; c++) {
      cells.push(r * boardSize + c);
    }
    regionMap.set(r + 1, cells);
  }
  
  const baseState = buildWindowBoard(window, boardSize, starsPerUnit, regionMap);
  
  console.log('1. Testing preconditions...');
  const preconditionTest = testSchemaPreconditions(familyId, baseState, window);
  console.log(`   Preconditions hold: ${preconditionTest.holds}`);
  
  if (!preconditionTest.holds) {
    console.log('   ❌ Preconditions don\'t hold - this is why no patterns are found!');
    return;
  }
  
  console.log('\n2. Checking base solvability...');
  const baseSolvability = enumerateAllCompletions(baseState, 1, 10000);
  console.log(`   Completions: ${baseSolvability.totalCompletions}`);
  
  if (baseSolvability.totalCompletions === 0) {
    console.log('   ❌ Base board is unsolvable!');
    return;
  }
  
  console.log('\n3. Trying to create E1 pattern...');
  const row = baseState.rows[0];
  const candidates = row.cells.filter(c => baseState.cellStates[c] === CellState.Unknown);
  console.log(`   Row 0: ${candidates.length} candidates, needs ${row.starsRequired} stars`);
  
  if (candidates.length > row.starsRequired) {
    const emptiesToPlace = candidates.length - row.starsRequired;
    console.log(`   Need to place ${emptiesToPlace} empties`);
    
    // Try the same logic as the miner
    const maxAttempts = 50;
    let found = false;
    
    for (let attempt = 0; attempt < maxAttempts && !found; attempt++) {
      const forcedEmpties: number[] = [];
      const step = Math.max(1, Math.floor(candidates.length / emptiesToPlace));
      
      for (let i = 0; i < emptiesToPlace; i++) {
        const idx = (attempt + i * step) % candidates.length;
        if (!forcedEmpties.includes(candidates[idx])) {
          forcedEmpties.push(candidates[idx]);
        }
        if (forcedEmpties.length >= emptiesToPlace) break;
      }
      
      while (forcedEmpties.length < emptiesToPlace && forcedEmpties.length < candidates.length) {
        for (const c of candidates) {
          if (!forcedEmpties.includes(c)) {
            forcedEmpties.push(c);
            break;
          }
        }
      }
      
      if (forcedEmpties.length !== emptiesToPlace) continue;
      
      const testState = applyFixedClues(baseState, [], forcedEmpties);
      const solvabilityCheck = enumerateAllCompletions(testState, 1, 10000);
      
      if (solvabilityCheck.totalCompletions === 0) {
        if (attempt < 3) {
          console.log(`   Attempt ${attempt + 1}: Unsolvable after placing empties`);
        }
        continue;
      }
      
      const e1Check = testSchemaPreconditions(familyId, testState, window);
      if (!e1Check.holds) {
        if (attempt < 3) {
          console.log(`   Attempt ${attempt + 1}: E1 condition doesn't hold`);
        }
        continue;
      }
      
      console.log(`   ✓ Found valid E1 pattern on attempt ${attempt + 1}!`);
      found = true;
    }
    
    if (!found) {
      console.log(`   ❌ No pattern found after ${maxAttempts} attempts`);
    }
  }
}

debugE1Miner().catch(console.error);

