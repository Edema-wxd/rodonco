---
phase: 03-interactive-shop
plan: 01
subsystem: testing
tags: [vitest, jsdom, zustand, cart]

requires: []
provides:
  - Vitest regression harness for cart compound-key semantics
  - Cart store API updated to key remove/update operations with `prepOption`
affects:
  - Phase 03 cart drawer/cart UI (line item add/remove/edit correctness)

tech-stack:
  added: [vitest, jsdom]
  patterns:
    - "Zustand cart persist testable via localStorage polyfill under Vitest"
    - "Compound-key identity tuple (productId + variantLabel + prepOption) used consistently across add/update/remove"

key-files:
  created:
    - vitest.config.ts
    - src/store/cart.test.ts
  modified:
    - package.json
    - src/test/setup.ts
    - src/store/cart.ts

key-decisions:
  - "Cart identity tuple is (productId, variantLabel, prepOption) so remove/update never touches a different prepOption line item"
  - "Use Vitest (jsdom) for fast unit regression coverage of Zustand cart logic"

patterns-established:
  - "AddItem merge uses compound key; updateQuantity/removeItem now use the same compound key"

requirements-completed: [CART-01, CART-02]

duration: 6min
completed: 2026-04-29
---

# Phase 03: 01 Cart Compound-Key & Regression Harness Summary

**Vitest harness + cart store fix ensure remove/update never affect the wrong prepOption line item.**

## Performance
- **Duration:** ~6 min (includes install + verify loop)
- **Started:** 2026-04-29T08:24:00Z
- **Completed:** 2026-04-29T08:31:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added a fast `vitest` unit test suite covering cart compound-key semantics across add/update/remove.
- Updated Zustand cart store to include `prepOption` in `removeItem` and `updateQuantity` identity matching.

## Task Commits
Each task was committed atomically:

1. **Task 1: Add Vitest harness and cart key regression tests** - `239c34e` (test)
2. **Task 2: Fix cart store API to include prepOption in identity** - `cd735a4` (fix)

**Plan metadata:** `03-01` (docs: complete plan)

## Files Created/Modified
- `vitest.config.ts` - Vitest config with jsdom + setupFiles
- `src/test/setup.ts` - test-time localStorage polyfill to support Zustand `persist`
- `src/store/cart.test.ts` - regression tests for compound-key add/update/remove
- `src/store/cart.ts` - updated remove/update signatures and compound-key filtering logic
- `package.json` - added `test` scripts + dev dependencies

## Decisions Made
- Standardized cart line identity to `(productId, variantLabel, prepOption)` to prevent collateral edits/removals.
- Used a Vitest + jsdom unit-test setup rather than Next-driven integration tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added test-time localStorage polyfill for Zustand persist**
- **Found during:** Task 1 (Vitest execution)
- **Issue:** Vitest jsdom storage shim did not expose the `localStorage` API shape expected by `zustand/middleware` (`setItem`/`removeItem`).
- **Fix:** Added a minimal `localStorage` polyfill in `src/test/setup.ts` (with `getItem/setItem/removeItem/clear/key/length`) before running tests.
- **Files modified:** `src/test/setup.ts`
- **Verification:** `npm test` executed and reached the intended RED assertions (prepOption-keying bug) and later GREEN after Task 2.
- **Committed in:** `239c34e`

### Verification deviation
- **Found during:** Task 1
- **Issue:** For TDD, we intentionally let `npm test` run in RED before completing the store fix in Task 2.
- **Fix:** Task 2 reran full verification (`npm test && npx tsc --noEmit && npm run build`) after the store changes.
- **Committed in:** Task 2 commit `cd735a4`

---
**Total deviations:** 1 auto-fixed + 1 verification deviation
**Impact on plan:** No functional scope creep; harness correctness depended on localStorage and full verification completed at the end of Task 2.

## Issues Encountered
- Vitest jsdom/localStorage integration required a small polyfill to make Zustand persist deterministic in unit tests.

## Next Phase Readiness
- Cart mutation correctness is now guarded by regression tests; Phase 03 cart UI can rely on consistent identity semantics once it wires `prepOption` through.

---
*Phase: 03-interactive-shop*
*Completed: 2026-04-29*

## Self-Check: PASSED
- `03-01-SUMMARY.md` exists
- Task commits `239c34e` and `cd735a4` are reachable in git history

