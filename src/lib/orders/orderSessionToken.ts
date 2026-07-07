// src/lib/orders/orderSessionToken.ts
// Stateless signed token for the customer "My Orders" magic-link flow.
// No DB table: the token itself carries { email, exp }, HMAC-signed with
// AUTH_SECRET (same secret NextAuth already requires), verified with a
// constant-time comparison — mirrors src/lib/paystack/verifySignature.ts.

import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_SECONDS = 30 * 60;

interface TokenPayload {
  email: string;
  exp: number; // unix seconds
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createOrderSessionToken(
  email: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): string {
  const payload: TokenPayload = {
    email: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyOrderSessionToken(token: string): { email: string } | null {
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
    ) as TokenPayload;

    if (typeof payload.email !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { email: payload.email };
  } catch {
    return null;
  }
}
