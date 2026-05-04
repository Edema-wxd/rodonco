import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { auth } from "@/auth";
import { getPaidOrdersForWeek } from "@/lib/admin/reminders";

const resend = new Resend(process.env.RESEND_API_KEY);

const reminderBodySchema = z.object({
  week_of: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "week_of must be YYYY-MM-DD")
    .refine((val) => {
      const d = new Date(val);
      return d.getDay() === 6; // Saturday
    }, "week_of must be a Saturday"),
});

export async function POST(req: Request) {
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

  const parsed = reminderBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const orders = await getPaidOrdersForWeek(parsed.data.week_of);

  if (orders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const { error } = await resend.batch.send(
    orders.map((order) => ({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: [order.customer_email],
      subject: "Your Rodo & Co delivery is this Saturday!",
      html: `<p>Hi ${order.customer_name},</p><p>Just a reminder that your Rodo &amp; Co order is scheduled for delivery this Saturday (${parsed.data.week_of}). We're preparing everything fresh for you!</p><p>Thank you for ordering with us.</p><p>— The Rodo &amp; Co team</p>`,
    }))
  );

  if (error) {
    console.error("[reminders] Resend batch error:", error);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({ sent: orders.length });
}
