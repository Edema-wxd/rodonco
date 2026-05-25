# Phase 3: Interactive Shop - Context

**Gathered:** 2026-04-29  
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the interactive shopping flow: product selection drawer (`/shop/[slug]`) becomes a real configure-and-add experience, the cart becomes editable (sidebar), and ordering-window rules are enforced (disable add-to-cart and block checkout when closed). This phase is strictly customer-facing shop/cart behavior; payments and admin functionality remain out of scope.

</domain>

<decisions>
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing routing scaffolding (drawer slot)
- `src/app/(customer)/shop/layout.tsx` — shop layout that owns `{drawer}` slot
- `src/app/(customer)/shop/@drawer/default.tsx` — default drawer slot (must remain to avoid refresh 404s)
- `src/app/(customer)/shop/@drawer/[slug]/page.tsx` — current drawer page stub to replace with real UI

### Cart state + hydration guard
- `src/store/cart.ts` — canonical cart merge semantics (productId + variantLabel + prepOption)
- `src/hooks/useHasHydrated.ts` — hydration guard pattern (avoid SSR mismatches)
- `src/components/layout/Navbar.tsx` — existing cart badge wiring + link to `/checkout`

### Product + order types
- `src/types/index.ts` — `CartItem` shape and product/order interfaces (kobo integer pricing conventions)
- `drizzle/schema.ts` — table source-of-truth (products, variants, prep options, ordering_config)

### Prior phase UI decisions that carry forward
- `.planning/phases/02-static-shop-ui/02-CONTEXT.md` — product card layout decisions + cutoff banner styling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCartStore` in `src/store/cart.ts` already supports merge-on-add and quantity updates.
- Navbar cart badge exists and is already hydration-safe.

### Established Patterns
- Customer pages live under `src/app/(customer)/...` with shared navbar layout.
- Drawer routing is already scaffolded using the `@drawer` parallel route slot.

### Integration Points
- `src/app/(customer)/shop/page.tsx` currently stubbed — will need real product grid for interactive flow.
- `src/app/(customer)/shop/@drawer/[slug]/page.tsx` is the implementation anchor for the drawer UI and add-to-cart.
- `/checkout` route exists and must be blocked when ordering is closed.

</code_context>

<specifics>
## Specific Ideas

- Reference interaction: Chowdeck-style configure-and-add drawer, but implemented using Next.js `@drawer` routing so URLs remain shareable.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 3 scope.

</deferred>

---

*Phase: 03-interactive-shop*  
*Context gathered: 2026-04-29*

