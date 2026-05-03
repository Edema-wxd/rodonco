---
phase: 05-payments-email
verified: 2026-05-03T12:00:00Z
status: gaps_found
score: 4/5 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Order confirmation page displays order reference, customer name, itemised order summary, delivery address, and next Saturday delivery date"
    status: failed
    reason: "customer_name is not rendered anywhere in OrderConfirmationView.tsx. The ConfirmedOrder sub-component shows reference, delivery_address, line items, and nextDeliveryDate, but order.customer_name is never referenced or displayed. CONF-02 and Roadmap SC-5 both explicitly require it."
    artifacts:
      - path: "src/components/order/OrderConfirmationView.tsx"
        issue: "order.customer_name is available in the Order prop but never rendered in the ConfirmedOrder component. No heading like 'Thank you, [name]' or customer details section exists."
    missing:
      - "Render order.customer_name in the ConfirmedOrder component — e.g., a greeting header 'Thank you, {order.customer_name}' or a customer details block listing the name."
  - truth: "Webhook verifies charged amount matches stored order total before marking paid (money path integrity)"
    status: failed
    reason: "The webhook handler reads payload.data.reference but never reads payload.data.amount. An order is marked paid regardless of the amount Paystack reports, including test-mode events or cases where a charge was made for a different amount. This is CR-01 from the code review. The charged kobo value is never compared against pendingOrder.total_ngn."
    artifacts:
      - path: "src/app/api/paystack/webhook/route.ts"
        issue: "Step 7 (lines 123-146) transitions pending→paid using only the reference match, without verifying payload.data.amount === pendingOrder.total_ngn. The pendingOrder is fetched (step 6, lines 108-118) but its total_ngn is never compared to the Paystack-reported amount."
    missing:
      - "After fetching pendingOrder (step 6), add: if (payload.data.amount !== pendingOrder.total_ngn) { console.error('[webhook] Amount mismatch for ' + reference + ': expected ' + pendingOrder.total_ngn + ' kobo, got ' + payload.data.amount + ' kobo'); return NextResponse.json({ received: true, mismatch: true }); }"
  - truth: "Server-side price recomputation is authoritative — client cannot forge order total"
    status: failed
    reason: "cartTotalKobo() sums item.subtotalNgn from the client-submitted request body. The comment 'server recomputes — never trust client totals' is misleading: no DB price lookup occurs. A client can submit any subtotalNgn value. This is CR-02 from the code review. The initOrderSchema validates subtotalNgn is a non-negative integer but does not cross-check against DB product_variants.price_ngn."
    artifacts:
      - path: "src/app/api/orders/init/route.ts"
        issue: "Line 93 calls cartTotalKobo(cart) which sums client-submitted subtotalNgn fields. There is no DB query against product_variants or prep_options to establish canonical prices."
      - path: "src/lib/checkout/cartToOrderDraft.ts"
        issue: "cartTotalKobo sums item.subtotalNgn directly from the cart array — no server-side price authority."
    missing:
      - "Fetch canonical prices from product_variants (and prep_options if applicable) for each submitted productId/variantLabel combination, compute authoritative subtotals server-side, and reject any request where items cannot be matched to DB records."
human_verification:
  - test: "End-to-end Paystack payment with test card"
    expected: "Customer completes checkout, Paystack popup opens, test card payment succeeds, webhook fires, order transitions to paid, customer and admin receive emails, customer is redirected to /order/[ref] confirmation page showing correct details"
    why_human: "Requires Paystack sandbox credentials, browser interaction for inline popup, and a live Resend API key with accessible inboxes. Cannot be verified programmatically without these external services."
  - test: "Paystack popup cancel flow"
    expected: "Clicking cancel/close on the Paystack popup returns the customer to the checkout page with form fields still filled, a toast notification 'Payment cancelled — your cart is still saved.' appears, Pay Now button is re-enabled"
    why_human: "Requires browser interaction with the Paystack inline popup UI."
  - test: "Email deliverability — customer receipt and admin alert"
    expected: "After a successful webhook charge.success event, two emails arrive: (1) customer receives HTML receipt with order reference, items, delivery date; (2) admin receives alert with full order details including customer contact info"
    why_human: "Requires live Resend API key, working DNS for sender domain, and inbox access to verify rendered HTML and content."
---

# Phase 5: Payments + Email Verification Report

