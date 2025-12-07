/**
 * Window enumeration for pattern mining
 */
import type { WindowSpec } from '../model/types.js';
/**
 * Enumerate all windows of given size
 */
export declare function enumerateWindows(boardSize: number, windowWidth: number, windowHeight: number): WindowSpec[];
/**
 * Normalize pattern by translating origin to (0,0)
 */
export declare function normalizePattern(window: WindowSpec, patternData: any): any;
/**
 * Canonicalize pattern (handle rotations/mirrors if applicable)
 */
export declare function canonicalizePattern(pattern: any): any;
//# sourceMappingURL=windowEnumerator.d.ts.map