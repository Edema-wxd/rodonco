---
phase: 05-payments-email
plan: 02
subsystem: checkout-ui
tags: [checkout, paystack, cart, react-hook-form, zod, tdd]
dependency_graph:
  requires: [05-01, 05-03]
  provides: [checkout-experience-ui, cart-summary-sidebar, paystack-popup-integration]
  affects: [src/app/(customer)/checkout/page.tsx, src/app/layout.tsx]
tech_stack:
  added: ["@types/paystack__inline-js"]
  patterns: ["PaystackPop.resumeTransaction with server-generated access_code", "RHF+Zod checkout form", "Zustand hydration guard for empty-cart redirect"]
key_files:
  created:
    - src/components/checkout/CheckoutExperience.tsx
    - src/components/checkout/CheckoutCartSummary.tsx
    - src/components/checkout/CheckoutExperience.test.tsx
    - src/components/ui/checkbox.tsx
  modified:
    - src/app/(customer)/checkout/page.tsx
    - src/app/layout.tsx
    - src/test/setup.ts
    - package.json
decisions:
  - "Used PaystackPop.resumeTransaction (access_code) not newTransaction: server-generated reference and access_code from 05-03 /api/orders/init is the source of truth"
  - "Static import of @paystack/inline-js (not lazy dynamic import): vitest vi.mock works correctly with static imports; dynamic import bypasses module mocking in tests"
  - "expect cast to any in test file: vitest/globals ambient type conflicts with imported expect, blocking objectContaining/any from compiling"
metrics:
  duration: "15 minutes"
  completed: "2026-05-03"
  tasks_completed: 2
  files_changed: 8
---

# Phase 5 Plan 02: Checkout UI — Full Experience Summary

**One-liner:** Full checkout UI with RHF+Zod form, Zustand cart summary, Paystack inline popup wired to server-generated access_code, loading/cancel/success state.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Server shell + Closed state | 3888e6c | checkout/page.tsx, CheckoutExperience.tsx (stub), checkbox.tsx |
| 2 | Checkout client + cart summary + Paystack hookup | c052036 | CheckoutExperience.tsx, CheckoutCartSummary.tsx, CheckoutExperience.test.tsx, layout.tsx, test/setup.ts |

---

## What Was Built

### Checkout Server Page (`src/app/(customer)/checkout/page.tsx`)

- `export const dynamic = "force-dynamic"` forces per-request ordering config read.
- Closed state: renders `OrderingClosedBanner` + a message heading; no form or cart.
- Open state: renders `<CheckoutExperience />` client island inside `max-w-7xl` container.

### `CheckoutExperience` Client Component

- **RHF + Zod** form wired to `checkoutPayloadSchema`: name, phone (Nigerian regex), email, delivery address, allergy notes (optional), terms checkbox.
- **Empty-cart redirect (D-02):** `useEffect` watches `hasHydrated && items.length === 0`, calls `router.push("/shop")`. Shows a `Loader2` spinner before hydration to prevent flash.
- **Two-column layout (D-01):** `grid grid-cols-1 lg:grid-cols-[1fr_auto]`, `gap-8`. Cart summary sticky at `top-24`. Single column on mobile.
- **Pay Now loading state (D-03):** `isSubmitting` disables button and shows `<Loader2 animate-spin /> Processing...` while `POST /api/orders/init` is in-flight.
- **Double-submit guard (threat model):** Button `disabled` during `isSubmitting`.
- **Paystack popup (D-04, D-08):** `PaystackPop.resumeTransaction(access_code, { onSuccess, onCancel, onError })`.
  - `onCancel`: shows sonner toast "Payment cancelled — your cart is still saved.", resets `isSubmitting`.
  - `onSuccess`: calls `clearCart()` then `router.push("/order/[ref]")`.
  - `onError`: shows server error message, resets `isSubmitting`.
- **Server error display:** Red box below the terms area for `/api/orders/init` failures.

### `CheckoutCartSummary` Component

