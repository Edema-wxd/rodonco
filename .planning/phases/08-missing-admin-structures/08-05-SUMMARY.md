---
phase: 08-missing-admin-structures
plan: "05"
subsystem: admin
tags: [pending-orders, bulk-transition, delete-handler, prep-list, OPS-06, OPS-07]
dependency_graph:
  requires:
    - "08-02"
    - "08-03"
    - "08-04"
  provides:
    - /admin/pending (pending orders page with delete)
    - DELETE /api/admin/orders/[id]
    - POST /api/admin/orders/bulk-status
    - BulkTransitionPanel on prep-list page
  affects:
    - src/app/admin/prep-list/page.tsx (extended)
    - src/app/api/admin/orders/[id]/route.ts (extended)
tech_stack:
  added: []
  patterns:
    - Next.js RSC auth-guard page (pending)
    - Client component with confirm-before-delete pattern
    - Drizzle DELETE with cascading FK (order_items)
    - Drizzle bulk UPDATE returning rowCount
    - Zod schema validation on bulk transition endpoint
key_files:
  created:
    - src/app/admin/pending/page.tsx
    - src/components/admin/pending/PendingOrdersTable.tsx
    - src/lib/admin/bulkTransition.ts
    - src/app/api/admin/orders/bulk-status/route.ts
    - src/components/admin/prep-list/BulkTransitionPanel.tsx
  modified:
    - src/app/api/admin/orders/[id]/route.ts
    - src/lib/admin/bulkTransition.test.ts
    - src/app/admin/prep-list/page.tsx
decisions:
  - "window.confirm is UX-only guard; auth enforcement is server-side"
  - "bulkTransition.ts uses server-only import to prevent client-side bundling"
  - "rowCount ?? 0 defensive coercion handles Neon HTTP driver edge cases"
  - "vi.mock db factory pattern used to avoid hoisting variable access errors"
metrics:
  duration: "38 min (active execution)"
  completed: "2026-05-15"
  tasks_completed: 2
  files_changed: 8
---

# Phase 8 Plan 05: Pending Orders Page + Bulk Status Transition Summary

**One-liner:** Pending orders page with per-row delete (auth-gated DELETE API) and bulk status transition panel on prep-list with Zod-validated POST endpoint.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Pending Orders page + PendingOrdersTable + DELETE handler (OPS-06) | 6748170 | pending/page.tsx, PendingOrdersTable.tsx, orders/[id]/route.ts |
| 2 | bulkTransition.ts lib + bulk-status API + BulkTransitionPanel (OPS-07) | c3f96c9 | bulkTransition.ts, bulkTransition.test.ts, bulk-status/route.ts, BulkTransitionPanel.tsx, prep-list/page.tsx |

## What Was Built

### OPS-06: Pending Orders Page + DELETE

**`/admin/pending` page** (`src/app/admin/pending/page.tsx`): Auth-gated RSC that calls `getPendingOrders()` and renders count of abandoned checkouts.

**`PendingOrdersTable`** (`src/components/admin/pending/PendingOrdersTable.tsx`): Client component with Delete buttons per row. Each delete triggers `window.confirm()` before calling `DELETE /api/admin/orders/{id}`. On success: `toast.success()` + `router.refresh()`. On failure: `toast.error()`.

**DELETE handler** added to `src/app/api/admin/orders/[id]/route.ts`: Auth-gated (401 if no session), deletes via `db.delete(orders).where(eq(orders.id, id))`. The `order_items` FK has `onDelete: "cascade"` in schema so cascade is automatic.

### OPS-07: Bulk Transition API + UI

**`bulkTransitionOrders()`** (`src/lib/admin/bulkTransition.ts`): Server-only function that runs a single Drizzle UPDATE with compound WHERE (`week_of` AND `status`), returning `result.rowCount ?? 0`.

**POST `/api/admin/orders/bulk-status`**: Auth guard → JSON parse → `bulkStatusTransitionSchema.safeParse()` (rejects paid→delivered invalid hop) → `bulkTransitionOrders()` → `{ updated: N }`.

**`BulkTransitionPanel`** (`src/components/admin/prep-list/BulkTransitionPanel.tsx`): Client component with week date picker and two buttons ("Paid → Processing", "Processing → Delivered"). Confirm dialog before each operation. Toast feedback + router.refresh() on success.

**Prep-list page extended**: `BulkTransitionPanel currentWeek={weekOf}` rendered below `PrepListTable`.

## Verification Results

- `npx vitest run src/lib/admin/bulkTransition.test.ts` — 5 tests passed
- `npx vitest run src/lib/admin/schemas.test.ts` — 11 tests passed (including 4 bulkStatusTransitionSchema tests)
- Full suite: 32 files passed, 160 tests passed; 5 pre-existing failures in `api/orders/init/route.test.ts` (unrelated, out of scope)
- TypeScript: no new errors introduced; 5 pre-existing errors in email templates and old `it.todo` test files remain out of scope

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vi.mock factory hoisting error in bulkTransition.test.ts**
- **Found during:** Task 2 — first test run
- **Issue:** Plan's test template referenced module-level `mockUpdate`, `mockSet`, `mockWhere` variables inside a `vi.mock` factory. Vitest hoists `vi.mock` calls to the top of the file, causing "Cannot access before initialization" ReferenceError.
- **Fix:** Restructured the `@/lib/db` mock to use an inline wrapper function that delegates to the module-level spies. All mock state is maintained via `beforeEach` setup rather than factory initialization.
- **Files modified:** `src/lib/admin/bulkTransition.test.ts`
- **Commit:** c3f96c9

## Known Stubs

None. All components are wired to real data sources.

## Threat Flags

No new security surface beyond what the plan's threat model covers. The DELETE and POST handlers are both auth-gated server-side (T-8-05-01, T-8-05-02 mitigated). The `bulkStatusTransitionSchema` Zod refine rejects paid→delivered (T-8-05-03 mitigated). The week_of regex blocks SQL injection patterns (T-8-05-05 mitigated).

## Self-Check: PASSED

Files verified:
- FOUND: src/app/admin/pending/page.tsx
- FOUND: src/components/admin/pending/PendingOrdersTable.tsx
- FOUND: src/lib/admin/bulkTransition.ts
- FOUND: src/app/api/admin/orders/bulk-status/route.ts
- FOUND: src/components/admin/prep-list/BulkTransitionPanel.tsx
- FOUND: 6748170 (Task 1 commit)
- FOUND: c3f96c9 (Task 2 commit)