**Phase Goal:** Wire the full purchase flow end-to-end — checkout form, Paystack payment, webhook, confirmation emails, and order confirmation page.
**Verified:** 2026-05-03T12:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Checkout page at `/checkout` renders full RHF+Zod form (name, Nigerian phone, email, address, allergy notes, terms checkbox) without account; closed state shows blocked page with no form | VERIFIED | `src/app/(customer)/checkout/page.tsx` uses `force-dynamic`, reads `getOrderingConfig()`, renders `OrderingClosedBanner` + heading when closed; renders `<CheckoutExperience />` when open. `CheckoutExperience.tsx` uses `zodResolver(checkoutPayloadSchema)` with all required fields including `z.literal(true)` terms guard. |
| 2 | Submitting checkout calls `POST /api/orders/init` creating a pending order; Paystack inline popup opens with server-generated access_code | VERIFIED | `CheckoutExperience.tsx` POSTs to `/api/orders/init`, receives `{ reference, access_code, amount_kobo }`. Route creates/reuses pending order with `RDC-{nanoid(10)}` reference, calls `initializePaystackTransaction()`, returns access_code. `PaystackPop.resumeTransaction(result.access_code, ...)` opens the popup. |
| 3 | Webhook reads raw body first, verifies HMAC-SHA512 signature, performs idempotency check on `orders.reference`, sets order to `paid`, returns 200 | VERIFIED (with security caveat) | `req.text()` is first call; `verifyPaystackSignature()` uses `createHmac('sha512')` + `timingSafeEqual` on UTF-8 buffers; idempotency check queries `WHERE reference=? AND status='paid'`; `UPDATE orders SET status='paid' WHERE reference=? AND status='pending' RETURNING` with race-condition guard; returns 200. Caveat: charged amount is never verified against stored total (see gap CR-01). |
| 4 | Customer receives Resend order confirmation email and admin receives new-order alert on every `charge.success`; Resend errors caught and logged without causing non-200 response | VERIFIED | `sendOrderEmails()` in `src/lib/email/sendOrderEmails.ts` sends CustomerOrderReceipt and AdminNewOrderAlert via Resend; each send is wrapped in independent try/catch with `console.error`; called via `void sendOrderEmails(...)` (fire-and-forget) from webhook; webhook returns 200 regardless. |
| 5 | Order confirmation page at `/order/[ref]` fetches order by reference, displays order reference, **customer name**, itemised summary, delivery address, and next Saturday delivery date; not-found/not-paid renders clear error state | FAILED | Reference lookup verified (`getOrderForConfirmation` queries by `orders.reference`, enforces `status='paid'` gate). Error state renders `AlertCircle` + CTAs for not-found/not-paid. BUT `customer_name` is NOT rendered in `OrderConfirmationView.tsx` — the `ConfirmedOrder` component shows reference, delivery_address, line items, total, and delivery date but never references `order.customer_name`. This directly fails CONF-02 and Roadmap SC-5. |

**Score:** 4/5 truths verified (SC-5 failed on customer_name gap; SC-3 has security weakness but functional flow is wired)

---

### Deferred Items

