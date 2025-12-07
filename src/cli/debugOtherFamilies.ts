/**
 * Debug why other families aren't generating patterns
 */

import { buildWindowBoard } from '../miner/boardBuilder.js';
import { testSchemaPreconditions } from '../miner/schemaTesters.js';
import { enumerateAllCompletions } from '../solver/exactSolver.js';

async function debugFamily(familyId: string, starsPerUnit: number) {
  console.log(`\n=== Debugging ${familyId} ===\n`);
  
  const boardSize = 10;
  const window = { width: 5, height: 5, originRow: 0, originCol: 0 };
  
  // Create region structure based on family
  const regionMap = new Map<number, number[]>();
  
  if (familyId.includes('A1') || familyId.includes('rowBand')) {
    // For A1: need regions that span multiple rows
    // Structure: some regions fully inside, some partial
    regionMap.set(1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]); // Rows 0-1
    regionMap.set(2, [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]); // Rows 2-3
    regionMap.set(3, [20, 21, 22, 23, 24]); // Row 4
  } else if (familyId.includes('C1') || familyId.includes('exactCages')) {
    // For C1: regions aligned with 2x2 blocks
    let regionId = 1;
    for (let r = 0; r < 4; r += 2) {
      for (let c = 0; c < 4; c += 2) {
        const cells: number[] = [];
        for (let dr = 0; dr < 2; dr++) {
          for (let dc = 0; dc < 2; dc++) {
            cells.push((r + dr) * 5 + (c + dc));
          }
        }
        regionMap.set(regionId++, cells);
      }
    }
    // Last row
    for (let c = 0; c < 4; c += 2) {
      const cells: number[] = [];
      for (let dc = 0; dc < 2; dc++) {
        cells.push(4 * 5 + (c + dc));
      }
      regionMap.set(regionId++, cells);
    }
  } else {
    // Default: each row is a region
    for (let r = 0; r < 5; r++) {
      const cells: number[] = [];
      for (let c = 0; c < 5; c++) {
        cells.push(r * boardSize + c);
      }
      regionMap.set(r + 1, cells);
    }
  }
  
  const baseState = buildWindowBoard(window, boardSize, starsPerUnit, regionMap);
  
  console.log(`1. Board state:`);
  console.log(`   Rows: ${baseState.rows.length}, each needs ${baseState.rows[0]?.starsRequired || 0} stars`);
  console.log(`   Cols: ${baseState.cols.length}, each needs ${baseState.cols[0]?.starsRequired || 0} stars`);
  console.log(`   Regions: ${baseState.regions.length}`);
  
  console.log(`\n2. Checking solvability...`);
  const solvability = enumerateAllCompletions(baseState, 1, 3000);
  console.log(`   Completions: ${solvability.totalCompletions}`);
  
  if (solvability.totalCompletions === 0) {
    console.log(`   ❌ Board is unsolvable - this family won't work with this window size`);
    return;
  }
  
  console.log(`\n3. Testing preconditions...`);
  const preconditionTest = testSchemaPreconditions(familyId, baseState, window);
  console.log(`   Preconditions hold: ${preconditionTest.holds}`);
  if (preconditionTest.data) {
    console.log(`   Data: ${JSON.stringify(preconditionTest.data, null, 2)}`);
  }
  
  if (!preconditionTest.holds) {
    console.log(`   ❌ Preconditions don't hold - patterns won't be generated`);
    console.log(`   This is why no patterns are found for ${familyId}`);
  } else {
    console.log(`   ✓ Preconditions hold - patterns should be generatable`);
  }
}

async function main() {
  const starsPerUnit = 1; // Use 1 for testing
  
  await debugFamily('A1_rowBand_regionBudget', starsPerUnit);
  await debugFamily('C1_bandExactCages', starsPerUnit);
  await debugFamily('D1_rowColIntersection', starsPerUnit);
}

main().catch(console.error);

