/**
 * Family-specific pattern miners
 * Each schema family may need specialized mining logic
 */
/**
 * Mine patterns for A1 family (row-band region budget)
 */
export async function mineA1Patterns(state, window) {
    // A1-specific mining logic
    // This would test specific A1 preconditions and configurations
    // For now, return empty (generic miner handles it)
    return [];
}
/**
 * Mine patterns for C2 family (cages vs region quota)
 */
export async function mineC2Patterns(state, window) {
    // C2-specific mining logic
    // Would test C1 condition first, then C2
    return [];
}
/**
 * Get family-specific miner
 */
export function getFamilyMiner(familyId) {
    switch (familyId) {
        case 'A1_rowBand_regionBudget':
            return mineA1Patterns;
        case 'C2_cages_regionQuota':
            return mineC2Patterns;
        default:
            return null; // Use generic miner
    }
}
//# sourceMappingURL=familyMiners.js.map