import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { orderingConfigPatchSchema } from "@/lib/admin/schemas";
import { db, schema } from "@/lib/db";

export async function PATCH(req: Request) {
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

  const parsed = orderingConfigPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updateFields: Record<string, unknown> = { updated_at: new Date() };
  if (parsed.data.is_ordering_open !== undefined)
    updateFields.is_ordering_open = parsed.data.is_ordering_open;
  if (parsed.data.next_delivery_date !== undefined)
    updateFields.next_delivery_date = parsed.data.next_delivery_date;
  if (parsed.data.cutoff_message !== undefined)
    updateFields.cutoff_message = parsed.data.cutoff_message;

  await db
    .update(schema.ordering_config)
    .set(updateFields)
    .where(eq(schema.ordering_config.id, 1));

  return NextResponse.json({ ok: true });
}

