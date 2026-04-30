# Phase 2: Static Shop UI - Research

**Researched:** 2026-04-30  
**Domain:** Next.js App Router static shop pages + DB-backed reads (Neon Postgres via Drizzle ORM)  
**Confidence:** HIGH

## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Landing page — Hero section
- **D-01:** White/light background hero — clean, food-forward look consistent with Hello Fresh / Home Chef reference
- **D-02:** CTA button uses solid brand colour as placeholder (e.g. `#16a34a` green) until real moodboard arrives from client; swap when assets land
- **D-03:** Hero includes: headline, subheadline, and a single CTA button linking to `/shop`

### Landing page — How It Works
- **D-04:** 3-step flow: **Browse → Customise → Deliver** — placeholder copy; update when brand copy arrives
- **D-05:** Steps are icon + label + short description; icons: Tailwind/Lucide placeholders (e.g. `Search`, `Settings`, `Truck`)
- **D-06:** Section is visually distinct from hero (light grey or white alternate background)

### Product card design
- **D-07:** Image aspect ratio: **4:3 landscape** (`aspect-[4/3]` with `object-cover`)
- **D-08:** Card style: **subtle shadow + rounded corners** — use `rounded-xl shadow-sm hover:shadow-md` pattern
- **D-09:** Price display: **"From ₦X,XXX"** — lowest `product_variants.price_ngn` for that product divided by 100; formatted with `toLocaleString('en-NG')` or manual comma separator
- **D-10:** "Add to Order" CTA: **solid black, full-width button** below card content — `Button` variant `default` (shadcn); in Phase 2 the button links to the product drawer route (`/shop/[slug]`) but drawer is a stub so it may be an `<a>` or `<Link>` for now
- **D-11:** Card content order: image → product name → price → button

### Shop page — Grid layout
- **D-12:** Desktop: **3 columns** (`grid-cols-3`), Tablet: 2 columns (`sm:grid-cols-2`), Mobile: **2 columns** (`grid-cols-2`)
- **D-13:** Section headers: **bold heading (`text-xl font-bold`) + subtle horizontal divider line** (`border-b`) below the heading, before the grid
- **D-14:** Two sections in order: Fresh Produce first, Cooking Kits second
- **D-15:** If a section has no active products: **show the section with "No products available" message** (do not hide silently)

### Cutoff banner
- **D-16:** Colour: **amber/warning** — use `bg-amber-50 border-amber-200 text-amber-800` or equivalent Tailwind
- **D-17:** Position: **sticky at top of page** (`sticky top-0 z-40`) so it remains visible as user scrolls the product grid
- **D-18:** Message format: `"Ordering is closed. Next delivery: Saturday, 3 May"` — format `ordering_config.next_delivery_date` (ISO string from DB) as `"Day, D Month"`
- **D-19:** Banner only renders when `ordering_config.is_ordering_open === false`; when open, component returns null

### Data fetching
- **D-20:** Use `createSupabaseServerClient()` from `src/lib/supabase/server.ts` in server components — no client-side fetching on these pages
- **D-21:** Starting price for a product = MIN of its `product_variants.price_ngn` values; fetch variants in same query or separate query per product
- **D-22:** Shop page uses `export const revalidate = 60` for the cutoff banner (SHOP-03 requirement)

### CART-04 (Navbar cart badge)
- **D-23:** Already implemented in Phase 1 — `src/components/layout/Navbar.tsx` renders cart icon with `useHasHydrated` guard. No changes needed in Phase 2.

### Claude's Discretion
- Exact hero headline and subheadline copy (placeholder; client to provide real copy)
- Specific icon choices for How It Works steps
- Precise spacing, padding, and typography scale beyond the decisions above
- Whether to extract ProductCard and CutoffBanner as separate components vs inline
- How to handle `image_url: null` on Product — default placeholder image approach

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

## Summary

Phase 2’s “static shop UI” should be planned as **server-rendered App Router pages** that read from **Neon Postgres via Drizzle (`src/lib/db`)** and reuse the **already-established shop UI primitives** (product drawer route, ordering banner, and cart sidebar) to keep Phase 3 consistent. The codebase has moved beyond Supabase: the Phase 2 CONTEXT.md references Supabase server client APIs, but the actual repo uses Drizzle + Neon and `getOrderingConfig()` already enforces “no caching” semantics per request.

The most important planning work for Phase 2 is therefore: align the landing page to the locked UI decisions, align the shop grid to the locked card decisions (including “From ₦X,XXX” computed from variants), and make sure the shop routes continue to work with the `@drawer` parallel route (links must use `scroll={false}` and target `/shop/{product.id}`).

