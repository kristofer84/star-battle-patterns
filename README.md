# Star Battle Pattern Miner

Offline tool for generating pattern files for the schema-based Star Battle solver.

## Status

✅ **Mining Algorithm Implemented!**

The pattern miner is now fully functional with:
- Exact solver for pattern verification
- Window enumeration and board building
- Schema precondition testing
- Pattern verification and deduplication
- CLI tool for running the miner

## Usage

```bash
# Build
npm run build

# Mine patterns
npm run mine-patterns -- --board-size 10 --stars 2 --families A1_rowBand_regionBudget,C2_cages_regionQuota

# With custom output directory
npm run mine-patterns -- --board-size 10 --stars 2 --families A1_rowBand_regionBudget --output ./my-patterns
```

## How It Works

1. **Window Enumeration**: Enumerates all possible windows of different sizes (4×4, 5×5, 6×6)

2. **Board Building**: For each window, builds an abstract board model with:
   - Region structures tailored to schema requirements
   - Row/column groups
   - Cell states (initially all unknown)

3. **Precondition Testing**: Tests if schema preconditions hold in the window:
   - **E1**: Checks for groups with candidate deficit
   - **A1/A2**: Verifies row/column bands with full/partial regions
   - **C1/C2**: Validates 2×2 block conditions
   - **D1**: Tests row/column intersection scenarios

4. **Configuration Testing**: Generates systematic test configurations:
   - **E1**: Creates candidate deficit scenarios
   - **A1/A2**: Sets up region budget pressure
   - **C1/C2**: Configures exact block/star matching
   - **D1**: Creates intersection constraints

5. **Pattern Verification**: Uses exact solver to enumerate all completions and find forced deductions

6. **Pattern Generation**: Creates patterns with normalized coordinates and deduplicates

7. **File Generation**: Outputs JSON pattern files ready for import into the solver

## Supported Schema Families

The miner currently implements proper mining logic for:

- ✅ **E1** – Candidate Deficit
- ✅ **A1** – Row-Band vs Regions Star-Budget Squeeze
- ✅ **A2** – Column-Band vs Regions Star-Budget Squeeze
- ✅ **C1** – Exact-Match 2×2 Cages in a Band
- ✅ **C2** – 2×2 Cages vs Region Quota
- ✅ **D1** – Row × Column Intersection

Other families use basic mining logic and can be enhanced as needed.

## Output

Generated pattern files will be in the `output/` directory (or custom directory):

```
output/
├── 10x10-A1_rowBand_regionBudget-patterns.json
├── 10x10-C2_cages_regionQuota-patterns.json
└── ...
```

## Integration

1. Copy generated pattern files to:
   ```
   star-battle-solver/src/specs/patterns/
   ```

2. Update `star-battle-solver/src/specs/patterns/index.ts` to import them:
   ```typescript
   import patternsA1 from './10x10-A1_rowBand_regionBudget-patterns.json';
   
   export const patternFiles: Array<{ id: string; data: any }> = [
     { id: 'A1_rowBand_regionBudget', data: patternsA1 },
     // ... more patterns
   ];
   ```

3. The solver will automatically load and use the patterns!

## Architecture

```
src/
├── solver/
│   └── exactSolver.ts        # Backtracking exact solver
├── miner/
│   ├── windowEnumerator.ts   # Window enumeration
│   ├── boardBuilder.ts        # Abstract board building
│   ├── schemaTesters.ts       # Precondition testing
│   ├── patternVerifier.ts     # Pattern verification
│   ├── patternGenerator.ts    # Main mining loop
│   ├── patternLibrary.ts      # File generation
│   ├── deduplicator.ts        # Pattern deduplication
│   └── familyMiners.ts        # Family-specific miners
├── model/
│   └── types.ts               # Type definitions
└── cli/
    └── index.ts                # CLI entry point
```

## Pattern File Format

```json
{
  "board_size": 10,
  "stars_per_row": 2,
  "stars_per_column": 2,
  "family_id": "A1_rowBand_regionBudget",
  "patterns": [
    {
      "id": "A1_rowBand_regionBudget_pattern_0001",
      "window_width": 5,
      "window_height": 5,
      "data": {
        "row_band": [0, 1, 2],
        "regions": [1, 2, 3]
      },
      "deductions": [
        {
          "type": "forceStar",
          "relative_cell_ids": [12, 13]
        }
      ]
    }
  ]
}
```

## Performance

- Window enumeration: O(board_size² × window_sizes)
- Pattern verification: O(completions × window_size²)
- Timeout: 5 seconds per pattern verification
- Max completions: 1000 per verification

For a 10×10 board with 3 window sizes, expect:
- ~1000-5000 windows to test
- Several seconds to minutes per family
- Output: 0-100+ patterns per family (depends on schema complexity)

## Future Enhancements

- More sophisticated precondition testing
- Family-specific mining optimizations
- Pattern rotation/mirror canonicalization
- Parallel mining for multiple families
- Progress persistence (resume interrupted mining)
