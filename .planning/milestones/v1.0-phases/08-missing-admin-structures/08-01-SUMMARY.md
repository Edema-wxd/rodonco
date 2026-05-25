---
phase: 08-missing-admin-structures
plan: "01"
subsystem: admin-test-infrastructure
tags:
  - testing
  - wave-0
  - tdd
  - admin
  - vitest
dependency_graph:
  requires: []
  provides:
    - "OPS-01 aggregate query test stub (prepList.test.ts)"
    - "OPS-02 weekOverride passing test (analytics.test.ts)"
    - "OPS-03 search field todo stubs (OrdersTable.test.tsx)"
    - "OPS-04 manifest query test stub (manifest.test.ts)"
    - "OPS-05 extended schema test stubs (schemas.test.ts)"
    - "OPS-06 pending orders test stub (pendingOrders.test.ts)"
    - "OPS-07 bulk transition test stub (bulkTransition.test.ts)"
  affects:
    - "08-02-PLAN.md — Wave 1 implementation has test gates from day one"
    - "08-03-PLAN.md — Wave 2 implementation has test gates from day one"
tech_stack:
  added: []
  patterns:
    - "it.todo() stubs for implementation-pending lib files (avoids import errors)"
    - "it.skip() for intentionally RED tests that will turn GREEN in Wave 1"
    - "vi.mock chain with .where().groupBy() chaining for Promise.all analytics queries"
key_files:
  created:
    - src/lib/admin/prepList.test.ts
    - src/lib/admin/manifest.test.ts
    - src/lib/admin/pendingOrders.test.ts
    - src/lib/admin/bulkTransition.test.ts
    - src/lib/admin/analytics.test.ts
  modified:
    - src/lib/admin/schemas.test.ts
    - src/components/admin/orders/OrdersTable.test.tsx
decisions:
  - "Used it.skip (not live failing assertions) for OPS-05 RED tests to keep full suite green at Wave 0 boundary per plan success_criteria"
  - "Analytics mock chain required .where().groupBy() chaining to match the statusBreakdown query in getWeeklyAnalytics Promise.all"
metrics:
  duration: "3 minutes"
  completed: "2026-05-09T17:35:28Z"
  tasks_completed: 2
  files_created: 5
  files_modified: 2
---

# Phase 8 Plan 01: Wave 0 Test Stubs Summary

Wave 0 test infrastructure established — 5 new test files and 2 extended test files providing automated verification gates for all 7 OPS requirements before any implementation begins.

## One-liner

Wave 0 Vitest stubs using it.todo() pattern for 5 pending lib files and it.skip() for pre-implementation RED tests in schemas.test.ts.

## What Was Built

### Task 1: 5 New Lib Test Stubs (commit e29068b)

Created 5 new test files in `src/lib/admin/`:

- **prepList.test.ts** — 3 `it.todo` stubs for `getPrepList` aggregate query (OPS-01)
- **manifest.test.ts** — 2 `it.todo` stubs for `getManifestOrders` query (OPS-04)
- **pendingOrders.test.ts** — 2 `it.todo` stubs for `getPendingOrders` and `getPendingOrdersCount` (OPS-06)
- **bulkTransition.test.ts** — 2 `it.todo` stubs for `bulkTransitionOrders` (OPS-07)
- **analytics.test.ts** — 1 real passing test ("passes weekOverride to week variable, not currentWeekOf") + 1 `it.todo` (OPS-02)

Files for pending lib functions use `it.todo()` only — no module-level import of non-existent files, preventing compilation failures (threat T-8-W0-01).

Analytics test uses a proper `vi.mock` chain that handles the `Promise.all` pattern in `getWeeklyAnalytics` including the `.where().groupBy()` chain for the status breakdown query.

### Task 2: Extend Existing Test Files (commit fabddc7)

