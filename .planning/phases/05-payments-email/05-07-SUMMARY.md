---
phase: 05-payments-email
plan: 07
subsystem: paystack-webhook
tags: [gap-closure, security]
requires: []
provides: [CHKT-06]
affects: [src/app/api/paystack/webhook/route.ts]
completed_at: "2026-05-03"
commits:
  - 9258b5e
---

# Phase 05 Plan 07: Paystack webhook amount-mismatch guard — Summary

Closed CR-01 by verifying Paystack’s charged amount (kobo) matches the stored order total before transitioning an order from `pending` → `paid`.

## What Changed

- **Added amount integrity guard**: If `payload.data.amount !== pendingOrder.total_ngn`, the webhook logs expected vs actual kobo and returns `200` with `{ received: true, mismatch: true }` to prevent Paystack retries.

## Files Changed

- `src/app/api/paystack/webhook/route.ts`

## Verification

- `grep -n "payload.data.amount" src/app/api/paystack/webhook/route.ts`
- `grep -n "mismatch" src/app/api/paystack/webhook/route.ts`
- `npx tsc --noEmit`

## Deviations from Plan

None — implemented exactly as specified in `05-07-PLAN.md`.

## Known Stubs

None.

## Threat Flags

None — change only adds an additional integrity check inside an existing verified webhook handler.

## Self-Check

PASSED

- FOUND: `.planning/phases/05-payments-email/05-07-SUMMARY.md`
- FOUND: commit `9258b5e`
