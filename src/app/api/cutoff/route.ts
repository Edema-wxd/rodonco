import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await db
    .update(schema.ordering_config)
    .set({ is_ordering_open: false, updated_at: new Date() })
    .where(eq(schema.ordering_config.id, 1));

  return NextResponse.json({ ok: true });
}