No items deferred to later phases. The gaps identified are within Phase 5 scope and not addressed in Phase 6.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/checkout/schemas.ts` | checkoutPayloadSchema with Nigerian phone | VERIFIED | 29 lines; Zod schema with `nigerianPhoneRegex = /^0[7-9][0-9]{9}$/`, `z.literal(true)` for terms, `.strict()` |
| `src/lib/checkout/cartToOrderDraft.ts` | Cart-to-order-items draft + fingerprint + total | VERIFIED | Exists, substantive (buildOrderItemsDraftFromCart, cartFingerprint, cartTotalKobo) |
| `src/lib/paystack/initialize.ts` | Server-only Paystack initialize wrapper | VERIFIED | `import 'server-only'`, calls POST /transaction/initialize, returns access_code |
| `src/components/checkout/CheckoutExperience.tsx` | Full RHF+Zod checkout form + Paystack popup | VERIFIED | 272 lines; full form, empty-cart redirect, isSubmitting guard, PaystackPop.resumeTransaction, onSuccess/onCancel/onError handlers |
| `src/components/checkout/CheckoutCartSummary.tsx` | Cart summary sidebar | VERIFIED | Exists; reads Zustand items, formatNgn, sticky Card |
| `src/app/(customer)/checkout/page.tsx` | Checkout page with ordering gate | VERIFIED | force-dynamic, getOrderingConfig(), OrderingClosedBanner when closed, CheckoutExperience when open |
| `src/app/api/orders/init/route.ts` | POST /api/orders/init route handler | VERIFIED | 177 lines; Zod validation, ordering gate, server-side total, findPendingReuse, DB insert, Paystack init, returns { reference, access_code, amount_kobo } |
| `src/lib/orders/findPendingReuse.ts` | Pending order deduplication helper | VERIFIED (with warning) | Exists; queries by email+status='pending', reconstructs cartFingerprint from order_items. WARNING: missing `.orderBy(desc(created_at))` — documented comment says "LIMIT 1, ORDER BY created_at DESC" but query omits orderBy (WR-01 from code review). |
| `src/lib/paystack/verifySignature.ts` | HMAC-SHA512 signature verifier | VERIFIED | createHmac('sha512'), timingSafeEqual on UTF-8 buffers, returns boolean |
| `src/lib/email/resendClient.ts` | Resend client singleton | VERIFIED | Exists; server-only Resend client |
| `src/lib/email/sendOrderEmails.ts` | Fire-and-forget email send helper | VERIFIED | 96 lines; sends CustomerOrderReceipt + AdminNewOrderAlert; independent try/catch blocks; never throws |
| `src/lib/email/templates/CustomerOrderReceipt.tsx` | Customer receipt React Email template | VERIFIED | Exists in templates directory |
| `src/lib/email/templates/AdminNewOrderAlert.tsx` | Admin alert React Email template | VERIFIED | Exists in templates directory |
| `src/app/api/paystack/webhook/route.ts` | Webhook route handler | VERIFIED (with gaps) | 199 lines; req.text() first, HMAC verify, idempotency, pending→paid transition, fire-and-forget emails. Missing: amount verification (CR-01) |
| `src/lib/orders/getOrderForConfirmation.ts` | Order confirmation DB loader | VERIFIED | 94 lines; server-only, queries by reference, enforces paid gate, returns Order+OrderItem or null |
| `src/components/order/OrderConfirmationView.tsx` | Order confirmation presentation component | PARTIAL | 228 lines; ConfirmedOrder renders reference, delivery_address, items, total, delivery date. MISSING: `order.customer_name` is never rendered. ErrorState correctly shows AlertCircle + Back to Shop + Contact Support CTAs. |
| `src/app/(customer)/order/[ref]/page.tsx` | Order confirmation page | VERIFIED | force-dynamic, Promise.all for order + config, passes data to OrderConfirmationView |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `CheckoutExperience.tsx` | `POST /api/orders/init` | `fetch('/api/orders/init', { method: 'POST' })` | WIRED | Line 30; response destructured for reference, access_code, amount_kobo |
| `CheckoutExperience.tsx` | Paystack popup | `PaystackPop.resumeTransaction(result.access_code, { onSuccess, onCancel, onError })` | WIRED | Lines 96-118; uses server-generated access_code |
| `CheckoutExperience.tsx (onSuccess)` | `/order/[ref]` | `router.push('/order/${ref}')` after `clearCart()` | WIRED | Line 104; clearCart called before navigation (D-08) |
| `POST /api/orders/init` | `getOrderingConfig()` | Direct call with `unstable_noStore` | WIRED | Line 81; `unstable_noStore()` is called inside `getOrderingConfig` (confirmed in orderingConfig.ts) |
| `POST /api/orders/init` | `initializePaystackTransaction()` | Direct call, passes reference+amount+email | WIRED | Lines 101, 158 |
| `POST /api/paystack/webhook` | `orders` table | `UPDATE orders SET status='paid' WHERE reference=? AND status='pending'` | WIRED | Lines 123-146; Drizzle update with RETURNING |
| `POST /api/paystack/webhook` | `sendOrderEmails()` | `void sendOrderEmails(...)` | WIRED | Line 194; fire-and-forget pattern |
| `sendOrderEmails()` | Resend API | `resend.emails.send({ from, to, subject, html })` | WIRED | Lines 57-62, 82-87 |
| `getOrderForConfirmation()` | `orders` DB table | `db.select().where(eq(orders.reference, ref)).limit(1)` | WIRED | Line 33-37; textual lookup on reference column |
| `/order/[ref]/page.tsx` | `OrderConfirmationView` | Props: `data`, `errorVariant`, `nextDeliveryDate` | WIRED | Line 41-46; passes all required props |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `CheckoutExperience.tsx` | `items` (cart) | `useCartStore((s) => s.items)` (Zustand, localStorage-persisted) | Yes — Zustand store read from localStorage hydration | FLOWING |
| `OrderConfirmationView.tsx` | `data.order`, `data.items` | `getOrderForConfirmation(ref)` → Drizzle DB query | Yes — `db.select().from(orders).where(eq(reference, ref))` + `db.select().from(order_items)` | FLOWING |
| `OrderConfirmationView.tsx` | `nextDeliveryDate` | `getOrderingConfig()` → DB read with `unstable_noStore` | Yes — live DB read per request | FLOWING |

---

### Behavioral Spot-Checks

No server is running. API routes cannot be invoked without a running Next.js instance. Module-level checks performed instead.

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| verifySignature helper exists and exports function | `ls src/lib/paystack/verifySignature.ts` | File exists, 51 lines | PASS |
| sendOrderEmails is fire-and-forget (never throws) | Code inspection: two independent try/catch blocks, no re-throw | Confirmed — each send wrapped independently | PASS |
| Webhook reads raw body before JSON parse | Line 47: `rawBody = await req.text()` before line 71: `JSON.parse(rawBody)` | Confirmed correct order | PASS |
| OrderConfirmationView renders customer_name | grep customer_name in OrderConfirmationView.tsx | No matches found | FAIL |
| Webhook verifies amount before marking paid | grep `payload.data.amount` in webhook route.ts | Not found — amount is read in struct but never compared to stored total | FAIL |
| All 12 plan commits exist in git log | git log check | All 12 commit hashes verified present (9c686e3 through e740bfd) | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CHKT-01 | 05-02 | Checkout page accessible without account or login | SATISFIED | No auth guard on checkout page; getOrderingConfig() but no session required |
| CHKT-02 | 05-01 | Checkout form collects name, Nigerian phone (Zod-validated), email, delivery address, allergy notes (optional), terms | SATISFIED | checkoutPayloadSchema validates all fields; nigerianPhoneRegex enforced; z.literal(true) for terms |
| CHKT-03 | 05-02 | Checkout page renders full-screen blocked state when ordering closed | SATISFIED | checkout/page.tsx renders OrderingClosedBanner + heading when !config.is_ordering_open |
| CHKT-04 | 05-03 | POST /api/orders/init creates pending order + returns Paystack reference | SATISFIED | Route inserts order+order_items, returns { reference, access_code, amount_kobo } |
| CHKT-05 | 05-02 | Paystack inline popup opens after order init | SATISFIED | PaystackPop.resumeTransaction(access_code) called in CheckoutExperience.tsx |
| CHKT-06 | 05-04 | Webhook verifies HMAC, sets order paid, triggers notifications | PARTIAL | HMAC + idempotency + notifications: all implemented. Amount verification missing (CR-01 security gap). |
| CHKT-07 | 05-04 | User redirected to /order/[ref] after successful payment | SATISFIED | onSuccess callback: clearCart() + router.push(`/order/${ref}`) |
| CONF-01 | 05-05 | Confirmation page fetches order by Paystack reference from DB | SATISFIED | getOrderForConfirmation queries orders WHERE reference=ref |
| CONF-02 | 05-05 | Confirmation page displays: order reference, customer name, itemised summary, delivery address, next Saturday delivery date | BLOCKED | Reference, delivery_address, items, total, delivery date: all displayed. `customer_name` is NOT rendered in OrderConfirmationView.tsx. |
| CONF-03 | 05-05 | Not-found or non-paid reference renders clear error state | SATISFIED | ErrorState component with AlertCircle, heading, body copy, Back to Shop + Contact Support CTAs |
| NOTF-02 | 05-04 | Admin new-order alert email fires automatically on successful Paystack payment | SATISFIED | sendOrderEmails() sends AdminNewOrderAlert via Resend on charge.success |
| NOTF-03 | 05-04 | Customer order confirmation email fires automatically on successful payment | SATISFIED | sendOrderEmails() sends CustomerOrderReceipt via Resend on charge.success |
| INFRA-04 | 05-03 | All ordering state checks read is_ordering_open on every request — no caching | SATISFIED | getOrderingConfig() calls `unstable_noStore()` (confirmed in orderingConfig.ts line 24); checkout page uses force-dynamic; /api/orders/init calls getOrderingConfig() directly |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/api/paystack/webhook/route.ts` | 84-145 | Webhook marks order paid without verifying `payload.data.amount` against `pendingOrder.total_ngn` | Blocker (security) | An order can be marked paid for any charge amount; CR-01 from code review |
| `src/app/api/orders/init/route.ts` | 93 | `cartTotalKobo(cart)` sums client-submitted `subtotalNgn` values — server-side comment is misleading | Blocker (security) | Client controls charged amount; no DB price lookup; CR-02 from code review |
| `src/lib/orders/findPendingReuse.ts` | 44-55 | Missing `.orderBy(desc(created_at))` despite comment promising "LIMIT 1, ORDER BY created_at DESC" | Warning | Non-deterministic row selection in Postgres; WR-01 from code review |
| `src/app/api/paystack/webhook/route.ts` | 149-152 | Order items fetch after successful DB update has no try/catch | Warning | DB error after paid transition returns 500 → Paystack retry → idempotency path skips emails forever; WR-02 from code review |
| `src/components/checkout/CheckoutExperience.tsx` | 99-104 | `setIsSubmitting(false)` not called in `onSuccess` before `router.push` | Info | "Processing..." spinner shown during navigation on slow connections; IN-02 from code review |
| `src/components/checkout/CheckoutExperience.tsx` | 224 | `undefined as unknown as true` type cast for unchecked terms | Info | Misleading cast; IN-03 from code review |

