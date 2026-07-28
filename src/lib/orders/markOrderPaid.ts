// src/lib/orders/markOrderPaid.ts
// Single source of truth for the pending → paid transition.
//
// Shared by:
//  - the Paystack webhook (charge.success), and
//  - the /order/[ref] confirmation page (direct GET /transaction/verify fallback).
//
// Both paths must behave identically: verify the charged amount, flip the order
// to paid atomically (idempotent — only the caller that wins the update fires
// emails), and send the receipt + admin alert exactly once.

import "server-only";

import { and, eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { sendOrderEmails } from "@/lib/email/sendOrderEmails";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { logActivity } from "@/lib/admin/activityLog";
import type { Order, OrderItem } from "@/types";

export type MarkOrderPaidResult =
  | { kind: "paid"; transitioned: boolean }
  | { kind: "not-found" }
  | { kind: "amount-mismatch"; expectedKobo: number; receivedKobo: number };

/**
 * Promotes a pending order to paid after verifying the charged amount.
 *
 * @param reference  Our order reference (e.g. "RDC-...").
 * @param amountKobo The amount actually charged, in integer kobo, as reported
 *                   by Paystack (webhook `data.amount` or verify `data.amount`).
 *
 * Returns:
 *  - `{ kind: "paid", transitioned }` — order is paid. `transitioned` is true
 *    only for the caller that actually flipped it (that caller sent the emails);
 *    false when it was already paid / another caller won the race.
 *  - `{ kind: "not-found" }` — no order for this reference.
 *  - `{ kind: "amount-mismatch" }` — charged amount ≠ stored total; not promoted.
 *
 * Throws only on unexpected DB failures — callers decide whether to retry
 * (webhook → 500) or degrade (page → keep showing pending).
 */
export async function markOrderPaid(params: {
  reference: string;
  amountKobo: number;
}): Promise<MarkOrderPaidResult> {
  const { reference, amountKobo } = params;

  // Idempotency: already paid → nothing to do (emails already sent).
  const [alreadyPaid] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.reference, reference), eq(schema.orders.status, "paid")))
    .limit(1);
  if (alreadyPaid) {
    return { kind: "paid", transitioned: false };
  }

  // Fetch the order (any status) to read its stored total.
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.reference, reference))
    .limit(1);
  if (!order) {
    return { kind: "not-found" };
  }

  // Verify the charged amount matches the stored total.
  // total_ngn is stored in NGN; Paystack reports amount in kobo — multiply by 100.
  const expectedKobo = order.total_ngn * 100;
  if (amountKobo !== expectedKobo) {
    logActivity({
      adminEmail: "system",
      action: "system.payment_amount_mismatch",
      entityLabel: reference,
      details: { expected_kobo: expectedKobo, received_kobo: amountKobo },
    }).catch(() => {});
    return { kind: "amount-mismatch", expectedKobo, receivedKobo: amountKobo };
  }

  // Atomic pending → paid. `.returning()` yields rows only for the caller that
  // won; concurrent callers (webhook + page verify) get no rows and skip emails.
  const [updated] = await db
    .update(schema.orders)
    .set({ status: "paid" })
    .where(and(eq(schema.orders.reference, reference), eq(schema.orders.status, "pending")))
    .returning();

  if (!updated) {
    // Someone else transitioned it between our select and update — treat as paid.
    return { kind: "paid", transitioned: false };
  }

  // ── We won the transition: fetch items and fire the receipt emails once. ──
  const items = await db
    .select()
    .from(schema.order_items)
    .where(eq(schema.order_items.order_id, updated.id));

  let nextDeliveryDate: string;
  try {
    const config = await getOrderingConfig();
    nextDeliveryDate = config.next_delivery_date ?? updated.week_of;
  } catch {
    nextDeliveryDate = updated.week_of;
  }

  const orderForEmail: Order = {
    id: updated.id,
    reference: updated.reference,
    customer_name: updated.customer_name,
    customer_email: updated.customer_email,
    customer_phone: updated.customer_phone,
    delivery_address: updated.delivery_address,
    allergy_notes: updated.allergy_notes ?? null,
    status: "paid",
    total_ngn: updated.total_ngn,
    week_of: updated.week_of,
    created_at:
      updated.created_at instanceof Date
        ? updated.created_at.toISOString()
        : String(updated.created_at),
    notified_at:
      updated.notified_at instanceof Date
        ? updated.notified_at.toISOString()
        : updated.notified_at ?? null,
  };

  const itemsForEmail: OrderItem[] = items.map((item) => ({
    id: item.id,
    order_id: item.order_id,
    product_id: item.product_id,
    product_name: item.product_name,
    variant_label: item.variant_label ?? null,
    prep_option: item.prep_option ?? null,
    quantity: item.quantity,
    unit_price_ngn: item.unit_price_ngn,
    subtotal_ngn: item.subtotal_ngn,
  }));

  // Fire-and-forget: never block the caller's response on email delivery.
  void sendOrderEmails({ order: orderForEmail, items: itemsForEmail, nextDeliveryDate });

  return { kind: "paid", transitioned: true };
}
