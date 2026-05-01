import { db } from "@/lib/db";
import { order_items, orders } from "../../../drizzle/schema";
import { desc } from "drizzle-orm";

export type AdminOrderItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  prep_option: string | null;
  quantity: number;
  unit_price_ngn: number;
  subtotal_ngn: number;
};

export type AdminOrder = {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  allergy_notes: string | null;
  status: string;
  total_ngn: number;
  week_of: string;
  created_at: string;
  items: AdminOrderItem[];
};

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const [orderRows, itemRows] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.created_at)),
    db.select().from(order_items),
  ]);

  if (orderRows.length === 0) return [];

  const itemsByOrderId = new Map<string, AdminOrderItem[]>();
  for (const it of itemRows) {
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
    allergy_notes: o.allergy_notes ?? null,
    status: o.status,
    total_ngn: o.total_ngn,
    week_of: typeof o.week_of === "string" ? o.week_of : new Date(o.week_of).toISOString().slice(0, 10),
    created_at: o.created_at instanceof Date ? o.created_at.toISOString() : String(o.created_at),
    items: itemsByOrderId.get(o.id) ?? [],
  }));
}
