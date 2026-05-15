import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders } from "../../../drizzle/schema";

export async function bulkTransitionOrders(
  weekOf: string,
  fromStatus: "paid" | "processing",
  toStatus: "processing" | "delivered"
): Promise<number> {
  const result = await db
    .update(orders)
    .set({ status: toStatus })
    .where(and(eq(orders.week_of, weekOf), eq(orders.status, fromStatus)));
  // Neon HTTP driver returns NeonQueryResultBase with rowCount
  return result.rowCount ?? 0;
}
