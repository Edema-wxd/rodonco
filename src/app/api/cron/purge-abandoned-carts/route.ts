// GET /api/cron/purge-abandoned-carts
// Deletes abandoned_carts rows older than 90 days (NDPR retention policy).
// Called daily by Vercel Cron at 03:00 UTC. Protected by CRON_SECRET.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { lt } from "drizzle-orm";

import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const deleted = await db
    .delete(schema.abandoned_carts)
    .where(lt(schema.abandoned_carts.created_at, cutoff))
    .returning({ id: schema.abandoned_carts.id });

  console.log(`[purge-abandoned-carts] Deleted ${deleted.length} records older than 90 days.`);

  return NextResponse.json({ ok: true, deleted: deleted.length });
}
