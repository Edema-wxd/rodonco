// src/app/api/orders/request-link/route.ts
// POST /api/orders/request-link — customer "My Orders" magic-link request.
//
// Always returns the same generic response regardless of whether the email
// has any orders, so this endpoint can't be used to enumerate customers.

import "server-only";

import { render } from "react-email";
import React from "react";
import { NextResponse } from "next/server";
import { z } from "zod";

import { resend } from "@/lib/email/resendClient";
import { logEmail } from "@/lib/email/logEmail";
import { OrderHistoryLink } from "@/lib/email/templates/OrderHistoryLink";
import { getOrdersByEmail } from "@/lib/orders/getOrdersByEmail";
import { createOrderSessionToken } from "@/lib/orders/orderSessionToken";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

const requestLinkSchema = z.object({
  email: z.string().email("A valid email address is required"),
});

const TTL_MINUTES = 30;

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "orders@rodoandco.com";
}

export async function POST(req: Request): Promise<NextResponse> {
  const ip = getClientIP(req);
  const rl = await rateLimit(ip, {
    requests: 3,
    window: "1 h",
    prefix: "rl:orders-request-link",
    route: "/api/orders/request-link (3/hr)",
  });
  if (rl.limited) return rl.response;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestLinkSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  // Generic response — sent whether or not this email has orders.
  const genericResponse = NextResponse.json({ ok: true });

  try {
    const orders = await getOrdersByEmail(email);
    if (orders.length === 0) return genericResponse;

    const rawHost =
      req.headers.get("origin") ??
      req.headers.get("x-forwarded-host") ??
      req.headers.get("host") ??
      "";
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      (rawHost.startsWith("http") ? rawHost : `https://${rawHost}`);

    const token = createOrderSessionToken(email, TTL_MINUTES * 60);
    const link = `${origin}/api/orders/verify-link?token=${encodeURIComponent(token)}`;

    const html = await render(
      React.createElement(OrderHistoryLink, { link, expiresInMinutes: TTL_MINUTES })
    );

    const subject = "View your Rodo & Co orders";
    const { data, error } = await resend.emails.send({
      from: `Rodo & Co <${getFromAddress()}>`,
      to: email,
      subject,
      html,
    });

    logEmail({
      type: "order_history_link",
      to: email,
      subject,
      status: error ? "failed" : "sent",
      resendId: data?.id ?? null,
      error: error ? JSON.stringify(error) : null,
    });

    if (error) {
      console.error("[/api/orders/request-link] Resend send error:", error);
    }
  } catch (err) {
    console.error("[/api/orders/request-link] Unexpected error:", err);
  }

  return genericResponse;
}
