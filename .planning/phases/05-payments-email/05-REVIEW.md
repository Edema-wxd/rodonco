---
phase: 05-payments-email
reviewed: 2026-05-03T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - src/lib/checkout/schemas.ts
  - src/lib/checkout/cartToOrderDraft.ts
  - src/lib/paystack/initialize.ts
  - src/components/checkout/CheckoutExperience.tsx
  - src/components/checkout/CheckoutCartSummary.tsx
  - src/components/ui/checkbox.tsx
  - src/app/(customer)/checkout/page.tsx
  - src/lib/orders/findPendingReuse.ts
  - src/app/api/orders/init/route.ts
  - src/lib/paystack/verifySignature.ts
  - src/lib/email/resendClient.ts
  - src/lib/email/sendOrderEmails.ts
  - src/lib/email/templates/CustomerOrderReceipt.tsx
  - src/lib/email/templates/AdminNewOrderAlert.tsx
  - src/app/api/paystack/webhook/route.ts
  - src/lib/orders/getOrderForConfirmation.ts
  - src/components/order/OrderConfirmationView.tsx
  - src/app/(customer)/order/[ref]/page.tsx
findings:
  critical: 2
  warning: 3
  info: 3
  total: 8
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-05-03
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

The payment and email pipeline is generally well-structured. HMAC signature verification is correctly implemented using `timingSafeEqual` on raw body bytes (read before any JSON parsing — correct order). The webhook handler's idempotency logic is sound. Email errors are properly isolated and never propagate. The `server-only` guard is applied where needed.

Two critical issues are present. The more severe one is that the webhook handler does not verify the Paystack-reported charge amount against the stored order total before marking the order paid. The second critical issue is that the server-side "total recomputation" in the order init route actually sums client-supplied per-item subtotals rather than looking up prices from the database, meaning the client controls the charged amount.

Three warnings cover a missing `ORDER BY` in the pending-reuse query (documented contract broken), an unguarded DB query inside the webhook handler, and an absent cross-check between `unitPriceNgn × quantity` and `subtotalNgn` in the cart schema. Three info items cover minor state, type safety, and data-completeness gaps.

---

## Critical Issues

### CR-01: Webhook does not verify charged amount matches stored order total

**File:** `src/app/api/paystack/webhook/route.ts:84-145`

**Issue:** On a `charge.success` event the handler reads `payload.data.reference` but never reads `payload.data.amount`. The `pending → paid` status transition fires for any charge amount Paystack reports — including test-mode events or a tampered payload where only the reference field is correct (signature verification only confirms Paystack signed the body, not that the amount is what your system originally requested). An attacker who can arrange a legitimate Paystack signature for a lower amount (e.g., by sending ₦100 for a ₦50,000 order) would mark the order paid at the wrong charge.

The correct defence is to compare `payload.data.amount` against `pendingOrder.total_ngn` before updating status, and reject the event (or flag for manual review) if they differ.

**Fix:**
```typescript
// After fetching pendingOrder (step 6), add before the status update:
if (payload.data.amount !== pendingOrder.total_ngn) {
  console.error(
    `[webhook] Amount mismatch for ${reference}: ` +
    `expected ${pendingOrder.total_ngn} kobo, got ${payload.data.amount} kobo`
  );
  // Return 200 so Paystack does not retry; alert ops via logging/monitoring.
  return NextResponse.json({ received: true, mismatch: true });
}
```

---

### CR-02: Server-side price recomputation trusts client-submitted subtotals

**File:** `src/app/api/orders/init/route.ts:93`, `src/lib/checkout/cartToOrderDraft.ts:72-74`

**Issue:** The comment on line 92 of the route reads "server recomputes — never trust client totals", but `cartTotalKobo` (line 93) simply sums `item.subtotalNgn` across the cart array — which was submitted by the client in the request body. The `cartItemSchema` only validates that `subtotalNgn` is a non-negative integer; it does not enforce `subtotalNgn === unitPriceNgn * quantity`, and neither field is validated against DB prices.

A client can submit `unitPriceNgn: 100, quantity: 1, subtotalNgn: 100` for a product actually priced at ₦50,000 (5,000,000 kobo), resulting in the order being stored at ₦1 and Paystack being asked to charge ₦1.

True server-side recomputation requires fetching `product_variants.price_ngn` (and any `prep_options.extra_cost_ngn`) from the database for each submitted `productId` / `variantLabel` / `prepOption` combination, then computing the authoritative subtotals server-side.

**Fix (sketch):**
```typescript
// In POST /api/orders/init — replace step 3:

// Fetch canonical prices from DB for each cart item
const productIds = [...new Set(cart.map(i => i.productId))];
const variants = await db.select().from(schema.product_variants)
  .where(inArray(schema.product_variants.product_id, productIds));
const prepOptions = await db.select().from(schema.prep_options)
  .where(inArray(schema.prep_options.product_id, productIds));

let totalKobo = 0;
const verifiedCart = cart.map((item) => {
  const variant = variants.find(
    v => v.product_id === item.productId && v.label === (item.variantLabel ?? "")
  );
  if (!variant) throw new Error(`Unknown variant for product ${item.productId}`);

  const prep = item.prepOption
    ? prepOptions.find(p => p.product_id === item.productId && p.label === item.prepOption)
    : null;
  const unitPrice = variant.price_ngn + (prep?.extra_cost_ngn ?? 0);
  const subtotal = unitPrice * item.quantity;
  totalKobo += subtotal;
  return { ...item, unitPriceNgn: unitPrice, subtotalNgn: subtotal };
});
```

