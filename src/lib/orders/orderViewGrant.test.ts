// src/lib/orders/orderViewGrant.test.ts
// Unit tests for the signed single-order view grant used by the post-checkout
// path. Mirrors orderSessionToken.test.ts, plus the cross-token replay guard.

import { describe, expect, it, beforeEach, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

const ORIGINAL_SECRET = process.env.AUTH_SECRET;

afterAll(() => {
  process.env.AUTH_SECRET = ORIGINAL_SECRET;
});

describe("orderViewGrant", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AUTH_SECRET = "test_auth_secret_abc123";
  });

  it("round-trips a valid grant", async () => {
    const { createOrderViewGrant, verifyOrderViewGrant } = await import("./orderViewGrant");
    const token = createOrderViewGrant("RDC-abc123");
    expect(verifyOrderViewGrant(token)).toEqual({ reference: "RDC-abc123" });
  });

  it("rejects a tampered grant", async () => {
    const { createOrderViewGrant, verifyOrderViewGrant } = await import("./orderViewGrant");
    const [payload] = createOrderViewGrant("RDC-abc123").split(".");
    expect(verifyOrderViewGrant(`${payload}.deadbeef`)).toBeNull();
  });

  it("rejects an expired grant", async () => {
    const { createOrderViewGrant, verifyOrderViewGrant } = await import("./orderViewGrant");
    expect(verifyOrderViewGrant(createOrderViewGrant("RDC-abc123", -60))).toBeNull();
  });

  it("rejects a malformed grant", async () => {
    const { verifyOrderViewGrant } = await import("./orderViewGrant");
    expect(verifyOrderViewGrant("not-a-real-token")).toBeNull();
  });

  it("rejects a grant signed with a different secret", async () => {
    const { createOrderViewGrant } = await import("./orderViewGrant");
    const token = createOrderViewGrant("RDC-abc123");

    vi.resetModules();
    process.env.AUTH_SECRET = "a_completely_different_secret";
    const { verifyOrderViewGrant } = await import("./orderViewGrant");

    expect(verifyOrderViewGrant(token)).toBeNull();
  });

  // Both token types share a secret and a wire format, so domain separation is
  // what stops one standing in for the other.
  it("does not accept a session token as a grant, or a grant as a session", async () => {
    const { createOrderViewGrant, verifyOrderViewGrant } = await import("./orderViewGrant");
    const { createOrderSessionToken, verifyOrderSessionToken } = await import(
      "./orderSessionToken"
    );

    expect(verifyOrderViewGrant(createOrderSessionToken("customer@example.com"))).toBeNull();
    expect(verifyOrderSessionToken(createOrderViewGrant("RDC-abc123"))).toBeNull();
  });

  it("throws rather than issuing an unsigned grant when AUTH_SECRET is missing", async () => {
    delete process.env.AUTH_SECRET;
    const { createOrderViewGrant } = await import("./orderViewGrant");
    expect(() => createOrderViewGrant("RDC-abc123")).toThrow(/AUTH_SECRET/);
  });

  describe("grantCoversReference", () => {
    it("matches only the reference the grant names", async () => {
      const { createOrderViewGrant, grantCoversReference } = await import("./orderViewGrant");
      const token = createOrderViewGrant("RDC-abc123");

      expect(grantCoversReference(token, "RDC-abc123")).toBe(true);
      expect(grantCoversReference(token, "RDC-someone-else")).toBe(false);
    });

    it("is false when no grant cookie is present", async () => {
      const { grantCoversReference } = await import("./orderViewGrant");
      expect(grantCoversReference(undefined, "RDC-abc123")).toBe(false);
    });
  });
});
