// src/lib/admin/customers.ts
// Admin-only: orders rolled up per customer, keyed by email address.
// Emails are grouped case-insensitively via lower(customer_email) because
// checkout does not normalise case on insert (see api/orders/init/route.ts),
// so the same person can otherwise split across "Ada@x.com" / "ada@x.com".

import { db } from "@/lib/db";
import { orders } from "../../../drizzle/schema";
import { ilike, or, sql } from "drizzle-orm";

import { getAdminOrders, type AdminOrder } from "./orders";

// Statuses that represent money actually received (excludes pending & cancelled).
const REVENUE_STATUSES = ["paid", "processing", "delivered"] as const;

export type AdminCustomer = {
  /** Lowercased email — the grouping key and the [email] route param. */
  email: string;
  /** Name/phone from the customer's most recent order. */
  name: string;
  phone: string;
  order_count: number;
  /** Orders in a revenue status (paid/processing/delivered). */
  paid_count: number;
  /** Lifetime spend across revenue-status orders, in NGN. */
  total_spent_ngn: number;
  first_order_at: string;
  last_order_at: string;
};

export type AdminCustomerDetail = AdminCustomer & {
  orders: AdminOrder[];
};

function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

/**
 * One row per customer email, most-recently-active first.
 * `search` matches any of the customer's orders on name / email / phone.
 */
export async function getAdminCustomers(opts?: {
  search?: string;
  limit?: number;
}): Promise<AdminCustomer[]> {
  const searchTerm = opts?.search?.trim();

  const searchCondition = searchTerm
    ? or(
        ilike(orders.customer_name, `%${searchTerm}%`),
        ilike(orders.customer_email, `%${searchTerm}%`),
        ilike(orders.customer_phone, `%${searchTerm}%`),
      )
    : undefined;

  const revenueFilter = sql`${orders.status} in ('paid', 'processing', 'delivered')`;

  let query = db
    .select({
      email: sql<string>`lower(${orders.customer_email})`.as("email"),
      // Name/phone from the latest order for this email.
      name: sql<string>`(array_agg(${orders.customer_name} order by ${orders.created_at} desc))[1]`,
      phone: sql<string>`(array_agg(${orders.customer_phone} order by ${orders.created_at} desc))[1]`,
      order_count: sql<number>`count(*)::int`,
      paid_count: sql<number>`count(*) filter (where ${revenueFilter})::int`,
      total_spent_ngn: sql<number>`coalesce(sum(${orders.total_ngn}) filter (where ${revenueFilter}), 0)::int`,
      first_order_at: sql<string>`min(${orders.created_at})`,
      last_order_at: sql<string>`max(${orders.created_at})`,
    })
    .from(orders)
    .groupBy(sql`lower(${orders.customer_email})`)
    .$dynamic();

  // Search filters WHICH customers appear (a customer matches if ANY of their
  // orders matches the term) via HAVING, so the returned aggregates still cover
  // the customer's FULL order history rather than only the matching rows.
  if (searchCondition) {
    query = query.having(sql`bool_or(${searchCondition})`);
  }

  query = query.orderBy(sql`max(${orders.created_at}) desc`);
  if (opts?.limit) query = query.limit(opts.limit);

  const rows = await query;

  return rows.map((r) => ({
    email: r.email,
    name: r.name,
    phone: r.phone,
    order_count: r.order_count,
    paid_count: r.paid_count,
    total_spent_ngn: r.total_spent_ngn,
    first_order_at: toIso(r.first_order_at),
    last_order_at: toIso(r.last_order_at),
  }));
}

/**
 * Full order history for a single customer email, plus rolled-up totals.
 * Returns null when the email has no orders.
 */
export async function getAdminCustomerByEmail(
  email: string,
): Promise<AdminCustomerDetail | null> {
  const customerOrders = await getAdminOrders({ filters: { email } });

  if (customerOrders.length === 0) return null;

  // getAdminOrders returns created_at DESC, so index 0 is the latest order.
  const latest = customerOrders[0];
  const oldest = customerOrders[customerOrders.length - 1];

  const revenueOrders = customerOrders.filter((o) =>
    (REVENUE_STATUSES as readonly string[]).includes(o.status),
  );

  return {
    email: email.toLowerCase(),
    name: latest.customer_name,
    phone: latest.customer_phone,
    order_count: customerOrders.length,
    paid_count: revenueOrders.length,
    total_spent_ngn: revenueOrders.reduce((sum, o) => sum + o.total_ngn, 0),
    first_order_at: oldest.created_at,
    last_order_at: latest.created_at,
    orders: customerOrders,
  };
}
