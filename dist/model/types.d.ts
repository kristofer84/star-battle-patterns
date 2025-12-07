/**
 * Pattern miner data model types
 */
/**
 * Window specification
 */
export interface WindowSpec {
    width: number;
    height: number;
    originRow: number;
    originCol: number;
}
/**
 * Pattern structure (matches solver's Pattern interface)
 */
export interface Pattern {
    id: string;
    familyId: string;
    windowWidth: number;
    windowHeight: number;
    data: Record<string, any>;
    deductions: {
        type: 'forceStar' | 'forceEmpty';
        relativeCellIds: number[];
    }[];
}
/**
 * Pattern file structure (JSON output format)
 */
export interface PatternFile {
    board_size: number;
    stars_per_row: number;
    stars_per_column: number;
    family_id: string;
    patterns: Array<{
        id: string;
        window_width: number;
        window_height: number;
        data: Record<string, any>;
        deductions: Array<{
            type: 'forceStar' | 'forceEmpty';
            relative_cell_ids: number[];
        }>;
    }>;
}
/**
 * Family pattern set
 */
export interface FamilyPatternSet {
    familyId: string;
    patterns: Pattern[];
}
//# sourceMappingURL=types.d.ts.map