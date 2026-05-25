import "server-only";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logActivity } from "@/lib/admin/activityLog";
import { db, schema } from "@/lib/db";

// PATCH /api/admin/abandoned-carts/[id]
// Body: { action: "mark_contacted" | "mark_not_contacted" }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const action = (body as Record<string, unknown>)?.action;
  if (action !== "mark_contacted" && action !== "mark_not_contacted") {
    return NextResponse.json({ error: "action must be mark_contacted or mark_not_contacted" }, { status: 400 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ id: schema.abandoned_carts.id, customer_email: schema.abandoned_carts.customer_email })
    .from(schema.abandoned_carts)
    .where(eq(schema.abandoned_carts.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newContactedAt = action === "mark_contacted" ? new Date() : null;
  await db
    .update(schema.abandoned_carts)
    .set({ contacted_at: newContactedAt })
    .where(eq(schema.abandoned_carts.id, id));

  logActivity({
    adminEmail: session.user.email ?? "unknown",
    action:
      action === "mark_contacted"
        ? "abandoned_cart.marked_contacted"
        : "abandoned_cart.marked_not_contacted",
    entityId: id,
    entityLabel: existing.customer_email,
    details: { customer_email: existing.customer_email },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/abandoned-carts/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ id: schema.abandoned_carts.id, customer_email: schema.abandoned_carts.customer_email })
    .from(schema.abandoned_carts)
    .where(eq(schema.abandoned_carts.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(schema.abandoned_carts).where(eq(schema.abandoned_carts.id, id));

  logActivity({
    adminEmail: session.user.email ?? "unknown",
    action: "abandoned_cart.deleted",
    entityId: id,
    entityLabel: existing.customer_email,
    details: { customer_email: existing.customer_email },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
