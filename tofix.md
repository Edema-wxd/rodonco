# tofix.md

Open findings from the payment-system review (2026-05-28), admin-perf review, and minor leftovers. Each item has a stable ID so prompts can reference them without restating context.

Severity legend: **C** = critical (money / data loss) · **H** = high (customer-visible bug) · **M** = medium (operational pain) · **L** = low / polish.

---

## ✅ Already shipped (do not re-fix)

- **C1, C2, C3, H3, L5** — Reused-pending-order data integrity (init route + `findPendingReuse`).
- **C4** — `validateEnv` now throws in production if Upstash vars missing; runtime degradation writes to `activity_logs` with per-route 60s dedup.
- Admin perf: scoped `order_items` queries, `getAdminOrders({ limit })`, streamed sidebar badges via Suspense, perf indexes migration applied (`0005_admin_perf_indexes.sql`).
- Orders pagination (load-more button, keyset cursor, 25-row batches).
- Cart can be added when ordering is closed (`ProductDrawer.tsx`).
- Drag-and-drop image upload + progress bar (admin product editor).

---

## 🔴 Critical / unverified

### CHK1 — Confirm checkout actually blocks when `isOrderingOpen=false`
**Where**: anywhere that consumes the cart and hits `/api/orders/init`.
**Context**: when fixing the Product Drawer (cart add now works when ordering is closed), the assumption was that `/api/orders/init` and/or `/checkout` page already enforce the gate. `/api/orders/init/route.ts:93-98` does check `config.is_ordering_open` and returns 422. `/checkout/page.tsx:10-26` also renders an `OrderingClosedBanner` instead of the form when closed. **Likely fine, but never explicitly verified end-to-end with an integration test.**
**Acceptance**: a Playwright/Vitest test that simulates closed ordering → add to cart → navigate to checkout → asserts either the form is not rendered OR the init endpoint returns 422.

---

## 🟠 High

### H1 — Confirmation page can't distinguish "not paid yet" from "doesn't exist"
**File**: `src/app/(customer)/order/[ref]/page.tsx:38-40` (hard-coded `errorVariant = "not-found"`).
**Context**: `getOrderForConfirmation` returns `null` for both "no row" and "row exists but status≠paid". A customer who refreshes during the webhook window sees a scary "not found" message and may re-pay.
**Fix**: do a second status-only query (`SELECT status FROM orders WHERE reference = $1`) when `getOrderForConfirmation` returns null. If the row exists but is `pending`, render an `errorVariant = "pending"` state with copy like "Your payment is being confirmed — refresh in a moment." If no row, keep `"not-found"`.
**Acceptance**: `OrderConfirmationView` receives `pending` variant for a stub pending order; `not-found` for a non-existent ref. Unit test in `getOrderForConfirmation` covers both.

### H2 — Webhook silently 200s `charge.failed`, refunds, disputes
**File**: `src/app/api/paystack/webhook/route.ts:85-88`.
**Context**: only `charge.success` is processed. Everything else returns `{received: true}` with no DB side effect. Refunds (`refund.processed`) should mark orders accordingly; failed charges (`charge.failed`) should log so ops can see the failure rate.
**Fix**:
- For `charge.failed`: write an `activity_logs` row (`system.payment_failed` — add to ActivityAction union) with the reference + reason in `details`. Don't mutate the order; pending stays pending.
- For `refund.processed`: lookup order by reference, transition to a new `refunded` status (add to schema enum + admin filter dropdown), log to activity.
- For `charge.dispute.create`: log only — admin needs to act manually.
**Acceptance**: three new branches in the webhook with integration tests; admin filter dropdown can show refunded orders.

---

## 🟡 Medium

