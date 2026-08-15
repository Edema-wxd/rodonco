// POST /api/waitlist — capture a waitlist signup (name, email, area) into Neon.
// One row per email: a repeat signup updates the stored name/area instead of
// erroring, so the customer always sees success.

import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { db, schema } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

const waitlistSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(200),
  email: z.string().trim().email("Enter a valid email address").max(320),
  area: z.string().trim().min(1, "Tell us where you live").max(200),
});

export async function POST(req: Request): Promise<NextResponse> {
  // Rate limit: 5/min and 30/hr per IP — cheap protection against spam signups.
  const ip = getClientIP(req);
  const [perMinute, perHour] = await Promise.all([
    rateLimit(ip, { requests: 5, window: "1 m", prefix: "rl:waitlist:minute", route: "/api/waitlist (5/min)" }),
    rateLimit(ip, { requests: 30, window: "1 h", prefix: "rl:waitlist:hour", route: "/api/waitlist (30/hr)" }),
  ]);
  if (perMinute.limited) return perMinute.response;
  if (perHour.limited) return perHour.response;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, area } = parsed.data;
  // Normalise email so casing/spacing never creates duplicate rows.
  const email = parsed.data.email.toLowerCase();

  try {
    await db
      .insert(schema.waitlist)
      .values({ name, email, area })
      .onConflictDoUpdate({
        target: schema.waitlist.email,
        set: { name, area },
      });
  } catch (err) {
    console.error("[/api/waitlist] DB insert error:", err);
    return NextResponse.json(
      { error: "Could not add you to the waitlist. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
