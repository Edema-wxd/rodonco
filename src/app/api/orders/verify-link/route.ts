// src/app/api/orders/verify-link/route.ts
// GET /api/orders/verify-link?token=...[&ref=...] — consumes either a "My
// Orders" magic link (from the request form) or a "track your order" link
// (from a receipt / delivery reminder email).
//
// Validates the signed token, then sets `order_session` — a FRESHLY minted
// token. Reusing the incoming one would cap the browser session at that link's
// own `exp`, which verifyOrderSessionToken re-checks on every read, so a
// 30-minute emailed link would otherwise mean a 30-minute session no matter the
// cookie maxAge.
//
// That one cookie is the whole grant: following the link proves control of the
// email address, and /order/[ref] renders full detail for any order the DB says
// that email placed. This used to also set an `order_view_<reference>` cookie
// per order, which meant a customer with 40 orders carried 40 cookies on every
// request to the site, static assets included.
//
// Redirects to /order/<ref> when `ref` is one of this customer's own orders,
// otherwise to /orders/my-orders. An invalid or expired token just lands on the
// request form, since no valid cookie gets set.

import "server-only";

import { NextResponse } from "next/server";

import {
  createOrderSessionToken,
  verifyOrderSessionToken,
} from "@/lib/orders/orderSessionToken";
import { getOrdersByEmail } from "@/lib/orders/getOrdersByEmail";
import type { Order } from "@/types";

const SESSION_COOKIE = "order_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const LEGACY_VIEW_COOKIE_PREFIX = "order_view_";

/**
 * Expire any `order_view_<reference>` cookies this browser is still carrying
 * from the previous per-order scheme. They are dead weight now — the session
 * cookie authorizes these same orders — and this is the one route the
 * heaviest-laden customers reliably pass through.
 */
function clearLegacyViewCookies(req: Request, response: NextResponse): void {
  const header = req.headers.get("cookie");
  if (!header) return;

  for (const pair of header.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (name?.startsWith(LEGACY_VIEW_COOKIE_PREFIX)) {
      response.cookies.set(name, "", { maxAge: 0, path: "/" });
    }
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get("token");
  const historyUrl = new URL("/orders/my-orders", origin);

  if (!token) {
    return NextResponse.redirect(historyUrl);
  }

  const result = verifyOrderSessionToken(token);
  if (!result) {
    return NextResponse.redirect(historyUrl);
  }

  // Load the orders before choosing a destination: the list proves a requested
  // `ref` belongs to this customer, so we never redirect to a caller-supplied
  // path we haven't verified.
  let orders: Order[] = [];
  try {
    orders = await getOrdersByEmail(result.email);
  } catch (err) {
    console.error("[/api/orders/verify-link] Could not load orders:", err);
  }

  const requestedRef = searchParams.get("ref");
  const ownsRequestedRef =
    requestedRef !== null && orders.some((order) => order.reference === requestedRef);

  const response = NextResponse.redirect(
    ownsRequestedRef
      ? new URL(`/order/${encodeURIComponent(requestedRef)}`, origin)
      : historyUrl
  );

  // Safe: verifyOrderSessionToken already succeeded, so AUTH_SECRET is present.
  response.cookies.set(
    SESSION_COOKIE,
    createOrderSessionToken(result.email, SESSION_MAX_AGE_SECONDS),
    {
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    }
  );

  clearLegacyViewCookies(req, response);

  return response;
}
