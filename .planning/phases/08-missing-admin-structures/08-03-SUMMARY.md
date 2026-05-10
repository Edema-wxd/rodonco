---
phase: 08-missing-admin-structures
plan: "03"
subsystem: admin-pending-orders
tags:
  - admin
  - sidebar
  - pending-orders
  - wave-1
  - badge
dependency_graph:
  requires:
    - "08-01 (Wave 0 test stubs — pendingOrders.test.ts stub)"
  provides:
    - "getPendingOrdersCount() returning number for sidebar badge"
    - "getPendingOrders() returning AdminOrder[] filtered to status=pending"
    - "AdminLayout passing pendingCount to AdminSidebar via post-auth fetch"
    - "AdminSidebar with 8 nav items including Prep List, Manifest, Pending Orders"
    - "Red badge on Pending Orders nav item when pendingCount > 0"
    - "print:hidden on sidebar aside; print:w-full on main"
  affects:
    - "08-04 (/admin/prep-list page — Prep List nav item now links to it)"
    - "08-05 (/admin/manifest page — Manifest nav item now links to it)"
    - "08-06 (/admin/pending page — Pending Orders nav item now links to it, badge is live)"
tech_stack:
  added: []
  patterns:
    - "Pending count fetched in AdminLayout after session null check (T-8-03-01 mitigation)"
    - "buildNavItems(pendingCount) factory replaces static NAV_ITEMS const for dynamic badge"
    - "NavItem type with optional badge field for extensibility"
    - "print:hidden on aside + print:w-full on main for manifest print support"
key_files:
  created:
    - src/lib/admin/pendingOrders.ts
  modified:
    - src/lib/admin/pendingOrders.test.ts
    - src/app/admin/layout.tsx
    - src/components/admin/AdminSidebar.tsx
    - src/components/admin/AdminSidebar.test.tsx
decisions:
  - "Called getPendingOrdersCount() after the session null check (not in Promise.all with auth) per T-8-03-01 threat mitigation — avoids unnecessary DB query for unauthenticated requests"
  - "Replaced static NAV_ITEMS const with buildNavItems(pendingCount) function to enable badge data flow from parent prop"
  - "Updated AdminSidebar.test.tsx to pass pendingCount=0 to all existing tests and added 3 new tests covering new nav items and badge visibility"
metrics:
  duration: "8 minutes"
  completed: "2026-05-09T17:45:29Z"
  tasks_completed: 2
  files_created: 1
  files_modified: 4
---

# Phase 8 Plan 03: Pending Orders Lib + Sidebar Badge Summary

Server-to-client data flow for pending order count badge: pendingOrders lib with getPendingOrdersCount/getPendingOrders, AdminLayout auth-gated fetch, and AdminSidebar extended with 3 new nav items (Prep List, Manifest, Pending Orders) plus a live red badge on the Pending Orders item.

## One-liner

pendingOrders lib + AdminLayout pendingCount prop pass-through + AdminSidebar 8-item nav with live badge on Pending Orders item.

## What Was Built

### Task 1: pendingOrders lib (commit a666ff0)

Created `src/lib/admin/pendingOrders.ts`:

- `getPendingOrdersCount()` — `SELECT COUNT(*) FROM orders WHERE status = 'pending'`, returns `Number(row?.c ?? 0)`
- `getPendingOrders()` — fetches all `status=pending` orders newest-first, maps to `AdminOrder[]` shape using same items-join pattern as `getAdminOrders()`
- Both functions use `import "server-only"` at top
- Updated `pendingOrders.test.ts`: replaced `it.todo` stubs with 3 real passing tests for `getPendingOrdersCount` (returns 0, coerces string to number, filters by status=pending)

### Task 2: AdminLayout + AdminSidebar extensions (commit a9ff1e2)

**`src/app/admin/layout.tsx`:**
- Added `import { getPendingOrdersCount }` from pendingOrders lib
- Calls `getPendingOrdersCount()` after session null check (not before — T-8-03-01 mitigation)
- Passes `pendingCount` prop to `AdminSidebar`
- Added `print:w-full` to `<main>` for manifest print layout

**`src/components/admin/AdminSidebar.tsx`:**
- Added `import * as React from "react"` for `React.ComponentType`
- Replaced `const NAV_ITEMS = [...] as const` with `type NavItem` + `buildNavItems(pendingCount)` factory function
- 3 new nav items: Prep List (`/admin/prep-list`, `ClipboardList` icon), Manifest (`/admin/manifest`, `Truck` icon), Pending Orders (`/admin/pending`, `Clock` icon, badge)
- Badge renders when `badge > 0` — red pill with count inline in the nav link
- Updated `AdminSidebar` props signature: `{ adminEmail: string | null; pendingCount: number }`
- Added `print:hidden` to `<aside>` element

**`src/components/admin/AdminSidebar.test.tsx`:**
- Added `pendingCount={0}` to all 4 existing tests (previously no pendingCount prop)
- Added 3 new tests: new nav items render, badge shows when count > 0, badge hidden when count = 0
- All 7 tests pass

## Verification Results

```
npx vitest run src/lib/admin/pendingOrders.test.ts src/components/admin/AdminSidebar.test.tsx
Test Files  2 passed (2)
Tests  10 passed | 1 todo (11)
```

`npx tsc --noEmit` — implementation files have no TypeScript errors (pre-existing `it.todo` TS errors in test files are out of scope — inherited from Wave 0, present in 4+ other test files before this plan).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Security] Called getPendingOrdersCount() after session null check instead of in Promise.all**
- **Found during:** Task 2 — reading the plan's threat model T-8-03-01
- **Issue:** Plan's action section shows `Promise.all([auth(), getPendingOrdersCount()])` which would execute the DB count query even for unauthenticated requests (login page hits `/admin` without session)
- **Fix:** Auth first, early-return if no session, then fetch `pendingCount` for authenticated admins only
- **Files modified:** `src/app/admin/layout.tsx`
- **Commit:** a9ff1e2

**2. [Rule 2 - Missing Critical Functionality] Updated AdminSidebar.test.tsx with pendingCount prop and new tests**
- **Found during:** Task 2 — AdminSidebar now requires `pendingCount: number` prop; existing tests would fail without it
- **Issue:** All 4 existing test renders would TypeScript-error and fail at runtime without the required prop
- **Fix:** Added `pendingCount={0}` to all existing test renders + 3 new tests for badge behavior and new nav items
- **Files modified:** `src/components/admin/AdminSidebar.test.tsx`
- **Commit:** a9ff1e2

## Known Stubs

None — all nav items link to pages that do not exist yet (`/admin/prep-list`, `/admin/manifest`, `/admin/pending`). Per T-8-03-03 in the threat model, these return 404 until Wave 2 plans create the pages. This is intentional phased deployment behavior, not a stub.

## Threat Flags

None — no new network endpoints or auth paths introduced. The `getPendingOrdersCount()` DB call is gated behind `session?.user` check in AdminLayout.

## Commits

| Hash | Message |
|------|---------|
| a666ff0 | feat(08-03): implement pendingOrders lib with getPendingOrders and getPendingOrdersCount |
| a9ff1e2 | feat(08-03): extend AdminLayout with pendingCount and AdminSidebar with 3 new nav items + badge |

## Self-Check: PASSED
