import "server-only";

import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { logActivity } from "@/lib/admin/activityLog";
import { db, schema } from "@/lib/db";

const bulkSchema = z.object({
  action: z.enum(["mark_contacted", "delete"]),
  ids: z.array(z.string().uuid()).min(1).max(200),
});

// POST /api/admin/abandoned-carts/bulk
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { action, ids } = parsed.data;
  const adminEmail = session.user.email ?? "unknown";

  if (action === "mark_contacted") {
    await db
      .update(schema.abandoned_carts)
      .set({ contacted_at: new Date() })
      .where(inArray(schema.abandoned_carts.id, ids));

    logActivity({
      adminEmail,
      action: "abandoned_cart.bulk_marked_contacted",
      details: { count: ids.length, ids },
    }).catch(() => {});
  } else {
    await db
      .delete(schema.abandoned_carts)
      .where(inArray(schema.abandoned_carts.id, ids));

    logActivity({
      adminEmail,
      action: "abandoned_cart.bulk_deleted",
      details: { count: ids.length, ids },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