- shadcn `Card` with sticky positioning.
- Heading: "Your Order" (`text-base font-semibold`).
- Item rows: product name + variant label + quantity on left; subtotal in terracotta accent on right.
- Prep option below item name in `text-xs text-muted-foreground`.
- Divider + total row in `font-heading text-2xl`.
- Footer note: "Free delivery every Saturday".
- `formatNgn(kobo)`: `Intl.NumberFormat` NGN, divides by 100.

### Supporting Changes

- **`src/components/ui/checkbox.tsx`**: Added via `npx shadcn@latest add checkbox` (required by terms field).
- **`src/app/layout.tsx`**: Added `<Toaster richColors position="bottom-center" />` from sonner — required for cancellation toast to render (Rule 2).
- **`src/test/setup.ts`**: Added `cleanup()` in `afterEach` (prevents DOM leakage between tests) and `PointerEvent` polyfill (jsdom lacks it; Radix Checkbox requires it).

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added Sonner Toaster to root layout**
- **Found during:** Task 2
- **Issue:** `toast()` calls from sonner render nothing if `<Toaster />` is not mounted in the component tree.
- **Fix:** Added `<Toaster richColors position="bottom-center" />` to `src/app/layout.tsx`.
- **Files modified:** `src/app/layout.tsx`
- **Commit:** c052036

**2. [Rule 3 - Blocking] Test setup missing PointerEvent polyfill and cleanup**
- **Found during:** Task 2 test run
- **Issue:** jsdom doesn't implement `PointerEvent`; Radix UI Checkbox (shadcn) dispatches pointer events, causing `ReferenceError: PointerEvent is not defined` in all form-submit tests. Also, `@testing-library/react` cleanup was not wired, causing DOM accumulation across tests (multiple elements found errors).
- **Fix:** Added `PointerEvent` class polyfill and `afterEach(() => cleanup())` to `src/test/setup.ts`.
- **Files modified:** `src/test/setup.ts`
- **Commit:** c052036

**3. [Rule 3 - Blocking] Used static import for @paystack/inline-js instead of lazy dynamic import**
- **Found during:** Task 2 — initial component used `await import("@paystack/inline-js")` for bundle splitting but vitest's `vi.mock` does not intercept dynamic `import()` calls at runtime in the same way as static imports.
- **Fix:** Switched to static `import PaystackPop from "@paystack/inline-js"` which is correctly intercepted by `vi.mock`.
- **Files modified:** `src/components/checkout/CheckoutExperience.tsx`
- **Commit:** c052036

**4. [Rule 3 - Blocking] Added @types/paystack__inline-js**
- **Found during:** TypeScript compile check
- **Issue:** `@paystack/inline-js` ships no type declarations; `tsc --noEmit` reported `TS7016` implicit any.
- **Fix:** `npm i --save-dev @types/paystack__inline-js`
- **Files modified:** `package.json`, `package-lock.json`
- **Commit:** c052036

---

## Known Stubs

None. All plan deliverables are fully wired:
- Form submits to real `/api/orders/init` endpoint (from 05-03).
- Paystack popup uses real `access_code` from server response.
- Cart summary reads from live Zustand store (no mock data in production code).

---

## Threat Surface Scan

No new security-relevant surface introduced beyond what the plan's threat model covers:
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is the only Paystack key referenced in client code. The secret key is never touched.
- Double-submit prevention: button disabled during `isSubmitting` (threat model mitigation applied).

---

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `src/components/checkout/CheckoutExperience.tsx` | FOUND |
| `src/components/checkout/CheckoutCartSummary.tsx` | FOUND |
| `src/components/checkout/CheckoutExperience.test.tsx` | FOUND |
| `src/components/ui/checkbox.tsx` | FOUND |
| Commit `3888e6c` (Task 1) | FOUND |
| Commit `c052036` (Task 2) | FOUND |
| `npx tsc --noEmit` | PASS |
| `npm run test -- src/components/checkout` (10/10) | PASS |