---

### Human Verification Required

#### 1. End-to-End Paystack Test Payment

**Test:** Configure `.env.local` with Paystack test keys (`PAYSTACK_SECRET_KEY=sk_test_...`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...`), add at least one item to cart, navigate to `/checkout`, fill in the checkout form with a Nigerian test phone number (e.g. 08012345678), submit, and use Paystack test card `4084084084084081` to complete payment.
**Expected:** (a) Paystack popup opens successfully; (b) payment succeeds; (c) webhook fires and marks the order paid in DB; (d) customer and admin receive Resend emails (requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`); (e) browser redirects to `/order/[ref]` showing the confirmation page; (f) cart is cleared after redirect.
**Why human:** Requires Paystack sandbox credentials, live browser interaction for inline popup, live Resend API key, and inbox access to verify email deliverability and HTML rendering.

#### 2. Payment Cancellation Toast

**Test:** Open checkout with items in cart, fill form, click "Pay Now", wait for Paystack popup to open, then close/cancel it.
**Expected:** Toast notification "Payment cancelled — your cart is still saved." appears at the bottom of the page; form fields remain populated; Pay Now button re-enables; cart still contains items.
**Why human:** Requires browser interaction with Paystack popup and visual inspection of toast/button state.

#### 3. Email Content and Rendering

