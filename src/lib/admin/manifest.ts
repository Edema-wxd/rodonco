import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { order_items, orders } from "../../../drizzle/schema";
import { currentWeekOf, snapToWeekStart } from "./week";
import type { AdminOrderItem } from "./orders";

export type ManifestOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  allergy_notes: string | null;
  total_ngn: number;
  items: AdminOrderItem[];
};

export async function getManifestOrders(weekOf?: string): Promise<ManifestOrder[]> {
  const week = weekOf ? snapToWeekStart(weekOf) : currentWeekOf();

  const orderRows = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.week_of, week),
        inArray(orders.status, ["paid", "processing"])
      )
    )
    .orderBy(desc(orders.created_at));

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const relevantItems = await db
    .select()
    .from(order_items)
    .where(inArray(order_items.order_id, orderIds));

  const itemsByOrderId = new Map<string, AdminOrderItem[]>();
  for (const it of relevantItems) {
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
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    delivery_address: o.delivery_address,
    allergy_notes: o.allergy_notes ?? null,
    total_ngn: o.total_ngn,
    items: itemsByOrderId.get(o.id) ?? [],
  }));
}
