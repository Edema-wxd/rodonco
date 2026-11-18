import "server-only";

import { count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders } from "../../../drizzle/schema";

export async function getPendingOrdersCount(): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(orders)
    .where(eq(orders.status, "pending"));
  return Number(row?.c ?? 0);
}
