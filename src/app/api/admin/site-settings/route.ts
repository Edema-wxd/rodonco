import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { siteSettingsPatchSchema } from "@/lib/admin/schemas";
import { logActivity } from "@/lib/admin/activityLog";
import { db, schema } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(schema.site_settings)
    .where(eq(schema.site_settings.id, 1))
    .limit(1);

  return NextResponse.json(row ?? null);
}

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

  const parsed = siteSettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updateFields: Record<string, unknown> = { updated_at: new Date() };
  if (parsed.data.whatsapp_number !== undefined)
    updateFields.whatsapp_number = parsed.data.whatsapp_number;
  if (parsed.data.contact_email !== undefined)
    updateFields.contact_email = parsed.data.contact_email;
  if (parsed.data.instagram_handle !== undefined)
    updateFields.instagram_handle = parsed.data.instagram_handle;

  await db
    .update(schema.site_settings)
    .set(updateFields)
    .where(eq(schema.site_settings.id, 1));

  logActivity({
    adminEmail: session.user.email ?? "unknown",
    action: "settings.site_settings_updated",
    details: parsed.data as Record<string, unknown>,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
