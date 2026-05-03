---
phase: 05-payments-email
verified: 2026-05-03T15:45:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "CONF-02: confirmation page renders customer name"
    - "CHKT-06/CR-01: webhook verifies charged amount matches stored total"
    - "CHKT-04/CR-02: /api/orders/init computes totals from DB-authoritative prices"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "End-to-end Paystack payment with test card"
    expected: "Customer completes checkout, Paystack popup opens, payment succeeds, webhook marks order paid, customer + admin emails sent, redirect to /order/[ref] shows correct details."
    why_human: "Requires Paystack sandbox keys + browser popup interaction + deployed webhook endpoint."
  - test: "Paystack popup cancel flow"
    expected: "Canceling Paystack popup stays on checkout with form preserved, shows toast, and Pay Now button re-enables."
    why_human: "Requires Paystack inline UI interaction in a browser."
  - test: "Email deliverability + content"
    expected: "Customer receipt + admin new-order alert arrive with correct rendered HTML and correct order details."
    why_human: "Requires live Resend API key + inbox access; deliverability cannot be verified statically."
---

# Phase 5: Payments + Email Verification Report

**Phase Goal:** A customer can complete a real NGN payment via Paystack inline popup, have their order persisted on webhook confirmation with HMAC verification and idempotency protection, receive an email confirmation, and land on an order confirmation page; admin receives a new-order alert email on every successful payment.
**Verified:** 2026-05-03T15:45:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Checkout UI at `/checkout` captures required fields and triggers Paystack inline popup without login (CHKT-01, CHKT-02, CHKT-03, CHKT-05) | ✓ VERIFIED | `src/components/checkout/CheckoutExperience.tsx` uses RHF+Zod (`checkoutPayloadSchema`), empty-cart redirect, and opens Paystack via `PaystackPop.resumeTransaction(...)`. |
| 2 | `POST /api/orders/init` creates/reuses a `pending` order and returns `{ reference, access_code, amount_kobo }` (CHKT-04) | ✓ VERIFIED | `src/app/api/orders/init/route.ts` inserts a pending order + order_items (or reuses) and returns the expected JSON. |
| 3 | Server-authoritative pricing: charged amount is computed from DB canonical prices (variants + prep extras), not client-submitted subtotals (CHKT-04 security) | ✓ VERIFIED | `src/app/api/orders/init/route.ts` queries `schema.product_variants` + `schema.product_prep_options`, computes `pricedCart` + `totalKobo`, rejects unpriceable items with 422. |
| 4 | Webhook: raw-body HMAC verified, idempotency enforced on `orders.reference`, amount matched, order transitioned `pending → paid`, and emails triggered fail-open (CHKT-06, NOTF-02, NOTF-03) | ✓ VERIFIED | `src/app/api/paystack/webhook/route.ts` reads `req.text()` first, verifies signature, checks already-paid, guards `payload.data.amount !== pendingOrder.total_ngn`, updates `status='paid'`, and calls `void sendOrderEmails(...)`. |
| 5 | Order confirmation page `/order/[ref]` loads paid order by reference and renders reference, customer name, itemised order, delivery address, and next delivery date, else error state (CONF-01, CONF-02, CONF-03) | ✓ VERIFIED | `src/app/(customer)/order/[ref]/page.tsx` loads via `getOrderForConfirmation(ref)`; `src/components/order/OrderConfirmationView.tsx` renders `{order.customer_name}` plus order details and error UI. |

**Score:** 5/5 truths verified

## Requirements Coverage (explicit IDs from request)

| Requirement | Status | Evidence |
|------------|--------|----------|
| CHKT-01 | ✓ SATISFIED | Checkout page has no auth guard; client component renders without session. |
| CHKT-02 | ✓ SATISFIED | `checkoutPayloadSchema` enforces Nigerian phone/email/terms. |
| CHKT-03 | ✓ SATISFIED | Checkout page uses ordering-config closed-state gating. |
| CHKT-04 | ✓ SATISFIED | Pending order created/reused and Paystack initialized in `src/app/api/orders/init/route.ts`. |
| CHKT-05 | ✓ SATISFIED | `PaystackPop.resumeTransaction(access_code, ...)` in `CheckoutExperience.tsx`. |
| CHKT-06 | ✓ SATISFIED | Webhook verifies signature + idempotency + amount match; marks order paid; triggers emails. |
| CHKT-07 | ✓ SATISFIED | `CheckoutExperience.tsx` routes to `/order/[ref]` after success. |
| CONF-01 | ✓ SATISFIED | `/order/[ref]` uses reference textual lookup. |
| CONF-02 | ✓ SATISFIED | `OrderConfirmationView.tsx` renders customer name + summary + address + delivery date. |
| CONF-03 | ✓ SATISFIED | Error state rendered when data null. |
| NOTF-02 | ✓ SATISFIED | Admin alert sent in `sendOrderEmails.ts` via Resend. |
| NOTF-03 | ✓ SATISFIED | Customer receipt sent in `sendOrderEmails.ts` via Resend. |

## Notable Warnings (non-blocking)

| Concern | Location | Why it matters |
|--------|----------|----------------|
| Pending reuse query claims "ORDER BY created_at DESC" but does not order | `src/lib/orders/findPendingReuse.ts` | May reuse a non-most-recent pending order depending on DB plan/default ordering. |
| After transitioning order to paid, item fetch is not guarded | `src/app/api/paystack/webhook/route.ts` | If item fetch throws after status update, Paystack retries hit the already-paid idempotency path and emails may never be sent for that order. |

## Human Verification Required

### 1. End-to-End Paystack Test Payment

**Test:** Configure Paystack test keys and complete a sandbox payment from `/checkout`.
**Expected:** Popup opens, payment succeeds, webhook marks order paid, redirect to `/order/[ref]`, customer + admin emails received.
**Why human:** Browser popup + Paystack + deployed webhook required.

### 2. Paystack Cancel Flow

**Test:** Start payment then cancel/close Paystack popup.
**Expected:** Toast appears, form preserved, Pay Now re-enabled, cart remains.
**Why human:** Requires Paystack inline UI interaction.

### 3. Email Deliverability + Rendering

**Test:** Inspect delivered Resend emails after a successful payment.
**Expected:** Customer receipt + admin alert contain correct details and render well in real inboxes.
**Why human:** Requires real inbox access; deliverability cannot be verified statically.

---

_Verified: 2026-05-03T15:45:00Z_
_Verifier: Claude (gsd-verifier)_
