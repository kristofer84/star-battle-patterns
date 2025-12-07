# Pattern Mining Issues and Solutions

## Issue: Empty Pattern Files with `--stars 2`

### Root Cause
With `starsPerUnit = 2`, the generated windows (especially 5x5 and 6x6) are **unsolvable** due to 8-directional adjacency constraints. 

For example:
- A 5x5 window with 2 stars per unit needs **10 stars total** (5 rows × 2 stars)
- A 6x6 window with 2 stars per unit needs **12 stars total** (6 rows × 2 stars)
- With 8-directional adjacency (including diagonals), it's often impossible to place this many stars without violating adjacency rules

### Current Status
✅ **Works with `starsPerUnit = 1`**: Successfully finds patterns  
❌ **Fails with `starsPerUnit = 2`**: Windows are unsolvable, so no patterns found

### Solutions

#### Option 1: Use Larger Windows (Recommended)
For `starsPerUnit = 2`, use larger windows (7x7, 8x8, or 9x9):
```bash
# This is already implemented - the miner uses larger windows for starsPerUnit >= 2
npm run mine-patterns -- --board-size 10 --stars 2 --family E1
```

However, even 7x7 and 8x8 windows may be unsolvable. You may need to:
- Use even larger windows (9x9, 10x10)
- Or accept that some star counts require very large windows

#### Option 2: Use Different Region Structures
The current miner uses simple row-based regions. More complex region structures might make boards more solvable, but this requires significant changes to the mining logic.

#### Option 3: Pre-filter Unsolvable Windows
Add a quick solvability check before attempting to mine patterns in a window. This is partially implemented but may need optimization.

### Testing
To verify the miner works:
```bash
# This should find patterns
npm run mine-patterns -- --board-size 10 --stars 1 --family E1

# This may find 0 patterns if windows are unsolvable
npm run mine-patterns -- --board-size 10 --stars 2 --family E1
```

### Next Steps
1. Test with even larger windows (9x9, 10x10) for `starsPerUnit = 2`
2. Consider using constraint-based region structures
3. Add better logging to show why windows are being skipped

