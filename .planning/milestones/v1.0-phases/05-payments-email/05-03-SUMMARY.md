---
phase: 05-payments-email
plan: "03"
subsystem: orders-api
tags:
  - payments
  - orders
  - api
  - tdd
dependency_graph:
  requires:
    - 05-01  # checkout schemas, cartToOrderDraft helpers, Paystack wrapper
  provides:
    - POST /api/orders/init (pending order creation + Paystack initialize)
    - findPendingReuse (pending order deduplication helper)
  affects:
    - Checkout flow client (will call this route)
    - Paystack webhook (consumes orders.reference)
tech_stack:
  added:
    - nanoid (reference generation, already installed in 05-01)
  patterns:
    - TDD (RED → GREEN) for both tasks
    - Zod validation before any DB write
    - Server-side cart total recompute (forged-total threat mitigation)
    - findPendingReuse: query-then-fingerprint-compare (no schema migration needed)
key_files:
  created:
    - src/lib/orders/findPendingReuse.ts
    - src/lib/orders/findPendingReuse.test.ts
    - src/app/api/orders/init/route.ts
    - src/app/api/orders/init/route.test.ts
  modified: []
decisions:
  - "Pending-order reuse implemented without schema migration: query order_items to reconstruct fingerprint, compare in application code rather than storing fingerprint column"
  - "Cart total recomputed server-side from submitted CartItem.subtotalNgn — forged-total threat is fully mitigated (D-07 + threat model)"
  - "Route returns 422 (Unprocessable Entity) for ordering-closed, 503 for Paystack failure — distinct codes aid client error handling"
metrics:
  duration: "~6 minutes"
  completed: "2026-05-02"
  tasks: 2
  files: 4
requirements:
  - CHKT-04
  - INFRA-04
---

# Phase 5 Plan 03: POST /api/orders/init + Pending Reuse Helper Summary

**One-liner:** `POST /api/orders/init` creates/reuses a pending order, calls Paystack transaction initialize, and returns `{ reference, access_code, amount_kobo }` for inline checkout.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Pending reuse helper (TDD) | 916d7e6 | src/lib/orders/findPendingReuse.ts + test |
| 2 | Route handler (TDD) | 744e3da | src/app/api/orders/init/route.ts + test |

## Implementation Notes

### Task 1: `findPendingReuse`

Queries the most recent `pending` order by customer email, then reconstructs a cart fingerprint from stored `order_items` using the same algorithm as `cartFingerprint()` from `cartToOrderDraft.ts`. Returns the order if fingerprints match, `null` otherwise.

**Design decision:** No `cart_fingerprint` column added to schema (avoided migration). The fingerprint comparison is done in application code by fetching `order_items` and reconstructing the sorted segment string. Acceptable for MVP with low concurrent volume.

**Documented limits:**
- Only the most recent pending order per email is checked (LIMIT 1)
- DB errors return null safely (caller creates a new order instead)

### Task 2: `POST /api/orders/init`

Full route handler with:
- Zod validation of checkout payload + cart items (400 on invalid)
- Ordering window enforcement via `getOrderingConfig()` with `unstable_noStore` (422 if closed)
- Server-side total recompute from `CartItem.subtotalNgn` — forged totals are rejected by design
- Pending order reuse check via `findPendingReuse` (CONTEXT D-05)
- New order creation: `RDC-{nanoid(10)}` reference, insert `orders` + `order_items`
- Paystack `initializePaystackTransaction` call with reference, amount, metadata
- Returns `{ reference, access_code, amount_kobo }` for Paystack Inline JS
- 503 on Paystack failure without leaking internal error details

## Test Coverage

| Surface | Tests | Pass |
|---------|-------|------|
| findPendingReuse unit tests | 5 | 5/5 |
| Route validation (400) | 7 | 7/7 |
| Ordering closed guard (422) | 1 | 1/1 |
| New order success path (200) | 3 | 3/3 |
| Pending order reuse path | 1 | 1/1 |
| Paystack error handling (503) | 1 | 1/1 |
| No stack trace leakage | 1 | 1/1 |
| POST-only export check | 1 | 1/1 |
| **Total** | **20** | **20/20** |

## Deviations from Plan

### Out-of-scope pre-existing failure
`src/components/shop/OrderingClosedBanner.test.tsx` has a pre-existing test failure (text mismatch: test expects `"Ordering is closed."` but component renders `"Ordering is currently closed."`). This failure existed before Plan 03 execution and is not caused by these changes. Logged to deferred-items.

## Known Stubs

None — all data paths are wired. The route reads live DB data and calls Paystack.

## Threat Flags

None — no new network endpoints or auth paths beyond what the plan specified.

## Self-Check

Files created:
- src/lib/orders/findPendingReuse.ts: FOUND
- src/lib/orders/findPendingReuse.test.ts: FOUND
- src/app/api/orders/init/route.ts: FOUND
- src/app/api/orders/init/route.test.ts: FOUND

Commits:
- 395c63a: test(05-03): add failing tests for findPendingReuse helper
- 916d7e6: feat(05-03): implement findPendingReuse pending order helper
- cc70a21: test(05-03): add failing tests for POST /api/orders/init route
- 744e3da: feat(05-03): implement POST /api/orders/init route handler

## Self-Check: PASSED
