/**
 * Pattern library file generation
 */

import type { FamilyPatternSet, PatternFile } from '../model/types';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Generate pattern library file (JSON)
 */
export function generatePatternLibraryFile(
  patternSet: FamilyPatternSet,
  boardSize: number,
  starsPerRow: number,
  starsPerColumn: number,
  outputDir: string
): void {
  const fileName = `${boardSize}x${boardSize}-${patternSet.familyId}-patterns.json`;

  const file: PatternFile = {
    board_size: boardSize,
    stars_per_row: starsPerRow,
    stars_per_column: starsPerColumn,
    family_id: patternSet.familyId,
    patterns: patternSet.patterns.map(pattern => ({
      id: pattern.id,
      window_width: pattern.windowWidth,
      window_height: pattern.windowHeight,
      data: pattern.data,
      deductions: pattern.deductions.map(ded => ({
        type: ded.type,
        relative_cell_ids: ded.relativeCellIds,
      })),
    })),
  };

  const filePath = join(outputDir, fileName);
  const json = JSON.stringify(file, null, 2);

  writeFileSync(filePath, json, 'utf-8');
  console.log(`Generated: ${filePath}`);
}

/**
 * Generate all pattern library files
 */
export function generateAllPatternLibraryFiles(
  patternSets: FamilyPatternSet[],
  boardSize: number,
  starsPerRow: number,
  starsPerColumn: number,
  outputDir: string
): void {
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  for (const patternSet of patternSets) {
    generatePatternLibraryFile(
      patternSet,
      boardSize,
      starsPerRow,
      starsPerColumn,
      outputDir
    );
  }
}

