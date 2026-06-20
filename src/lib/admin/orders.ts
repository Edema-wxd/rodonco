import { db } from "@/lib/db";
import { order_items, orders } from "../../../drizzle/schema";
import { and, desc, eq, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { snapToWeekStart } from "./week";

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

export type OrdersCursor = { created_at: string; id: string };

export type OrderFilters = {
  status?: string;
  weekOf?: string;
  search?: string;
};

export async function getAdminOrders(opts?: {
  limit?: number;
  cursor?: OrdersCursor;
  filters?: OrderFilters;
}): Promise<AdminOrder[]> {
  const { status, weekOf, search } = opts?.filters ?? {};

  // Keyset pagination: rows AFTER cursor in (created_at DESC, id DESC) order.
  // Tie-break on id so identical timestamps don't drop or duplicate rows.
  const cursorCondition = opts?.cursor
    ? or(
        lt(orders.created_at, sql`${opts.cursor.created_at}::timestamptz`),
        and(
          sql`${orders.created_at} = ${opts.cursor.created_at}::timestamptz`,
          lt(orders.id, sql`${opts.cursor.id}::uuid`),
        ),
      )
    : undefined;

  const searchTerm = search?.trim();
  const filterConditions = [
    status && status !== "all" ? eq(orders.status, status) : undefined,
    weekOf ? eq(orders.week_of, snapToWeekStart(weekOf)) : undefined,
    searchTerm
      ? or(
          ilike(orders.customer_name, `%${searchTerm}%`),
          ilike(orders.customer_email, `%${searchTerm}%`),
          ilike(orders.customer_phone, `%${searchTerm}%`),
        )
      : undefined,
  ].filter((c): c is NonNullable<typeof c> => c != null);

  const whereClause = and(cursorCondition, ...filterConditions);

  const baseQuery = db
    .select()
    .from(orders)
    .where(whereClause)
    .orderBy(desc(orders.created_at), desc(orders.id));

  const orderRows = opts?.limit ? await baseQuery.limit(opts.limit) : await baseQuery;

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const itemRows = await db
    .select()
    .from(order_items)
    .where(inArray(order_items.order_id, orderIds));

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
