// src/lib/orders/orderSessionToken.test.ts
// Unit tests for the stateless signed "My Orders" magic-link token.

import { describe, expect, it, beforeEach, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

const ORIGINAL_SECRET = process.env.AUTH_SECRET;

afterAll(() => {
  process.env.AUTH_SECRET = ORIGINAL_SECRET;
});

describe("orderSessionToken", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AUTH_SECRET = "test_auth_secret_abc123";
  });

  it("round-trips a valid token", async () => {
    const { createOrderSessionToken, verifyOrderSessionToken } = await import("./orderSessionToken");
    const token = createOrderSessionToken("Customer@Example.com");
    const result = verifyOrderSessionToken(token);
    expect(result).toEqual({ email: "customer@example.com" });
  });

  it("rejects a tampered token", async () => {
    const { createOrderSessionToken, verifyOrderSessionToken } = await import("./orderSessionToken");
    const token = createOrderSessionToken("customer@example.com");
    const [payload] = token.split(".");
    const tampered = `${payload}.deadbeef`;
    expect(verifyOrderSessionToken(tampered)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const { createOrderSessionToken, verifyOrderSessionToken } = await import("./orderSessionToken");
    const token = createOrderSessionToken("customer@example.com", -60);
    expect(verifyOrderSessionToken(token)).toBeNull();
  });

  it("rejects a malformed token", async () => {
    const { verifyOrderSessionToken } = await import("./orderSessionToken");
    expect(verifyOrderSessionToken("not-a-real-token")).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const { createOrderSessionToken } = await import("./orderSessionToken");
    const token = createOrderSessionToken("customer@example.com");

    vi.resetModules();
    process.env.AUTH_SECRET = "a_completely_different_secret";
    const { verifyOrderSessionToken } = await import("./orderSessionToken");

    expect(verifyOrderSessionToken(token)).toBeNull();
  });
});
