import "server-only";

import { db } from "@/lib/db";
import { and, count, desc, eq, inArray, sum } from "drizzle-orm";

import { order_items, orders } from "../../../drizzle/schema";
import { currentWeekOf } from "./week";

// Statuses that represent real, committed revenue. Pending = unpaid; cancelled = void.
const COMPLETED_STATUSES = ["paid", "processing", "delivered"] as const;

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
      db
        .select({ c: count() })
        .from(orders)
        .where(and(eq(orders.week_of, week), inArray(orders.status, [...COMPLETED_STATUSES]))),
      db
        .select({ s: sum(orders.total_ngn) })
        .from(orders)
        .where(and(eq(orders.week_of, week), inArray(orders.status, [...COMPLETED_STATUSES]))),
      db
        .select({
          name: order_items.product_name,
          qty: sum(order_items.quantity),
        })
        .from(order_items)
        .innerJoin(orders, eq(order_items.order_id, orders.id))
        .where(and(eq(orders.week_of, week), inArray(orders.status, [...COMPLETED_STATUSES])))
        .groupBy(order_items.product_name)
        .orderBy(desc(sum(order_items.quantity)))
        .limit(5),
      // Status breakdown intentionally includes ALL statuses — percentages add to 100% across everything.
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

