---
phase: 06-automation-launch
plan: "03"
subsystem: admin-reminders
tags: [resend, batch-email, api-route, tdd, vitest, auth-guard, zod, client-component]
dependency_graph:
  requires: [06-01]
  provides: [reminders-db-helper, reminders-route, reminder-form-ui]
  affects: [admin-settings-page, paid-orders-email]
tech_stack:
  added: []
  patterns: [resend-batch-send, zod-validation, auth-guard, use-client-inline-feedback]
key_files:
  created:
    - src/lib/admin/reminders.ts
    - src/app/api/admin/reminders/route.ts
    - src/components/admin/settings/ReminderForm.tsx
  modified:
    - src/app/admin/settings/page.tsx
    - src/lib/admin/reminders.test.ts
    - src/app/api/admin/reminders/route.test.ts
decisions:
  - "Zod validates week_of as both YYYY-MM-DD format and Saturday (getDay() === 6) at route level; client is UX only"
  - "resend.batch.send() in single call (not looped emails.send()) per RESEARCH.md guidance"
  - "weekOf passed as raw string to eq() — no new Date() wrapping; Drizzle date column maps to string in queries"
  - "ReminderForm uses HTML native date input (type=date); no shadcn DatePicker needed for this MVP use case"
  - "Inline setResult state for feedback, no toast library; aria-live=polite for accessibility"
  - "TS implicit-any in vi.mock callbacks fixed with explicit unknown types (Rule 1 deviation)"
metrics:
  duration_minutes: 15
  completed_date: "2026-05-04"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 3
---

# Phase 6 Plan 03: Delivery Reminder Emails Summary

Bulk delivery reminder email feature: `getPaidOrdersForWeek` DB helper, auth-gated `POST /api/admin/reminders` route with Resend batch send, and `ReminderForm` Client Component with inline count feedback wired into `/admin/settings`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create getPaidOrdersForWeek helper and fill reminders.test.ts | d628c9c | src/lib/admin/reminders.ts, src/lib/admin/reminders.test.ts |
| 2 | Create /api/admin/reminders route handler and fill route.test.ts | 419a39a | src/app/api/admin/reminders/route.ts, src/app/api/admin/reminders/route.test.ts |
| 3 | Create ReminderForm component and wire into settings page | 8d4fc8d | src/components/admin/settings/ReminderForm.tsx, src/app/admin/settings/page.tsx |

## What Was Built

**`src/lib/admin/reminders.ts`** — Server-only DB helper `getPaidOrdersForWeek(weekOf: string)` that queries orders by `week_of = weekOf AND status = 'paid'`, returning `{ id, customer_name, customer_email }[]`. Uses Drizzle `and(eq(...), eq(...))`. weekOf is passed as a raw string to `eq()` — no `new Date()` wrapping.

**`src/app/api/admin/reminders/route.ts`** — POST route handler that:
- Returns 401 immediately if no active admin session (`auth()` check, mirrors all admin routes)
- Validates `{ week_of }` with Zod: must be YYYY-MM-DD and a Saturday (`getDay() === 6`)
- Calls `getPaidOrdersForWeek` and returns `{ sent: 0 }` early if no paid orders
- Bulk-sends via `resend.batch.send()` — one email per paid order with personalized HTML body
- Returns `{ sent: N }` on success; logs Resend error object (not API key) and returns 500 on failure

**`src/components/admin/settings/ReminderForm.tsx`** — `"use client"` component with:
- HTML `type="date"` input (native date picker, Saturdays enforced server-side)
- Submit handler: `fetch POST /api/admin/reminders` → sets inline result state
- `aria-live="polite"` on result paragraph for screen reader accessibility
- Disabled state during loading; result shows count or error text below button

**`src/app/admin/settings/page.tsx`** — Updated to import and render `<ReminderForm />` below `<OrderingToggle />` in a `space-y-6` container. `force-dynamic` and all existing imports preserved.

## Test Results

```
Tests  9 passed (9)

src/lib/admin/reminders.test.ts (4 passed):
- returns an array of orders with id, customer_name, customer_email
- passes week_of string directly to eq() without Date conversion
- filters by status = paid
- returns empty array when no paid orders exist for the week

src/app/api/admin/reminders/route.test.ts (5 passed):
- returns 401 when no session exists
- returns 400 when week_of is missing
- returns 400 when week_of is not a Saturday
- returns { sent: 0 } when no paid orders for the week
- returns { sent: 2 } and calls batch.send with 2 emails
```

Pre-existing failures in `src/app/api/orders/init/route.test.ts` and `src/components/shop/OrderingClosedBanner.test.tsx` are unrelated to this plan (documented in 06-01 SUMMARY).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed implicit-any TypeScript errors in vi.mock callbacks**
- **Found during:** Task 3 TypeScript verification
- **Issue:** `vi.mock("drizzle-orm")` had `(col, val)` and `(...args)` parameters without types, causing TS7006 errors in strict mode
- **Fix:** Added explicit `unknown` types: `(col: unknown, val: unknown)` and `(...args: unknown[])`
- **Files modified:** src/lib/admin/reminders.test.ts
- **Commit:** 8d4fc8d

**2. [Rule 1 - Bug] Fixed arrayContaining/objectContaining TypeScript errors in route test**
- **Found during:** Task 3 TypeScript verification
- **Issue:** `expect.arrayContaining` and `expect.objectContaining` did not exist on vitest's narrow expect type (TS2339)
- **Fix:** Applied established project pattern from CheckoutExperience.test.tsx: `import expect as _expect; const expect = _expect as any`
- **Files modified:** src/app/api/admin/reminders/route.test.ts
- **Commit:** 8d4fc8d

## Threat Model Coverage

| Threat | Mitigation Applied |
|--------|-------------------|
| T-06-05 Spoofing | `auth()` check present; returns 401 for unauthenticated requests |
| T-06-07 Tampering | Zod validates YYYY-MM-DD format and Saturday constraint at route level |
| T-06-08 Info Disclosure | `console.error("[reminders] Resend batch error:", error)` — logs error object only, not RESEND_API_KEY |

## Known Stubs

None — all three files are fully wired. ReminderForm fetches the real API endpoint; route calls getPaidOrdersForWeek and resend.batch.send with real data.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes beyond what the plan specified.

## Self-Check: PASSED

Files exist:
- src/lib/admin/reminders.ts: FOUND
- src/app/api/admin/reminders/route.ts: FOUND
- src/components/admin/settings/ReminderForm.tsx: FOUND
- src/app/admin/settings/page.tsx: FOUND (modified)
- src/lib/admin/reminders.test.ts: FOUND (modified)
- src/app/api/admin/reminders/route.test.ts: FOUND (modified)

Commits exist:
- d628c9c: FOUND (feat(06-03): implement getPaidOrdersForWeek DB helper)
- 419a39a: FOUND (feat(06-03): implement POST /api/admin/reminders route handler)
- 8d4fc8d: FOUND (feat(06-03): add ReminderForm component and wire into settings page)

Tests: 9 passed (4 reminders.test.ts + 5 route.test.ts)
