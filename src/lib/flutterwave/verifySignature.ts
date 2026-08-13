// src/lib/flutterwave/verifySignature.ts
// Webhook authenticity check for Flutterwave.
//
// Unlike Paystack (HMAC over the body), Flutterwave authenticates webhooks with a
// static "secret hash": the value you set in the dashboard (Settings → Webhooks)
// is sent verbatim in the `verif-hash` header on every delivery. We compare it,
// in constant time, against FLW_WEBHOOK_HASH.

import { timingSafeEqual } from "crypto";

export interface VerifyFlutterwaveSignatureInput {
  /** Value of the `verif-hash` request header */
  signature: string;
  /** Our configured secret hash — from `FLW_WEBHOOK_HASH` environment variable */
  secret: string;
}

/**
 * Verifies the `verif-hash` header Flutterwave attaches to every webhook delivery.
 *
 * Uses `crypto.timingSafeEqual` to prevent timing-based side-channel attacks.
 *
 * @returns `true` if the header matches the configured secret hash; `false` otherwise.
 */
export function verifyFlutterwaveSignature({
  signature,
  secret,
}: VerifyFlutterwaveSignatureInput): boolean {
  if (!signature || !secret) return false;

  try {
    const signatureBuf = Buffer.from(signature, "utf8");
    const secretBuf = Buffer.from(secret, "utf8");

    if (signatureBuf.length !== secretBuf.length) return false;

    return timingSafeEqual(signatureBuf, secretBuf);
  } catch {
    return false;
  }
}