### M1 — `/order/[ref]` exposes PII to anyone with the URL
**File**: `src/app/(customer)/order/[ref]/page.tsx`.
**Context**: name, email, phone, delivery address visible to anyone who learns the reference. URLs leak via browser history, support tickets, screenshots.
**Fix**: set a short-lived signed HTTP-only cookie on the payment-success client redirect (in `CheckoutExperience.tsx onSuccess`). Confirmation page checks the cookie before rendering; absence → render a stripped-down "your order is confirmed" view with only the reference and total, no PII. Cookie TTL ~ 24h is enough for re-loads.
**Acceptance**: requesting `/order/{ref}` without the cookie returns the stripped view; with cookie, full PII renders.

### M2 — `orders.notified_at` is never written
**Files**: `src/lib/email/sendOrderEmails.ts`, `src/app/api/paystack/webhook/route.ts:171-211`.
**Context**: the column exists, the webhook calls `sendOrderEmails` fire-and-forget but never writes `notified_at`. No way to know which paid orders successfully emailed.
**Fix**: in `sendOrderEmails`, after both Resend calls resolve, `UPDATE orders SET notified_at = NOW() WHERE id = $1`. On failure (either call rejects), log to `activity_logs` (`system.email_send_failed` — new action) and leave `notified_at` null.
**Acceptance**: paid order with successful emails has `notified_at` set; admin can filter for "paid orders with unsent emails" via `notified_at IS NULL AND status = 'paid'`.

### M3 — Amount-mismatch only logs to `console.error`
**File**: `src/app/api/paystack/webhook/route.ts:128-135`.
**Context**: when Paystack reports an amount that doesn't match the stored `total_ngn`, we 200 the webhook and only `console.error`. Money has moved; we have no signal in the product UI.
**Fix**: write to `activity_logs` with `system.payment_amount_mismatch` (new action), including `reference`, `expected_kobo`, `received_kobo` in details. Reuse the same dedup-less write — these should be rare and individually actionable.
**Acceptance**: trigger a mismatch in test; row appears in admin Activity feed with amber alert styling.

### M4 — `abandoned_carts` accumulates duplicates per email
**File**: `src/app/api/orders/draft/route.ts:59-67`.
**Context**: every step-1 checkout submission inserts a new row, with no dedup. A customer who clicks Continue 5 times appears 5 times in the admin abandoned-carts view.
**Fix**: change the insert to `ON CONFLICT (customer_email) DO UPDATE SET cart_items = EXCLUDED.cart_items, subtotal_ngn = EXCLUDED.subtotal_ngn, allergy_notes = EXCLUDED.allergy_notes, delivery_address = EXCLUDED.delivery_address, customer_phone = EXCLUDED.customer_phone, customer_name = EXCLUDED.customer_name, contacted_at = NULL, created_at = NOW()`. Requires a UNIQUE constraint on `abandoned_carts.customer_email` — new migration `0006_abandoned_carts_email_unique.sql`. Will need to dedup existing rows before adding the constraint.
**Acceptance**: 3 consecutive draft submissions for the same email leave 1 row, with the latest cart contents.

### M5 — Cart not cleared if user closes Paystack popup after charge succeeds
**File**: `src/components/checkout/CheckoutExperience.tsx:167`.
**Context**: `clearCart()` only fires in the `onSuccess` JS callback. If the user closes the popup after Paystack processes but before the callback runs, the order is paid but the local cart is intact — they might re-checkout the same items.
**Fix**: poll `/api/orders/status?ref={reference}` (new lightweight endpoint that returns only `{ status }`) when the page regains focus after the popup opens. If status changes to `paid`, clear the cart and redirect to `/order/{ref}`.
**Acceptance**: simulate popup-close-after-payment in a test; cart is cleared on next page-focus event.

---

## 🟢 Low / polish

