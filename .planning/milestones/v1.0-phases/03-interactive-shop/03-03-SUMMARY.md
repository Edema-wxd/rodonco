---
phase: 03-interactive-shop
plan: 03
subsystem: ui
tags: [nextjs, react, zustand, cart, ordering-config]

# Dependency graph
requires:
  - phase: 03-interactive-shop
    provides: "Cart store + hydration-safe navbar badge + ordering config server helper"
provides:
  - "Global cart sidebar mounted in customer layout"
  - "Navbar cart icon opens sidebar from any customer route"
  - "View-only cart behavior enforced when ordering is closed"
affects: [checkout, shop, ordering-window]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client UI store persisted with zustand `partialize` for minimal localStorage"
    - "Server-to-client ordering config boundary via customer layout props"

key-files:
  created:
    - src/store/cartUi.ts
    - src/components/cart/CartSidebar.tsx
  modified:
    - src/components/layout/Navbar.tsx
    - src/app/(customer)/layout.tsx

key-decisions:
  - "Persist only `hasAutoOpened` (not transient drawer open state) to satisfy D-10 without persisting UI noise"
  - "Ordering-closed enforcement is UI-level here: cart remains visible but quantity/remove controls are disabled (D-12)"

patterns-established:
  - "Ordering-closed UI surfaced via `OrderingClosedBanner` in the cart sidebar using layout-provided ordering config"

requirements-completed: [CART-03, CART-05, CART-02]

# Metrics
duration: 60min
completed: 2026-04-29
---

# Phase 03 Plan 03: Global Cart Sidebar Summary

**Global cart sidebar wired to the navbar, rendering itemized cart + subtotal, and enforcing view-only behavior when ordering is closed.**

## Performance

- **Duration:** 60min
- **Started:** 2026-04-29T14:04:00Z
- **Completed:** 2026-04-29T14:10:03Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- Cart sidebar can be opened from any customer page via the navbar cart icon (no navigation away from current route).
- Sidebar shows line items, subtotal, and the note `Free delivery on Saturdays`.
- When ordering is closed, the cart remains viewable but quantity/remove controls are disabled (D-12) and an ordering-closed banner is displayed.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add cart sidebar UI store (open/close + first-add auto-open)** - `37ba941` (feat)
2. **Task 2: Build cart sidebar UI (item list + subtotal + view-only when closed)** - `c9c8b01` (feat)
3. **Task 3: Wire navbar cart icon to open cart sidebar and mount globally** - `8336815` (feat)

## Files Created/Modified

- `src/store/cartUi.ts` - UI store for sidebar open/close + persisted first-add auto-open flag.
- `src/components/cart/CartSidebar.tsx` - Drawer/bottom-sheet cart UI, subtotal, and ordering-closed control disabling.
- `src/components/layout/Navbar.tsx` - Cart icon now opens the sidebar instead of navigating to `/checkout`.
- `src/app/(customer)/layout.tsx` - Mounts `CartSidebar` globally and passes `getOrderingConfig()` results as props.

## Decisions Made

- Persisted only `hasAutoOpened` (not `isOpen`) to satisfy D-10 while avoiding persisting transient UI state.
- Passed ordering config across a server boundary (customer layout) to keep server-only modules out of client bundles.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- `next build` intermittently failed due to stale/generated `.next/types` output referencing missing files. Resolved by regenerating `.next` (clean rebuild) and re-running `npm run build`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Cart UI surface is now globally accessible; next work can hook “auto-open on first add-to-cart” by calling `useCartUiStore.getState().autoOpenOnFirstAdd()` from the add-to-cart action.

---

*Phase: 03-interactive-shop*  
*Completed: 2026-04-29*

