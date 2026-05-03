// src/lib/orders/getOrderForConfirmation.ts
// Server-only helper: load an order + its items by `reference` (textual lookup).
// Used by the /order/[ref] confirmation page (CONF-01, CONF-02, CONF-03).
//
// Returns null if the reference does not exist or if the order is not `paid`.
// Callers should render the error state when null is returned (CONTEXT D-10).

import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import type { Order, OrderItem } from "@/types";

export interface OrderConfirmationData {
  order: Order;
  items: OrderItem[];
}

/**
 * Fetches an order and its line items by Paystack reference.
 *
 * Returns `null` when:
 * - No order row exists with the given reference
 * - The order status is not `paid` (e.g., still `pending` or `failed`)
 * - Any DB error occurs (safe fallback: caller renders error state)
 */
export async function getOrderForConfirmation(
  reference: string
): Promise<OrderConfirmationData | null> {
  try {
    // Step 1: look up the order by reference
    const [orderRow] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.reference, reference))
      .limit(1);

    if (!orderRow) {
      return null;
    }

    // Step 2: enforce the paid gate (CONTEXT D-10, CONF-02)
    if (orderRow.status !== "paid") {
      return null;
    }

    // Step 3: fetch associated line items ordered by insertion order (stable display)
    const itemRows = await db
      .select()
      .from(schema.order_items)
      .where(eq(schema.order_items.order_id, orderRow.id));

    // Map DB rows to domain types
    const order: Order = {
      id: orderRow.id,
      reference: orderRow.reference,
      customer_name: orderRow.customer_name,
      customer_email: orderRow.customer_email,
      customer_phone: orderRow.customer_phone,
      delivery_address: orderRow.delivery_address,
      allergy_notes: orderRow.allergy_notes ?? null,
      status: orderRow.status as Order["status"],
      total_ngn: orderRow.total_ngn,
      week_of: orderRow.week_of,
      created_at:
        orderRow.created_at instanceof Date
          ? orderRow.created_at.toISOString()
          : String(orderRow.created_at),
      notified_at:
        orderRow.notified_at instanceof Date
          ? orderRow.notified_at.toISOString()
          : orderRow.notified_at ?? null,
    };

    const items: OrderItem[] = itemRows.map((row) => ({
      id: row.id,
      order_id: row.order_id,
      product_id: row.product_id,
      product_name: row.product_name,
      variant_label: row.variant_label ?? null,
      prep_option: row.prep_option ?? null,
      quantity: row.quantity,
      unit_price_ngn: row.unit_price_ngn,
      subtotal_ngn: row.subtotal_ngn,
    }));

    return { order, items };
  } catch (err) {
    console.error("[getOrderForConfirmation] DB query failed:", err);
    return null;
  }
}
