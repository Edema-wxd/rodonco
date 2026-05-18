import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { orderStatusPatchSchema } from "@/lib/admin/schemas";
import { logActivity } from "@/lib/admin/activityLog";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { orders } from "../../../../../../drizzle/schema";


export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const parsed = orderStatusPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await params;

  const [order] = await db
    .select({ reference: orders.reference, status: orders.status })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  await db.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, id));

  if (order) {
    logActivity({
      adminEmail: session.user.email ?? "unknown",
      action: "order.status_changed",
      entityId: id,
      entityLabel: `#${order.reference}`,
      details: { from: order.status, to: parsed.data.status, reference: order.reference },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [order] = await db
    .select({ reference: orders.reference })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  await db.delete(orders).where(eq(orders.id, id));

  if (order) {
    logActivity({
      adminEmail: session.user.email ?? "unknown",
      action: "order.deleted",
      entityId: id,
      entityLabel: `#${order.reference}`,
      details: { reference: order.reference },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
