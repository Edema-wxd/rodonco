// src/lib/orders/orderTrackingLink.test.ts
// Unit tests for the "track your order" link embedded in customer emails.

import { describe, expect, it, beforeEach, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

const ORIGINAL_SECRET = process.env.AUTH_SECRET;

afterAll(() => {
  process.env.AUTH_SECRET = ORIGINAL_SECRET;
});

describe("buildOrderTrackingLink", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AUTH_SECRET = "test_auth_secret_abc123";
  });

  it("builds a verify-link URL carrying a token the verifier accepts", async () => {
    const { buildOrderTrackingLink } = await import("./orderTrackingLink");
    const { verifyOrderSessionToken } = await import("./orderSessionToken");

    const link = buildOrderTrackingLink({
      baseUrl: "https://rodoandco.com",
      customerEmail: "Customer@Example.com",
      reference: "RDC-123",
    });

    expect(link).not.toBeNull();
    const url = new URL(link as string);
    expect(url.origin).toBe("https://rodoandco.com");
    expect(url.pathname).toBe("/api/orders/verify-link");
    expect(url.searchParams.get("ref")).toBe("RDC-123");

    const token = url.searchParams.get("token");
    expect(verifyOrderSessionToken(token as string)).toEqual({ email: "customer@example.com" });
  });

  it("omits the ref param when no reference is given", async () => {
    const { buildOrderTrackingLink } = await import("./orderTrackingLink");
    const link = buildOrderTrackingLink({
      baseUrl: "https://rodoandco.com",
      customerEmail: "customer@example.com",
    });
    expect(new URL(link as string).searchParams.has("ref")).toBe(false);
  });

  it("returns null when no base URL is configured", async () => {
    const { buildOrderTrackingLink } = await import("./orderTrackingLink");
    expect(
      buildOrderTrackingLink({ baseUrl: "", customerEmail: "customer@example.com" })
    ).toBeNull();
  });

  it("returns null instead of throwing when AUTH_SECRET is missing", async () => {
    delete process.env.AUTH_SECRET;
    const { buildOrderTrackingLink } = await import("./orderTrackingLink");
    expect(
      buildOrderTrackingLink({
        baseUrl: "https://rodoandco.com",
        customerEmail: "customer@example.com",
      })
    ).toBeNull();
  });

  it("issues a token that outlives the 30-minute on-demand magic link", async () => {
    const { buildOrderTrackingLink, EMAIL_LINK_TTL_SECONDS } = await import("./orderTrackingLink");
    expect(EMAIL_LINK_TTL_SECONDS).toBeGreaterThan(30 * 60);

    const link = buildOrderTrackingLink({
      baseUrl: "https://rodoandco.com",
      customerEmail: "customer@example.com",
    });
    const token = new URL(link as string).searchParams.get("token") as string;
    const [encodedPayload] = token.split(".");
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

    expect(payload.exp - Math.floor(Date.now() / 1000)).toBeGreaterThan(30 * 60);
  });
});
