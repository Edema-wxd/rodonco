---
phase: 03-interactive-shop
plan: 04
subsystem: shop
tags:
  - nextjs-app-router
  - parallel-routes
  - drizzle
  - ordering-window
requires:
  - 03-02
provides:
  - "/shop grid backed by DB products"
  - "deep-link navigation contracts for /shop/[id] drawer route"
  - "hard-refresh fallback via shop/default.tsx"
affects:
  - "src/app/(customer)/shop/*"
  - "src/components/shop/*"
  - "src/lib/shop/*"
completed_at: "2026-04-29"
commits:
  - "2310128"
  - "11fecc9"
  - "45ea74d"
key_files:
  created:
    - "src/lib/shop/products.ts"
    - "src/components/shop/ShopGrid.tsx"
    - "src/app/(customer)/shop/default.tsx"
  modified:
    - "src/app/(customer)/shop/page.tsx"
---

# Phase 03 Plan 04: Shop grid + routing contracts Summary

Server-rendered `/shop` grid backed by DB products, with deep-link navigation to `/shop/[id]`, ordering-closed banner/disablement, and a `shop/default.tsx` fallback so hard refresh keeps the grid behind the drawer.

## What Shipped

- **Server product loader**: `getActiveProductsForShop()` reads active products via Drizzle and serializes into the shared `Product` type shape.
- **Shop grid server component**: `ShopGrid` renders Fresh Produce + Cooking Kits sections from real DB data, links each card to `/shop/{product.id}` using `scroll={false}` to preserve scroll semantics, and shows `OrderingClosedBanner` / disables “Add to order” affordances when ordering is closed.
- **Routing fallback for deep-link refresh**: `src/app/(customer)/shop/default.tsx` renders the same grid as `/shop/page.tsx`, ensuring refresh on `/shop/[id]` still has background content (children slot fallback for parallel routes).

## Commits

| Task | Commit | Summary |
|------|--------|---------|
| 1 | `2310128` | Add server-only shop product loader (`src/lib/shop/products.ts`) |
| 2 | `11fecc9` | Add `ShopGrid` server component + ordering-closed banner/disablement |
| 3 | `45ea74d` | Wire `/shop` + add `shop/default.tsx` refresh fallback |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleaned corrupted `.next` output after build ENOENT**
- **Issue:** `next build` intermittently failed with missing `.next/server/pages-manifest.json`.
- **Fix:** Removed `.next/` and rebuilt to produce a clean build output.
- **Notes:** This did not change source behavior; it unblocked verification.

## Known Stubs

- **`src/components/shop/ShopGrid.tsx`**: Product images render a placeholder (“No image yet”) when `image_url` is null (expected until real product media is available).
- **`src/components/shop/ShopGrid.tsx`**: “Add to order” button is a non-functional affordance on the grid; actual add-to-cart happens via the product drawer in later plans.

## Verification

- **Build**: `npx tsc --noEmit` and `npm run build` both pass.
- **Manual routing contract**:
  - Visit `/shop`, scroll, click a product card → URL becomes `/shop/{id}` and scroll position is preserved behind the drawer route (drawer UI is implemented in later plans).

## Self-Check: PASSED

- Confirmed files exist:
  - `src/lib/shop/products.ts`
  - `src/components/shop/ShopGrid.tsx`
  - `src/app/(customer)/shop/default.tsx`

- Confirmed commits exist:
  - `2310128`
  - `11fecc9`
  - `45ea74d`

