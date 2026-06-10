import React from "react";
import { render } from "react-email";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getPaidOrdersForWeek } from "@/lib/admin/reminders";
import { resend } from "@/lib/email/resendClient";
import { logEmail } from "@/lib/email/logEmail";
import { DeliveryReminderEmail } from "@/lib/email/templates/DeliveryReminderEmail";

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
      { status: 400 },
    );
  }

  const orders = await getPaidOrdersForWeek(parsed.data.week_of);

  if (orders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "orders@rodoandco.com";

  const emails = await Promise.all(
    orders.map(async (order) => {
      const html = await render(
        React.createElement(DeliveryReminderEmail, {
          customerName: order.customer_name,
          weekOf: parsed.data.week_of,
        }),
      );
      return {
        from: `Rodo & Co <${from}>`,
        to: [order.customer_email],
        subject: "Your Rodo & Co delivery is this Saturday!",
        html,
      };
    }),
  );

  const { data: batchData, error } = await resend.batch.send(emails);

  if (error) {
    orders.forEach((order, i) => {
      logEmail({
        type: "delivery_reminder",
        to: order.customer_email,
        subject: emails[i]?.subject ?? "Your Rodo & Co delivery is this Saturday!",
        status: "failed",
        error: JSON.stringify(error),
      });
    });
    console.error("[reminders] Resend batch error:", error);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  orders.forEach((order, i) => {
    logEmail({
      type: "delivery_reminder",
      to: order.customer_email,
      subject: emails[i]?.subject ?? "Your Rodo & Co delivery is this Saturday!",
      status: "sent",
      resendId: batchData?.data?.[i]?.id ?? null,
    });
  });

  return NextResponse.json({ sent: orders.length });
}