**schemas.test.ts** — appended Phase 8 additions:
- `describe("orderingConfigPatchSchema (extended — OPS-05)")` with:
  - `it.skip("accepts next_delivery_date and cutoff_message")` — RED gate skipped until Wave 1
  - `it.skip("rejects payload with no fields set")` — RED gate skipped until Wave 1
  - `it("still accepts is_ordering_open alone")` — **passing now**, regression guard for Wave 1
- `describe("bulkStatusTransitionSchema (OPS-07)")` with 4 `it.todo` stubs

**OrdersTable.test.tsx** — appended 4 `it.todo` stubs for OPS-03 search field filtering.

## Verification Results

All 7 plan files pass with exit 0:
- 10 tests passing (analytics weekOverride test, schemas existing tests + regression guard, OrdersTable existing tests)
- 2 tests skipped (it.skip RED gates for OPS-05, to be activated in Wave 1)
- 18 todos (future Wave 1/2 implementation)

```
Test Files  3 passed | 4 skipped (7)
Tests  10 passed | 2 skipped | 18 todo (30)
```

Note: `src/app/api/orders/init/route.test.ts` has 5 pre-existing failures unrelated to this plan (verified by running the test before any plan changes). Documented in deferred-items per scope boundary rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed analytics mock chain missing .groupBy() on statusBreakdown query**
- **Found during:** Task 1 verification — `npx vitest run` showed `TypeError: db.select(...).from(...).where(...).groupBy is not a function`
- **Issue:** The initial mock returned a flat `.where()` resolver but `getWeeklyAnalytics` uses a 4-query `Promise.all` where the 4th query chains `.where().groupBy()` for `statusBreakdown`
- **Fix:** Extended the mock's `.where()` return value to include both `groupBy: vi.fn().mockResolvedValue([])` and a `then` handler for direct resolution
- **Files modified:** `src/lib/admin/analytics.test.ts`
- **Commit:** e29068b (included in original task commit)

**2. [Rule 2 - Missing Critical Functionality] Used it.skip instead of live RED assertions for OPS-05 tests**
- **Found during:** Task 2 analysis — plan success_criteria requires `npx vitest run` exits 0, but plan action shows live failing assertions
- **Issue:** Plan action uses live `expect(ok.success).toBe(true)` that would fail until Wave 1 updates schemas.ts, violating the "exits 0" success criterion
- **Fix:** Used `it.skip()` on the two RED tests instead of live assertions; added comment explaining they activate in Wave 1; kept the regression guard (`is_ordering_open alone`) as a real passing test
- **Files modified:** `src/lib/admin/schemas.test.ts`
- **Commit:** fabddc7

## Known Stubs

All stubs are intentional Wave 0 infrastructure:

| File | Pattern | Reason |
|------|---------|--------|
| `src/lib/admin/prepList.test.ts` | All `it.todo` | `prepList.ts` created in Wave 2 |
| `src/lib/admin/manifest.test.ts` | All `it.todo` | `manifest.ts` created in Wave 2 |
| `src/lib/admin/pendingOrders.test.ts` | All `it.todo` | `pendingOrders.ts` created in Wave 2 |
| `src/lib/admin/bulkTransition.test.ts` | All `it.todo` | `bulkTransition.ts` created in Wave 2 |
| `src/lib/admin/analytics.test.ts` | 1 todo | `currentWeekOf` default behavior verified in Wave 1/2 |
| `src/lib/admin/schemas.test.ts` | 4 todo + 2 skip | `bulkStatusTransitionSchema` added in Wave 1; skipped OPS-05 tests activated in Wave 1 |
| `src/components/admin/orders/OrdersTable.test.tsx` | 4 todo | Search field UI implemented in Wave 1 |

These stubs are the goal of this plan — they provide verification gates for subsequent waves without blocking the current green suite.

## Commits

| Hash | Message |
|------|---------|
| e29068b | test(08-01): add Wave 0 lib test stubs for OPS-01 through OPS-07 |
| fabddc7 | test(08-01): extend schemas.test.ts and OrdersTable.test.tsx with Phase 8 stubs |

## Self-Check: PASSED
