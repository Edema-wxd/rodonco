import "server-only";

import { and, eq, inArray, sum } from "drizzle-orm";

import { db } from "@/lib/db";
import { order_items, orders } from "../../../drizzle/schema";
import { currentWeekOf } from "./week";

export type PrepListRow = {
  product_name: string;
  variant_label: string | null;
  prep_option: string | null;
  total_quantity: number;
};

export async function getPrepList(weekOf?: string): Promise<PrepListRow[]> {
  const week = weekOf ?? currentWeekOf();

  const rows = await db
    .select({
      product_name: order_items.product_name,
      variant_label: order_items.variant_label,
      prep_option: order_items.prep_option,
      total_quantity: sum(order_items.quantity),
    })
    .from(order_items)
    .innerJoin(orders, eq(order_items.order_id, orders.id))
    .where(
      and(
        eq(orders.week_of, week),
        inArray(orders.status, ["paid", "processing"])
      )
    )
    .groupBy(
      order_items.product_name,
      order_items.variant_label,
      order_items.prep_option
    )
    .orderBy(order_items.product_name);

  return rows.map((r) => ({
    product_name: r.product_name,
    variant_label: r.variant_label ?? null,
    prep_option: r.prep_option ?? null,
    // Drizzle sum() returns string | null — coerce defensively
    total_quantity: Number(r.total_quantity ?? 0),
  }));
}
