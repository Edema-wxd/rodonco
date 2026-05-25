---
phase: 03-interactive-shop
plan: 02
subsystem: ui
tags: [nextjs, drizzle-orm, server-only, ordering-window, tailwind]

requires:
  - phase: 02-static-shop-ui
    provides: [shop/drawer/cart cutoff/banner styling patterns]
provides:
  - Server-only `getOrderingConfig()` accessor for `ordering_config` (single-row id=1)
  - Sticky presentational `OrderingClosedBanner` component
  - `/checkout` blocked state (no checkout UI) when ordering is closed
affects:
  - phase: 03-interactive-shop (subsequent add-to-cart + cart view-only enforcement)

tech-stack:
  added: [drizzle-orm DB accessor pattern, Next `unstable_noStore` per-request enforcement]
  patterns: [server-only DB truth loader, sticky status banner below navbar]

key-files:
  created:
    - src/lib/shop/orderingConfig.ts
    - src/components/shop/OrderingClosedBanner.tsx
    - src/test/setup.ts
    - src/test/vitest-shim.d.ts
  modified:
    - src/app/(customer)/checkout/page.tsx
key-decisions:
  - "Use single-row `ordering_config` (id=1) as master switch for cutoff state"
  - "Enforce no-caching semantics via Next cache API (`unstable_noStore`) inside server accessor"
  - "Sticky ordering-closed banner uses `top-16` so it sits below the sticky navbar"

patterns-established:
  - "Pattern: server-only accessor returns safe OPEN default on missing/failed DB reads"
  - "Pattern: presentational banner renders nothing when open and sticky status when closed"

requirements-completed: [SHOP-11]

duration: 15min
completed: 2026-04-29
---

# Phase 03: interactive-shop Plan 02 Summary

**Centralized ordering-window truth via server-only DB accessor and enforced checkout blocking with a reusable sticky closed-banner**

## Performance
- **Duration:** 15min
- **Started:** 2026-04-29T08:15:14+01:00
- **Completed:** 2026-04-29T08:30:06+01:00
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Implemented `getOrderingConfig()` to read `ordering_config.id=1` on every request (no caching assumptions).
- Added `OrderingClosedBanner` sticky UI component to communicate closed state consistently.
- Updated `/checkout` so it renders a blocked state (banner + message) when ordering is closed.

## Task Commits
Each task was committed atomically:

1. **Task 1: Add server-only ordering config loader (no-cache by design)** - `641c891`
2. **Task 2: Create sticky ordering-closed banner component** - `e118561`
3. **Task 3: Block `/checkout` when ordering is closed** - `5f42acc`

**Plan metadata:** `5f42acc` (docs: complete plan execution)

## Files Created/Modified
- `src/lib/shop/orderingConfig.ts` - server-only `getOrderingConfig()` reading `ordering_config` row id=1 with safe OPEN fallback
- `src/components/shop/OrderingClosedBanner.tsx` - sticky status banner component (renders nothing when open)
- `src/app/(customer)/checkout/page.tsx` - calls `getOrderingConfig()` and blocks checkout UI when ordering is closed

## Decisions Made
- Ordering window enforcement is driven exclusively by `ordering_config` (single-row table) to avoid mismatched UI/behavior.
- Checkout “closed” UX is implemented via a sticky banner component (below navbar) to match the phase’s banner placement decision.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Blocking] Fixed `tsc --noEmit` verification failures due to missing Vitest types**
- **Found during:** Task 1 (verification gate)
- **Issue:** `npx tsc --noEmit` failed because the repo’s test files/imports referenced `vitest`, but Vitest types weren’t available in this environment.
- **Fix:** Added minimal ambient Vitest type shims and adjusted `src/test/setup.ts` so `tsc` can type-check without requiring Vitest installation.
- **Files modified:** `src/test/setup.ts`, `src/test/vitest-shim.d.ts`
- **Verification:** `npx tsc --noEmit && npm run build` passed
- **Committed in:** `641c891` (part of task commit)

**2. [Rule 3 - Blocking] Used correct Next cache API for no-store semantics**
- **Found during:** Task 1 (implementation correctness)
- **Issue:** `next/cache` did not export `noStore` in this Next version.
- **Fix:** Switched to `unstable_noStore()` in `getOrderingConfig()` to preserve “per-request truth” behavior.
- **Files modified:** `src/lib/shop/orderingConfig.ts`
- **Verification:** `npx tsc --noEmit && npm run build` passed
- **Committed in:** `641c891` (part of task commit)

## Issues Encountered
- While iterating on the banner component file, an accidental duplicate content block was temporarily introduced; it was corrected before the Task 2 commit.

## User Setup Required
None - no external services required for this plan.

## Next Phase Readiness
- `/checkout` is now correctly blocked when ordering is closed.
- With ordering truth centralized + banner established, the next interactive-shop tasks can safely implement “disable add-to-cart everywhere” and cart view-only behavior (D-12/D-13).

---
*Phase: 03-interactive-shop*
*Completed: 2026-04-29*

