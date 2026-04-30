---
phase: 02
plan: 02
slug: static-shop-ui
status: complete
completed_at: 2026-04-30
tags:
  - shop
  - rsc
  - drizzle
requires: []
provides:
  - /shop server-rendered grid with sectioned products and cutoff banner
affects:
  - src/lib/shop/products.ts
  - src/components/shop/ShopGrid.tsx
  - src/components/shop/ProductCard.tsx
  - src/components/shop/OrderingClosedBanner.tsx
  - src/app/(customer)/shop/page.tsx
commits:
  - f1d6e5e
  - 5c8a43b
  - f59d99b
---

# Phase 02 Plan 02: Shop grid + product card + cutoff banner alignment — Summary

DB-backed `/shop` now renders the locked Phase 2 layout: two product sections (Fresh Produce, Cooking Kits) with spec-compliant product cards (“From ₦…”, black CTA linking to drawer route with `scroll={false}`) and an amber sticky “Ordering is closed” banner that formats the next delivery date as `Day, D Month`.

## What Shipped

- **Starting price server helper (no N+1)**: Added `getActiveProductsWithStartingPriceForShop()` which returns active products plus `starting_price_ngn` computed as MIN variant price per product.  
  - **Commit**: `f1d6e5e`
  - **Key file**: `src/lib/shop/products.ts`

- **Spec-compliant shop grid + product cards**: Extracted `ProductCard` and refactored `ShopGrid` to render two locked sections, headings/dividers, and the specified grid columns/gaps. `/shop` now exports `revalidate = 60`.  
  - **Commit**: `5c8a43b`
  - **Key files**: `src/components/shop/ProductCard.tsx`, `src/components/shop/ShopGrid.tsx`, `src/app/(customer)/shop/page.tsx`

- **Cutoff banner contract alignment**: Updated `OrderingClosedBanner` to render only when ordering is closed, use amber styling + sticky stacking under navbar, format next delivery date, and announce via `role="alert"`.  
  - **Commit**: `f59d99b`
  - **Key file**: `src/components/shop/OrderingClosedBanner.tsx`

## Verification

- **Automated**: `npm test` (green) after each task.

## Deviations from Plan

- **Image fallback asset**: UI-SPEC suggests `/images/placeholder-product.jpg`, but the asset didn’t exist in `public/`. Implemented a safe fallback to existing `/logo.svg` for `ProductCard` to avoid introducing a binary image file.

## Known Stubs

- None introduced by this plan. (Note: the `/shop` drawer route is still a Phase 3 stub by design; this plan preserves routing via links.)

## Self-Check: PASSED

- FOUND: `.planning/phases/02-static-shop-ui/02-02-SUMMARY.md`
- FOUND commits: `f1d6e5e`, `5c8a43b`, `f59d99b`

