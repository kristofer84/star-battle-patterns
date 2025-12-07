/**
 * Schema precondition testers
 * Test if schema preconditions hold in a window
 */
import type { BoardState } from '../solver/exactSolver.js';
import type { WindowSpec } from '../model/types.js';
/**
 * Test if A1 (row-band region budget) preconditions hold
 * A1 requires:
 * - A row band (2+ rows)
 * - Multiple regions intersecting the band
 * - At least one region fully inside
 * - At least one partial region
 * - Other partial regions have known quotas (for mining, we'll set them up)
 */
export declare function testA1Preconditions(state: BoardState, window: WindowSpec): {
    holds: boolean;
    data?: any;
};
/**
 * Test if A2 (col-band region budget) preconditions hold
 */
export declare function testA2Preconditions(state: BoardState, window: WindowSpec): {
    holds: boolean;
    data?: any;
};
/**
 * Test if C2 (cages vs region quota) preconditions hold
 * C2 requires:
 * - C1 condition: valid blocks === remaining stars in band
 * - Region intersecting band
 * - Region fully covering some blocks
 */
export declare function testC2Preconditions(state: BoardState, window: WindowSpec): {
    holds: boolean;
    data?: any;
};
/**
 * Test if C1 (band exact cages) preconditions hold
 * C1 requires: valid blocks === remaining stars in band
 */
export declare function testC1Preconditions(state: BoardState, window: WindowSpec): {
    holds: boolean;
    data?: any;
};
/**
 * Test if E1 (candidate deficit) preconditions hold
 * E1 requires: a group with exactly as many candidates as remaining stars
 */
export declare function testE1Preconditions(state: BoardState, window: WindowSpec): {
    holds: boolean;
    data?: any;
};
/**
 * Test if D1 (row × column intersection) preconditions hold
 * D1 requires: a row and column that intersect, with quota constraints
 */
export declare function testD1Preconditions(state: BoardState, window: WindowSpec): {
    holds: boolean;
    data?: any;
};
/**
 * Test schema preconditions for a family
 */
export declare function testSchemaPreconditions(familyId: string, state: BoardState, window: WindowSpec): {
    holds: boolean;
    data?: any;
};
//# sourceMappingURL=schemaTesters.d.ts.map