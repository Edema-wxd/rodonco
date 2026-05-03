import "server-only";

import { and, eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";

export type PaidOrderForReminder = {
  id: string;
  customer_name: string;
  customer_email: string;
};

export async function getPaidOrdersForWeek(weekOf: string): Promise<PaidOrderForReminder[]> {
  return db
    .select({
      id: schema.orders.id,
      customer_name: schema.orders.customer_name,
      customer_email: schema.orders.customer_email,
    })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.week_of, weekOf),
        eq(schema.orders.status, "paid")
      )
    );
}