**Test:** After a successful test payment (see test 1), inspect received emails.
**Expected:** Customer receipt contains order reference, line items with prep options, delivery address, total in NGN, and next delivery date in formatted form (e.g. "Saturday, 10 May 2026"). Admin alert contains customer name, phone, email, and full itemised order.
**Why human:** Requires live inbox access and visual inspection of rendered React Email HTML.

---

### Gaps Summary

Three gaps block full goal achievement:

**Gap 1 — CONF-02: Missing customer_name in order confirmation** (functional gap)
`OrderConfirmationView.tsx` renders the reference, delivery address, line items, and delivery date but never displays `order.customer_name`. CONF-02 and Roadmap SC-5 explicitly require it. The data is available in the `Order` prop — it is simply not rendered. This is a straightforward omission, not a wiring failure.

**Gap 2 — CR-01: Webhook amount not verified** (security gap on money path)
The webhook transitions an order from `pending` to `paid` based on reference match alone. `payload.data.amount` is present in the typed interface but never compared against the stored `pendingOrder.total_ngn`. An order can be marked paid regardless of the kobo amount Paystack reports charging. A one-line comparison before the status update would close this gap.

**Gap 3 — CR-02: Client-controlled order total** (security gap on money path)
The `/api/orders/init` comment says "server recomputes — never trust client totals" but the implementation sums `subtotalNgn` from the client-submitted cart array. No DB price lookup occurs. A customer can submit ₦1 subtotals for ₦50,000 products and have a real Paystack transaction initialised for that fraudulent amount. True remediation requires DB price lookup against `product_variants`.

**Root cause grouping:** Gaps 2 and 3 share a root cause — price/amount authority was not established end-to-end. Both the order creation step (Gap 3) and the payment confirmation step (Gap 2) trust external/client data for the monetary amount. A single focused plan addressing both (DB price lookup in init + amount comparison in webhook) would close both together.

---

_Verified: 2026-05-03T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
