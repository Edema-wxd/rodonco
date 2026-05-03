---
phase: 05-payments-email
reviewed: 2026-05-03T15:43:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/app/api/paystack/webhook/route.ts
  - src/app/api/orders/init/route.ts
  - src/lib/orders/getOrderForConfirmation.ts
  - src/components/order/OrderConfirmationView.tsx
  - src/app/(customer)/order/[ref]/page.tsx
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 5: Code Review Report (gap-closure focus)

**Reviewed:** 2026-05-03
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

The gap-closure commits addressed the three highest-risk issues called out in verification:

- **Webhook amount verification** is now present: the webhook compares `payload.data.amount` (kobo) against `pendingOrder.total_ngn` before transitioning to `paid` (`src/app/api/paystack/webhook/route.ts:120-128`).
- **DB-authoritative pricing** is now implemented in `POST /api/orders/init` by fetching `product_variants` and `product_prep_options` and computing `unitPrice`/`subtotal` server-side (`src/app/api/orders/init/route.ts:93-151`), preventing client-controlled totals.
- **Confirmation page customer greeting** now renders the customer name via `order.customer_name` (`src/components/order/OrderConfirmationView.tsx:110-117`), and the page loader already returns that field (`src/lib/orders/getOrderForConfirmation.ts:55-75`).

Remaining issues are mostly hardening: input validation for `variantLabel`/`prepOption`, and making the webhook resilient after it has successfully updated the order status (so email sending doesn’t get skipped due to a post-update crash).

---

## Warnings

### WR-01: Webhook can throw after marking order paid, skipping email send forever

**File:** `src/app/api/paystack/webhook/route.ts:130-163`

**Issue:** After the order is transitioned to `paid` (the DB update is committed), the handler immediately queries `order_items` without a guard:

- The update is inside a `try/catch` (`:133-156`), but the subsequent query (`:158-163`) is not.
- If that query throws (transient DB issue, driver error), the handler will 500. Paystack will retry, but the idempotency check returns early for already-paid orders (`:90-105`), so **the email send will never occur** for that order.

**Fix (concrete):** Wrap the items fetch in `try/catch` and continue with an empty items list (or explicitly schedule a resend job if you have one). Example:

```typescript
// src/app/api/paystack/webhook/route.ts
let items: Awaited<ReturnType<typeof db.select>> = [];
try {
  items = await db
    .select()
    .from(schema.order_items)
    .where(eq(schema.order_items.order_id, updatedOrder.id));
} catch (err) {
  console.error(`[webhook] Failed to fetch items for order ${reference}:`, err);
  // Continue: order is already paid; avoid making email dispatch impossible.
}
```

---

### WR-02: `variantLabel` and `prepOption` allow empty strings → “unknown variant/prep” false negatives

**File:** `src/app/api/orders/init/route.ts:32-40`, `src/app/api/orders/init/route.ts:112-138`

**Issue:** The request schema allows `variantLabel`/`prepOption` to be `string | null` with no `.min(1)` constraint (`:35-36`). An empty string `""` is valid, but the price lookup treats “non-null” as “explicit selection”:

- `variantLabel !== null` → lookup by exact label (`:113-117`)
- `prepOption !== null` → lookup by exact label (`:126-130`)

If the client ever sends `""` (common UI bug when binding select inputs), the handler will throw “Unknown variant” / fail pricing (`:122-124`) and respond 422, even though the default variant path likely should have applied.

**Fix (concrete):** Normalize empty strings to `null` at the validation boundary, or tighten schema. Two safe options:

- **Normalize** (preferred for backwards compatibility):

```typescript
const cartItemSchema = z.object({
  // ...
  variantLabel: z.string().trim().min(1).nullable().transform((v) => (v ? v : null)),
  prepOption: z.string().trim().min(1).nullable().transform((v) => (v ? v : null)),
  // ...
});
```

- **Strict schema** (reject empty strings explicitly):

```typescript
variantLabel: z.string().min(1).nullable(),
prepOption: z.string().min(1).nullable(),
```

---

## Info

### IN-01: Webhook does not persist `notified_at` (still always null)

**File:** `src/app/api/paystack/webhook/route.ts:130-207` (and `orderForEmail` mapping `:175-189`)

**Issue:** The webhook dispatches emails (`void sendOrderEmails(...)` at `:203-205`) but never marks the order as “notified”. `orderForEmail` reads `updatedOrder.notified_at` as if it’s meaningful (`:187-189`), but the update only sets `status: "paid"` (`:134-143`).

**Fix:** If you don’t want to await the email send, you can still record “notification dispatched” right after scheduling:

```typescript
await db
  .update(schema.orders)
  .set({ notified_at: new Date() })
  .where(eq(schema.orders.id, updatedOrder.id));
```

If you want “delivered” semantics, that requires awaiting `sendOrderEmails` (or moving email to a queue) — but “attempted” is still useful operationally.

---

### IN-02: Confirmation page cannot distinguish “not found” vs “not paid”

**File:** `src/app/(customer)/order/[ref]/page.tsx:32-45`, `src/lib/orders/getOrderForConfirmation.ts:39-46`

**Issue:** `getOrderForConfirmation` returns `null` both for “missing ref” and “not paid” (`getOrderForConfirmation.ts:39-46`). The page always sets `errorVariant` to `"not-found"` (`page.tsx:38-44`), so the UI can’t show the more accurate “Payment not confirmed” state even though `OrderConfirmationView` supports it (`OrderConfirmationView.tsx:51-87`).

**Fix:** Either:
- change `getOrderForConfirmation` to return `{ kind: "not-found" | "not-paid" | "ok", data?: ... }`, or
- perform a second lightweight status query when the first returns null (trade-off: extra DB call).

---

_Reviewed: 2026-05-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
