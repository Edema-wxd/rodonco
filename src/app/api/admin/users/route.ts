import { randomBytes } from "crypto";

import { hash } from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import React from "react";
import { render } from "react-email";
import { z } from "zod";

import { auth } from "@/auth";
import { logActivity } from "@/lib/admin/activityLog";
import { db } from "@/lib/db";
import { resend } from "@/lib/email/resendClient";
import { AdminInviteEmail } from "@/lib/email/templates/AdminInviteEmail";
import { admins } from "../../../../../drizzle/schema";

const createSchema = z.object({
  email: z.string().email(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({ id: admins.id, email: admins.email, created_at: admins.created_at })
    .from(admins)
    .orderBy(desc(admins.created_at));

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      email: r.email,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    })),
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const [existing] = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "An admin with this email already exists." }, { status: 409 });
  }

  const tempPassword = randomBytes(10).toString("base64url").slice(0, 12);
  const password_hash = await hash(tempPassword, 12);

  const [created] = await db.insert(admins).values({ email, password_hash }).returning({ id: admins.id });

  // Send invite email — fire-and-forget, errors logged but never thrown
  try {
    const loginUrl = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://rodoandco.com"}/admin`;
    const html = await render(
      React.createElement(AdminInviteEmail, {
        email,
        tempPassword,
        loginUrl,
        invitedBy: session.user.email ?? "an admin",
      }),
    );

    const from = process.env.RESEND_FROM_EMAIL ?? "orders@rodoandco.com";
    const { error } = await resend.emails.send({
      from: `Rodo & Co <${from}>`,
      to: email,
      subject: "You've been added to the Rodo & Co admin panel",
      html,
    });

    if (error) console.error("[/api/admin/users] Resend error:", error);
  } catch (err) {
    console.error("[/api/admin/users] Failed to send invite email:", err);
  }

  logActivity({
    adminEmail: session.user.email ?? "unknown",
    action: "admin.created",
    entityId: created.id,
    entityLabel: email,
  }).catch(() => {});

  return NextResponse.json({ id: created.id }, { status: 201 });
}
