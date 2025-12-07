/**
 * Pattern generator - main mining loop
 */

import type { Pattern, WindowSpec, FamilyPatternSet } from '../model/types';
import { enumerateWindows } from './windowEnumerator';
import { verifyPattern } from './patternVerifier';
import { buildWindowBoard, applyFixedClues } from './boardBuilder';
import { testSchemaPreconditions } from './schemaTesters';
import { normalizePattern, canonicalizePattern } from './windowEnumerator';
import { deduplicatePatterns } from './deduplicator';

/**
 * Generate a unique pattern ID
 */
function generatePatternId(familyId: string, index: number): string {
  return `${familyId}_pattern_${index.toString().padStart(4, '0')}`;
}

/**
 * Generate patterns for a schema family
 */
export async function generatePatternsForFamily(
  familyId: string,
  boardSize: number,
  starsPerUnit: number,
  windowSizes: Array<{ width: number; height: number }>
): Promise<FamilyPatternSet> {
  const allPatterns: Pattern[] = [];
  let patternIdCounter = 0;

  console.log(`  Mining ${familyId}...`);

  // Enumerate windows for each size
  for (const { width, height } of windowSizes) {
    const windows = enumerateWindows(boardSize, width, height);
    console.log(`    Testing ${windows.length} windows of size ${width}×${height}...`);

    let windowsTested = 0;
    let patternsFound = 0;

    for (const window of windows) {
      windowsTested++;
      
      if (windowsTested % 100 === 0) {
        process.stdout.write(`\r    Progress: ${windowsTested}/${windows.length} windows, ${patternsFound} patterns found`);
      }

      // Build abstract board model for window
      // For mining, we create a simplified board with regions
      // In full implementation, we'd use actual region data
      const regionMap = new Map<number, number[]>();
      
      // Create a simple region structure for the window
      // Each row could be a different region, or we could use a grid pattern
      for (let r = 0; r < height; r++) {
        const regionId = r + 1;
        const cells: number[] = [];
        for (let c = 0; c < width; c++) {
          const absRow = window.originRow + r;
          const absCol = window.originCol + c;
          const absCellId = absRow * boardSize + absCol;
          cells.push(absCellId);
        }
        regionMap.set(regionId, cells);
      }

      const baseState = buildWindowBoard(window, boardSize, starsPerUnit, regionMap);

      // Test schema preconditions
      const preconditionTest = testSchemaPreconditions(familyId, baseState, window);
      
      if (!preconditionTest.holds) {
        continue;
      }

      // Try different initial configurations (forced stars/empties)
      // This is a simplified approach - full implementation would be more systematic
      const configurations = generateTestConfigurations(baseState, window, width, height);

      for (const config of configurations) {
        const testState = applyFixedClues(
          baseState,
          config.forcedStars,
          config.forcedEmpties
        );

        // Verify pattern using exact solver
        const verification = await verifyPattern(
          testState,
          window,
          [] // Expected deductions - we'll discover them
        );

        if (verification.verified && verification.actualDeductions.length > 0) {
          // Normalize pattern (translate to origin)
          const normalizedData = normalizePattern(window, {
            ...preconditionTest.data,
            forcedStars: config.forcedStars,
            forcedEmpties: config.forcedEmpties,
          });

          // Create pattern
          const pattern: Pattern = {
            id: generatePatternId(familyId, patternIdCounter++),
            familyId,
            windowWidth: width,
            windowHeight: height,
            data: normalizedData,
            deductions: verification.actualDeductions,
          };

          // Canonicalize (handle rotations/mirrors)
          const canonical = canonicalizePattern(pattern);
          allPatterns.push(canonical);
          patternsFound++;
        }
      }
    }

    console.log(`\r    ${width}×${height}: Found ${patternsFound} patterns`);
  }

  // Deduplicate patterns
  const uniquePatterns = deduplicatePatterns(allPatterns);
  console.log(`  Total patterns for ${familyId}: ${uniquePatterns.length} (${allPatterns.length} before deduplication)`);
  
  return {
    familyId,
    patterns: uniquePatterns,
  };
}

/**
 * Generate test configurations for pattern mining
 * Tries different combinations of forced stars/empties
 */
function generateTestConfigurations(
  state: BoardState,
  window: WindowSpec,
  width: number,
  height: number
): Array<{ forcedStars: number[]; forcedEmpties: number[] }> {
  const configs: Array<{ forcedStars: number[]; forcedEmpties: number[] }> = [];
  const totalCells = width * height;

  // Try a few simple configurations
  // Full implementation would be more systematic
  
  // Configuration 1: No forced cells (empty board)
  configs.push({ forcedStars: [], forcedEmpties: [] });

  // Configuration 2: One forced star in corner
  if (totalCells > 0) {
    configs.push({ forcedStars: [0], forcedEmpties: [] });
  }

  // Configuration 3: Two forced stars (non-adjacent)
  if (totalCells > 2) {
    const cell1 = 0;
    const cell2 = Math.min(2, totalCells - 1); // Non-adjacent
    configs.push({ forcedStars: [cell1, cell2], forcedEmpties: [] });
  }

  // Configuration 4: One star, some forced empties around it
  if (totalCells > 4) {
    const starCell = Math.floor(totalCells / 2);
    const emptyCells: number[] = [];
    // Add some adjacent cells as empty
    const row = Math.floor(starCell / width);
    const col = starCell % width;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < height && c >= 0 && c < width) {
          const neighborId = r * width + c;
          if (neighborId < totalCells) {
            emptyCells.push(neighborId);
          }
        }
      }
    }
    configs.push({ forcedStars: [starCell], forcedEmpties: emptyCells });
  }

  return configs;
}

/**
 * Generate all patterns
 */
export async function generateAllPatterns(
  boardSize: number,
  starsPerUnit: number,
  families: string[]
): Promise<FamilyPatternSet[]> {
  const windowSizes = [
    { width: 4, height: 4 },
    { width: 5, height: 5 },
    { width: 6, height: 6 },
  ];

  const results: FamilyPatternSet[] = [];

  for (const familyId of families) {
    console.log(`\nMining patterns for family ${familyId}...`);
    const startTime = Date.now();
    
    const patterns = await generatePatternsForFamily(
      familyId,
      boardSize,
      starsPerUnit,
      windowSizes
    );
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Completed ${familyId} in ${elapsed}s: ${patterns.patterns.length} patterns`);
    
    results.push(patterns);
  }

  return results;
}
