---
phase: 05-payments-email
plan: "05"
subsystem: order-confirmation
tags: [confirmation-page, server-component, order-lookup, error-state]
dependency_graph:
  requires: [05-03, 05-04]
  provides: [CONF-01, CONF-02, CONF-03]
  affects: [customer-flow]
tech_stack:
  added: []
  patterns: [server-component-data-fetch, parallel-promise-all, buttonVariants-link-pattern]
key_files:
  created:
    - src/lib/orders/getOrderForConfirmation.ts
    - src/components/order/OrderConfirmationView.tsx
  modified:
    - src/app/(customer)/order/[ref]/page.tsx
decisions:
  - "Used Promise.all for parallel order + ordering-config fetch in page"
  - "Used buttonVariants helper (not Button+asChild) — base-ui Button has no asChild prop"
  - "Date formatted via UTC midnight parse to avoid YYYY-MM-DD timezone shift"
  - "Single error variant 'not-found' displayed for both missing ref and non-paid status at MVP; avoids second DB query"
metrics:
  duration_minutes: 3
  completed_date: "2026-05-03"
  tasks_completed: 2
  files_changed: 3
---

# Phase 05 Plan 05: Order Confirmation Page Summary

Shipped `/order/[ref]` confirmation page: server-loads order + items by `reference` field, enforces `paid` gate for happy path vs explicit error UX for missing or non-paid references.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Loader helper | 2fd8361 | src/lib/orders/getOrderForConfirmation.ts |
| 2 | Page + presentation component | e740bfd | src/app/(customer)/order/[ref]/page.tsx, src/components/order/OrderConfirmationView.tsx |

## What Was Built

### `getOrderForConfirmation` (Task 1)

Server-only helper at `src/lib/orders/getOrderForConfirmation.ts`:
- Looks up order by `reference` column (textual lookup, satisfies CONF-01)
- Enforces `paid` gate — returns `null` for non-paid orders (CONF-02)
- Returns `null` for unknown references (CONF-03)
- Maps DB rows to `Order` + `OrderItem` domain types from `src/types/index.ts`
- Handles `Date` → ISO string conversion for `created_at` / `notified_at`
- Safe fallback: DB errors return `null` (caller renders error state)

### `OrderConfirmationView` (Task 2)

Presentation-only Server Component at `src/components/order/OrderConfirmationView.tsx`:
- **Happy path:** reference badge (accent colour), delivery address + formatted next delivery date, itemised line items with prep options, total in NGN, "Continue Shopping →" CTA
- **Error state:** AlertCircle icon, variant-specific heading + body copy per UI-SPEC, "Back to Shop" + "Contact Support" CTAs
- `formatDeliveryDate()` parses `YYYY-MM-DD` as UTC midnight to avoid day-shift artefacts
- `formatNGN()` converts kobo to NGN display string
- Uses `buttonVariants` + `Link`/`<a>` (not `Button asChild`) — base-ui `ButtonPrimitive` has no `asChild` prop

### `/order/[ref]` page (Task 2)

Server Component page at `src/app/(customer)/order/[ref]/page.tsx`:
- `Promise.all` for parallel order data + `ordering_config` fetch
- Passes `nextDeliveryDate` from `ordering_config` to presentation component
- `force-dynamic` to ensure per-request DB reads

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `Button asChild` prop not supported by base-ui ButtonPrimitive**
- **Found during:** Task 2 — TypeScript check after initial implementation
- **Issue:** `@base-ui/react/button` does not expose an `asChild` prop; shadcn standard Button uses Radix Slot but this project uses base-nova preset with base-ui
- **Fix:** Replaced `<Button asChild>` wrapping `<Link>` with `<Link className={cn(buttonVariants(...))}>`; adds `cn` import from `@/lib/utils`
- **Files modified:** `src/components/order/OrderConfirmationView.tsx`
- **Commit:** e740bfd

## Known Stubs

None — all displayed data is sourced directly from the DB order row and its items.

## Threat Flags

None — `/order/[ref]` is a read-only page. Reference enumeration is a low-severity risk acknowledged in the plan's threat model (MVP acceptable; rate-limit future).

## Self-Check: PASSED

- [x] `src/lib/orders/getOrderForConfirmation.ts` exists — FOUND
- [x] `src/components/order/OrderConfirmationView.tsx` exists — FOUND
- [x] `src/app/(customer)/order/[ref]/page.tsx` modified — FOUND
- [x] Commit 2fd8361 exists — FOUND
- [x] Commit e740bfd exists — FOUND
- [x] `npx tsc --noEmit` passes — PASSED
