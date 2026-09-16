import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logActivity } from "@/lib/admin/activityLog";
import { menuPreviewPatchSchema } from "@/lib/admin/schemas";
import { db, schema } from "@/lib/db";
import { MENU_PREVIEW_CACHE_TAG, getMenuPreviewConfig } from "@/lib/homepage/menuPreview";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getMenuPreviewConfig());
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

  const parsed = menuPreviewPatchSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: firstIssue ? `${firstIssue.path.join(".") || "payload"}: ${firstIssue.message}` : "Invalid payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const values = { ...parsed.data, updated_at: new Date() };

  // Upsert so saving works even if the seed row from migration 0016 is missing.
  await db
    .insert(schema.homepage_menu_preview)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: schema.homepage_menu_preview.id, set: values });

  revalidateTag(MENU_PREVIEW_CACHE_TAG);

  logActivity({
    adminEmail: session.user.email ?? "unknown",
    action: "settings.homepage_updated",
    entityLabel: "Ready for the Pot section",
    details: parsed.data as Record<string, unknown>,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
