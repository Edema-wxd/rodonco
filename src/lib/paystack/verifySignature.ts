// src/lib/paystack/verifySignature.ts
// HMAC-SHA512 signature verification for Paystack webhooks.
//
// Paystack signs every webhook delivery with HMAC-SHA512 of the raw request body,
// using the Paystack secret key. The resulting hex digest is sent in the
// `x-paystack-signature` header.
//
// CRITICAL: Call `req.text()` BEFORE any JSON parsing. The body stream is single-pass;
// parsing JSON first silently destroys the raw bytes needed for HMAC (CONTEXT D-16).

import { createHmac, timingSafeEqual } from "crypto";

export interface VerifyPaystackSignatureInput {
  /** Raw request body as a UTF-8 string — must be read via `req.text()` before JSON parsing */
  rawBody: string;
  /** Value of the `x-paystack-signature` request header */
  signature: string;
  /** Paystack secret key — from `PAYSTACK_SECRET_KEY` environment variable */
  secret: string;
}

/**
 * Verifies the HMAC-SHA512 signature Paystack attaches to every webhook delivery.
 *
 * Uses `crypto.timingSafeEqual` to prevent timing-based side-channel attacks.
 *
 * @returns `true` if the signature is valid; `false` otherwise.
 */
export function verifyPaystackSignature({
  rawBody,
  signature,
  secret,
}: VerifyPaystackSignatureInput): boolean {
  if (!signature || !secret) return false;

  try {
    const expected = createHmac("sha512", secret).update(rawBody).digest("hex");

    // Paystack always sends lowercase hex. We compare raw strings via timingSafeEqual
    // on UTF-8 buffers so the comparison is both constant-time and case-sensitive.
    const expectedBuf = Buffer.from(expected, "utf8");
    const signatureBuf = Buffer.from(signature, "utf8");

    if (expectedBuf.length !== signatureBuf.length) return false;

    return timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    // Any error (e.g. invalid input) is treated as verification failure.
    return false;
  }
}
