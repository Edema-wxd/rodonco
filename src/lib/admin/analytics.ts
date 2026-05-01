import "server-only";

import { db } from "@/lib/db";
import { count, desc, eq, sum } from "drizzle-orm";

import { order_items, orders } from "../../../drizzle/schema";
import { currentWeekOf } from "./week";

export type WeeklyAnalytics = {
  week: string;
  totalOrders: number;
  totalRevenue: number;
  topProducts: Array<{ name: string; qty: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
};

export async function getWeeklyAnalytics(weekOverride?: string): Promise<WeeklyAnalytics> {
  const week = weekOverride ?? currentWeekOf();

  const [totalOrdersResult, totalRevenueResult, topProductsResult, statusBreakdownResult] =
    await Promise.all([
      db.select({ c: count() }).from(orders).where(eq(orders.week_of, week)),
      db.select({ s: sum(orders.total_ngn) }).from(orders).where(eq(orders.week_of, week)),
      db
        .select({
          name: order_items.product_name,
          qty: sum(order_items.quantity),
        })
        .from(order_items)
        .innerJoin(orders, eq(order_items.order_id, orders.id))
        .where(eq(orders.week_of, week))
        .groupBy(order_items.product_name)
        .orderBy(desc(sum(order_items.quantity)))
        .limit(5),
      db
        .select({ status: orders.status, c: count() })
        .from(orders)
        .where(eq(orders.week_of, week))
        .groupBy(orders.status),
    ]);

  return {
    week,
    totalOrders: Number(totalOrdersResult[0]?.c ?? 0),
    // Drizzle `sum()` returns string | null for numeric aggregates; coerce defensively.
    totalRevenue: Number(totalRevenueResult[0]?.s ?? 0),
    topProducts: topProductsResult.map((row) => ({
      name: row.name,
      qty: Number(row.qty ?? 0),
    })),
    statusBreakdown: statusBreakdownResult.map((row) => ({
      status: row.status,
      count: Number(row.c ?? 0),
    })),
  };
}

