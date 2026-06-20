import "server-only";

import { count, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { order_items, orders } from "../../../drizzle/schema";
import type { AdminOrder, AdminOrderItem } from "./orders";

export async function getPendingOrdersCount(): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(orders)
    .where(eq(orders.status, "pending"));
  return Number(row?.c ?? 0);
}

export async function getPendingOrders(): Promise<AdminOrder[]> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.status, "pending"))
    .orderBy(desc(orders.created_at));

  if (orderRows.length === 0) return [];

  const pendingIds = orderRows.map((o) => o.id);
  const itemsForPending = await db
    .select()
    .from(order_items)
    .where(inArray(order_items.order_id, pendingIds));

  const itemsByOrderId = new Map<string, AdminOrderItem[]>();
  for (const it of itemsForPending) {
    const list = itemsByOrderId.get(it.order_id) ?? [];
    list.push({
      id: it.id,
      product_name: it.product_name,
      variant_label: it.variant_label ?? null,
      prep_option: it.prep_option ?? null,
      quantity: it.quantity,
      unit_price_ngn: it.unit_price_ngn,
      subtotal_ngn: it.subtotal_ngn,
    });
    itemsByOrderId.set(it.order_id, list);
  }

  return orderRows.map((o) => ({
    id: o.id,
    reference: o.reference,
    customer_name: o.customer_name,
    customer_email: o.customer_email,
    customer_phone: o.customer_phone,
    delivery_address: o.delivery_address,
    delivery_area: o.delivery_area ?? null,
    allergy_notes: o.allergy_notes ?? null,
    status: o.status,
    total_ngn: o.total_ngn,
    week_of:
      typeof o.week_of === "string"
        ? o.week_of
        : new Date(o.week_of).toISOString().slice(0, 10),
    created_at:
      o.created_at instanceof Date
        ? o.created_at.toISOString()
        : String(o.created_at),
    items: itemsByOrderId.get(o.id) ?? [],
  }));
}
