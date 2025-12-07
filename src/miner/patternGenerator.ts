/**
 * Pattern generator - main mining loop
 */

import type { Pattern, WindowSpec, FamilyPatternSet } from '../model/types.js';
import type { BoardState } from '../solver/exactSolver.js';
import { CellState, enumerateAllCompletions } from '../solver/exactSolver.js';
import { enumerateWindows } from './windowEnumerator.js';
import { verifyPattern } from './patternVerifier.js';
import { buildWindowBoard, applyFixedClues } from './boardBuilder.js';
import { testSchemaPreconditions } from './schemaTesters.js';
import { normalizePattern, canonicalizePattern } from './windowEnumerator.js';
import { deduplicatePatterns } from './deduplicator.js';

/**
 * Generate a unique pattern ID
 */
function generatePatternId(familyId: string, index: number): string {
  return `${familyId}_pattern_${index.toString().padStart(4, '0')}`;
}

/**
 * Generate region structures for mining
 * Creates more realistic region layouts that match schema requirements
 */
function generateRegionStructures(
  width: number,
  height: number,
  familyId: string
): Array<Map<number, number[]>> {
  const structures: Array<Map<number, number[]>> = [];
  
  if (familyId.includes('E1') || familyId.includes('candidateDeficit')) {
    // For E1: Simple structures work fine
    const structure = new Map<number, number[]>();
    for (let r = 0; r < height; r++) {
      const cells: number[] = [];
      for (let c = 0; c < width; c++) {
        cells.push(r * width + c);
      }
      structure.set(r + 1, cells);
    }
    structures.push(structure);
  } else if (familyId.includes('C1') || familyId.includes('exactCages')) {
    // For C1: Try simpler structures first (row-based) which are more likely solvable
    // Structure 1: Simple row-based (most solvable)
    const structure1 = new Map<number, number[]>();
    for (let r = 0; r < height; r++) {
      const cells: number[] = [];
      for (let c = 0; c < width; c++) {
        cells.push(r * width + c);
      }
      structure1.set(r + 1, cells);
    }
    structures.push(structure1);
    
    // Structure 2: 2x2 block-aligned (if window is large enough and even-sized)
    if (width >= 4 && height >= 4 && width % 2 === 0 && height % 2 === 0) {
      const structure2 = new Map<number, number[]>();
      let regionId = 1;
      for (let r = 0; r < height; r += 2) {
        for (let c = 0; c < width; c += 2) {
          const cells: number[] = [];
          for (let dr = 0; dr < 2; dr++) {
            for (let dc = 0; dc < 2; dc++) {
              cells.push((r + dr) * width + (c + dc));
            }
          }
          structure2.set(regionId++, cells);
        }
      }
      structures.push(structure2);
    }
  } else if (familyId.includes('D1') || familyId.includes('rowColIntersection')) {
    // For D1: Simple row/column structure
    const structure = new Map<number, number[]>();
    for (let r = 0; r < height; r++) {
      const cells: number[] = [];
      for (let c = 0; c < width; c++) {
        cells.push(r * width + c);
      }
      structure.set(r + 1, cells);
    }
    structures.push(structure);
  } else if (familyId.includes('rowBand') || familyId.includes('A1')) {
    // For A1: Create regions that span multiple rows
    // Structure 1: Each row is a region (simple)
    const structure1 = new Map<number, number[]>();
    for (let r = 0; r < height; r++) {
      const cells: number[] = [];
      for (let c = 0; c < width; c++) {
        cells.push(r * width + c);
      }
      structure1.set(r + 1, cells);
    }
    structures.push(structure1);
    
    // Structure 2: Some regions span 2 rows, some are single rows
    const structure2 = new Map<number, number[]>();
    let regionId = 1;
    for (let r = 0; r < height; r += 2) {
      if (r + 1 < height) {
        // Two-row region
        const cells: number[] = [];
        for (let c = 0; c < width; c++) {
          cells.push(r * width + c);
          cells.push((r + 1) * width + c);
        }
        structure2.set(regionId++, cells);
      } else {
        // Single-row region
        const cells: number[] = [];
        for (let c = 0; c < width; c++) {
          cells.push(r * width + c);
        }
        structure2.set(regionId++, cells);
      }
    }
    structures.push(structure2);
    
    // Structure 3: Mixed - some full inside, some partial
    const structure3 = new Map<number, number[]>();
    // First region: fully inside (rows 0-1)
    const region1: number[] = [];
    for (let r = 0; r < 2 && r < height; r++) {
      for (let c = 0; c < width; c++) {
        region1.push(r * width + c);
      }
    }
    structure3.set(1, region1);
    
    // Second region: partial (extends beyond window)
    const region2: number[] = [];
    for (let r = 1; r < height; r++) {
      for (let c = 0; c < width; c++) {
        region2.push(r * width + c);
      }
    }
    structure3.set(2, region2);
    
    // Third region: partial (starts in middle)
    if (height >= 3) {
      const region3: number[] = [];
      for (let r = 2; r < height; r++) {
        for (let c = 0; c < width; c++) {
          region3.push(r * width + c);
        }
      }
      structure3.set(3, region3);
    }
    structures.push(structure3);
  } else {
    // Default: simple row-based regions
    const structure = new Map<number, number[]>();
    for (let r = 0; r < height; r++) {
      const cells: number[] = [];
      for (let c = 0; c < width; c++) {
        cells.push(r * width + c);
      }
      structure.set(r + 1, cells);
    }
    structures.push(structure);
  }
  
  return structures;
}

