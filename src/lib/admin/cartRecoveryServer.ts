// src/lib/admin/cartRecoveryServer.ts
// Database reads behind the "Email" reminder button on unpaid orders.

import "server-only";

import { and, desc, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db";
import { email_logs, order_items, orders } from "../../../drizzle/schema";

/** Don't let the same order be emailed again within this window. */
export const RECOVERY_EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type RecoveryOrderRecord = {
  id: string;
  reference: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_ngn: number;
  items: {
    id: string;
    product_name: string;
    variant_label: string | null;
    prep_option: string | null;
    quantity: number;
    subtotal_ngn: number;
  }[];
};

export async function getRecoveryOrder(id: string): Promise<RecoveryOrderRecord | null> {
  const [order] = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      status: orders.status,
      customer_name: orders.customer_name,
      customer_email: orders.customer_email,
      customer_phone: orders.customer_phone,
      total_ngn: orders.total_ngn,
    })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select({
      id: order_items.id,
      product_name: order_items.product_name,
      variant_label: order_items.variant_label,
      prep_option: order_items.prep_option,
      quantity: order_items.quantity,
      subtotal_ngn: order_items.subtotal_ngn,
    })
    .from(order_items)
    .where(eq(order_items.order_id, id));

  return { ...order, items };
}

/** When a reminder email was last sent successfully for this order, if within the cooldown. */
export async function getRecentRecoveryEmailAt(reference: string): Promise<Date | null> {
  const since = new Date(Date.now() - RECOVERY_EMAIL_COOLDOWN_MS);
  const [row] = await db
    .select({ sent_at: email_logs.sent_at })
    .from(email_logs)
    .where(
      and(
        eq(email_logs.order_reference, reference),
        eq(email_logs.type, "cart_recovery"),
        eq(email_logs.status, "sent"),
        gt(email_logs.sent_at, since),
      ),
    )
    .orderBy(desc(email_logs.sent_at))
    .limit(1);
  return row ? new Date(row.sent_at) : null;
}
