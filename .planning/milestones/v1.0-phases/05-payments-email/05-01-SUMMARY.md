---
phase: 05-payments-email
plan: 01
subsystem: payments
tags: [paystack, zod, nanoid, resend, react-email, checkout, kobo]

# Dependency graph
requires:
  - phase: 04-admin-panel
    provides: Drizzle schema with orders.reference column, established Route Handler patterns

provides:
  - checkoutPayloadSchema: Zod schema with Nigerian phone validation (CHKT-02)
  - buildOrderItemsDraftFromCart: CartItem[] to order_items insert shapes (integer kobo)
  - cartFingerprint: deterministic order-insensitive cart hash for D-05 retry deduplication
  - cartTotalKobo: total order value in integer kobo
  - initializePaystackTransaction: server-only Paystack POST /transaction/initialize wrapper

affects:
  - 05-02 (POST /api/orders/init uses schemas + cart helpers + Paystack wrapper)
  - 05-03 (webhook route uses same reference pattern)
  - 05-04 (checkout form uses checkoutPayloadSchema for client validation)

# Tech tracking
tech-stack:
  added:
    - "@paystack/inline-js ^2.22.8 — client-side Paystack Inline popup"
    - "resend ^6.12.2 — transactional email delivery"
    - "react-email ^6.0.5 — React Email framework"
    - "@react-email/components ^1.0.12 — prebuilt email components"
    - "nanoid ^5.1.11 — collision-resistant unique ID generation"
  patterns:
    - "import 'server-only' at top of all server-exclusive lib files"
    - "Prices always integer kobo; no float NGN on the wire or in DB"
    - "Nigerian phone validated with /^0[7-9][0-9]{9}$/ — 11 digits, 07x/08x/09x prefix"
    - "Cart fingerprint: sorted 'productId:variantLabel:prepOption:quantity' segments joined by '|'"

key-files:
  created:
    - src/lib/checkout/schemas.ts
    - src/lib/checkout/schemas.test.ts
    - src/lib/checkout/cartToOrderDraft.ts
    - src/lib/checkout/cartToOrderDraft.test.ts
    - src/lib/paystack/initialize.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Zod schema uses z.literal(true) for terms checkbox — rejects false and missing"
  - "Nigerian phone regex /^0[7-9][0-9]{9}$/ covers all NCC-assigned GSM prefixes (07x/08x/09x)"
  - "cartFingerprint is order-insensitive (sorted segments) — same cart in any array order matches"
  - "initializePaystackTransaction is server-only; PAYSTACK_SECRET_KEY validated at call time"
  - "Currency hard-coded to NGN per project scope; amount always integer kobo"

patterns-established:
  - "Pattern: TDD for all pure lib functions (schemas, helpers) — RED test then GREEN implementation"
  - "Pattern: server-only imports in paystack/* and future email/* helpers"

requirements-completed:
  - CHKT-02

# Metrics
duration: 4min
completed: 2026-05-02
---

# Phase 5 Plan 01: Dependency + Payment Foundation Summary

**Zod checkout schema with Nigerian phone validation, CartItem-to-order-items draft helpers with deterministic cart fingerprint, and server-only Paystack transaction initializer — all shared utilities for the Phase 5 payment flow**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-02T10:04:10Z
- **Completed:** 2026-05-02T10:08:14Z
- **Tasks:** 3 of 3
- **Files modified:** 7

## Accomplishments

- Installed all five Phase 5 payment/email dependencies (`@paystack/inline-js`, `resend`, `react-email`, `@react-email/components`, `nanoid`)
- Implemented `checkoutPayloadSchema` with strict Nigerian phone regex, email, terms literal, and all required checkout fields (CHKT-02 satisfied)
- Implemented `buildOrderItemsDraftFromCart`, `cartFingerprint`, `cartTotalKobo` — deterministic cart-to-DB helpers with 25 passing Vitest tests
- Implemented `initializePaystackTransaction()`: `server-only`, uses `PAYSTACK_SECRET_KEY`, calls Paystack `POST /transaction/initialize`, returns `access_code`

## Task Commits

1. **Task 1: Dependency + env alignment** - `9c686e3` (chore)
2. **Task 2: Schemas + cart draft helpers** - `4527940` (feat — TDD GREEN + tests)
3. **Task 3: Paystack initialize wrapper** - `80e5e95` (feat — includes fix for schemas test TS error)

## Files Created/Modified

- `package.json` — Added 5 new dependencies
- `package-lock.json` — Updated lockfile
- `src/lib/checkout/schemas.ts` — `checkoutPayloadSchema` + `CheckoutPayload` type
- `src/lib/checkout/schemas.test.ts` — 15 Vitest tests (valid, invalid phone, email, terms, required fields)
- `src/lib/checkout/cartToOrderDraft.ts` — `buildOrderItemsDraftFromCart`, `cartFingerprint`, `cartTotalKobo`
- `src/lib/checkout/cartToOrderDraft.test.ts` — 10 Vitest tests (mapping, integer kobo, fingerprint determinism)
- `src/lib/paystack/initialize.ts` — `initializePaystackTransaction()` server-only wrapper

## Decisions Made

- `z.literal(true)` for terms: rejects `false` and absent key (stricter than `z.boolean()`)
- Nigerian phone regex `/^0[7-9][0-9]{9}$/` covers 07x, 08x, 09x prefixes (all NCC-licensed NG mobile networks)
- Cart fingerprint sorts segments before joining so retry deduplication is order-insensitive
- `PAYSTACK_SECRET_KEY` is validated at call time (throws immediately if missing, not at module load) — better DX for environments without keys

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error: `expect(value, message)` called with 2 args**
- **Found during:** Task 3 (after running `npx tsc --noEmit`)
- **Issue:** Vitest's `expect()` only accepts one argument; second argument `message` is not a valid overload in strict TypeScript
- **Fix:** Removed the message string argument; the assertion itself is descriptive enough
- **Files modified:** `src/lib/checkout/schemas.test.ts`
- **Verification:** `npx tsc --noEmit` clean; `npm run test -- src/lib/checkout` all 25 pass
- **Committed in:** `80e5e95` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Minor TypeScript compliance fix. No scope creep.

## Issues Encountered

None — no external service auth gates, no blocking dependency issues.

## User Setup Required

Before Plan 02 can be tested end-to-end, the following environment variables must be configured in `.env.local`:

- `PAYSTACK_SECRET_KEY` — Paystack secret key (sk_test_... for sandbox, sk_live_... for production)
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` — Paystack public key for client-side Inline popup

These are not code blockers for Plan 01 (the wrapper validates at call time), but are required for POST /api/orders/init in Plan 02.

## Next Phase Readiness

- `checkoutPayloadSchema` ready for use in checkout form (Plan 04) and `/api/orders/init` (Plan 02)
- `buildOrderItemsDraftFromCart` and `cartFingerprint` ready for order creation logic (Plan 02)
- `initializePaystackTransaction` ready for `/api/orders/init` route handler (Plan 02)
- All TypeScript clean, all tests passing

---
*Phase: 05-payments-email*
*Completed: 2026-05-02*
