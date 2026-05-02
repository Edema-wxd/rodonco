import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { orderStatusPatchSchema } from "@/lib/admin/schemas";
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
  await db.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, id));

  return NextResponse.json({ ok: true });
}

