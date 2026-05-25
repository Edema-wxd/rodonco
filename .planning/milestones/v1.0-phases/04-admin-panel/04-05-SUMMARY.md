---
phase: 04-admin-panel
plan: 05
subsystem: admin-analytics
tags:
  - nextjs-app-router
  - drizzle
  - vitest
commits:
  - b8e03a3
  - e350846
key_files:
  created:
    - src/app/admin/analytics/page.tsx
    - src/lib/admin/analytics.ts
    - src/components/admin/analytics/StatCard.test.tsx
    - src/components/ui/card.tsx
  modified:
    - src/components/admin/analytics/StatCard.tsx
    - src/components/admin/products/ProductsList.tsx
    - src/test/vitest-shim.d.ts
---

# Phase 04 Plan 05: Admin analytics dashboard Summary

Built the `/admin/analytics` dashboard as a Server Component backed by a server-only Drizzle aggregation loader, plus a presentational `StatCard` component with four variants (count, currency, list, breakdown).

## What shipped

- **Server-side analytics loader**: `getWeeklyAnalytics()` runs four bounded aggregations in parallel via `Promise.all()` and filters on the current delivery week using `eq(orders.week_of, week)` (`src/lib/admin/analytics.ts`).
- **Analytics page**: `/admin/analytics` is a Server Component with `export const dynamic = "force-dynamic"` and a defence-in-depth `auth()` check (`src/app/admin/analytics/page.tsx`).
- **Stat cards UI**: `StatCard` supports:
  - `count`: integer display + optional sublabel
  - `currency`: NGN display via `formatNgn`
  - `list`: ordered list (top products) with empty-state
  - `breakdown`: status rows with empty-state
  (`src/components/admin/analytics/StatCard.tsx`)

## Query strategy (Drizzle)

All metrics are derived server-side with Drizzle helpers:

- **Total orders**: `count()` over `orders` filtered by `week_of`
- **Total revenue**: `sum(orders.total_ngn)` filtered by `week_of`
- **Top 5 products**: `sum(order_items.quantity)` grouped by `order_items.product_name`, `orderBy(desc(sum(...)))`, `limit(5)`
- **Status breakdown**: `count()` grouped by `orders.status`

## Pitfall mitigations

- **Pitfall 4 (Drizzle `sum()` returns string | null)**: coerced aggregate outputs with `Number(...)` before returning from `getWeeklyAnalytics()` (`src/lib/admin/analytics.ts`).

## Tests / verification

- **Analytics UI tests**: `npm run test -- src/components/admin/analytics` (6 tests passing) (`src/components/admin/analytics/StatCard.test.tsx`).
- **Typecheck**: `npx tsc --noEmit` passes.

## Import-path verification

- Confirmed `drizzle-orm` exports `count` and `sum` as functions (no `sql` fallback needed):
  - `node -e "const d = require('drizzle-orm'); console.log({ count: typeof d.count, sum: typeof d.sum })"`

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 3 - Blocking] Added missing test type shim surface**
   - **Issue**: `tsc --noEmit` failed because `src/test/vitest-shim.d.ts` overrode the `vitest` module and omitted commonly-used exports (`vi`, `afterEach`, etc.).
   - **Fix**: expanded the shim to include `vi` and additional lifecycle/test helpers so `tsc` can typecheck tests.
   - **Files**: `src/test/vitest-shim.d.ts`
   - **Commit**: `e350846`

2. **[Rule 3 - Blocking] Added missing `ProductsList` component**
   - **Issue**: `tsc --noEmit` failed because `src/app/admin/products/page.tsx` imports `@/components/admin/products/ProductsList` which did not exist in this worktree.
   - **Fix**: added a minimal client component implementation to satisfy the import and keep the repo typecheckable.
   - **Files**: `src/components/admin/products/ProductsList.tsx`
   - **Commit**: `e350846`

## Self-Check: PASSED

- `src/lib/admin/analytics.ts` exists
- `src/app/admin/analytics/page.tsx` exists
- Commits `b8e03a3` and `e350846` exist in git history

