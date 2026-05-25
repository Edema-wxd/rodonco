---
phase: 04-admin-panel
plan: 02
subsystem: auth
tags: [nextjs, next-auth, admin, ui, vitest, tailwind]

requires:
  - phase: 02.1-migrate-supabase-to-neon-and-uploadthing
    provides: NextAuth v5 credentials auth() + middleware protection for /admin/:path*
provides:
  - Admin login at /admin calling next-auth/react signIn("credentials", { email, password, redirectTo })
  - Session-gated admin shell layout with sidebar chrome + sign-out
affects: [04-admin-panel, admin-pages, orders, products, analytics, settings]

tech-stack:
  added: []
  patterns:
    - Server Components use `auth()` for defence-in-depth gating
    - Client Components import `signIn`/`signOut` from `next-auth/react` (not `@/auth`)

key-files:
  created:
    - src/components/admin/AdminLogin.tsx
    - src/components/admin/AdminLogin.test.tsx
    - src/components/admin/AdminSidebar.tsx
    - src/components/admin/AdminSidebar.test.tsx
    - src/components/admin/AdminSignOut.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/separator.tsx
  modified:
    - src/app/admin/page.tsx
    - src/app/admin/layout.tsx

key-decisions:
  - "Render admin sidebar chrome only when `auth()` returns a session; unauthenticated /admin renders full-bleed login without sidebar."
  - "Enforce client-side auth calls via `next-auth/react` imports to avoid NextAuth v5 server/client signIn confusion."

patterns-established:
  - "Admin login tests assert next-auth/react import to prevent silent runtime failures (Pitfall 1)."
  - "Admin nav active state uses usePathname + aria-current='page' for accessibility."

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

duration: 1h
completed: 2026-05-01
---

# Phase 4 Plan 02: Admin Shell + Login Summary

**Working `/admin` login form + session-gated admin shell with persistent sidebar and sign-out, aligned to the Phase 4 UI contract.**

## Performance

- **Duration:** ~1h
- **Tasks:** 2

## Accomplishments

- `/admin` now renders a centered Sign in card on `bg-gray-50`, calls `signIn("credentials", { email, password, redirectTo: "/admin/orders" })`, and shows non-enumerating inline error copy.
- Admin layout (`src/app/admin/layout.tsx`) now uses `auth()` defence-in-depth and renders the sidebar chrome only for authenticated sessions (middleware still owns unauthenticated redirects for `/admin/*`).
- Sidebar includes 4 nav links with icons, pathname-aware active state + `aria-current="page"`, footer email display, and a sign-out button calling `signOut({ redirectTo: "/admin" })`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Login page — replace placeholder with NextAuth Credentials form (AUTH-01)** - `f8d947f` (feat)
2. **Task 2: Sidebar layout shell + sign-out (D-01..D-04, D-22)** - `f3cfe9f` (feat)

Support commit:

- `4574790` (fix): commit `Separator` UI primitive required by the sidebar

## Files Created/Modified

- `src/app/admin/page.tsx` - Server Component redirect wrapper; renders `<AdminLogin />` when logged out
- `src/components/admin/AdminLogin.tsx` - Client login form calling `next-auth/react` signIn with redirectTo
- `src/components/admin/AdminLogin.test.tsx` - AUTH-01 behavior + import-path guard tests
- `src/app/admin/layout.tsx` - Session-aware shell (sidebar only when session exists), `dynamic = "force-dynamic"`
- `src/components/admin/AdminSidebar.tsx` - Sidebar nav + footer email + sign-out
- `src/components/admin/AdminSidebar.test.tsx` - D-01/D-04/D-22 sidebar behavior tests
- `src/components/admin/AdminSignOut.tsx` - Client sign-out button calling `next-auth/react` signOut

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing `Input` and `Label` UI primitives**
- **Found during:** Task 1
- **Issue:** Plan referenced shadcn `Input`/`Label`, but they were not present in `src/components/ui/`.
- **Fix:** Added `src/components/ui/input.tsx` and corrected `src/components/ui/label.tsx`.
- **Verification:** `npm run test -- src/components/admin/AdminLogin` green.
- **Committed in:** `f8d947f`

**2. [Rule 3 - Blocking] Committed `Separator` UI primitive required by sidebar**
- **Found during:** Task 2 wrap-up
- **Issue:** Sidebar depended on `src/components/ui/separator.tsx`, which existed but was untracked.
- **Fix:** Committed `src/components/ui/separator.tsx`.
- **Verification:** `npm run test -- src/components/admin/AdminSidebar src/components/admin/AdminLogin` green.
- **Committed in:** `4574790`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both deviations were required to keep the planned UI components buildable/testable. No scope creep.

## Issues Encountered

- Testing-library renders were accumulating between tests in admin component suites; added `cleanup()` in `afterEach` to keep role/text queries deterministic.

## User Setup Required

None.

## Next Phase Readiness

- Admin chrome and auth entrypoint are ready for downstream admin pages (`/admin/orders`, `/admin/products`, `/admin/analytics`, `/admin/settings`) to render inside the sidebar shell.

## Self-Check: PASSED

- FOUND: `.planning/phases/04-admin-panel/04-02-SUMMARY.md`
- FOUND: `f8d947f` (Task 1)
- FOUND: `f3cfe9f` (Task 2)
- FOUND: `4574790` (supporting fix)

