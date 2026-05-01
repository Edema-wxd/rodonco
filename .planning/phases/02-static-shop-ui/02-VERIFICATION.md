---
phase: 02-static-shop-ui
verified: 2026-05-01T22:01:00Z
status: passed
score: 7/7 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 6/7
  gaps_closed:
    - "Banner formatting and card price formatting are protected by automated tests. All 4 Phase 2 test files now collect and pass: Navbar.test.tsx, ProductCard.test.tsx, products.test.ts, and OrderingClosedBanner.test.tsx. The missing `import { vi } from 'vitest'` was added to the three previously-broken files. Full suite: 17 test files, 52 tests, 0 failures."
  gaps_remaining: []
  regressions: []
---

# Phase 2: Static Shop UI — Verification Report

**Phase Goal:** A visitor can open the site, read the landing page, browse the shop product grid, and see individual product cards — all server-rendered from real DB data, with no cart interaction yet
**Verified:** 2026-05-01T22:01:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (vi import fix in 3 test files)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor can open `/` and see a hero section (headline, subheadline, CTA to `/shop`) without client-side JS | ✓ VERIFIED | `src/app/(customer)/page.tsx` is a server component (no `"use client"`), renders `<h1>`, `<p>`, and `<Link href="/shop">` with green CTA |
| 2 | Visitor can see a 3-step How It Works section (Browse, Customise, Deliver) below the hero | ✓ VERIFIED | `HowItWorks.tsx` defines 3 steps, each with Lucide icon (`aria-hidden="true"`), label, and description; rendered in `page.tsx` |
| 3 | Visitor can open `/shop` and see two labeled sections (Fresh Produce, Cooking Kits) populated from DB active products | ✓ VERIFIED | `ShopGrid.tsx` calls `getActiveProductsWithStartingPriceForShop()` (DB-backed), filters by `.type`, renders two `<h2>` section headings with `border-b` dividers |
| 4 | When ordering is closed, a sticky amber banner appears beneath the navbar showing the next delivery date | ✓ VERIFIED | `OrderingClosedBanner.tsx`: renders `null` when `isOpen=true`; sticky amber (`bg-amber-50 border-amber-200`), `top-16 z-40`, `role="alert"`, formats date via `Intl.DateTimeFormat` |
| 5 | Each product card shows an image, name, starting price formatted as `From ₦X,XXX`, and an `Add to Order` CTA that links to `/shop/{id}` | ✓ VERIFIED | `ProductCard.tsx`: renders `<img>`, product name, `formatFromPrice()` (kobo ÷ 100 + `toLocaleString`), "Add to Order" `<Link href={/shop/${product.id}}` with `scroll={false}` |
| 6 | Navbar renders at all times and shows a cart icon (badge only visible post-hydration when itemCount > 0) | ✓ VERIFIED | `Navbar.tsx` is always rendered; cart badge guarded by `useHasHydrated()` — badge only visible when `hasHydrated && itemCount > 0` |
| 7 | Banner formatting and card price formatting are protected by automated tests | ✓ VERIFIED | All 4 Phase 2 test suites pass. `Navbar.test.tsx`, `ProductCard.test.tsx`, `products.test.ts` each now import `vi` from `'vitest'`; `OrderingClosedBanner.test.tsx` was already passing. Full suite: 17 test files, 52 tests, 0 failures. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/(customer)/page.tsx` | Landing page hero + How It Works (server-rendered) | ✓ VERIFIED | Server component; imports `HowItWorks`, renders hero with `/shop` CTA |
| `src/components/landing/HowItWorks.tsx` | 3-step How It Works section | ✓ VERIFIED | 3 steps with Lucide icons (`aria-hidden`), distinct `bg-secondary` background |
| `src/app/(customer)/shop/page.tsx` | Shop route entry; `revalidate = 60` | ✓ VERIFIED | `export const revalidate = 60` at line 3; delegates to `<ShopGrid />` |
| `src/components/shop/ShopGrid.tsx` | Shop grid SSR using server-only reads | ✓ VERIFIED | Async server component; calls `getActiveProductsWithStartingPriceForShop()` and `getOrderingConfig()` |
| `src/components/shop/ProductCard.tsx` | Product card UI per Phase 2 decisions | ✓ VERIFIED | Server component; `From ₦` formatter, `scroll={false}` link |
| `src/components/shop/OrderingClosedBanner.tsx` | Ordering closed sticky banner | ✓ VERIFIED | Amber, sticky, `role="alert"`, date-formatted, null when open |
| `src/lib/shop/products.ts` | Active products read + starting price helper | ✓ VERIFIED | `getActiveProductsWithStartingPriceForShop()` uses two queries (no N+1), returns `starting_price_ngn` as MIN variant price |
| `src/components/layout/Navbar.test.tsx` | CART-04 regression coverage | ✓ VERIFIED | `import { ..., vi } from 'vitest'` on line 2; 2 tests pass (pre-hydration badge absent, post-hydration badge shows count) |
| `src/components/shop/OrderingClosedBanner.test.tsx` | SHOP-03 banner contract coverage | ✓ VERIFIED | 2 tests pass; null-when-open, `role="alert"`, message prefix, and date format |
| `src/components/shop/ProductCard.test.tsx` | SHOP-04 card contract coverage | ✓ VERIFIED | `import { ..., vi } from 'vitest'` on line 2; 1 test passes (From ₦ format, CTA copy, href) |
| `src/lib/shop/products.test.ts` | SHOP-02/04 price helper coverage | ✓ VERIFIED | `import { ..., vi } from 'vitest'` on line 1; 2 tests pass (MIN price, missing variant fallback to 0) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/(customer)/page.tsx` | `/shop` | `next/link` CTA with `href="/shop"` | ✓ WIRED | `<Link href="/shop">` present at line 22 |
| `src/components/shop/ProductCard.tsx` | `/shop/[id]` | `next/link` with `scroll={false}` | ✓ WIRED | Both image and CTA links use `href={/shop/${product.id}}` and `scroll={false}` |
| `src/components/shop/ShopGrid.tsx` | `src/lib/shop/products.ts` | `getActiveProductsWithStartingPriceForShop` | ✓ WIRED | Imported and called at top of async component |
| `src/components/shop/ShopGrid.tsx` | `src/components/shop/OrderingClosedBanner.tsx` | `OrderingClosedBanner` render | ✓ WIRED | Imported and rendered; `isOpen` prop wired from `ordering.is_ordering_open` |
| `src/components/layout/Navbar.tsx` | `src/hooks/useHasHydrated.ts` | `useHasHydrated` | ✓ WIRED | Imported at line 7; used at line 10; badge render guarded at line 33 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ShopGrid.tsx` | `products`, `ordering` | `getActiveProductsWithStartingPriceForShop()` → Drizzle `db.select().from(schema.products).where(eq(is_active, true))` + MIN variant price aggregate | Yes — two bounded DB queries, no static returns | ✓ FLOWING |
| `ShopGrid.tsx` | `ordering` | `getOrderingConfig()` → Drizzle `db.select().from(schema.ordering_config).where(eq(id,1))` with `unstable_noStore()` | Yes — per-request DB read; no caching | ✓ FLOWING |
| `ProductCard.tsx` | `startingPriceNgn` | Passed as prop from `ShopGrid` which sources from DB | Yes — prop originates from real DB aggregate | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All Phase 2 test files collect and pass | `npm test` | 17 test files, 52 tests, 0 failures | ✓ PASS |
| `revalidate = 60` export present | grep check | `export const revalidate = 60` at line 3 of `shop/page.tsx` | ✓ PASS |
| `server-only` guard on products helper | grep check | `import "server-only"` at line 1 of `products.ts` | ✓ PASS |
| Banner renders null when open | unit test | `OrderingClosedBanner.test.tsx` 2/2 pass — returns null when `isOpen=true` | ✓ PASS |
| CART-04 hydration guard | unit test | `Navbar.test.tsx` 2/2 pass — badge absent pre-hydration, badge shows count post-hydration | ✓ PASS |
| SHOP-04 price formatting | unit test | `ProductCard.test.tsx` 1/1 pass — `From ₦2,500` for 250_000 kobo | ✓ PASS |
| MIN variant price logic | unit test | `products.test.ts` 2/2 pass — MIN price correct, missing-variant defaults to 0 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SHOP-01 | 02-01-PLAN.md | Landing page hero + How It Works, static CTA to `/shop` | ✓ SATISFIED | `page.tsx` and `HowItWorks.tsx` exist, substantive, server-rendered |
| SHOP-02 | 02-02-PLAN.md | Shop page — two sections from active DB products | ✓ SATISFIED | `ShopGrid.tsx` queries `is_active=true`, renders Fresh Produce + Cooking Kits sections |
| SHOP-03 | 02-02-PLAN.md | Cutoff banner when ordering closed, revalidates 60s | ✓ SATISFIED | Banner component wired; `revalidate=60` on shop page; 2 banner tests pass |
| SHOP-04 | 02-02-PLAN.md | Product card: image, name, starting price, Add to Order CTA | ✓ SATISFIED | `ProductCard.tsx` implements all four elements; `From ₦` formatting confirmed by passing test |
| CART-04 | 02-03-PLAN.md | Navbar cart icon with hydration-guarded badge | ✓ SATISFIED | `Navbar.tsx` correctly guards badge with `useHasHydrated`; 2 regression tests pass |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/shop/products.ts` | 61-62 | `console.error(...)` for missing variant prices — will log in production for products without variants | Warning | Not blocking; noise in logs for seeded products with no variants |

No blocker anti-patterns. The three previously-blocking `vi`-not-defined issues are resolved.

### Human Verification Required

No human verification items identified. All observable goal behaviors are verifiable programmatically.

### Gaps Summary

No gaps remain. The single gap from the initial verification — broken automated test collection in `Navbar.test.tsx`, `ProductCard.test.tsx`, and `products.test.ts` due to missing `import { vi } from 'vitest'` — has been resolved. All four Phase 2 test files now collect and pass. The full test suite runs 17 files and 52 tests with 0 failures.

The phase goal is fully achieved: the landing page, shop grid, and product cards are all server-rendered from real DB data, all Phase 2 formatting contracts are protected by automated tests, and no cart interaction is present.

---

_Verified: 2026-05-01T22:01:00Z_
_Verifier: Claude (gsd-verifier)_
