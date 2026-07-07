// src/lib/orders/getOrdersByEmail.ts
// Server-only helper: load every order placed by a given customer email,
// most recent first. Used by the /orders/my-orders read-only history page.

import "server-only";

import { desc, eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import type { Order } from "@/types";

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const rows = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.customer_email, email.toLowerCase()))
    .orderBy(desc(schema.orders.created_at));

  return rows.map((orderRow) => ({
    id: orderRow.id,
    reference: orderRow.reference,
    customer_name: orderRow.customer_name,
    customer_email: orderRow.customer_email,
    customer_phone: orderRow.customer_phone,
    delivery_address: orderRow.delivery_address,
    allergy_notes: orderRow.allergy_notes ?? null,
    status: orderRow.status as Order["status"],
    total_ngn: orderRow.total_ngn,
    week_of: orderRow.week_of,
    created_at:
      orderRow.created_at instanceof Date
        ? orderRow.created_at.toISOString()
        : String(orderRow.created_at),
    notified_at:
      orderRow.notified_at instanceof Date
        ? orderRow.notified_at.toISOString()
        : orderRow.notified_at ?? null,
  }));
}
