// src/lib/orders/getOrderForConfirmation.ts
// Server-only helper: load an order + its items by `reference` (textual lookup).
// Used by the /order/[ref] confirmation page (CONF-01, CONF-02, CONF-03).

import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import type { Order, OrderItem } from "@/types";

export type OrderConfirmationResult =
  | { kind: "paid"; order: Order; items: OrderItem[] }
  | { kind: "pending" }
  | { kind: "not-found" }
  | { kind: "error" };

export async function getOrderForConfirmation(
  reference: string
): Promise<OrderConfirmationResult> {
  try {
    const [orderRow] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.reference, reference))
      .limit(1);

    if (!orderRow) {
      return { kind: "not-found" };
    }

    if (orderRow.status !== "paid") {
      return { kind: "pending" };
    }

    const itemRows = await db
      .select()
      .from(schema.order_items)
      .where(eq(schema.order_items.order_id, orderRow.id));

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

    return { kind: "paid", order, items };
  } catch (err) {
    console.error("[getOrderForConfirmation] DB query failed:", err);
    return { kind: "error" };
  }
}
