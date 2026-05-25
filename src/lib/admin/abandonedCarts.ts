import "server-only";

import { count, desc, isNull } from "drizzle-orm";

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

export async function getAbandonedCarts(): Promise<AbandonedCart[]> {
  const rows = await db
    .select()
    .from(abandoned_carts)
    .orderBy(desc(abandoned_carts.created_at));

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