**Primary recommendation:** Plan Phase 2 around existing modules: `src/app/(customer)/page.tsx`, `src/components/shop/ShopGrid.tsx`, and `src/lib/shop/*`, using Drizzle reads only; avoid introducing client fetching or Supabase APIs.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.2.4 | App Router, RSC, routing | Existing app framework and route patterns in repo. [VERIFIED: npm registry] |
| `react` | 19.0.0 | UI runtime | Existing dependency; RSC + client components split. [VERIFIED: package.json] |
| `tailwindcss` | 4.2.4 | Styling | Existing styling system used throughout. [VERIFIED: npm registry] |
| `drizzle-orm` | 0.45.2 | Typed DB access | Existing DB layer (`src/lib/db/index.ts`). [VERIFIED: npm registry] |
| `@neondatabase/serverless` | 1.1.0 | Neon HTTP driver | Existing DB client (`src/lib/db/index.ts`). [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | 1.8.0 | Icons | Landing page “How it works” step icons (placeholders). [VERIFIED: package.json] |
| `motion` | 12.38.0 | Animations | Phase 3 drawer/cart interactions; keep imports as `motion/react`. [VERIFIED: npm registry] |
| `zustand` | 5.0.12 | Client state | Cart badge + cart UI state; already used. [VERIFIED: package.json] |
| `vitest` | 4.1.5 | Unit tests | Existing test runner. [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle server reads (`src/lib/db`) | Supabase JS client | **Not applicable**: Supabase packages are not present and DB access patterns already standardized on Drizzle + Neon. [VERIFIED: package.json + code] |

## Architecture Patterns

### Recommended Project Structure (already present)
```
src/
├── app/(customer)/
│   ├── layout.tsx               # Server layout; fetches ordering config
│   ├── page.tsx                 # Landing page (Phase 2 implements)
│   └── shop/
│       ├── layout.tsx           # Renders children + @drawer slot
│       ├── page.tsx             # Shop page (renders ShopGrid)
│       └── @drawer/
│           ├── default.tsx      # MUST exist; returns null
│           └── [slug]/page.tsx  # Drawer route (already implemented)
├── components/shop/             # Shop UI building blocks
└── lib/shop/                    # Server-only DB access for shop reads
```
[VERIFIED: codebase]

### Pattern 1: “Server component pages call server-only shop reads”
**What:** Server components (`page.tsx`, `ShopGrid`) call `src/lib/shop/*` functions which import `"server-only"` and query via `db`/`schema`.  
**When to use:** Any DB-backed read required for SSR (landing/shop/drawer).  
**Example:** `ShopGrid` uses `Promise.all([getActiveProductsForShop(), getOrderingConfig()])`. [VERIFIED: `src/components/shop/ShopGrid.tsx`]

### Pattern 2: “Parallel route drawer navigation”
**What:** Product links target `/shop/{product.id}` with `scroll={false}` so the `@drawer/[slug]` route can render as an overlay while keeping the shop grid visible.  
**When to use:** Any “open details without full page reload” behavior.  
**Example:** `ProductCard` uses `<Link href={\`/shop/${product.id}\`} scroll={false}>`. [VERIFIED: `src/components/shop/ShopGrid.tsx`]

### Pattern 3: “Ordering config is treated as a dynamic source of truth”
**What:** `getOrderingConfig()` calls `unstable_noStore()` to force per-request execution.  
**When to use:** Any check that must reflect live open/closed status.  
**Example:** Customer layout reads ordering config server-side and passes values to client `CartSidebar`. [VERIFIED: `src/app/(customer)/layout.tsx`, `src/lib/shop/orderingConfig.ts`]

### Anti-Patterns to Avoid
- **Doing DB queries directly inside components without `"server-only"` boundaries:** keep reads in `src/lib/shop/*` to prevent accidental client bundling and to centralize mapping logic. [VERIFIED: existing pattern in `src/lib/shop/*.ts`]
- **Using Supabase clients in Phase 2:** Phase 2 CONTEXT.md references Supabase, but the repo is already on Drizzle/Neon and `DATABASE_URL` is the configured source of truth. [VERIFIED: `package.json`, `src/lib/db/index.ts`, `src/types/env.d.ts`]
- **Using `unstable_noStore()` while expecting ISR revalidation semantics:** `noStore` opts out of caching, so `export const revalidate = 60` is not the mechanism controlling ordering config freshness. If Phase 2 insists on “revalidate every 60s”, treat it as a product requirement (“updates within 60s”), not as an implementation requirement. [VERIFIED: `src/lib/shop/orderingConfig.ts`]

## DB Schema + Access Patterns (Products / Variants / Ordering Config)

### Tables and key fields (Drizzle schema)
- **`products`**: `id (uuid)`, `name`, `description`, `type ('fresh_produce'|'cooking_kit')`, `image_url`, `is_active`. [VERIFIED: `drizzle/schema.ts`]
- **`product_variants`**: `product_id`, `label`, `price_ngn` (kobo integer), `is_default`. [VERIFIED: `drizzle/schema.ts`]
- **`product_prep_options`**: `product_id`, `label`, `extra_cost_ngn` (kobo). [VERIFIED: `drizzle/schema.ts`]
- **`ordering_config`**: single-row config (`id=1`) with `is_ordering_open`, `cutoff_message`, `next_delivery_date`. [VERIFIED: `drizzle/schema.ts`]

### Current read API surface (server-only)
- `getActiveProductsForShop()` returns `Product[]` filtered by `is_active=true`, ordered by name. [VERIFIED: `src/lib/shop/products.ts`]
- `getProductDetailsById(productId)` returns `{ product, variants, prepOptions }`. [VERIFIED: `src/lib/shop/productDetails.ts`]
- `getOrderingConfig()` returns `{ is_ordering_open, cutoff_message, next_delivery_date }` with safe defaults on error. [VERIFIED: `src/lib/shop/orderingConfig.ts`]

### Starting price (Phase 2 requirement: “From ₦X,XXX”)
Phase 2’s product cards need a **per-product MIN of `product_variants.price_ngn`**. The codebase does **not** currently provide a “products + min price” read helper; it only provides `getActiveProductsForShop()` without variant aggregation. Plan Phase 2 to add a dedicated read helper in `src/lib/shop/` (either a join + aggregate query, or a second query keyed by product ids) and keep conversion/formatting consistent with the drawer/cart helpers (kobo → NGN).
[VERIFIED: current helpers in `src/lib/shop/*.ts`]

## UI Patterns Established in Phase 3 (must remain compatible)

Even though Phase 2 is “static”, the repository already contains Phase-3-grade UI patterns that Phase 2 should not fight:

- **Drawer overlay**: `src/app/(customer)/shop/@drawer/[slug]/page.tsx` renders `ProductDrawer` and uses `router.back()` to close. Links must continue using `scroll={false}` for the overlay UX. [VERIFIED: code]
- **Ordering banner**: `OrderingClosedBanner` is used in both shop grid and drawer/cart. Planning should avoid duplicating banner logic elsewhere. [VERIFIED: `src/components/shop/OrderingClosedBanner.tsx`]
- **Sticky stacking**: Navbar is `sticky top-0 z-50`, and the banner is `sticky top-16 z-40`. Any Phase 2 shop-page banner should keep this stacking behavior. [VERIFIED: `src/components/layout/Navbar.tsx`, `src/components/shop/OrderingClosedBanner.tsx`]

## Next.js App Router (RSC) Pitfalls to Plan Around

### Pitfall 1: Server component vs client component boundaries
**What goes wrong:** DB code (or `process.env`) accidentally bundles into the client when a file becomes `"use client"`.  
**How to avoid:** Keep DB reads in `"server-only"` modules (`src/lib/shop/*`, `src/lib/db/*`) and only pass serializable data to client components. [VERIFIED: existing `"server-only"` usage]

### Pitfall 2: `unstable_noStore()` vs ISR expectations
**What goes wrong:** Adding `export const revalidate = 60` but still seeing per-request execution (or vice-versa) because `noStore` disables caching.  
**How to avoid:** Decide intentionally:
- If ordering state must be live: keep `unstable_noStore()` and treat SHOP-03 as “updates quickly” (≤ 60s).  
- If you truly want ISR caching: remove `noStore` for ordering_config reads (but this conflicts with INFRA-04 later).  
[VERIFIED: `src/lib/shop/orderingConfig.ts` + requirements]

### Pitfall 3: Date formatting / serialization in server components
**What goes wrong:** Rendering a raw DB `date` value directly results in awkward UI (e.g., `2026-05-03`) and/or timezone confusion.  
**How to avoid:** Centralize formatting (e.g., a `formatNextDeliveryDate()` helper) and ensure it matches D-18. [VERIFIED: D-18 in CONTEXT.md; current banner prints raw string]

## Don’t Hand-Roll

| Problem | Don’t Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Manual comma insertion | `Intl.NumberFormat("en-NG", { style:"currency", currency:"NGN" })` | Handles separators and edge cases; already used in drawer/cart. [VERIFIED: `ProductDrawer.tsx`, `CartSidebar.tsx`] |
| DB access | Raw SQL strings scattered in components | Centralized `src/lib/shop/*` reads via Drizzle | Prevents client bundling + keeps mapping consistent. [VERIFIED: codebase] |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next dev/build, tests | ✓ | v25.2.1 | — |
| npm | installs, scripts | ✓ | 11.11.1 | — |
| drizzle-kit | schema tooling | ✓ | 0.31.10 | — |

[VERIFIED: local command output]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (jsdom) [VERIFIED: `vitest.config.ts`] |
| Config file | `vitest.config.ts` |
| Setup file | `src/test/setup.ts` (localStorage polyfill + clearing) |
| Quick run command | `npm test` |
| Focused command | `npx vitest run src/lib/shop/<file>.test.ts` (add tests in Wave 0 if missing) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHOP-01 | Landing page renders hero + How It Works w/o JS | manual smoke | `npm run dev` then visit `/` | ❌ (manual) |
| SHOP-02 | Shop page shows two sections filtered by active products | unit/integration (server fn) | `npx vitest run src/lib/shop/products.test.ts` | ❌ |
| SHOP-03 | Banner shows when ordering closed; updates quickly | unit (banner + formatter) | `npx vitest run src/components/shop/OrderingClosedBanner.test.tsx` | ❌ |
| SHOP-04 | Product card shows image, name, starting price, CTA | unit (card rendering) | `npx vitest run src/components/shop/ProductCard.test.tsx` | ❌ |
| CART-04 | Navbar cart badge uses hydration guard | already tested indirectly | `npm test` | ✅ (`src/store/cart.test.ts` exists; Navbar test optional) |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test` + manual smoke of `/` and `/shop` (RSC, routing, and sticky stacking are visual)

### Wave 0 Gaps
- [ ] `src/lib/shop/products.test.ts` — cover SHOP-02 data filtering and ordering
- [ ] `src/components/shop/OrderingClosedBanner.test.tsx` — cover SHOP-03 open/closed rendering
- [ ] `src/components/shop/ProductCard.test.tsx` (or test via `ShopGrid`) — cover SHOP-04 “From ₦…” formatting and link target

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | SHOP-03 acceptance can be satisfied by “no caching” semantics (updates faster than 60s), not strictly ISR `revalidate=60`. | Next.js pitfalls | If the team interprets SHOP-03 as strictly ISR-based, implementation may need adjustment. |

## Open Questions

1. **Should Phase 2 keep the existing “ordering config is dynamic per request” behavior?**
   - What we know: `getOrderingConfig()` currently calls `unstable_noStore()` and is used in the customer layout. [VERIFIED: code]
   - What’s unclear: Phase 2 CONTEXT.md locked D-22 (“`revalidate=60` for cutoff banner”), but this conflicts with later INFRA-04 (“no caching on ordering checks”). [VERIFIED: requirements + code]
   - Recommendation: Keep `noStore` for ordering checks; treat revalidate as a non-binding UI freshness target for the banner.

## Sources

### Primary (HIGH confidence)
- Codebase (verified by direct reads):
  - `src/app/(customer)/shop/layout.tsx`, `src/app/(customer)/shop/@drawer/[slug]/page.tsx`
  - `src/components/shop/ShopGrid.tsx`, `src/components/shop/OrderingClosedBanner.tsx`, `src/components/shop/ProductDrawer.tsx`
  - `src/lib/shop/products.ts`, `src/lib/shop/productDetails.ts`, `src/lib/shop/orderingConfig.ts`
  - `src/lib/db/index.ts`, `drizzle/schema.ts`, `src/types/index.ts`
  - `vitest.config.ts`, `src/test/setup.ts`
- npm registry version checks (2026-04-30):
  - next 16.2.4 (published 2026-04-15) [VERIFIED: npm registry]
  - drizzle-orm 0.45.2 (published 2026-03-27) [VERIFIED: npm registry]
  - motion 12.38.0 (published 2026-03-17) [VERIFIED: npm registry]
  - vitest 4.1.5 (published 2026-04-21) [VERIFIED: npm registry]
  - tailwindcss 4.2.4 (published 2026-04-21) [VERIFIED: npm registry]
  - zod 4.4.1 (published 2026-04-29) [VERIFIED: npm registry]

### Notes
- `CLAUDE.md` was not found in the repo root at research time. [VERIFIED: file read error]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm registry and repo `package.json`.
- Architecture: HIGH — patterns are implemented in the current codebase.
- Pitfalls: MEDIUM — derived from current code behavior + Next.js caching semantics; SHOP-03 interpretation flagged as an explicit assumption.

**Valid until:** 2026-05-30 (30 days)

