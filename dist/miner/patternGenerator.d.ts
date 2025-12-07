/**
 * Pattern generator - main mining loop
 */
import type { FamilyPatternSet } from '../model/types.js';
/**
 * Generate patterns for a schema family
 */
export declare function generatePatternsForFamily(familyId: string, boardSize: number, starsPerUnit: number, windowSizes: Array<{
    width: number;
    height: number;
}>): Promise<FamilyPatternSet>;
/**
 * Generate all patterns
 */
export declare function generateAllPatterns(boardSize: number, starsPerUnit: number, families: string[]): Promise<FamilyPatternSet[]>;
//# sourceMappingURL=patternGenerator.d.ts.map