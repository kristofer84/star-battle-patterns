/**
 * Debug the pattern miner to see why patterns aren't being found
 */

import { buildWindowBoard } from '../miner/boardBuilder.js';
import { applyFixedClues } from '../miner/boardBuilder.js';
import { testSchemaPreconditions } from '../miner/schemaTesters.js';
import { verifyPattern } from '../miner/patternVerifier.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';
import { CellState } from '../solver/exactSolver.js';

async function debugE1Mining() {
  console.log('Debugging E1 pattern mining\n');
  
  const boardSize = 10;
  const starsPerUnit = 2;
  const window = { width: 4, height: 4, originRow: 0, originCol: 0 };
  
  // Create region structure (each row is a region)
  const regionMap = new Map<number, number[]>();
  for (let r = 0; r < 4; r++) {
    const cells: number[] = [];
    for (let c = 0; c < 4; c++) {
      cells.push(r * boardSize + c);
    }
    regionMap.set(r + 1, cells);
  }
  
  console.log('1. Building base board state...');
  const baseState = buildWindowBoard(window, boardSize, starsPerUnit, regionMap);
  console.log(`   Rows: ${baseState.rows.length}, each needs ${baseState.rows[0].starsRequired} stars`);
  console.log(`   Cols: ${baseState.cols.length}, each needs ${baseState.cols[0].starsRequired} stars`);
  console.log(`   Regions: ${baseState.regions.length}, each needs ${baseState.regions[0].starsRequired} stars`);
  
  console.log('\n2. Testing E1 preconditions on base state...');
  const preconditionTest = testSchemaPreconditions('E1_candidateDeficit', baseState, window);
  console.log(`   Preconditions hold: ${preconditionTest.holds}`);
  if (preconditionTest.data) {
    console.log(`   Data: ${JSON.stringify(preconditionTest.data, null, 2)}`);
  }
  
  console.log('\n3. Creating E1 pattern by reducing candidates...');
  // Find a row and reduce candidates to match quota
  for (const row of baseState.rows) {
    const candidates = row.cells.filter(c => baseState.cellStates[c] === CellState.Unknown);
    console.log(`   Row ${row.rowIndex}: ${candidates.length} candidates, needs ${row.starsRequired} stars`);
    
    if (candidates.length > row.starsRequired) {
      const emptiesToPlace = candidates.length - row.starsRequired;
      console.log(`   Placing ${emptiesToPlace} empties to create E1 condition...`);
      
      const forcedEmpties = candidates.slice(0, emptiesToPlace);
      const testState = applyFixedClues(baseState, [], forcedEmpties);
      
      // Check if E1 condition now holds
      const newPreconditionTest = testSchemaPreconditions('E1_candidateDeficit', testState, window);
      console.log(`   After placing empties, preconditions hold: ${newPreconditionTest.holds}`);
      
      if (newPreconditionTest.holds) {
        console.log('\n4. Verifying pattern...');
        const verification = await verifyPattern(testState, window, []);
        console.log(`   Verified: ${verification.verified}`);
        console.log(`   Deductions: ${JSON.stringify(verification.actualDeductions, null, 2)}`);
        
        if (!verification.verified) {
          console.log('\n5. Checking why verification failed...');
          const analysis = enumerateAllCompletions(testState, 100, 10000);
          console.log(`   Completions found: ${analysis.totalCompletions}`);
          
          if (analysis.totalCompletions === 0) {
            console.log('   ⚠️  No completions - board might be unsolvable');
            
            // Check constraints
            const totalRowStars = testState.rows.reduce((sum, r) => sum + r.starsRequired, 0);
            const totalColStars = testState.cols.reduce((sum, c) => sum + c.starsRequired, 0);
            const totalRegionStars = testState.regions.reduce((sum, r) => sum + r.starsRequired, 0);
            console.log(`   Constraints: rows=${totalRowStars}, cols=${totalColStars}, regions=${totalRegionStars}`);
          } else {
            console.log('   ✓ Completions found, but no forced deductions detected');
            // Show cell results
            const remainingCandidates = row.cells.filter(c => testState.cellStates[c] === CellState.Unknown);
            console.log(`   Remaining candidates in row ${row.rowIndex}: ${remainingCandidates.length}`);
            for (const cellId of remainingCandidates) {
              const result = analysis.cellResults.get(cellId);
              console.log(`     Cell ${cellId}: ${result || 'unknown'}`);
            }
          }
        }
        
        break; // Just test first row
      }
    }
  }
}

debugE1Mining().catch(console.error);