### L1 — `validateEnv` doesn't hard-assert `PAYSTACK_SECRET_KEY` or `DATABASE_URL`
**File**: `src/lib/validateEnv.ts`.
**Context**: both are required for the payment flow to function. Missing them only fails at first webhook / first query — not at boot. Now that Upstash is hard-asserted (C4), the asymmetry is glaring.
**Fix**: add two `if (!process.env.X) throw new Error("...")` blocks for `PAYSTACK_SECRET_KEY` and `DATABASE_URL`, applying in all environments (not gated on `NODE_ENV`). Update `validateEnv.test.ts` to cover both.
**Acceptance**: deleting either var from `.env.local` causes the dev server to fail to start.

### L2 — Reference prefix collision risk between environments
**File**: `src/app/api/orders/init/route.ts:194` (`RDC-${nanoid(10)}`).
**Context**: if test and prod ever share a database (they shouldn't, but humans), references can collide visually in admin views, even with the unique constraint. A prefix per env would help triage.
**Fix**: derive the prefix from `NODE_ENV` or an explicit `REF_PREFIX` env var — `RDC-` in prod, `RDC-TEST-` in dev.
**Acceptance**: dev orders all show the `TEST-` infix in the admin.

### L3 — `getOrderForConfirmation` conflates DB errors with 404
**File**: `src/lib/orders/getOrderForConfirmation.ts:89-92`.
**Context**: any thrown error returns `null` → caller renders "not found." Hides real outages from on-call.
**Fix**: rethrow on unexpected errors (or return a discriminated union `{ kind: "ok"|"not-found"|"not-paid"|"error" }`). Caller renders a 500-like state for real errors.
**Acceptance**: a thrown DB error produces a distinct UI state, not "not found."

### L4 — Paystack inline JS load error has no retry guidance
**File**: `src/components/checkout/CheckoutExperience.tsx:160` (dynamic import).
**Context**: if the dynamic `import("@paystack/inline-js")` fails (network blip, ad-blocker), the customer sees a generic toast with no path forward.
**Fix**: catch the import failure separately; show a dedicated message ("Could not load payment provider — disable ad blocker or refresh"). Add a retry button.
**Acceptance**: blocking the Paystack CDN in DevTools shows the dedicated error + retry, not the generic one.

### L6 — `activity_logs` needs `created_at` index
**Where**: schema + new migration.
**Context**: the Activity feed sorts by `desc(created_at)` (`activityLog.ts:55-61`) but the column has no index. Will get slow as the table grows.
**Fix**: `CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs (created_at DESC);` in a new migration file.
**Acceptance**: `EXPLAIN ANALYZE` on the activity feed query shows an index scan.

---

## Admin polish (deferred from earlier work)

### ADM1 — Paginate `/admin/abandoned-carts`
**Files**: `src/lib/admin/abandonedCarts.ts`, `src/app/admin/abandoned-carts/page.tsx`, `src/components/admin/abandoned-carts/AbandonedCartsTable.tsx`.
**Context**: still calls `getAbandonedCarts()` with no limit. Grows with every step-1 checkout submission.
**Fix**: mirror the orders pagination — `getAbandonedCarts({ limit?, cursor? })`, server action in `src/app/admin/abandoned-carts/_actions.ts`, constants in `_constants.ts`, load-more button in the table component. Cursor on `(created_at DESC, id DESC)`.
**Acceptance**: page renders first 25, "Load more" appends, button hides when last batch < 25.

### ADM2 — Paginate `/admin/activity`
**Files**: `src/lib/admin/activityLog.ts` (the `getActivityLogs(limit)` already supports a single limit but no cursor), `src/app/admin/activity/page.tsx`.
**Context**: `activity_logs` grows on every admin action + every system event we just added. Will outgrow the current limit.
**Fix**: same pattern as ADM1; cursor on `(created_at DESC, id DESC)`. Pairs naturally with L6's index.
**Acceptance**: scroll through 100+ activity rows in 25-row batches.

### ADM3 — Server-side filters for `/admin/orders`
**File**: `src/components/admin/orders/OrdersTable.tsx`.
**Context**: Search/Status/Week filters only filter the already-loaded 25 rows. A "delivered" filter with 0 hits in the first batch is misleading — the admin has to keep loading more.
**Fix**: hoist filter state into URL search params (`?status=delivered&week=2026-06-06&q=ada`), pass them into `getAdminOrders({ filters: { status, weekOf, search } })`. Server-side filter clauses + the existing cursor.
**Acceptance**: filtering "delivered" returns all delivered orders without needing to load more.

### ADM4 — Show total count next to "Showing N orders"
**File**: `OrdersTable.tsx`, server action.
**Context**: admin doesn't know if there are 30 more or 3000 more to load.
**Fix**: extend `getAdminOrders` to optionally return `{ rows, totalCount }`. Compute via `SELECT count(*)`. Or expose a separate cheap `getAdminOrdersCount()` and fetch in parallel with the first page.
**Acceptance**: UI reads "Showing 25 of 437 orders."

---

## ============================================================
## Ready-to-use prompts
## ============================================================

Drop one of these into a fresh Claude Code session. Each prompt is self-contained but anchors in `tofix.md` so the agent doesn't re-derive context.

---

### Prompt — L1 (validateEnv hard-asserts)

```
Read tofix.md and implement L1.

Constraints:
- Both asserts (PAYSTACK_SECRET_KEY, DATABASE_URL) apply in all environments, not gated on NODE_ENV.
- Match the existing error-message style in src/lib/validateEnv.ts.
- Update src/lib/validateEnv.test.ts: ensure happy-path test has both vars set; add two failure tests.

Verify: `npx vitest run src/lib/validateEnv.test.ts && npx tsc --noEmit`.

Don't change anything else. Don't touch L2-L6.
```

---

### Prompt — M3 (amount-mismatch → activity_logs)

```
Read tofix.md and implement M3.

Steps:
1. Add "system.payment_amount_mismatch" to the ActivityAction union in src/lib/admin/activityLog.ts.
2. In src/app/api/paystack/webhook/route.ts:128-135, before returning 200, call logActivity with adminEmail "system", action "system.payment_amount_mismatch", entityLabel: reference, details: { expected_kobo, received_kobo }. Fire-and-forget with .catch swallow.
3. In src/components/admin/activity/ActivityFeed.tsx, add a meta entry for the new action — red AlertOctagon icon, label like `Amount mismatch on {entity_label}` so it screams in the feed.
4. Keep the existing console.error.

Verify: `npx tsc --noEmit`. The webhook still returns 200.

Don't expand scope. Don't add the dedup machinery (mismatches are rare; we want one row per occurrence).
```

---

### Prompt — H1 (confirmation page pending vs not-found)

```
Read tofix.md and implement H1.

Steps:
1. In src/lib/orders/getOrderForConfirmation.ts, change the return type to a discriminated union:
   { kind: "paid", order, items } | { kind: "pending" } | { kind: "not-found" } | { kind: "error" }.
2. Update the function logic accordingly — separate "no row found" from "found but status != paid".
3. In src/app/(customer)/order/[ref]/page.tsx, branch on result.kind. Map "pending" to a new errorVariant "pending".
4. In src/components/order/OrderConfirmationView.tsx, add the "pending" variant — copy: "Your payment is being confirmed. Refresh in a moment or check your email." Include a refresh button.

Verify: `npx vitest run src/lib/orders` and visit /order/<ref-of-pending-order> in dev.

This will touch 3 files. Don't refactor anything not listed.
```

---

### Prompt — H2 (charge.failed, refunds, disputes)

```
Read tofix.md and implement H2.

Steps:
1. Add to ActivityAction union: "system.payment_failed", "order.refunded", "system.payment_disputed".
2. New migration supabase/migrations/0007_order_status_refunded.sql — no schema change needed (status is text), but document the new value.
3. In src/app/api/paystack/webhook/route.ts, after the existing `if (payload.event !== "charge.success")` branch, route on event type:
   - "charge.failed": find order by reference; if found and status === "pending", log activity (no status change — refund.processed handles real failures).
   - "refund.processed": find order; if paid, UPDATE status to "refunded"; log activity.
   - "charge.dispute.create": log only (admin acts manually).
4. Update OrdersTable status filter dropdown to include "Refunded".
5. Update STATUS_STYLES in src/app/admin/page.tsx and OrderStatusSelect to handle "refunded" (slate or stone color).

Verify: `npx vitest run src/app/api/paystack` and `npx tsc --noEmit`.

Don't add refund-initiation flow on the admin side — webhook-driven only for now.
```

---

### Prompt — M1 (auth gate on /order/[ref])

```
Read tofix.md and implement M1.

Approach:
1. In src/components/checkout/CheckoutExperience.tsx onSuccess, before router.push, set a cookie `order_view_<ref>=1` via document.cookie with maxAge=86400 and SameSite=Lax. (Or call a tiny server action that sets HttpOnly — preferred for security.)
2. In src/app/(customer)/order/[ref]/page.tsx, read the cookie via next/headers. If present, render full view. If absent, render a stripped variant — reference + total + thank-you copy, no PII.
3. Add OrderConfirmationView variant "stripped".

Verify: open /order/<ref> in an incognito window — should show stripped variant.

Cookie name must be reference-scoped (one per order) so the gate isn't bypassed by completing any single purchase.
```

---

### Prompt — M2 (notified_at + email failure log)

```
Read tofix.md and implement M2.

Steps:
1. In src/lib/email/sendOrderEmails.ts, after both Resend calls resolve, `UPDATE orders SET notified_at = NOW() WHERE id = $1` via drizzle.
2. On rejection from either Resend call, log to activity_logs with action "system.email_send_failed" (add to union), entityLabel: reference, details: { error: err.message }.
3. Wrap the existing sendOrderEmails body in a try/catch so the new logging fires.

Verify: `npx vitest run src/lib/email`.

Don't add retries — that's a separate, larger fix. Just log + write the timestamp on success.
```

---

### Prompt — M4 (abandoned_carts dedup)

```
Read tofix.md and implement M4.

Steps:
1. Write supabase/migrations/0006_abandoned_carts_email_unique.sql:
   - Delete duplicates keeping the most-recent row per email (use ROW_NUMBER + DELETE).
   - Add `ALTER TABLE abandoned_carts ADD CONSTRAINT abandoned_carts_customer_email_unique UNIQUE (customer_email);`.
2. Update drizzle/schema.ts to mark customer_email .unique() on abandoned_carts.
3. In src/app/api/orders/draft/route.ts, change the .insert to .insert(...).onConflictDoUpdate({ target: schema.abandoned_carts.customer_email, set: { ...all editable fields..., contacted_at: null, created_at: sql`NOW()` } }).

Verify: submit /api/orders/draft twice with the same email; only one row should exist.

Apply migration manually after merge — don't auto-run.
```

---

### Prompt — M5 (cart-clear on background webhook success)

```
Read tofix.md and implement M5.

Steps:
1. New endpoint src/app/api/orders/status/route.ts — GET `?ref=...` returns `{ status }` (string only, no PII). Rate-limit at 30/min/IP.
2. In src/components/checkout/CheckoutExperience.tsx, after Paystack popup opens, attach a window "focus" listener. On focus, fetch `/api/orders/status?ref={reference}`; if `status === "paid"`, clearCart() and router.push(`/order/${reference}`).
3. Remove the listener on unmount and after successful redirect.

Verify: in dev, start a payment, switch tabs, mark the order paid manually in DB, switch back — should redirect.

The window-focus poll is intentionally cheap — no setInterval. Don't add WebSocket / SSE.
```

---

### Prompt — L6 + ADM1 (activity_logs index + abandoned-carts pagination)

```
Read tofix.md and implement L6 then ADM1 in a single PR.

L6: new migration supabase/migrations/0008_activity_logs_index.sql adding `activity_logs_created_at_idx`.

ADM1: mirror the orders-pagination work:
- src/app/admin/abandoned-carts/_constants.ts — ABANDONED_CARTS_PAGE_SIZE = 25.
- src/app/admin/abandoned-carts/_actions.ts — loadMoreAbandonedCartsAction with auth check, keyset cursor on (created_at DESC, id DESC).
- Extend getAbandonedCarts({ limit?, cursor? }) in src/lib/admin/abandonedCarts.ts.
- Update AbandonedCartsTable.tsx with state, hasMore, useTransition, load-more button — copy the OrdersTable shape verbatim.
- Update page.tsx to fetch first 25.

Verify: `npx vitest run` and visit /admin/abandoned-carts.

Match the orders pagination patterns exactly — don't invent new ones.
```

---

### Prompt — ADM3 (server-side filters for /admin/orders)

```
Read tofix.md and implement ADM3.

This is the largest of the remaining items.

Steps:
1. Extend src/lib/admin/orders.ts:
   - getAdminOrders({ limit?, cursor?, filters? }) where filters: { status?: string, weekOf?: string, search?: string }.
   - Build WHERE clauses with drizzle's `and(...)`. Search filters via `or(ilike(name), ilike(email), ilike(phone))`.
2. Update loadMoreOrdersAction to accept filters.
3. In OrdersTable.tsx, hoist statusFilter/weekFilter/searchQuery into URL search params via next/navigation's useSearchParams + router.replace. On filter change, reset the orders list to first batch + new filters.
4. Server-side filters mean the client-side useMemo filter must go.

Verify: `npx vitest run src/lib/admin/orders.test.ts src/components/admin/orders/OrdersTable.test.tsx` and apply filters in dev.

This is bigger — expect ~150 line diff. Keep ADM4 (count) for a follow-up.
```

---

### Prompt — CHK1 (verify ordering-closed gate end-to-end)

```
Read tofix.md and implement CHK1.

This is a verification task — no production code changes expected unless a gap is found.

Steps:
1. Manually trace: when isOrderingOpen=false, what blocks a customer from completing a checkout? Confirm both:
   a. /checkout page renders OrderingClosedBanner instead of the form (verified at src/app/(customer)/checkout/page.tsx:10-26).
   b. /api/orders/init returns 422 (verified at src/app/api/orders/init/route.ts:93-98).
2. Write a Vitest integration test for /api/orders/init that asserts 422 when getOrderingConfig returns is_ordering_open=false.
3. If you find a path where the cart submits without either gate firing — STOP and report; don't try to fix it without confirming the design.

Verify: new test runs and passes.

Don't touch ProductDrawer — the cart-add gate was deliberately removed.
```

---

## Quick reference — IDs

| ID | One-liner |
|----|-----------|
| CHK1 | Verify ordering-closed gate is enforced server-side |
| H1   | Confirmation page: "not paid yet" ≠ "not found" |
| H2   | Webhook handles charge.failed / refund / dispute |
| M1   | Auth gate on /order/[ref] to stop PII leak |
| M2   | Write orders.notified_at after email send |
| M3   | Amount-mismatch → activity_logs |
| M4   | abandoned_carts ON CONFLICT dedup |
| M5   | Cart-clear on background webhook success |
| L1   | validateEnv asserts PAYSTACK_SECRET_KEY + DATABASE_URL |
| L2   | Env-scoped reference prefix |
| L3   | getOrderForConfirmation: separate DB error from 404 |
| L4   | Paystack inline-JS load error UX |
| L6   | activity_logs created_at index |
| ADM1 | Paginate /admin/abandoned-carts |
| ADM2 | Paginate /admin/activity |
| ADM3 | Server-side filters for /admin/orders |
| ADM4 | Total count beside "Showing N orders" |
