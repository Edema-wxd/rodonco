import "server-only";

import { and, count, desc, isNull, lt, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { abandoned_carts } from "../../../drizzle/schema";

export type AbandonedCartItem = {
  productId: string;
  productName: string;
  variantLabel: string | null;
  prepOption: string | null;
  quantity: number;
  unitPriceNgn: number;
  subtotalNgn: number;
};

export type AbandonedCart = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  allergy_notes: string | null;
  cart_items: AbandonedCartItem[];
  subtotal_ngn: number;
  created_at: string;
  contacted_at: string | null;
};

export type AbandonedCartsCursor = { created_at: string; id: string };

export async function getAbandonedCarts(opts?: {
  limit?: number;
  cursor?: AbandonedCartsCursor;
}): Promise<AbandonedCart[]> {
  // Keyset pagination: rows AFTER cursor in (created_at DESC, id DESC) order.
  // Tie-break on id so identical timestamps don't drop or duplicate rows.
  const cursorCondition = opts?.cursor
    ? or(
        lt(abandoned_carts.created_at, sql`${opts.cursor.created_at}::timestamptz`),
        and(
          sql`${abandoned_carts.created_at} = ${opts.cursor.created_at}::timestamptz`,
          lt(abandoned_carts.id, sql`${opts.cursor.id}::uuid`),
        ),
      )
    : undefined;

  const baseQuery = db
    .select()
    .from(abandoned_carts)
    .where(cursorCondition)
    .orderBy(desc(abandoned_carts.created_at), desc(abandoned_carts.id));

  const rows = opts?.limit ? await baseQuery.limit(opts.limit) : await baseQuery;

  return rows.map((r) => ({
    id: r.id,
    customer_name: r.customer_name,
    customer_email: r.customer_email,
    customer_phone: r.customer_phone,
    delivery_address: r.delivery_address,
    allergy_notes: r.allergy_notes ?? null,
    cart_items: (r.cart_items as AbandonedCartItem[]) ?? [],
    subtotal_ngn: r.subtotal_ngn,
    created_at:
      r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    contacted_at:
      r.contacted_at instanceof Date
        ? r.contacted_at.toISOString()
        : r.contacted_at
          ? String(r.contacted_at)
          : null,
  }));
}

export async function getUncContactedCount(): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(abandoned_carts)
    .where(isNull(abandoned_carts.contacted_at));
  return Number(row?.c ?? 0);
}