---

## Warnings

### WR-01: `findPendingReuse` missing ORDER BY — "most recent" ordering not guaranteed

**File:** `src/lib/orders/findPendingReuse.ts:44-58`

**Issue:** The function's header comment explicitly states "LIMIT 1, ORDER BY created_at DESC", but the actual Drizzle query omits the `.orderBy(...)` clause. Without an explicit sort, the database may return any matching `pending` row, not necessarily the most recent one. In practice Postgres tends to return rows in heap order, but this is undefined behaviour — a future vacuum or reorder could silently change which row is returned.

**Fix:**
```typescript
import { and, eq, desc } from "drizzle-orm";

const [existingOrder] = await db
  .select({ ... })
  .from(schema.orders)
  .where(
    and(
      eq(schema.orders.customer_email, customerEmail),
      eq(schema.orders.status, "pending")
    )
  )
  .orderBy(desc(schema.orders.created_at))  // add this
  .limit(1);
```

---

### WR-02: Order items fetch inside webhook handler is unguarded (can crash after a successful DB update)

**File:** `src/app/api/paystack/webhook/route.ts:149-152`

**Issue:** After the `pending → paid` update succeeds (step 7), the order items are fetched at step 8 with no try/catch. If the DB is intermittently unavailable at that moment (or the query throws for any other reason), the unhandled exception bubbles up as a 500 response. Paystack will then retry the webhook, and the idempotency check (step 5) will catch the already-paid status and short-circuit cleanly — so no double-charge. However, the emails will never be sent for that order because the retry path returns 200 before reaching the email step.

**Fix:**
```typescript
let items: typeof schema.order_items.$inferSelect[] = [];
try {
  items = await db
    .select()
    .from(schema.order_items)
    .where(eq(schema.order_items.order_id, updatedOrder.id));
} catch (err) {
  console.error(`[webhook] Failed to fetch items for order ${reference}:`, err);
  // Continue — emails will be sent without line items or skipped gracefully
  // by sendOrderEmails if items is empty. Order is already marked paid.
}
```

---

### WR-03: `subtotalNgn` not cross-validated against `unitPriceNgn × quantity` in API schema

**File:** `src/app/api/orders/init/route.ts:31-39`

**Issue:** `cartItemSchema` validates that both `unitPriceNgn` and `subtotalNgn` are non-negative integers, but does not check that `subtotalNgn === unitPriceNgn * quantity`. The server stores and uses the raw `subtotalNgn` values from the client. Even before the deeper fix required by CR-02, a simple server-side cross-check would catch accidental client-side arithmetic bugs and reduce attack surface.

**Fix (minimal, without DB lookup):**
```typescript
const cartItemSchema = z.object({
  ...
  subtotalNgn: z.number().int().nonnegative(),
}).refine(
  (item) => item.subtotalNgn === item.unitPriceNgn * item.quantity,
  { message: "subtotalNgn must equal unitPriceNgn × quantity" }
);
```

Note: this alone does not fix CR-02 (prices must still be verified against DB), but adds a consistency guard.

---

## Info

### IN-01: `notified_at` column is never populated after email dispatch

**File:** `src/app/api/paystack/webhook/route.ts:120-145`

**Issue:** The schema has a `notified_at` column on `orders` (visible in the `orderForEmail` mapping at line 178). The webhook sets `status: "paid"` but never sets `notified_at` after dispatching emails. This makes the field permanently `null` even for orders that were successfully notified, preventing any future "resend notification" tooling or admin queries that rely on it.

**Fix:** Update the DB row after dispatching emails, or set `notified_at` in the `update` call along with the status transition:
```typescript
// In the update set(), add:
.set({ status: "paid", notified_at: new Date() })
```

---

### IN-02: `isSubmitting` not reset on successful Paystack callback navigation

**File:** `src/components/checkout/CheckoutExperience.tsx:99-104`

**Issue:** In the `onSuccess` callback, `clearCart()` and `router.push(...)` are called but `setIsSubmitting(false)` is not. The submit button remains disabled and shows "Processing..." while Next.js navigates to `/order/[ref]`. On slow connections this can leave the UI frozen for several seconds with no feedback that it is navigating rather than waiting.

**Fix:**
```typescript
onSuccess: (transaction: unknown) => {
  const txn = transaction as { reference?: string };
  const ref = txn?.reference ?? result.reference;
  clearCart();
  setIsSubmitting(false); // add this before navigation
  router.push(`/order/${ref}`);
},
```

---

### IN-03: Terms checkbox uncheck path uses unsafe type cast

**File:** `src/components/checkout/CheckoutExperience.tsx:224`

**Issue:** When the checkbox is unchecked, the form value is set via `undefined as unknown as true`. This double-cast is semantically misleading — the intent is to put the field back into an invalid state so the `z.literal(true)` validation fails, but casting `undefined` to `true` at the type level is a lie that hides what is actually happening. A comment and a cleaner approach would be less confusing.

**Fix:**
```typescript
onCheckedChange={(checked) => {
  // When unchecked, setting undefined causes z.literal(true) to fail validation,
  // which is the desired behaviour. The cast is intentional but should be explicit.
  setValue(
    "terms",
    checked === true ? true : (undefined as unknown as true),
    { shouldValidate: true }
  );
}}
```

Alternatively, consider using `z.boolean()` for the field and checking `terms === true` in the schema's refine step, which avoids the need for the cast entirely.

---

_Reviewed: 2026-05-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
