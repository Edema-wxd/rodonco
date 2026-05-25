---
phase: 08-missing-admin-structures
plan: "02"
subsystem: admin-wave1-ops
tags:
  - admin
  - wave-1
  - tdd
  - settings
  - analytics
  - orders-search
dependency_graph:
  requires:
    - "08-01 — Wave 0 test stubs (schemas.test.ts RED gates, OrdersTable.test.tsx stubs)"
  provides:
    - "OPS-02 analytics week picker (WeekPickerBar + searchParams wiring)"
    - "OPS-03 orders customer search field (searchQuery useMemo filter)"
    - "OPS-05 delivery config form (DeliveryConfigForm PATCH /api/admin/config)"
    - "bulkStatusTransitionSchema export (required by Wave 2 plan 08-05)"
    - "Conditional PATCH /api/admin/config set pattern (won't zero unrelated fields)"
  affects:
    - "08-05-PLAN.md — bulkStatusTransitionSchema consumed by bulk-transition route"
    - "Customer-facing cutoff banner — next_delivery_date + cutoff_message now settable from Settings"
tech_stack:
  added: []
  patterns:
    - "TDD RED → GREEN cycle: test commit then feat commit per task"
    - "Conditional set object pattern for partial Drizzle updates"
    - "Next.js 15 async searchParams prop pattern for analytics page"
    - "useMemo haystack string for multi-field client-side search"
key_files:
  created:
    - src/components/admin/settings/DeliveryConfigForm.tsx
    - src/components/admin/analytics/WeekPickerBar.tsx
  modified:
    - src/lib/admin/schemas.ts
    - src/app/api/admin/config/route.ts
    - src/app/admin/settings/page.tsx
    - src/components/admin/orders/OrdersTable.tsx
    - src/app/admin/analytics/page.tsx
    - src/lib/admin/schemas.test.ts
    - src/components/admin/orders/OrdersTable.test.tsx
decisions:
  - "Used unique per-order emails in OrdersTable test fixtures to prevent false-positive haystack matches when all rows shared the same test email"
  - "Kept OrderingConfigPatch type derived from extended schema via z.infer — no manual type sync needed"
  - "WeekPickerBar uses defaultValue (not value) to remain uncontrolled — avoids full re-render on every keystroke"
metrics:
  duration: "6 minutes"
  completed: "2026-05-09T18:46:33Z"
  tasks_completed: 2
  files_created: 2
  files_modified: 7
---

# Phase 8 Plan 02: Wave 1 Ops Gaps — Search, Settings, Analytics Summary

Wave 1 admin operational improvements: schema extended with bulkStatusTransitionSchema and three optional fields, PATCH config route made partial-safe, customer search added to orders table, delivery config form created and wired to settings page, and analytics page accepts a week param from the URL.

## One-liner

orderingConfigPatchSchema extended to three optional fields with at-least-one refine; DeliveryConfigForm, OrdersTable search, and analytics WeekPickerBar implemented in TDD RED/GREEN cycles.

## What Was Built

### Task 1: Extend schemas.ts + update PATCH /api/admin/config (commits 59dfebb, 25c283a)

**RED commit (59dfebb):** Activated 2 previously-skipped `it.skip` OPS-05 tests in `schemas.test.ts` and added 4 new real assertions for `bulkStatusTransitionSchema` (paid→processing valid, processing→delivered valid, invalid direct hop, missing week_of). Tests failed as expected — `bulkStatusTransitionSchema` was not yet exported.

**GREEN commit (25c283a):**

`src/lib/admin/schemas.ts`:
- `orderingConfigPatchSchema` rewritten: all three fields (`is_ordering_open`, `next_delivery_date`, `cutoff_message`) now optional; `next_delivery_date` validated against `/^\d{4}-\d{2}-\d{2}$/`; `cutoff_message` capped at 300 chars; `.refine` rejects payloads where all values are `undefined` ("At least one field required")
- `bulkStatusTransitionSchema` added: `week_of` (date regex), `from_status`/`to_status` enums, `.refine` enforces only `paid→processing` or `processing→delivered` transitions
- `BulkStatusTransition` type exported via `z.infer`
- `OrderingConfigPatch` type updated to match extended schema

`src/app/api/admin/config/route.ts`:
- Old hard-coded `.set({ is_ordering_open })` replaced with conditional set object pattern — only fields present in `parsed.data` are written; `updated_at` is always set

### Task 2: UI components — DeliveryConfigForm, OrdersTable search, analytics WeekPickerBar (commits cb8f06c, 7505eb2)

**RED commit (cb8f06c):** Replaced 4 `it.todo` OrdersTable stubs with real assertions: customer_name filter, customer_phone filter, customer_email filter, and clear-search-shows-all. Tests failed — search input and `searchQuery` state did not yet exist.

**GREEN commit (7505eb2):**

