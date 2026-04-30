---
phase: 03-interactive-shop
plan: 05
subsystem: shop
tags:
  - nextjs-app-router
  - parallel-routes
  - drawer
  - motion
  - drizzle
  - cart
requires:
  - 03-01
  - 03-02
  - 03-03
  - 03-04
provides:
  - "Interactive product drawer at /shop/[id] with configuration rules and live subtotal pricing"
  - "Server-side product details loader (product + variants + prep options)"
  - "Add-to-cart wiring with compound-key merging and first-add cart sidebar auto-open"
affects:
  - "src/app/(customer)/shop/@drawer/[slug]/page.tsx"
  - "src/components/shop/ProductDrawer.tsx"
  - "src/lib/shop/productDetails.ts"
completed_at: "2026-04-30"
commits:
  - "846857c"
  - "2ffc213"
  - "1b4f0ec"
key_files:
  created:
    - "src/lib/shop/productDetails.ts"
    - "src/components/shop/ProductDrawer.tsx"
  modified:
    - "src/app/(customer)/shop/@drawer/[slug]/page.tsx"
verification:
  - "npx tsc --noEmit"
  - "npm run build"
---

# Phase 03 Plan 05: Interactive Product Drawer Summary

Implemented the full interactive product drawer overlay at `/shop/[id]` using the existing `@drawer` parallel route: motion-animated panel, explicit configuration (no defaults), subtotal-only pricing, add-to-cart wiring into the compound-key cart store, and ordering-closed enforcement.

## What Shipped

- **Server loader** (`src/lib/shop/productDetails.ts`):
  - `getProductDetailsById(productId)` fetches the active product plus its variants and prep options.
  - Returns a fully serializable payload (ISO string for `created_at`) suitable for passing into client components.
- **Drawer UI** (`src/components/shop/ProductDrawer.tsx`):
  - Uses `motion/react` for the overlay and sheet animation.
  - Close controls: backdrop + X + swipe-down (mobile). Close action uses `router.back()` so the `/shop` page state/scroll semantics are preserved.
  - **Kits**: size selector only. **Produce**: prep selector only. **No defaults** — selection must be explicit when options exist.
  - **Subtotal-only pricing** in integer kobo:
    - Kits use the selected variant price.
    - Produce uses the cheapest variant price + selected prep extra cost.
  - Ordering-closed: shows sticky banner and disables add-to-cart with explanatory copy/tooltip.
  - Add-to-cart: writes `CartItem` with `(productId, variantLabel, prepOption)` identity, then triggers `autoOpenOnFirstAdd()` and closes the drawer.
- **Route wiring** (`src/app/(customer)/shop/@drawer/[slug]/page.tsx`):
  - Treats `[slug]` as `productId`, loads ordering config + product details server-side, then renders `ProductDrawer`.
  - Graceful not-found: minimal overlay with a close action back to `/shop`.

## Notes / Deviations

- NextAuth’s jose edge-runtime warning still appears during build (existing dependency/runtime warning), but `npm run build` succeeds.

## Follow-ups

- Manual smoke test per plan: open `/shop`, click a product → drawer opens; refresh `/shop/{id}` still shows grid behind drawer; add-to-cart closes drawer and opens cart only on first add; ordering closed disables CTA and cart edits.

