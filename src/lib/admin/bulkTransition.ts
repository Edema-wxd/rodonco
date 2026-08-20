import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders } from "../../../drizzle/schema";

/** The rows the transition actually touched — enough to email each customer. */
export interface TransitionedOrder {
  reference: string;
  customer_name: string;
  customer_email: string;
}

export interface BulkTransitionResult {
  count: number;
  orders: TransitionedOrder[];
}

/**
 * Moves every order in `weekOf` from `fromStatus` to `toStatus`.
 *
 * Uses UPDATE ... RETURNING so the caller learns exactly which rows changed
 * rather than just how many. That set is also the dedupe boundary for the
 * status emails: the WHERE clause matches only rows still sitting on
 * `fromStatus`, so a re-run of the same transition returns zero rows and
 * nobody gets emailed twice.
 */
export async function bulkTransitionOrders(
  weekOf: string,
  fromStatus: "paid" | "processing",
  toStatus: "processing" | "delivered"
): Promise<BulkTransitionResult> {
  const rows = await db
    .update(orders)
    .set({ status: toStatus })
    .where(and(eq(orders.week_of, weekOf), eq(orders.status, fromStatus)))
    .returning({
      reference: orders.reference,
      customer_name: orders.customer_name,
      customer_email: orders.customer_email,
    });

  const transitioned = rows ?? [];
  return { count: transitioned.length, orders: transitioned };
}
