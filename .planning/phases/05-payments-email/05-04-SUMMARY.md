---
phase: 05-payments-email
plan: "04"
subsystem: payments-webhook-email
tags: [paystack, webhook, hmac, resend, react-email, security]
dependency_graph:
  requires:
    - 05-03  # orders/init route + Paystack inline popup
  provides:
    - POST /api/paystack/webhook (HMAC-verified, idempotent paid transition)
    - Resend customer receipt email
    - Resend admin new-order alert email
  affects:
    - orders table (status: pending → paid)
    - ordering_config (reads next_delivery_date for customer email)
tech_stack:
  added:
    - resend (v6.x) SDK — server-only email sends
    - "@react-email/components" — typed React Email templates
    - "crypto" (Node built-in) — HMAC-SHA512 via createHmac + timingSafeEqual
  patterns:
    - TDD (RED/GREEN) for HMAC verification helper
    - fire-and-forget email with void + catch+log (never throws)
    - req.text() before JSON parse (mandatory for HMAC body integrity)
    - idempotency via (reference + status='paid') double-check before update
key_files:
  created:
    - src/lib/paystack/verifySignature.ts
    - src/lib/paystack/verifySignature.test.ts
    - src/lib/email/resendClient.ts
    - src/lib/email/sendOrderEmails.ts
    - src/lib/email/templates/CustomerOrderReceipt.tsx
    - src/lib/email/templates/AdminNewOrderAlert.tsx
    - src/app/api/paystack/webhook/route.ts
  modified: []
decisions:
  - "timingSafeEqual on UTF-8 string buffers (not hex decode) makes comparison constant-time AND case-sensitive — Paystack always sends lowercase hex"
  - "fire-and-forget emails via void sendOrderEmails() with internal catch blocks; webhook returns 200 regardless of email outcome"
  - "Race-condition guard: update WHERE status='pending' + check RETURNING rows; no rows = concurrent webhook already won, return 200 silently"
  - "getOrderingConfig() called inside webhook for next_delivery_date; falls back to order.week_of on error to avoid blocking 200 response"
metrics:
  duration_minutes: 5
  completed_date: "2026-05-03"
  tasks_completed: 3
  tasks_total: 3
  files_created: 7
  files_modified: 0
---

# Phase 5 Plan 4: Webhook + Email Summary

**One-liner:** Paystack webhook with HMAC-SHA512 verification, idempotent `pending→paid` DB transition, and Resend React Email sends (customer receipt + admin alert) — all fail-open.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Signature helper + unit tests (TDD) | `18899fd` | `verifySignature.ts`, `verifySignature.test.ts` |
| 2 | Resend plumbing + React Email templates | `0c6010c` | `resendClient.ts`, `sendOrderEmails.ts`, `CustomerOrderReceipt.tsx`, `AdminNewOrderAlert.tsx` |
| 3 | Webhook route | `d5d36c8` | `src/app/api/paystack/webhook/route.ts` |

## Verification

- `npm run test -- src/lib/paystack/verifySignature` → 7/7 tests pass
- `npx tsc --noEmit` → clean (0 errors)
- Pre-existing failing test `OrderingClosedBanner.test.tsx` is out of scope (unrelated text-content mismatch, present before this plan)

## Implementation Notes

### Webhook route flow

```
POST /api/paystack/webhook
  1. req.text()                       — raw body (MUST be first; stream is single-pass)
  2. verifyPaystackSignature()        — HMAC-SHA512, constant-time compare, rejects with 401
  3. JSON.parse(rawBody)              — safe: signature already verified
  4. if event !== "charge.success"    — return 200 (acknowledge silently)
  5. idempotency check: reference + status='paid' → return 200 if already done
  6. fetch pending order by reference
  7. UPDATE orders SET status='paid' WHERE reference=? AND status='pending' RETURNING
  8. fetch order_items for email
  9. void sendOrderEmails(...)        — fire-and-forget (catch+log inside)
 10. return 200
```

### HMAC implementation detail

`timingSafeEqual` is used on UTF-8 string buffers (not hex-decoded bytes). This ensures:
- **Constant-time comparison** — prevents timing side-channel attacks
- **Case-sensitive** — `Buffer.from(sig, "utf8")` preserves case; uppercased hex is rejected. Paystack always sends lowercase hex so this is correct.

### Email templates

`CustomerOrderReceipt.tsx` — warm brand palette (`#c8501a` accent), itemised order, delivery date callout, customer + delivery details.

`AdminNewOrderAlert.tsx` — dark header (`#1a1a2e`), full order + prep instructions per item (highlighted), customer contact details for direct action without dashboard login.

Both rendered via `@react-email/components` `render()` and sent via `resend.emails.send()`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Case-sensitive HMAC comparison required string-level timingSafeEqual**
- **Found during:** Task 1 (TDD RED→GREEN iteration)
- **Issue:** Initial implementation used `Buffer.from(sig, "hex")` which decoded uppercase hex to the same bytes as lowercase — the test asserting case-sensitivity failed.
- **Fix:** Changed both buffers to use `Buffer.from(value, "utf8")` so the raw hex string characters are compared. Paystack sends lowercase hex; uppercase is correctly rejected.
- **Files modified:** `src/lib/paystack/verifySignature.ts`
- **Commit:** `18899fd` (within same task commit)

None of the above deviated from the plan's intent. No architectural changes.

## Known Stubs

None. All environment variables (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, `PAYSTACK_SECRET_KEY`) are properly guarded with warnings/errors at runtime if unset. No hardcoded placeholder data flows to production paths.

## Threat Flags

No new threat surface beyond what was modelled in the plan's `<threat_model>`. The webhook route is not gated by `src/middleware.ts` (only `/admin/:path*` is), which is the correct and intended configuration.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `src/lib/paystack/verifySignature.ts` | FOUND |
| `src/lib/paystack/verifySignature.test.ts` | FOUND |
| `src/lib/email/resendClient.ts` | FOUND |
| `src/lib/email/sendOrderEmails.ts` | FOUND |
| `src/lib/email/templates/CustomerOrderReceipt.tsx` | FOUND |
| `src/lib/email/templates/AdminNewOrderAlert.tsx` | FOUND |
| `src/app/api/paystack/webhook/route.ts` | FOUND |
| Commit `18899fd` (signature helper + tests) | FOUND |
| Commit `0c6010c` (Resend plumbing + templates) | FOUND |
| Commit `d5d36c8` (webhook route) | FOUND |
