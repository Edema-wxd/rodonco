---
phase: 09-tech-debt-cache-revalidation-requirements-cleanup
plan: "01"
subsystem: cache
tags:
  - cache
  - revalidation
  - next-cache
  - admin-mutations
dependency_graph:
  requires: []
  provides:
    - tag-based cache invalidation for shop ordering config
    - tag-based cache invalidation for shop products
  affects:
    - src/lib/shop/orderingConfig.ts
    - src/lib/shop/products.ts
    - src/lib/shop/productDetails.ts
    - src/app/(customer)/shop/page.tsx
    - src/app/(customer)/shop/products/[id]/page.tsx
    - src/app/api/admin/config/route.ts
    - src/app/api/admin/products/route.ts
    - src/app/api/admin/products/[id]/route.ts
tech_stack:
  added: []
  patterns:
    - Next.js tag-based cache invalidation via unstable_cache + revalidateTag
key_files:
  created: []
  modified:
    - src/lib/shop/orderingConfig.ts
    - src/lib/shop/products.ts
    - src/lib/shop/productDetails.ts
    - src/app/(customer)/shop/page.tsx
    - src/app/(customer)/shop/products/[id]/page.tsx
    - src/app/api/admin/config/route.ts
    - src/app/api/admin/products/route.ts
    - src/app/api/admin/products/[id]/route.ts
decisions:
  - "Used unstable_cache with tags only (no revalidate: number) for all three shop lib functions"
  - "getActiveProductsWithStartingPriceForShop inlined getActiveProductsForShop query instead of calling the cached wrapper to avoid double-cache layering"
  - "cache key for productDetails includes productId for per-product cache entries"
metrics:
  duration: ~10min
  completed_date: "2026-05-25"
---

# Phase 9 Plan 1: Tag-Based Cache Revalidation for Shop Data Summary

Replace passive TTL-based ISR caching with active tag-based `revalidateTag` invalidation — admin mutations to ordering config and product CRUD now immediately bust the customer-facing shop cache via two surgical tags: `"ordering-config"` and `"shop-products"`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Tag-cache all three shop reader libs | 4950797 | orderingConfig.ts, products.ts, productDetails.ts |
| 2 | Remove `export const revalidate = 60` from shop pages | 4950797 | shop/page.tsx, products/[id]/page.tsx |
| 3 | Wire revalidateTag into admin mutation routes | 4950797 | config/route.ts, products/route.ts, products/[id]/route.ts |

## Tag Strings Confirmed

- `"ordering-config"` — used in `orderingConfig.ts` `unstable_cache` options and called by `revalidateTag("ordering-config")` in `PATCH /api/admin/config`
- `"shop-products"` — used in `products.ts` (×2), `productDetails.ts` (×1) `unstable_cache` options and called by `revalidateTag("shop-products")` in POST `/api/admin/products`, PATCH `/api/admin/products/[id]`, and DELETE `/api/admin/products/[id]`

## File-by-File Change List

### src/lib/shop/orderingConfig.ts
- **Changed:** Replaced `{ revalidate: 15 }` with `{ tags: ["ordering-config"] }` in `unstable_cache` options
- **Lines:** ~0 added, ~2 removed (comment + field), 1 added
- Net: -1 line

### src/lib/shop/products.ts
- **Changed:** Added `import { unstable_cache } from "next/cache"`, wrapped `getActiveProductsForShop` in `unstable_cache(async () => { ... }, ["shop-active-products-v1"], { tags: ["shop-products"] })()`, inlined the DB query of `getActiveProductsForShop` directly inside `getActiveProductsWithStartingPriceForShop`'s cache wrapper (key: `["shop-active-products-with-price-v1"]`) to avoid double-cache layering
- **Lines:** +65 added, +1 import, removed cross-function call dependency

### src/lib/shop/productDetails.ts
- **Changed:** Added `import { unstable_cache } from "next/cache"`, wrapped `getProductDetailsById` body in `unstable_cache(async () => { ... }, ["shop-product-details-v1", productId], { tags: ["shop-products"] })()` — cache key includes `productId` for per-product entries
- **Lines:** +4 structural lines added (wrapper call + import)

### src/app/(customer)/shop/page.tsx
- **Changed:** Removed `export const revalidate = 60;` line (line 3)
- **Lines:** -2 (line + blank line)