`src/components/admin/settings/DeliveryConfigForm.tsx` (new):
- `"use client"` component accepting `initialNextDeliveryDate: string | null` and `initialCutoffMessage: string | null` props
- Date input (`id="next-delivery-date"`) + text input (`id="cutoff-message"`) pre-filled from props
- Save button calls `PATCH /api/admin/config` with `{ next_delivery_date, cutoff_message }`, shows `toast.success` on 200, `toast.error` on failure, calls `router.refresh()` on success
- Card styled to match `OrderingToggle` design token (`rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60`)

`src/app/admin/settings/page.tsx`:
- Imports `DeliveryConfigForm`
- Renders `<DeliveryConfigForm initialNextDeliveryDate={config.next_delivery_date} initialCutoffMessage={config.cutoff_message} />` after `<ReminderForm />` inside the `max-w-lg space-y-6` container

`src/components/admin/orders/OrdersTable.tsx`:
- New state: `const [searchQuery, setSearchQuery] = useState<string>("")`
- `useMemo` extended: computes `q = searchQuery.toLowerCase().trim()`; if `q` is non-empty, tests haystack `"${customer_name} ${customer_phone} ${customer_email}".toLowerCase().includes(q)`; `searchQuery` added to dependency array
- New search input (`id="customer-search"`, `type="search"`, placeholder "Name, phone, or email") rendered as first filter above status filter

`src/components/admin/analytics/WeekPickerBar.tsx` (new):
- `"use client"` component with `currentWeek: string` prop
- Date input (`id="analytics-week"`) using `defaultValue={currentWeek}`; `onChange` calls `router.push('/admin/analytics?week=' + value)` when value is non-empty

`src/app/admin/analytics/page.tsx`:
- Signature updated to accept `searchParams: Promise<{ week?: string }>` (Next.js 15 async pattern)
- `const { week } = await searchParams` then `getWeeklyAnalytics(week)` — passes override to existing function
- Imports and renders `<WeekPickerBar currentWeek={analytics.week} />` above StatCard grid

**Test fix (7505eb2 also):** OrdersTable test fixtures updated to use unique per-order emails — prevents false-positive haystack matches where a shared test email would match every row.

## Verification Results

All tests green after GREEN commits:

```
npx vitest run src/lib/admin/schemas.test.ts
  orderingConfigPatchSchema (extended — OPS-05) — 3 passing
  bulkStatusTransitionSchema (OPS-07) — 4 passing

npx vitest run src/components/admin/orders/OrdersTable.test.tsx
  search: filters by customer_name — passing
  search: filters by customer_phone — passing
  search: filters by customer_email — passing
  search: empty query shows all orders — passing

npx tsc --noEmit — exits 0
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] OrdersTable test fixtures used duplicate email addresses**
- **Found during:** Task 2 GREEN — `npx vitest run OrdersTable.test.tsx` reported search-by-email test passing for all rows, not just the expected one
- **Issue:** All test order fixtures shared the same `customer_email` value; the haystack search returned all rows because every order matched the email query
- **Fix:** Assigned unique email addresses to each order fixture in `OrdersTable.test.tsx`
- **Files modified:** `src/components/admin/orders/OrdersTable.test.tsx`
- **Commit:** 7505eb2 (included in GREEN task commit)

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED — schemas | 59dfebb | Confirmed failing before GREEN |
| GREEN — schemas | 25c283a | All schema tests passing |
| RED — OrdersTable search | cb8f06c | Confirmed failing before GREEN |
| GREEN — UI components | 7505eb2 | All search tests passing; tsc clean |

## Known Stubs

None — all files created in this plan are fully functional with real data wiring. The `bulkStatusTransitionSchema` export is not yet consumed (Wave 2 plan 08-05 will use it), but the schema itself is complete and tested.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundary changes introduced beyond what was modelled in the plan threat model. All three PATCH route changes operate within the existing admin auth guard and are covered by T-8-02-01 through T-8-02-05.

## Commits

| Hash | Message |
|------|---------|
| 59dfebb | test(08-02): RED — activate OPS-05 schema tests and add bulkStatusTransitionSchema tests |
| 25c283a | feat(08-02): extend schemas.ts and update PATCH /api/admin/config (OPS-05 + OPS-07) |
| cb8f06c | test(08-02): RED — activate OPS-03 OrdersTable search field tests |
| 7505eb2 | feat(08-02): delivery config form, orders search, analytics week picker (OPS-02/03/05) |

## Self-Check: PASSED

- `src/components/admin/settings/DeliveryConfigForm.tsx` — exists (107 lines at 7505eb2)
- `src/components/admin/analytics/WeekPickerBar.tsx` — exists (34 lines at 7505eb2)
- `src/lib/admin/schemas.ts` — `bulkStatusTransitionSchema` present at 25c283a
- `src/app/api/admin/config/route.ts` — `updateFields` conditional set present at 25c283a
- All 4 commits confirmed in `git log --all --oneline | grep 08-02`
