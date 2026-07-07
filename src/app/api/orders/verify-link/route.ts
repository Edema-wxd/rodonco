// src/app/api/orders/verify-link/route.ts
// GET /api/orders/verify-link?token=... — consumes the "My Orders" magic link.
//
// Validates the signed token, then sets:
//  - `order_session` cookie so /orders/my-orders recognizes this browser
//  - `order_view_<reference>` for each of the customer's orders, so clicking
//    through to /order/[ref] shows the full (non-stripped) detail — the
//    customer has already proven ownership of the email on this page.
// Redirects to /orders/my-orders either way; an invalid/expired token just
// lands on the request form since no valid cookie gets set.

import "server-only";

import { NextResponse } from "next/server";

import { verifyOrderSessionToken } from "@/lib/orders/orderSessionToken";
import { getOrdersByEmail } from "@/lib/orders/getOrdersByEmail";

const SESSION_COOKIE = "order_session";
const SESSION_MAX_AGE_SECONDS = 30 * 60;

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get("token");
  const redirectUrl = new URL("/orders/my-orders", origin);

  if (!token) {
    return NextResponse.redirect(redirectUrl);
  }

  const result = verifyOrderSessionToken(token);
  if (!result) {
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  try {
    const orders = await getOrdersByEmail(result.email);
    for (const order of orders) {
      response.cookies.set(`order_view_${order.reference}`, "1", {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 86400,
        path: "/",
      });
    }
  } catch (err) {
    console.error("[/api/orders/verify-link] Could not set per-order view cookies:", err);
  }

  return response;
}