### src/app/(customer)/shop/products/[id]/page.tsx
- **Changed:** Removed `export const revalidate = 60;` line (line 7)
- **Lines:** -2 (line + blank line)

### src/app/api/admin/config/route.ts
- **Changed:** Added `import { revalidateTag } from "next/cache";`, added `revalidateTag("ordering-config");` after `db.update(schema.ordering_config)` and before `logActivity`
- **Lines:** +2 added

### src/app/api/admin/products/route.ts
- **Changed:** Added `import { revalidateTag } from "next/cache";`, added `revalidateTag("shop-products");` after all four `db.insert` blocks and before `logActivity`
- **Lines:** +2 added

### src/app/api/admin/products/[id]/route.ts
- **Changed:** Added `import { revalidateTag } from "next/cache";`, added `revalidateTag("shop-products");` in PATCH handler (after prep-options replace-all, before `logActivity`) and in DELETE handler (after `db.delete(products)`, before `if (product)`)
- **Lines:** +3 added (import + 2 revalidateTag calls)

## Verification Results

### `tsc --noEmit` exit code
- **Result:** 0 errors in modified files
- Pre-existing test file errors (Footer.test.tsx, analytics.test.ts, pendingOrders.test.ts, products.test.ts) were present before this plan and are not regressions

### Grep verifications (all pass)
- `revalidateTag("ordering-config")` in `src/app/api/`: **1 match** (config/route.ts PATCH)
- `revalidateTag("shop-products")` in `src/app/api/`: **3 matches** (products POST, [id] PATCH, [id] DELETE)
- `export const revalidate` in `src/app/(customer)/shop/`: **0 matches**
- `revalidateTag` in `src/app/api/admin/orders/`: **0 matches** (order mutations not touched, per D-03)

### `npm test` exit code
- Not run — executor did not run the full test suite (requires live DB connection). Pre-existing test infrastructure errors noted above are unrelated to cache changes.

### Manual smoke test
- Not run in this execution (no dev server). Architecture is correct: admin PATCH to config now immediately calls `revalidateTag("ordering-config")` which marks the `unstable_cache` entry stale; the next customer request to `/shop` or `/shop/products/[id]` fetches fresh data from DB.

## Deviations from Plan

### Auto-adjusted: getActiveProductsWithStartingPriceForShop inlined base query

**Found during:** Task 1

**Issue:** The original `getActiveProductsWithStartingPriceForShop` called `getActiveProductsForShop()` internally. Wrapping both independently with `unstable_cache` would cause the outer function to call the inner cache's returned promise, creating double-cache layering — the outer function's cache would capture the result of the inner cached call, leading to potentially stale data propagation and redundant cache entries on invalidation.

**Fix:** Inlined the `getActiveProductsForShop` DB query directly inside `getActiveProductsWithStartingPriceForShop`'s own `unstable_cache` wrapper. Both functions remain independently exported with unchanged signatures and each has its own cache key. A single `revalidateTag("shop-products")` still invalidates both.

**Files modified:** `src/lib/shop/products.ts`

**Commit:** 4950797

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns introduced. `revalidateTag` calls are server-only and only reachable from authenticated admin routes (T-09-01 mitigated by existing `auth()` guards). Tag strings are hard-coded literals (T-09-02 mitigated).

## Self-Check: PASSED

- src/lib/shop/orderingConfig.ts — contains `tags: ["ordering-config"]`, no `revalidate: 15`
- src/lib/shop/products.ts — contains `unstable_cache` (×3 occurrences: 2 calls + 1 import), `tags: ["shop-products"]` ×2
- src/lib/shop/productDetails.ts — contains `unstable_cache`, `tags: ["shop-products"]`, cache key includes `productId`
- src/app/(customer)/shop/page.tsx — no `export const revalidate`
- src/app/(customer)/shop/products/[id]/page.tsx — no `export const revalidate`
- src/app/api/admin/config/route.ts — `revalidateTag("ordering-config")` ×1
- src/app/api/admin/products/route.ts — `revalidateTag("shop-products")` ×1
- src/app/api/admin/products/[id]/route.ts — `revalidateTag("shop-products")` ×2
- Commit 4950797 exists in git log
