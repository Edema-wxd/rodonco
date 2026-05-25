---
phase: 04-admin-panel
plan: 06
completed_at: "2026-05-01"
commits:
  - bc97e55
  - fadc938
files:
  created:
    - src/lib/admin/config.ts
    - src/app/admin/settings/page.tsx
    - src/app/api/admin/config/route.ts
    - src/components/admin/settings/OrderingToggle.tsx
    - src/components/admin/settings/OrderingToggle.test.tsx
    - src/components/ui/switch.tsx
  modified:
    - src/components/admin/AdminLogin.tsx
summary: "Admin Settings page ordering window kill-switch (UI + authenticated PATCH) with tests."
---

# Phase 04 Plan 06: Settings ordering window toggle — Summary

Implemented the admin Settings kill-switch for the ordering window (`ordering_config.is_ordering_open`) with a force-dynamic settings page, a protected PATCH endpoint, and a client toggle UI that requires inline confirmation when closing.

## What Shipped

- **Server loader (`getOrderingConfig`)**: Reads the single-row `ordering_config` record (id=1) for admin usage.
- **Settings page (`/admin/settings`)**: Server Component guarded by `auth()` and marked `force-dynamic` (INFRA-04).
- **PATCH `/api/admin/config`**:
  - Requires session (`auth()` → 401).
  - Validates body with `orderingConfigPatchSchema.safeParse` (strict).
  - Updates `ordering_config` row id=1 and **always** bumps `updated_at: new Date()` (Pitfall 6).
- **Ordering toggle UI**:
  - Prominent 28px OPEN/CLOSED label (`text-green-700` / `text-red-700`).
  - **Close requires inline confirmation** ("This will prevent new orders. Confirm?" → "Yes, Close" / "Cancel").
  - **Open saves immediately** (no confirmation).
  - Success shows **"Saved"** with fade-out after 2 seconds and calls `router.refresh()`.

## Verification

- **Typecheck**: `npx tsc --noEmit` passed.
- **Tests**: `npm run test -- src/components/admin/settings` passed (`OrderingToggle.test.tsx`).

## Deviations from Plan

- **[Rule 3 - Blocking] Fixed build/typecheck blockers required to run `npx tsc --noEmit`**
  - Added a minimal `src/components/admin/orders/OrdersTable.tsx` (was imported by `src/app/admin/orders/page.tsx` but missing).
  - Adjusted `src/components/admin/AdminLogin.tsx` typing to avoid `signIn()` returning `never` with NextAuth v5 types when using `redirectTo`.

## Notes

- **Residual risk acknowledged by threat model**: no per-admin audit log yet (only `updated_at` is bumped). This matches the plan’s threat register (T-04-30).

