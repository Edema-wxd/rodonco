import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logActivity } from "@/lib/admin/activityLog";
import { db } from "@/lib/db";
import { admins } from "../../../../../../drizzle/schema";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [target] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "Admin not found." }, { status: 404 });

  if (target.email === session.user.email) {
    return NextResponse.json({ error: "You cannot remove your own account." }, { status: 403 });
  }

  const [{ total }] = await db.select({ total: count() }).from(admins);
  if (Number(total) <= 1) {
    return NextResponse.json({ error: "Cannot remove the last admin account." }, { status: 409 });
  }

  await db.delete(admins).where(eq(admins.id, id));

  logActivity({
    adminEmail: session.user.email ?? "unknown",
    action: "admin.removed",
    entityId: id,
    entityLabel: target.email,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
