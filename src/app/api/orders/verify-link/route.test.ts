// src/app/api/orders/verify-link/route.test.ts
// Tests for GET /api/orders/verify-link — the magic-link / email tracking-link
// consumer. Covers the redirect target (including the untrusted `ref` guard)
// and the cookies granted: exactly one `order_session`, never one per order.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { mockState } = vi.hoisted(() => ({
  mockState: {
    orders: [] as { reference: string }[],
    throwOnLoad: false,
  },
}));

vi.mock("@/lib/orders/getOrdersByEmail", () => ({
  getOrdersByEmail: vi.fn(async () => {
    if (mockState.throwOnLoad) throw new Error("db down");
    return mockState.orders;
  }),
}));

const ORIGIN = "https://rodoandco.com";

async function callWith(params: Record<string, string>, cookieHeader?: string) {
  const { GET } = await import("./route");
  const url = new URL("/api/orders/verify-link", ORIGIN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return GET(new Request(url, cookieHeader ? { headers: { cookie: cookieHeader } } : undefined));
}

async function tokenFor(email: string, ttlSeconds?: number) {
  const { createOrderSessionToken } = await import("@/lib/orders/orderSessionToken");
  return createOrderSessionToken(email, ttlSeconds);
}

describe("GET /api/orders/verify-link", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AUTH_SECRET = "test_auth_secret_abc123";
    mockState.orders = [{ reference: "RDC-111" }, { reference: "RDC-222" }];
    mockState.throwOnLoad = false;
  });

  it("redirects to the history page and sets a session cookie for a valid token", async () => {
    const res = await callWith({ token: await tokenFor("customer@example.com") });

    expect(res.headers.get("location")).toBe(`${ORIGIN}/orders/my-orders`);
    expect(res.cookies.get("order_session")?.value).toBeTruthy();
  });

  it("redirects to the order page when ref belongs to the customer", async () => {
    const res = await callWith({
      token: await tokenFor("customer@example.com"),
      ref: "RDC-222",
    });

    expect(res.headers.get("location")).toBe(`${ORIGIN}/order/RDC-222`);
  });

  it("ignores a ref the customer does not own", async () => {
    const res = await callWith({
      token: await tokenFor("customer@example.com"),
      ref: "RDC-SOMEONE-ELSE",
    });

    expect(res.headers.get("location")).toBe(`${ORIGIN}/orders/my-orders`);
  });

  it("does not honour a ref used to smuggle an external redirect", async () => {
    const res = await callWith({
      token: await tokenFor("customer@example.com"),
      ref: "//evil.example.com",
    });

    const location = res.headers.get("location") as string;
    expect(new URL(location).origin).toBe(ORIGIN);
    expect(location).toBe(`${ORIGIN}/orders/my-orders`);
  });

  // Previously this route set one `order_view_<reference>` cookie per order, so
  // a customer with 40 orders carried 40 cookies on every request. Access to
  // those same orders now rides entirely on the single session cookie.
  it("grants access to the customer's orders without a cookie per order", async () => {
    mockState.orders = Array.from({ length: 40 }, (_, i) => ({ reference: `RDC-${i}` }));

    const res = await callWith({ token: await tokenFor("customer@example.com") });

    const setCookies = res.cookies.getAll();
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0].name).toBe("order_session");
  });

  it("expires legacy per-order cookies the browser is still carrying", async () => {
    const res = await callWith(
      { token: await tokenFor("customer@example.com") },
      "order_view_RDC-111=1; order_session=stale; order_view_RDC-222=1"
    );

    expect(res.cookies.get("order_view_RDC-111")?.maxAge).toBe(0);
    expect(res.cookies.get("order_view_RDC-222")?.maxAge).toBe(0);
    // The freshly minted session must survive the sweep.
    expect(res.cookies.get("order_session")?.value).toBeTruthy();
    expect(res.cookies.get("order_session")?.maxAge).toBeGreaterThan(24 * 60 * 60);
  });

  it("issues a session token that outlives the short-lived emailed link", async () => {
    const { verifyOrderSessionToken } = await import("@/lib/orders/orderSessionToken");

    // Emailed link expires in 60s; the resulting session must not inherit that.
    const res = await callWith({ token: await tokenFor("customer@example.com", 60) });
    const sessionToken = res.cookies.get("order_session")?.value as string;

    const [encodedPayload] = sessionToken.split(".");
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

    expect(payload.exp - Math.floor(Date.now() / 1000)).toBeGreaterThan(24 * 60 * 60);
    expect(verifyOrderSessionToken(sessionToken)).toEqual({ email: "customer@example.com" });
    expect(res.cookies.get("order_session")?.maxAge).toBeGreaterThan(24 * 60 * 60);
  });

  it("redirects to the request form without cookies when the token is missing", async () => {
    const res = await callWith({});

    expect(res.headers.get("location")).toBe(`${ORIGIN}/orders/my-orders`);
    expect(res.cookies.get("order_session")).toBeUndefined();
  });

  it("redirects to the request form without cookies when the token is expired", async () => {
    const res = await callWith({ token: await tokenFor("customer@example.com", -60) });

    expect(res.headers.get("location")).toBe(`${ORIGIN}/orders/my-orders`);
    expect(res.cookies.get("order_session")).toBeUndefined();
  });

  it("still establishes the session when the orders lookup fails", async () => {
    mockState.throwOnLoad = true;
    const res = await callWith({ token: await tokenFor("customer@example.com"), ref: "RDC-111" });

    expect(res.headers.get("location")).toBe(`${ORIGIN}/orders/my-orders`);
    expect(res.cookies.get("order_session")?.value).toBeTruthy();
  });
});
