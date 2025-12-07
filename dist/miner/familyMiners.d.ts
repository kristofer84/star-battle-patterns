/**
 * Family-specific pattern miners
 * Each schema family may need specialized mining logic
 */
import type { BoardState } from '../solver/exactSolver.js';
import type { WindowSpec } from '../model/types.js';
/**
 * Mine patterns for A1 family (row-band region budget)
 */
export declare function mineA1Patterns(state: BoardState, window: WindowSpec): Promise<Array<{
    data: any;
    deductions: any[];
}>>;
/**
 * Mine patterns for C2 family (cages vs region quota)
 */
export declare function mineC2Patterns(state: BoardState, window: WindowSpec): Promise<Array<{
    data: any;
    deductions: any[];
}>>;
/**
 * Get family-specific miner
 */
export declare function getFamilyMiner(familyId: string): ((state: BoardState, window: WindowSpec) => Promise<Array<{
    data: any;
    deductions: any[];
}>>) | null;
//# sourceMappingURL=familyMiners.d.ts.map