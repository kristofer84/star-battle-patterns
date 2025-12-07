# Star Battle Pattern Miner

Offline tool for generating pattern files for the schema-based Star Battle solver.

## Purpose

This tool mines patterns from schema definitions and generates JSON pattern files that can be imported into the `star-battle-solver` application.

## Status

🚧 **Under Construction**

The pattern miner is not yet fully implemented. This is a placeholder structure.

## Planned Structure

```
star-battle-patterns/
├── src/
│   ├── miner/          # Pattern mining logic
│   ├── model/          # Shared data models
│   ├── solver/         # Exact solver for verification
│   ├── schemas/        # Schema definitions (shared with solver)
│   └── cli/            # CLI entry point
├── output/             # Generated pattern files
└── tests/
```

## Usage (Planned)

```bash
# Build
npm run build

# Mine patterns
npm run mine-patterns -- --board-size 10 --stars 2 --families A1,A2,C2

# Output will be in output/ directory
# Copy to star-battle-solver/src/specs/patterns/
```

## Pattern File Format

Pattern files will be JSON with this structure:

```json
{
  "board_size": 10,
  "stars_per_row": 2,
  "stars_per_column": 2,
  "family_id": "A1_rowBand_regionBudget",
  "patterns": [
    {
      "id": "pattern_001",
      "window_width": 5,
      "window_height": 5,
      "data": { /* schema-specific data */ },
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

## Integration

Generated pattern files should be placed in:
`star-battle-solver/src/specs/patterns/`

The solver will load them automatically via `src/specs/patterns/index.ts`.

