// GET /api/orders/status?ref=... — returns { status } for a given order reference.
// Used by the checkout focus-poll to detect background payment completion (M5).
// No PII is returned — status string only.

import "server-only";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip = getClientIP(req);
  const rl = await rateLimit(ip, {
    requests: 30,
    window: "1 m",
    prefix: "rl:orders-status",
    route: "/api/orders/status (30/min)",
  });
  if (rl.limited) return rl.response;

  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "ref required" }, { status: 400 });
  }

  const [row] = await db
    .select({ status: schema.orders.status })
    .from(schema.orders)
    .where(eq(schema.orders.reference, ref))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ status: row.status });
}
