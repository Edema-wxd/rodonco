// src/lib/paystack/verifySignature.test.ts
// Unit tests for the Paystack webhook HMAC-SHA512 signature verification helper.
// Uses a fixed body + secret vector to assert correctness.

import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { verifyPaystackSignature } from "./verifySignature";

// ── Test vectors ──────────────────────────────────────────────────────────────

const SECRET = "test_secret_key_abc123";
const BODY = JSON.stringify({ event: "charge.success", data: { reference: "RDC-abc1234567" } });

/** Helper: compute expected HMAC for a given body+secret */
function computeHmac(body: string, secret: string): string {
  return createHmac("sha512", secret).update(body).digest("hex");
}

const VALID_SIGNATURE = computeHmac(BODY, SECRET);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("verifyPaystackSignature", () => {
  it("returns true for a valid signature", () => {
    expect(verifyPaystackSignature({ rawBody: BODY, signature: VALID_SIGNATURE, secret: SECRET })).toBe(true);
  });

  it("returns false for a tampered body", () => {
    const tampered = BODY + " ";
    expect(verifyPaystackSignature({ rawBody: tampered, signature: VALID_SIGNATURE, secret: SECRET })).toBe(false);
  });

  it("returns false for a wrong secret", () => {
    const wrongSig = computeHmac(BODY, "wrong_secret");
    expect(verifyPaystackSignature({ rawBody: BODY, signature: wrongSig, secret: SECRET })).toBe(false);
  });

  it("returns false for a completely invalid signature string", () => {
    expect(verifyPaystackSignature({ rawBody: BODY, signature: "deadbeef", secret: SECRET })).toBe(false);
  });

  it("returns false for an empty signature", () => {
    expect(verifyPaystackSignature({ rawBody: BODY, signature: "", secret: SECRET })).toBe(false);
  });

  it("returns false for an empty body (body hash won't match)", () => {
    const emptyBodySig = computeHmac("", SECRET);
    expect(verifyPaystackSignature({ rawBody: BODY, signature: emptyBodySig, secret: SECRET })).toBe(false);
  });

  it("is case-sensitive — uppercase hex is not equal to lowercase", () => {
    const upperSig = VALID_SIGNATURE.toUpperCase();
    // Only passes if the implementation normalises both sides; otherwise must fail.
    // Per spec, Paystack sends lowercase hex — we compare lowercase; uppercase should fail.
    expect(verifyPaystackSignature({ rawBody: BODY, signature: upperSig, secret: SECRET })).toBe(false);
  });
});
