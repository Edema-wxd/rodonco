# Phase 03: Interactive Shop - Research

**Researched:** 2026-04-29  
**Domain:** Next.js App Router parallel routes (drawer), interactive product configuration, cart sidebar (Zustand), ordering window enforcement  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Product drawer routing + UX
- **D-01:** Drawer is always an overlay on top of `/shop` (deep-link URL is `/shop/[slug]`). Refreshing `/shop/[slug]` must still render the shop grid behind the open drawer.
- **D-02:** Drawer closes via **backdrop tap**, **X button**, and **swipe-down** on mobile.
- **D-03:** Browser back button while on `/shop/[slug]` closes the drawer and returns to `/shop` while preserving scroll position.
- **D-04:** After **Add to cart**, close the drawer (cart badge updates).

### Configuration rules (variants / size / prep options)
- **D-05:** Rule set is “choose whatever exists”: if a product has options, user must choose them before Add to cart enables; if a product has no options, it is quantity-only.
- **D-06:** **Different mechanics by product type**:
  - Cooking kits: **Size only** (no prep options)
  - Fresh produce: **Prep option only** (no size)
- **D-07:** **No defaults**: do not preselect size/prep; require explicit selection (Add to cart disabled until chosen).

### Live pricing + quantity
- **D-08:** Show **subtotal only** in the drawer (unit price implied).
- **D-09:** Quantity stepper: **min 1**, no hard max; show a **soft warning after 20**.

### Cart sidebar behavior
- **D-10:** Cart sidebar auto-opens only on the **first add-to-cart**; otherwise it opens only when the user clicks the navbar cart icon.
- **D-11:** Cart merges identical items into a single line item keyed by **product + variant/size + prep option** (quantity accumulates).

### Ordering window enforcement
- **D-12:** When `ordering_config.is_ordering_open === false`:
  - Disable **Add to cart** everywhere (shop cards + drawer).
  - Disable quantity changes in cart (view-only cart allowed).
  - Block `/checkout` with a clear “ordering closed” message.
- **D-13:** Ordering-closed message placement: **sticky banner** on **/shop + drawer + cart**.

### Claude's Discretion
- Exact visual layout of drawer controls (placement of X, warning styling, spacing)
- Exact warning copy for “quantity > 20” soft warning
- Exact cart line-item layout, as long as merge/edit/remove behaviors match the decisions above

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

