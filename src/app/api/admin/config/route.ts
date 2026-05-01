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

  await db
    .update(schema.ordering_config)
    .set({
      is_ordering_open: parsed.data.is_ordering_open,
      updated_at: new Date(),
    })
    .where(eq(schema.ordering_config.id, 1));

  return NextResponse.json({ ok: true });
}

