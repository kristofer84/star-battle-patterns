# Pattern Miner Test Suite

## Overview

Comprehensive test suite for the Star Battle pattern miner, covering:
- Exact solver functionality
- Pattern verification
- Constraint satisfaction (row/col/region quotas, adjacency)
- E1 pattern detection
- Board state construction

## Test Results

All 7 tests pass ✅

## Test Cases

### Test 1: Simple 4x4 board
- Verifies basic solver functionality with a 4x4 board
- Tests constraint consistency (rows, cols, regions)
- Ensures solver can find valid completions

### Test 2: E1 pattern (candidate deficit)
- Tests E1 schema: row with exactly 1 candidate and needs 1 star
- Verifies solver correctly forces the candidate cell to be a star
- Uses 5x5 board to ensure solvability

### Test 3: Pattern verification
- Tests the pattern verifier's ability to detect forced moves
- Uses E1 pattern configuration
- Verifies that forced deductions are correctly identified

### Test 4: Minimal valid configuration
- Tests constraint consistency in board building
- Verifies that all quotas (rows, cols, regions) match
- Ensures solver can find completions for valid configurations

### Test 5: Adjacency constraint
- Tests that adjacency rules are correctly enforced
- Verifies that placing a star forces adjacent cells to be empty
- Uses 5x5 board for sufficient space

### Test 6: Row quota constraint
- Tests that row quotas are correctly satisfied
- Verifies solver can find completions with proper quotas
- Tests empty board solvability

### Test 7: Solver debug
- Comprehensive debugging output for solver state
- Shows constraint details and completion results
- Helps diagnose solver issues

## Running Tests

```bash
npm run build && npm run test
```

## Additional Test Scripts

- `npm run test:solver` - Detailed solver debugging
- `npm run test:valid` - Valid configuration tests
- `npm run test:manual` - Manual constraint checking
- `npm run test:completion` - Completion validation tests
- `npm run test:solver` - Step-by-step solver debugging

## Notes

- 2x2 and 3x3 boards are often impossible with 8-directional adjacency rules
- Tests use 4x4+ boards to ensure solvability
- All tests verify constraint consistency before running solver
- Pattern verification requires at least one forced deduction to pass

