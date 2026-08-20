// src/lib/orders/orderViewGrant.ts
// Stateless signed grant for ONE order reference — the narrow post-checkout
// path to full order detail.
//
// A guest who has just paid has proved nothing about their email address, so
// the `order_session` cookie (which authorizes by verified email) cannot cover
// them. This does: /api/orders/init mints a grant naming the reference IT just
// created for that browser, and /order/[ref] honours it only for that exact
// reference. Nothing here trusts a client-supplied reference — the only writer
// is the route that generated the reference in the first place.
//
// Same construction as src/lib/orders/orderSessionToken.ts: payload carries
// { ref, exp }, HMAC-signed with AUTH_SECRET, verified with a constant-time
// comparison. The signing input is domain-separated so a session token can
// never be replayed as a view grant, or vice versa.

import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

/** Single cookie, replaced on each checkout — never one per order. */
export const ORDER_VIEW_GRANT_COOKIE = "order_view_grant";

/** Matches the maxAge the old per-order post-checkout cookie used. */
export const ORDER_VIEW_GRANT_TTL_SECONDS = 24 * 60 * 60;

const DOMAIN_SEPARATOR = "order-view-grant.v1:";

interface GrantPayload {
  ref: string;
  exp: number; // unix seconds
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(DOMAIN_SEPARATOR + payload).digest("hex");
}

export function createOrderViewGrant(
  reference: string,
  ttlSeconds: number = ORDER_VIEW_GRANT_TTL_SECONDS
): string {
  const payload: GrantPayload = {
    ref: reference,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyOrderViewGrant(token: string): { reference: string } | null {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    const expected = sign(encodedPayload);
    const expectedBuf = Buffer.from(expected, "utf8");
    const signatureBuf = Buffer.from(signature, "utf8");
    if (expectedBuf.length !== signatureBuf.length) return null;
    if (!timingSafeEqual(expectedBuf, signatureBuf)) return null;

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as GrantPayload;

    if (typeof payload.ref !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { reference: payload.ref };
  } catch {
    return null;
  }
}

/**
 * True when `token` is a live grant for exactly `reference`. Callers pass the
 * reference from the URL; a grant for a different order never matches.
 */
export function grantCoversReference(
  token: string | undefined,
  reference: string
): boolean {
  if (!token) return false;
  return verifyOrderViewGrant(token)?.reference === reference;
}
