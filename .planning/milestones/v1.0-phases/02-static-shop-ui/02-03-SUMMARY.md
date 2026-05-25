---
phase: 02-static-shop-ui
plan: 03
status: complete
completed_at: "2026-04-30"
subsystem: tests
requirements:
  - CART-04
provides:
  - "Regression coverage for CART-04 Navbar badge hydration guard"
  - "Contract coverage for SHOP-03 banner copy/role/date formatting"
  - "Contract coverage for SHOP-04 product-card price formatting + routing"
  - "Unit coverage for starting price MIN aggregation helper"
key_files:
  created:
    - src/components/layout/Navbar.test.tsx
    - src/components/shop/OrderingClosedBanner.test.tsx
    - src/components/shop/ProductCard.test.tsx
    - src/lib/shop/products.test.ts
  modified:
    - vitest.config.ts
    - package.json
    - package-lock.json
commits:
  - fe0d0c1: "test(02-static-shop-ui-03): add CART-04 Navbar hydration badge coverage"
  - 880c642: "chore(02-static-shop-ui-03): configure vitest JSX automatic runtime"
  - 83bdf3b: "test(02-static-shop-ui-03): add banner and product-card contract coverage"
  - 5d9eac5: "test(02-static-shop-ui-03): cover min starting-price helper logic"
---

# Phase 02 Plan 03: Test coverage summary

Added targeted Vitest coverage to lock in the key Phase 2 UI contracts (banner, product card, and Navbar hydration-guarded cart badge) and the “starting price = MIN variant price” aggregation logic.

## What shipped

- **CART-04 regression coverage**
  - `src/components/layout/Navbar.test.tsx` verifies badge is hidden pre-hydration (even with items) and appears with correct count after hydration.
- **SHOP-03 banner contract coverage**
  - `src/components/shop/OrderingClosedBanner.test.tsx` verifies null render when open, `role="alert"`, and locked copy prefix + date formatting shape.
- **SHOP-04 product card contract coverage**
  - `src/components/shop/ProductCard.test.tsx` verifies “From ₦…” formatting, CTA copy, and `/shop/{product.id}` link target.
- **Starting price helper coverage**
  - `src/lib/shop/products.test.ts` verifies MIN aggregation and missing-variant fallback without requiring a real DB.

## Verification

- `npm test`

## Deviations from Plan

### Auto-fixed issues

1. **[Rule 3 - Blocking] Vitest did not include TSX tests by default**
   - **Fix:** Expanded `vitest.config.ts` include pattern to `src/**/*.test.{ts,tsx}`.
2. **[Rule 3 - Blocking] TSX component tests failed with `React is not defined`**
   - **Fix:** Configured Vitest/Vite esbuild JSX runtime to `automatic` in `vitest.config.ts` so component TSX compiles without per-file React imports.
3. **[Rule 3 - Blocking] Repo lacked a component test harness**
   - **Fix:** Added `@testing-library/react` + `@testing-library/dom` as dev deps to implement the requested component-level tests.
4. **[Rule 3 - Blocking] `server-only` import prevented unit-testing server modules**
   - **Fix:** Mocked `server-only` in `src/lib/shop/products.test.ts` to keep the test runner environment compatible.

## Known stubs

None introduced by this plan.

## Threat flags

None. (Test-only changes; no new runtime endpoints or trust-boundary changes.)

## Self-Check: PASSED

- SUMMARY exists at `.planning/phases/02-static-shop-ui/02-03-SUMMARY.md`
- All listed commits exist in git history.

