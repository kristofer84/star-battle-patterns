/**
 * Pattern verifier - verifies patterns using exact solver
 */
import type { Pattern, WindowSpec } from '../model/types.js';
import type { BoardState } from '../solver/exactSolver.js';
/**
 * Verify a pattern using exact solver
 * Returns verified deductions if pattern is valid
 */
export declare function verifyPattern(state: BoardState, window: WindowSpec, expectedDeductions: Array<{
    type: 'forceStar' | 'forceEmpty';
    relativeCellIds: number[];
}>): Promise<{
    verified: boolean;
    actualDeductions: Array<{
        type: 'forceStar' | 'forceEmpty';
        relativeCellIds: number[];
    }>;
}>;
/**
 * Check if two patterns are equivalent (same shape, different position)
 */
export declare function arePatternsEquivalent(p1: Pattern, p2: Pattern): boolean;
//# sourceMappingURL=patternVerifier.d.ts.map