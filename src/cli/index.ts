/**
 * CLI entry point for pattern miner
 */

import { generateAllPatterns } from '../miner/patternGenerator.js';
import { generateAllPatternLibraryFiles } from '../miner/patternLibrary.js';
import { join } from 'path';

async function main() {
  console.log('Star Battle Pattern Miner');
  console.log('========================');
  console.log('');

  // Parse command line arguments (simplified)
  const args = process.argv.slice(2);
  let boardSize = 10;
  let starsPerUnit = 2;
  let families: string[] = [
    'A1_rowBandRegionBudget',
    'A2_colBandRegionBudget',
    'A3_regionRowBandPartition',
    'A4_regionColBandPartition',
    'B1_exclusiveRegionsRowBand',
    'B2_exclusiveRegionsColBand',
    'B3_exclusiveRowsInRegion',
    'B4_exclusiveColsInRegion',
    'C1_bandExactCages',
    'C2_cagesRegionQuota',
    'C3_internalCagePlacement',
    'C4_cageExclusion',
    'D1_rowColIntersection',
    'D2_regionBandIntersection',
    'E1_candidateDeficit',
    'E2_partitionedCandidates',
    'F1_regionPairExclusion',
    'F2_exclusivityChains'
  ];
  let outputDir = join(process.cwd(), 'output');

  // Parse arguments (support both --flag value and positional)
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--board-size' && args[i + 1]) {
      boardSize = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--stars' && args[i + 1]) {
      starsPerUnit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--family' && args[i + 1]) {
      families = [args[i + 1]];
      i++;
    } else if (args[i] === '--families' && args[i + 1]) {
      families = args[i + 1].split(',');
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--max-patterns' && args[i + 1]) {
      // Ignore for now, but parse it
      i++;
    }
    // Also support positional args for backward compatibility
    else if (i === 0 && !isNaN(parseInt(args[i], 10))) {
      boardSize = parseInt(args[i], 10);
    } else if (i === 1 && !isNaN(parseInt(args[i], 10))) {
      starsPerUnit = parseInt(args[i], 10);
    } else if (i === 2 && args[i]) {
      families = [args[i]];
    }
  }

  console.log(`Board size: ${boardSize}x${boardSize}`);
  console.log(`Stars per unit: ${starsPerUnit}`);
  console.log(`Families: ${families.join(', ')}`);
  console.log(`Output directory: ${outputDir}`);
  console.log('');

  try {
    // Generate patterns
    const patternSets = await generateAllPatterns(boardSize, starsPerUnit, families);

    // Generate library files
    generateAllPatternLibraryFiles(
      patternSets,
      boardSize,
      starsPerUnit,
      starsPerUnit,
      outputDir
    );

    console.log('');
    console.log('Pattern mining complete!');
    console.log(`Generated files in: ${outputDir}`);
    console.log('');
    console.log('Next steps:');
    console.log(`1. Copy pattern files to star-battle-solver/src/specs/patterns/`);
    console.log('2. Update star-battle-solver/src/specs/patterns/index.ts to import them');
    console.log('');
  } catch (error) {
    console.error('Error during pattern mining:', error);
    process.exit(1);
  }
}

main();