None — discussion stayed within Phase 3 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHOP-05 | Clicking a product card opens product drawer without full page reload (Next.js parallel route / intercepting route) | Use `@drawer` slot + Link navigation; ensure `default.tsx` exists for `@drawer` and **also** for implicit `children` fallback on refresh. [CITED: https://nextjs.org/docs/app/building-your-application/routing/parallel-routes] |
| SHOP-06 | Drawer opens as bottom sheet on mobile, side panel on desktop, with 300ms ease-out animation (Framer Motion) | Use `motion` package (already installed) with responsive layout + `transition={{ duration: 0.3, ease: "easeOut" }}`; for mobile swipe-down close use `drag="y"` + `onDragEnd` heuristics. [VERIFIED: codebase package.json] [CITED: https://motion.dev/docs/react-drag] |
| SHOP-07 | Fresh Produce drawer shows quantity selector (min 1) and optional prep options as radio buttons; no size selector | Drive UI from `Product.type === "fresh_produce"`; load prep options for the product from DB and render radio group when any exist; enforce “no defaults”. [VERIFIED: `.planning/phases/03-interactive-shop/03-CONTEXT.md`] |
| SHOP-08 | Cooking Kit drawer shows size variant selector (radio/tab group) and optional prep options | Drive UI from `Product.type === "cooking_kit"`; load variants; enforce “no defaults”; note Phase 3 context says kits are “size only” (no prep) which **conflicts** with REQUIREMENTS wording—treat Phase 3 context as authoritative for planning. [VERIFIED: `.planning/phases/03-interactive-shop/03-CONTEXT.md`] |
| SHOP-09 | Drawer prep options loaded dynamically per product from `product_prep_options` | Use Drizzle queries against `schema.product_prep_options` keyed by `product_id`. [VERIFIED: `drizzle/schema.ts`] |
| SHOP-10 | Drawer price recalculates live as user changes quantity, size, or prep option | Compute `unitPriceKobo = variant.price_ngn + prep.extra_cost_ngn` (both ints) and `subtotalKobo = unitPriceKobo * quantity`. Use client state for selections; render subtotal only. [VERIFIED: `src/types/index.ts`] |
| SHOP-11 | Add to Cart disabled + tooltip when ordering closed | Fetch `ordering_config.is_ordering_open` server-side with **no caching** and pass to UI; disable CTA and show tooltip. [VERIFIED: `.planning/phases/03-interactive-shop/03-CONTEXT.md`] |
| CART-01 | Cart state in Zustand persisted to localStorage | `src/store/cart.ts` already uses `zustand/persist` with name `rodo-cart`. Ensure any added fields stay serializable. [VERIFIED: `src/store/cart.ts`] |
| CART-02 | Cart supports add/increment/decrement/remove/clear | Store has `addItem/removeItem/updateQuantity/clearCart`, but remove/update currently ignore `prepOption` and can incorrectly remove/update multiple distinct prep-option items. Planner should fix keying to include `prepOption` (and preferably include `variantLabel` + `prepOption` everywhere). [VERIFIED: `src/store/cart.ts`] |
| CART-03 | Cart accessible as drawer/sidebar from anywhere | Implement a client `CartSidebar` mounted in customer layout (e.g., `src/app/(customer)/layout.tsx`) and controlled by a small UI store (open/close + “first add auto-open” logic). [VERIFIED: `src/app/(customer)/layout.tsx`] |
| CART-05 | Cart drawer shows itemised list, subtotal, and “Free delivery on Saturdays” note | Compute subtotal from store items’ `subtotalNgn` (kobo). Add note in sidebar UI. [VERIFIED: `src/types/index.ts`, `src/store/cart.ts`] |
</phase_requirements>

## Summary

This phase hinges on getting the **Next.js parallel route slot** behavior correct for a shareable drawer URL while still rendering the `/shop` grid behind it on **hard refresh**. The existing scaffold (`src/app/(customer)/shop/layout.tsx` + `@drawer/default.tsx`) is aligned with Next’s slot conventions, but per the official docs you also need to account for the **implicit `children` slot fallback** on hard navigation—otherwise refreshing `/shop/[slug]` can render a 404 or blank background when Next can’t recover the active slot state. [CITED: https://nextjs.org/docs/app/building-your-application/routing/parallel-routes]

On the cart side, the current Zustand store already merges by `productId + variantLabel + prepOption`, matching the Phase 3 decision. However, the existing `removeItem`/`updateQuantity` functions key only by `productId + variantLabel`, which is a correctness bug once prep options exist (and even size variants + prep would diverge). This is a key “plan well” item: fix the cart store key semantics before building UI around it. [VERIFIED: `src/store/cart.ts`]

Finally, ordering window enforcement needs to be **server-truthy** (no caching) and consistently surfaced in all three UIs (shop grid cards, product drawer, cart sidebar), plus `/checkout` must render a blocked state when closed. The repo currently has **no ordering_config reads in `src/`**, so the plan must include a small DB query layer for `ordering_config` and shop product/option fetching via Drizzle. [VERIFIED: repo grep results for `ordering_config` in `src/`]

**Primary recommendation:** Implement the drawer using the existing `@drawer/[slug]` parallel slot **plus** a `shop/default.tsx` fallback that renders the shop grid for hard refresh; centralize DB reads (products/options + ordering config) in `src/lib/*` server-only modules; fix cart keying to include `prepOption` for all mutations; add a lightweight cart sidebar open/close store to satisfy “first add auto-open” behavior. [CITED: https://nextjs.org/docs/app/building-your-application/routing/parallel-routes]

## Project Constraints (from codebase/state)

- **Animation library**: Use `motion` (imports from `"motion/react"`), not `framer-motion`. [VERIFIED: `package.json`, `.planning/STATE.md`]
- **Zod**: Keep Zod pinned to v3 (repo has `zod@3.25.76`), due to known resolver compatibility decision. [VERIFIED: `package.json`, `.planning/STATE.md`]
- **DB**: Repo uses Drizzle + Neon HTTP driver (`drizzle-orm/neon-http`, `@neondatabase/serverless`) with `db` exported from `src/lib/db/index.ts`. [VERIFIED: `src/lib/db/index.ts`, `package.json`]

## Standard Stack

### Core
| Library | Version (repo) | Purpose | Why Standard |
|---------|----------------|---------|--------------|
| next | ^15.5.15 | App Router routing + layouts + parallel slots | Required framework; parallel routes + `default.tsx` behavior is central to drawer UX. [VERIFIED: codebase package.json] |
| react | 19.0.0 | UI runtime | Required by Next. [VERIFIED: codebase package.json] |
| tailwindcss | ^4.0.0 | Styling | Existing styling system. [VERIFIED: codebase package.json] |
| motion | ^12.38.0 | Drawer animation + drag gestures | Already installed; supports drag gestures (`drag`, `onDragEnd`, constraints). [VERIFIED: codebase package.json] [CITED: https://motion.dev/docs/react-drag] |
| zustand | ^5.0.12 | Cart state + persistence | Cart store already exists using `persist`. [VERIFIED: `src/store/cart.ts`] |
| drizzle-orm | ^0.45.2 | DB queries | Existing DB access path. [VERIFIED: `package.json`, `src/lib/db/index.ts`] |

### Supporting
| Library | Version (repo) | Purpose | When to Use |
|---------|----------------|---------|-------------|
| sonner | ^2.0.7 | Toasts | Add-to-cart confirmations/errors (esp. ordering closed). [VERIFIED: `package.json`] |
| @base-ui/react | ^1.4.0 | UI primitives | If you need accessible radio groups / overlays beyond shadcn components. [VERIFIED: `package.json`] |

### Version verification (npm registry snapshot)

- `next` latest on npm: `16.2.4` (repo is on `15.5.15`). [VERIFIED: npm registry via `npm view next version`]
- `motion` latest on npm: `12.38.0` (repo matches). [VERIFIED: npm registry via `npm view motion version`]
- `zustand` latest on npm: `5.0.12` (repo matches). [VERIFIED: npm registry via `npm view zustand version`]
- `zod` latest on npm: `4.3.6` but repo intentionally stays on v3. [VERIFIED: npm registry via `npm view zod version`; project decision in `.planning/STATE.md`]

## Architecture Patterns

### Pattern 1: Drawer as a parallel route slot with hard-refresh fallback

**What:** Keep the shop grid rendered as `children` and render the product UI in the `@drawer` slot. Ensure hard-refresh on `/shop/[slug]` still renders the grid behind the drawer by providing a **`default.tsx` fallback for the implicit `children` slot** under `shop/`.

**Why:** Next can’t recover active slot state for non-matching slots on hard navigation; it uses `default.tsx` fallbacks (or renders 404). This applies to slots like `@drawer`, but also to the implicit `children` slot. [CITED: https://nextjs.org/docs/app/building-your-application/routing/parallel-routes]

**Concrete guidance for planning:**
- Keep `src/app/(customer)/shop/@drawer/default.tsx` returning `null` (already done). [VERIFIED: `src/app/(customer)/shop/@drawer/default.tsx`]
- Add `src/app/(customer)/shop/default.tsx` that renders the shop grid (or delegates to a shared server component used by `shop/page.tsx`). This satisfies D-01 on refresh. [CITED: https://nextjs.org/docs/app/building-your-application/routing/parallel-routes]
- Implement close behavior via `router.back()` from the drawer (X/backdrop/swipe); for “Add to cart closes drawer” also call `router.back()` after store mutation. [ASSUMED] (standard pattern; verify in implementation with actual app behavior)

### Pattern 2: Server-only DB query modules + client configuration UI

**What:** Fetch product, variants, prep options, and ordering config in server components or server-only modules (`import "server-only"`), then pass serializable data to client components for interactivity.

**Why:** Keeps DB access consistent with current `src/lib/db/index.ts` pattern and avoids accidental client bundling. [VERIFIED: `src/lib/db/index.ts`]

### Pattern 3: Single source of truth for money math (kobo integers)

**What:** Keep all math in integer kobo; only format to ₦ for display. Use `unitPriceNgn`/`subtotalNgn` fields (kobo) consistently.

**Why:** Existing type contract states kobo conventions and cart store computes `subtotalNgn = quantity * unitPriceNgn`. [VERIFIED: `src/types/index.ts`, `src/store/cart.ts`]

### Anti-Patterns to Avoid

- **Relying on intercepting routes to satisfy D-01 refresh overlay**: Intercepting routes are designed so hard navigation/refresh renders the full page, not the intercepted modal. D-01 explicitly wants overlay-on-refresh, so plan must use the parallel slot + `children` fallback approach (or equivalent). [CITED: https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes] [CITED: https://nextjs.org/docs/app/building-your-application/routing/parallel-routes]
- **Cart mutations that ignore `prepOption`**: Will cause wrong item updates/removals once prep options exist. [VERIFIED: `src/store/cart.ts`]
- **Static rendering/caching of ordering state**: `is_ordering_open` must be checked on every request (no caching), and used to disable actions. Plan should enforce dynamic rendering / no-store for relevant pages/layouts. [VERIFIED: `.planning/REQUIREMENTS.md` INFRA-04; `.planning/phases/03-interactive-shop/03-CONTEXT.md` D-12]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gesture-driven swipe-to-dismiss | custom pointer math | Motion drag API (`drag="y"`, constraints, `onDragEnd`) | Handles momentum/velocity/offset, avoids brittle pointer logic. [CITED: https://motion.dev/docs/react-drag] |
| Modal/drawer routing state | ad-hoc global “drawer open” URL hacks | Next parallel route slots with `default.tsx` fallbacks | Built-in URL navigation + back button semantics. [CITED: https://nextjs.org/docs/app/building-your-application/routing/parallel-routes] |
| LocalStorage persistence | custom `localStorage` sync | `zustand/persist` | Already present; avoids edge cases and rehydration boilerplate. [VERIFIED: `src/store/cart.ts`] |

## Common Pitfalls

### Pitfall 1: Hard-refresh on `/shop/[slug]` loses the grid behind the drawer
**What goes wrong:** Refreshing the deep link renders 404/blank background because Next can’t recover the `children` slot state; only the `@drawer` page matches.  
**Why it happens:** Parallel routes require `default.tsx` fallback for unmatched slots on hard navigation; docs explicitly call this out (including the implicit `children` slot).  
**How to avoid:** Add `src/app/(customer)/shop/default.tsx` that renders the shop grid; keep `@drawer/default.tsx` as `null`. [CITED: https://nextjs.org/docs/app/building-your-application/routing/parallel-routes]

### Pitfall 2: Cart remove/update corrupts line items when prep options exist
**What goes wrong:** Removing/updating a line item removes/updates all items with same product+variant but different prep option.  
**Why it happens:** `removeItem` and `updateQuantity` ignore `prepOption`.  
**How to avoid:** Fix store API to use the same compound key everywhere: `(productId, variantLabel, prepOption)` (or move to a generated `lineId`). [VERIFIED: `src/store/cart.ts`]

### Pitfall 3: “No defaults” violated accidentally by UI component defaults
**What goes wrong:** Radio groups/tabs preselect first option, enabling Add to cart without explicit choice.  
**Why it happens:** Many UI primitives default to first item or a controlled value initialized to something non-null.  
**How to avoid:** Initialize selection state to `null` and require user interaction; keep CTA disabled until selection made. [VERIFIED: Phase 3 decisions D-07]

### Pitfall 4: Ordering-closed enforcement only in the drawer (not everywhere)
**What goes wrong:** Shop cards or cart edits still allow adding/changing quantities when ordering is closed.  
**Why it happens:** Ordering state not centralized or not passed to all relevant components.  
**How to avoid:** Load ordering state once in a high-level server component (shop layout + customer layout for cart) and distribute via a small client provider; also block `/checkout`. [VERIFIED: Phase 3 decisions D-12/D-13]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next dev/build, test tooling | ✓ | v25.2.1 | — |
| npm | package install/scripts | ✓ | 11.11.1 | — |

## Validation Architecture

> Nyquist validation is enabled (`workflow.nyquist_validation: true`). [VERIFIED: `.planning/config.json`]

### Test Framework (current state)
| Property | Value |
|---------|-------|
| Framework | none detected |
| Config file | none detected |
| Quick run command | none |
| Full suite command | none |

**Wave 0 Gaps (recommended to add before implementing interactive flows):**
- Add either:
  - **Playwright** for end-to-end drawer/back-button/refresh semantics (best fit for routing behaviors), OR
  - **Vitest + React Testing Library** for store and UI unit tests (best fit for cart key semantics + pricing math).

[ASSUMED] (repo has no tests; exact choice is planner discretion unless phase policy mandates one).

### Phase Requirements → Test Map (proposed)
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHOP-05 | Clicking product opens drawer via URL without full reload | e2e | `npx playwright test -g \"opens product drawer\"` | ❌ |
| SHOP-06 | Drawer animates and can swipe-down close on mobile | e2e/manual | `npx playwright test -g \"drawer close\"` | ❌ |
| SHOP-10 | Subtotal updates as quantity/option changes | unit/e2e | `npm test` (once added) | ❌ |
| CART-02 | Update/remove respects `(product, variant, prep)` key | unit | `npm test` (once added) | ❌ |
| SHOP-11 | Ordering closed disables add + tooltip | e2e | `npx playwright test -g \"ordering closed\"` | ❌ |

## Security Domain

### Applicable ASVS Categories (Phase 3 scope)

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V5 Input Validation | yes | Validate route params (`slug`) and DB results; handle not-found states gracefully. [ASSUMED] |
| V3 Session Management | no | Phase 3 is customer, no login. |
| V4 Access Control | no | Phase 3 is public; enforcement is business rule (ordering window), not auth. |

**Known threat patterns (practical):**
- **Client-only ordering enforcement** (bypass by calling APIs directly): even if Phase 3 is UI-only, planner should ensure any “add-to-order” server endpoints later check `is_ordering_open` server-side. [VERIFIED: `.planning/REQUIREMENTS.md` INFRA-04]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Using `router.back()` is the best close primitive for drawer across X/backdrop/add-to-cart | Architecture Patterns | If wrong, back-stack could behave oddly; might need explicit `router.push('/shop')`. |
| A2 | Test tooling choice (Playwright vs Vitest) is discretionary for Phase 3 | Validation Architecture | If project requires tests, missing infra will block validation gate. |

## Open Questions (RESOLVED)

1. **Are cooking kits allowed to have prep options in v1?**
   - What we know: Phase 3 decisions say kits are size-only; REQUIREMENTS says kits have optional prep options. [VERIFIED: `.planning/phases/03-interactive-shop/03-CONTEXT.md`, `.planning/REQUIREMENTS.md`]
   - **RESOLVED (planning decision):** For Phase 03, **cooking kits are size-only (no prep options)** per locked decision **D-06** in `03-CONTEXT.md`. If requirements later need kit prep options, it becomes a follow-up decision/phase change.

2. **How is `slug` mapped to products in DB?**
   - What we know: `products` table in `drizzle/schema.ts` has no `slug` column. [VERIFIED: `drizzle/schema.ts`]
   - **RESOLVED (planning decision):** Treat the route param `[slug]` as **`productId`** (UUID) for Phase 03 and generate links as `/shop/{id}`. No schema change in Phase 03.

## Sources

### Primary (HIGH confidence)
- Next.js App Router docs: Parallel Routes (`default.tsx` behavior, slots, hard refresh fallback) — https://nextjs.org/docs/app/building-your-application/routing/parallel-routes
- Next.js App Router docs: Intercepting Routes (modal behavior on refresh) — https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes
- Motion React docs: Drag API — https://motion.dev/docs/react-drag
- Codebase: `src/store/cart.ts`, `src/app/(customer)/shop/*`, `src/lib/db/index.ts`, `drizzle/schema.ts`, `src/types/index.ts`

### Secondary (MEDIUM confidence)
- Next.js GitHub discussions/issues about intercepting route refresh edge cases (useful for planner risk awareness): https://github.com/vercel/next.js/discussions/67934 and related issues (currency varies). [CITED: GitHub search results; not fully validated against current Next 15.5.15 behavior]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (from `package.json` + npm registry checks)
- Architecture: MEDIUM (Next docs are clear, but exact behavior in Next 15.5.15 should be verified during implementation)
- Pitfalls: HIGH for cart key mismatch; MEDIUM for routing edge cases

**Research date:** 2026-04-29  
**Valid until:** 2026-05-29

