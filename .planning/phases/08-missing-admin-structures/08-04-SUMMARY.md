---
phase: 08-missing-admin-structures
plan: "04"
subsystem: admin-operations
tags: [admin, prep-list, manifest, drizzle, aggregate-query, print]
dependency_graph:
  requires:
    - "08-02"
    - "08-03"
  provides:
    - getPrepList
    - getManifestOrders
    - /admin/prep-list
    - /admin/manifest
  affects:
    - admin-operations
tech_stack:
  added: []
  patterns:
    - Drizzle GROUP BY aggregate with inArray status filter
    - Two-query Promise.all fetch with Map join for nested items
    - Next.js 15 async searchParams pattern
    - print:hidden / print:break-inside-avoid CSS strategy
key_files:
  created:
    - src/lib/admin/prepList.ts
    - src/app/admin/prep-list/page.tsx
    - src/components/admin/prep-list/PrepListTable.tsx
    - src/lib/admin/manifest.ts
    - src/app/admin/manifest/page.tsx
    - src/components/admin/manifest/ManifestTable.tsx
  modified:
    - src/lib/admin/prepList.test.ts
    - src/lib/admin/manifest.test.ts
decisions:
  - "Used vi.hoisted() for mock variable initialization to avoid Vitest hoisting ReferenceError"
  - "PrepListWeekInput exported from PrepListTable.tsx as named export (not separate file)"
  - "ManifestTable controls div uses print:hidden; Print button also has print:hidden for safety"
  - "allergy_notes rendered as plain text — no emoji per project conventions"
metrics:
  duration_minutes: 8
  completed_date: "2026-05-12"
  tasks_completed: 2
  files_created: 6
  files_modified: 2
---

# Phase 8 Plan 04: Prep List + Delivery Manifest Summary

**One-liner:** Drizzle GROUP BY prep list and two-query manifest fetch for paid+processing orders, with sortable tables and browser print support.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Prep List lib + tests + RSC page + PrepListTable | 8a48c09 | prepList.ts, prepList.test.ts, prep-list/page.tsx, PrepListTable.tsx |
| 2 | Manifest lib + tests + RSC page + ManifestTable | 0ea13a3 | manifest.ts, manifest.test.ts, manifest/page.tsx, ManifestTable.tsx |

## What Was Built

### Task 1 — Prep List (OPS-01)

**`src/lib/admin/prepList.ts`** — `getPrepList(weekOf?)` runs a single Drizzle query with:
- `GROUP BY (product_name, variant_label, prep_option)` to aggregate quantities
- `inArray(orders.status, ['paid', 'processing'])` to filter only active orders
- `sum(order_items.quantity)` coerced via `Number(r.total_quantity ?? 0)` (Drizzle returns `string | null`)
- `orderBy(order_items.product_name)` for default ascending sort

**`src/app/admin/prep-list/page.tsx`** — RSC with auth guard, async `searchParams.week`, passes rows to client component.

**`src/components/admin/prep-list/PrepListTable.tsx`** — client component with:
- `PrepListWeekInput` (exported) — date input that pushes `?week=` to router
- `PrepListTable` — sortable by Product (asc) or Qty, with toggle direction
- Empty state: "No items for this week"

### Task 2 — Delivery Manifest (OPS-04)

**`src/lib/admin/manifest.ts`** — `getManifestOrders(weekOf?)` uses:
- Two-query `Promise.all` pattern: orders with `inArray(status, ['paid','processing'])` + all order_items
- `Set<string>` for fast `orderIds` membership check
- `Map<string, AdminOrderItem[]>` to join items to their orders
- Returns `ManifestOrder[]` with nested `items[]`

**`src/app/admin/manifest/page.tsx`** — RSC with auth guard, async `searchParams.week`, passes orders to client component.

**`src/components/admin/manifest/ManifestTable.tsx`** — client component with:
- Controls div: week date input + Sort by Name + Sort by Address + Print Manifest button (all `print:hidden`)
- Manifest cards: `print:break-inside-avoid` + `print:shadow-none` + `print:outline-none`
- `window.print()` on Print Manifest button — sidebar already has `print:hidden` from plan 08-03
- Allergy notes displayed inline on the card in red text
- `formatNgn()` for order total display

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Vitest hoisting ReferenceError in prepList.test.ts mock**

- **Found during:** Task 1 — first test run
- **Issue:** The plan's test used top-level `const mockOrderBy = vi.fn()` before `vi.mock()` factory, but `vi.mock()` is hoisted to the top of the file by Vitest, causing `ReferenceError: Cannot access 'mockSelect' before initialization`
- **Fix:** Converted all mock variables to use `vi.hoisted(() => { ... })` which runs them in hoisted context before mocks resolve
- **Files modified:** `src/lib/admin/prepList.test.ts`

**2. [Rule 1 - Bug] manifest.test.ts `require("@/lib/db")` in beforeEach fails in ESM context**

- **Found during:** Task 2 — first test run
- **Issue:** The plan's test template used `require("@/lib/db")` inside `beforeEach` for mock reset; ESM Vitest context does not support synchronous `require()` for mocked path aliases
- **Fix:** Rewrote manifest.test.ts using `vi.hoisted()` for mock chain setup, and `mockReturnValueOnce` per test for isolation. Removed `require()` call entirely
- **Files modified:** `src/lib/admin/manifest.test.ts`

**3. [Style deviation] Allergy notes — removed ⚠ emoji**

- **Found during:** Task 2 implementation
- **Issue:** Plan's ManifestTable template included `⚠ {order.allergy_notes}` with emoji
- **Fix:** Per project conventions ("avoid emojis unless explicitly requested"), rendered `{order.allergy_notes}` without the warning emoji
- **Files modified:** `src/components/admin/manifest/ManifestTable.tsx`

## Known Stubs

None — both pages fetch live data from DB via Drizzle. Empty states shown when no data exists for the selected week.

## Threat Surface Scan

No new threat surface beyond what is documented in the plan's threat model. Both pages:
- Gate access via `auth()` + redirect (T-8-04-01)
- Use Drizzle parameterised queries (T-8-04-02)
- Print is intentional (T-8-04-03)
- `inArray` array is hard-coded (T-8-04-04)

## Self-Check: PASSED

Files created:
- src/lib/admin/prepList.ts — FOUND
- src/lib/admin/prepList.test.ts — FOUND (modified)
- src/app/admin/prep-list/page.tsx — FOUND
- src/components/admin/prep-list/PrepListTable.tsx — FOUND
- src/lib/admin/manifest.ts — FOUND
- src/lib/admin/manifest.test.ts — FOUND (modified)
- src/app/admin/manifest/page.tsx — FOUND
- src/components/admin/manifest/ManifestTable.tsx — FOUND

Commits:
- 8a48c09 — feat(08-04): prep list lib, page, and table component (OPS-01)
- 0ea13a3 — feat(08-04): delivery manifest lib, page, and table component (OPS-04)

Tests: 7/7 passing (4 prepList + 3 manifest)
TypeScript: no new errors introduced