/**
 * Generate test configurations for pattern mining
 * Creates systematic configurations that match schema requirements
 */
function generateTestConfigurations(
  state: BoardState,
  window: WindowSpec,
  width: number,
  height: number,
  familyId: string,
  preconditionData?: any
): Array<{ forcedStars: number[]; forcedEmpties: number[] }> {
  const configs: Array<{ forcedStars: number[]; forcedEmpties: number[] }> = [];
  const totalCells = width * height;
  
  if (familyId.includes('E1') || familyId.includes('candidateDeficit')) {
    // For E1: Create configurations that lead to candidate deficit
    // Config 1: Empty board (might not trigger E1)
    configs.push({ forcedStars: [], forcedEmpties: [] });
    
    // Config 2: Place stars to reduce candidates in a group
    // Find a group and place stars to create deficit scenario
    for (const row of state.rows) {
      const candidates = row.cells.filter(c => state.cellStates[c] === CellState.Unknown);
      if (candidates.length > row.starsRequired) {
        // Place stars to reduce candidates to exactly starsRequired
        const starsToPlace = candidates.length - row.starsRequired;
        if (starsToPlace > 0 && starsToPlace < candidates.length) {
          const forcedStars = candidates.slice(0, starsToPlace);
          const forcedEmpties: number[] = [];
          // Mark adjacent cells as empty
          for (const starCell of forcedStars) {
            const rowIdx = Math.floor(starCell / width);
            const colIdx = starCell % width;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = rowIdx + dr;
                const c = colIdx + dc;
                if (r >= 0 && r < height && c >= 0 && c < width) {
                  const neighborId = r * width + c;
                  if (neighborId < totalCells && !forcedStars.includes(neighborId)) {
                    forcedEmpties.push(neighborId);
                  }
                }
              }
            }
          }
          configs.push({ forcedStars, forcedEmpties: [...new Set(forcedEmpties)] });
          break; // Just one example
        }
      }
    }
  } else if (familyId.includes('C1') || familyId.includes('exactCages')) {
    // For C1: Create configurations where valid blocks = remaining stars
    configs.push({ forcedStars: [], forcedEmpties: [] });
    
    // Place some stars to create the exact match condition
    if (preconditionData?.valid_blocks && preconditionData.valid_blocks > 0) {
      // Try placing stars to match the block count
      const starsToPlace = preconditionData.remaining_stars || 0;
      if (starsToPlace > 0 && starsToPlace < totalCells) {
        const forcedStars: number[] = [];
        const forcedEmpties: number[] = [];
        
        // Place stars in a pattern that creates the exact match
        let placed = 0;
        for (let r = 0; r < height - 1 && placed < starsToPlace; r += 2) {
          for (let c = 0; c < width - 1 && placed < starsToPlace; c += 2) {
            const cellId = r * width + c;
            if (cellId < totalCells) {
              forcedStars.push(cellId);
              placed++;
              // Mark adjacent as empty
              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  if (dr === 0 && dc === 0) continue;
                  const nr = r + dr;
                  const nc = c + dc;
                  if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
                    const neighborId = nr * width + nc;
                    if (neighborId < totalCells && !forcedStars.includes(neighborId)) {
                      forcedEmpties.push(neighborId);
                    }
                  }
                }
              }
            }
          }
        }
        
        if (forcedStars.length > 0) {
          configs.push({ forcedStars, forcedEmpties: [...new Set(forcedEmpties)] });
        }
      }
    }
  } else if (familyId.includes('D1') || familyId.includes('rowColIntersection')) {
    // For D1: Create row/column intersection scenarios
    configs.push({ forcedStars: [], forcedEmpties: [] });
    
    if (preconditionData?.row !== undefined && preconditionData?.col !== undefined) {
      // Place stars in row/column to create intersection constraint
      const row = preconditionData.row;
      const col = preconditionData.col;
      
      // Place a star in the intersection
      const intersectionCell = row * width + col;
      if (intersectionCell < totalCells) {
        const forcedEmpties: number[] = [];
        // Mark adjacent as empty
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < height && c >= 0 && c < width) {
              const neighborId = r * width + c;
              if (neighborId < totalCells) {
                forcedEmpties.push(neighborId);
              }
            }
          }
        }
        configs.push({ forcedStars: [intersectionCell], forcedEmpties });
      }
    }
  } else if (familyId.includes('A1') || familyId.includes('rowBand')) {
    // For A1: Create configurations that set up the A1 scenario
    // Need: some regions with stars, some partial regions with known quotas
    
    // Config 1: Empty board
    configs.push({ forcedStars: [], forcedEmpties: [] });
    
    // Config 2: Place stars in fully-inside regions to create budget pressure
    if (preconditionData?.full_inside_regions && preconditionData.full_inside_regions.length > 0) {
      const fullRegionId = preconditionData.full_inside_regions[0];
      const fullRegion = state.regions.find(r => r.id === fullRegionId);
      if (fullRegion && fullRegion.cells.length > 0) {
        // Place one star in the full region
        const starCell = fullRegion.cells[0];
        if (starCell < totalCells) {
          const emptyCells: number[] = [];
          // Mark adjacent cells as empty
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
      }
    }
    
    // Config 3: Multiple stars in full regions
    if (preconditionData?.full_inside_regions && preconditionData.full_inside_regions.length >= 2) {
      const forcedStars: number[] = [];
      const forcedEmpties: number[] = [];
      
      for (let i = 0; i < Math.min(2, preconditionData.full_inside_regions.length); i++) {
        const regionId = preconditionData.full_inside_regions[i];
        const region = state.regions.find(r => r.id === regionId);
        if (region && region.cells.length > 0) {
          const starCell = region.cells[0];
          if (starCell < totalCells) {
            forcedStars.push(starCell);
            // Mark adjacent as empty
            const row = Math.floor(starCell / width);
            const col = starCell % width;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < height && c >= 0 && c < width) {
                  const neighborId = r * width + c;
                  if (neighborId < totalCells && !forcedStars.includes(neighborId)) {
                    forcedEmpties.push(neighborId);
                  }
                }
              }
            }
          }
        }
      }
      
      if (forcedStars.length > 0) {
        configs.push({ forcedStars, forcedEmpties: [...new Set(forcedEmpties)] });
      }
    }
  } else {
    // Generic configurations
    configs.push({ forcedStars: [], forcedEmpties: [] });
    
    if (totalCells > 0) {
      configs.push({ forcedStars: [0], forcedEmpties: [] });
    }
    
    if (totalCells > 4) {
      const starCell = Math.floor(totalCells / 2);
      const emptyCells: number[] = [];
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
  }
  
  return configs;
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

      // Try different region structures
      const regionStructures = generateRegionStructures(width, height, familyId);
      
      for (const regionMap of regionStructures) {
        const baseState = buildWindowBoard(window, boardSize, starsPerUnit, regionMap);

        // Test schema preconditions
        // For E1, we create the condition ourselves, so preconditions may not hold initially
        // For other families, preconditions must hold
        const preconditionTest = testSchemaPreconditions(familyId, baseState, window);
        
        if (!familyId.includes('E1') && !familyId.includes('candidateDeficit')) {
          // For non-E1 families, preconditions must hold
          if (!preconditionTest.holds) {
            continue;
          }
        }
        // For E1, we proceed even if preconditions don't hold (we'll create the condition)
        
        // For E1, use a constraint-aware approach
        // The key insight: E1 patterns occur when a group has exactly N candidates and needs N stars
        // We need to create this condition while maintaining board solvability
        if (familyId.includes('E1') || familyId.includes('candidateDeficit')) {
          // Store starsPerUnit for use in E1 pattern generation  
          const currentStarsPerUnit = starsPerUnit;
          // Strategy: For each group, try to create E1 condition by placing empties
          // But only if doing so maintains solvability
          
          // First verify the base board is solvable (quick check)
          // Use longer timeout for larger windows - 10x10 with 2 stars needs more time
          const baseTimeout = (width >= 10 || height >= 10) ? 10000 : 3000;
          const baseSolvability = enumerateAllCompletions(baseState, 1, baseTimeout);
          if (baseSolvability.totalCompletions === 0) {
            continue; // Base board is unsolvable, skip this window/region structure
          }
          
          // For 10x10 windows, we know they're solvable, so proceed with pattern generation
          
          // Try creating E1 patterns for rows
          for (const row of baseState.rows) {
            if (patternsFound >= 10) break;
            
            const candidates = row.cells.filter(c => baseState.cellStates[c] === CellState.Unknown);
            if (candidates.length <= row.starsRequired) continue;
            
            const emptiesToPlace = candidates.length - row.starsRequired;
            
            // For starsPerUnit >= 2, we need to try more combinations
            // because placing empties is more likely to break solvability
            // For 10x10 windows, try even more combinations
            const maxAttempts = currentStarsPerUnit >= 2 
              ? (width >= 10 || height >= 10) 
                ? Math.min(50, Math.floor(candidates.length / 2)) // More attempts for large windows
                : Math.min(30, Math.floor(candidates.length / 2))
              : Math.min(5, candidates.length - emptiesToPlace + 1);
            
            // Try placing empties in different combinations
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
              // Try different strategies for selecting empties
              const forcedEmpties: number[] = [];
              
              if (currentStarsPerUnit >= 2) {
                // For higher star counts, try spacing empties out
                // Strategy: place empties with gaps to maintain flexibility
                const step = Math.max(1, Math.floor(candidates.length / emptiesToPlace));
                for (let i = 0; i < emptiesToPlace; i++) {
                  const idx = (attempt + i * step) % candidates.length;
                  if (!forcedEmpties.includes(candidates[idx])) {
                    forcedEmpties.push(candidates[idx]);
                  }
                  if (forcedEmpties.length >= emptiesToPlace) break;
                }
                // If we didn't get enough, fill with remaining candidates
                while (forcedEmpties.length < emptiesToPlace && forcedEmpties.length < candidates.length) {
                  for (const c of candidates) {
                    if (!forcedEmpties.includes(c)) {
                      forcedEmpties.push(c);
                      break;
                    }
                  }
                }
              } else {
                // For starsPerUnit = 1, use simple sequential approach
                for (let i = 0; i < emptiesToPlace; i++) {
                  const idx = (attempt + i) % candidates.length;
                  forcedEmpties.push(candidates[idx]);
                }
              }
              
              if (forcedEmpties.length !== emptiesToPlace) continue;
              
              const testState = applyFixedClues(baseState, [], forcedEmpties);
              
              // Critical: check solvability BEFORE checking E1 condition
              // Use longer timeout for larger windows
              const solvabilityTimeout = (width >= 10 || height >= 10) ? 5000 : 3000;
              const solvabilityCheck = enumerateAllCompletions(testState, 1, solvabilityTimeout);
              if (solvabilityCheck.totalCompletions === 0) {
                continue; // Skip unsolvable configurations
              }
              
              // Now check if E1 condition holds
              // Use the actual familyId, not hardcoded string
              const e1Check = testSchemaPreconditions(familyId, testState, window);
              if (!e1Check.holds) {
                continue;
              }
              
              // Verify pattern produces forced deductions
              const verification = await verifyPattern(testState, window, []);
              if (verification.verified && verification.actualDeductions.length > 0) {
                const pattern: Pattern = {
                  id: generatePatternId(familyId, patternIdCounter++),
                  familyId,
                  windowWidth: width,
                  windowHeight: height,
                  data: {
                    group_type: 'row',
                    group_id: row.rowIndex,
                    forced_empties: forcedEmpties,
                  },
                  deductions: verification.actualDeductions,
                };
                const canonical = canonicalizePattern(pattern);
                allPatterns.push(canonical);
                patternsFound++;
                break; // Found one pattern for this row
              }
            }
          }
          
          // Also try columns (similar logic)
          for (const col of baseState.cols) {
            if (patternsFound >= 10) break;
            
            const candidates = col.cells.filter(c => baseState.cellStates[c] === CellState.Unknown);
            if (candidates.length <= col.starsRequired) continue;
            
            const emptiesToPlace = candidates.length - col.starsRequired;
            const maxAttempts = currentStarsPerUnit >= 2 
              ? Math.min(25, Math.floor(candidates.length / 2))
              : Math.min(3, candidates.length - emptiesToPlace + 1);
            
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
              const forcedEmpties: number[] = [];
              
              if (currentStarsPerUnit >= 2) {
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
              } else {
                for (let i = 0; i < emptiesToPlace; i++) {
                  const idx = (attempt + i) % candidates.length;
                  forcedEmpties.push(candidates[idx]);
                }
              }
              
              if (forcedEmpties.length !== emptiesToPlace) continue;
              
              const testState = applyFixedClues(baseState, [], forcedEmpties);
              const solvabilityCheck = enumerateAllCompletions(testState, 1, 3000);
              if (solvabilityCheck.totalCompletions === 0) continue;
              
              const e1Check = testSchemaPreconditions(familyId, testState, window);
              if (!e1Check.holds) continue;
              
              const verification = await verifyPattern(testState, window, []);
              if (verification.verified && verification.actualDeductions.length > 0) {
                const pattern: Pattern = {
                  id: generatePatternId(familyId, patternIdCounter++),
                  familyId,
                  windowWidth: width,
                  windowHeight: height,
                  data: {
                    group_type: 'column',
                    group_id: col.colIndex,
                    forced_empties: forcedEmpties,
                  },
                  deductions: verification.actualDeductions,
                };
                const canonical = canonicalizePattern(pattern);
                allPatterns.push(canonical);
                patternsFound++;
                break;
              }
            }
          }
          
          continue; // Skip normal config generation for E1
        }

        // Generate configurations based on preconditions
        const configurations = generateTestConfigurations(
          baseState,
          window,
          width,
          height,
          familyId,
          preconditionTest.data
        );

        for (const config of configurations) {
          // Check solvability first
          const testState = applyFixedClues(
            baseState,
            config.forcedStars,
            config.forcedEmpties
          );
          
          // Quick solvability check
          const solvabilityCheck = enumerateAllCompletions(testState, 1, 2000);
          if (solvabilityCheck.totalCompletions === 0) {
            continue; // Skip unsolvable configurations
          }

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
            
            if (patternsFound >= 10) {
              break; // Limit patterns per window
            }
          }
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
 * Generate all patterns
 */
export async function generateAllPatterns(
  boardSize: number,
  starsPerUnit: number,
  families: string[]
): Promise<FamilyPatternSet[]> {
  // Use appropriate window sizes based on starsPerUnit
  // With 1 star per unit: smaller windows work fine
  // With 2 stars per unit: need larger windows (8x8+) to ensure solvability
  // Testing shows: 6x6 and 7x7 are unsolvable with 2 stars/unit, but 8x8+ are solvable
  const windowSizes = starsPerUnit >= 2 
    ? [
        { width: 8, height: 8 },
        { width: 9, height: 9 },
        { width: 10, height: 10 },
      ]
    : [
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
