// src/app/(customer)/order/[ref]/page.test.tsx
// Tests the confirmation page's authorization decision — the `stripped` prop
// that removes name, phone, and delivery address from the view.
//
// Full detail is earned two ways and no other: an `order_session` whose
// verified email placed THIS order, or a signed single-order `order_view_grant`
// naming THIS reference. Everything else — a guessed reference, another
// customer's session, a forged cookie — must fall back to the stripped view.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { mockState } = vi.hoisted(() => ({
  mockState: {
    cookies: {} as Record<string, string>,
    customerEmail: "owner@example.com",
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name in mockState.cookies ? { name, value: mockState.cookies[name] } : undefined,
    has: (name: string) => name in mockState.cookies,
  }),
}));

vi.mock("@/lib/orders/getOrderForConfirmation", () => ({
  getOrderForConfirmation: vi.fn(async (reference: string) => ({
    kind: "paid" as const,
    order: {
      id: "order-1",
      reference,
      customer_name: "Ada Owner",
      customer_email: mockState.customerEmail,
      customer_phone: "08012345678",
      delivery_address: "12 Owner Street, Lagos",
      allergy_notes: null,
      status: "paid",
      total_ngn: 25000,
      week_of: "2026-08-16",
      created_at: "2026-08-16T10:00:00.000Z",
      notified_at: null,
    },
    items: [],
  })),
}));

vi.mock("@/lib/orders/markOrderPaid", () => ({ markOrderPaid: vi.fn() }));
vi.mock("@/lib/paystack/verifyTransaction", () => ({ verifyPaystackTransaction: vi.fn() }));
vi.mock("@/lib/flutterwave/verifyTransaction", () => ({ verifyFlutterwaveTransaction: vi.fn() }));
vi.mock("@/lib/shop/orderingConfig", () => ({
  getOrderingConfig: vi.fn(async () => ({ next_delivery_date: "2026-08-22" })),
}));
vi.mock("@/lib/admin/config", () => ({ getSiteSettings: vi.fn(async () => null) }));
vi.mock("@/components/order/OrderConfirmationView", () => ({
  OrderConfirmationView: () => null,
}));

const REF = "RDC-OWNER-ORDER";

/** Renders the page and reports whether PII was stripped from the view. */
async function isStripped(reference = REF): Promise<boolean> {
  const { default: OrderConfirmationPage } = await import("./page");
  const element = await OrderConfirmationPage({ params: Promise.resolve({ ref: reference }) });
  return (element.props as { stripped: boolean }).stripped;
}

async function sessionFor(email: string) {
  const { createOrderSessionToken } = await import("@/lib/orders/orderSessionToken");
  return createOrderSessionToken(email, 3600);
}

async function grantFor(reference: string) {
  const { createOrderViewGrant } = await import("@/lib/orders/orderViewGrant");
  return createOrderViewGrant(reference);
}

describe("/order/[ref] authorization", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AUTH_SECRET = "test_auth_secret_abc123";
    mockState.cookies = {};
    mockState.customerEmail = "owner@example.com";
  });

  it("shows full detail post-checkout, with no email verification step", async () => {
    mockState.cookies = { order_view_grant: await grantFor(REF) };

    expect(await isStripped()).toBe(false);
  });

  it("shows full detail when the session's verified email placed the order", async () => {
    mockState.cookies = { order_session: await sessionFor("owner@example.com") };

    expect(await isStripped()).toBe(false);
  });

  it("matches the owner's email case-insensitively", async () => {
    mockState.customerEmail = "Owner@Example.com";
    mockState.cookies = { order_session: await sessionFor("owner@example.com") };

    expect(await isStripped()).toBe(false);
  });

  // The core isolation guarantee: a verified session is not a skeleton key.
  it("strips PII when another customer's session is used on this reference", async () => {
    mockState.cookies = { order_session: await sessionFor("stranger@example.com") };

    expect(await isStripped()).toBe(true);
  });

  it("strips PII when a grant for a different order is presented", async () => {
    mockState.cookies = { order_view_grant: await grantFor("RDC-SOMEONE-ELSE") };

    expect(await isStripped()).toBe(true);
  });

  it("strips PII for a stranger who guesses or is forwarded the reference", async () => {
    expect(await isStripped()).toBe(true);
  });

  it("strips PII when the grant signature does not verify", async () => {
    const grant = await grantFor(REF);
    const [payload] = grant.split(".");
    mockState.cookies = { order_view_grant: `${payload}.${"0".repeat(64)}` };

    expect(await isStripped()).toBe(true);
  });

  it("strips PII when the grant payload is re-signed for another reference", async () => {
    // Swap the payload for one naming a different order, keeping a real
    // signature: the HMAC covers the reference, so this must not verify.
    const other = await grantFor("RDC-SOMEONE-ELSE");
    const mine = await grantFor(REF);
    mockState.cookies = { order_view_grant: `${other.split(".")[0]}.${mine.split(".")[1]}` };

    expect(await isStripped()).toBe(true);
  });

  it("does not honour a session token replayed as a view grant", async () => {
    mockState.cookies = { order_view_grant: await sessionFor("owner@example.com") };

    expect(await isStripped()).toBe(true);
  });

  // Cutover: legacy `order_view_<ref>` cookies are unsigned and forgeable, so
  // they buy nothing. Worst case is this stripped view, never an error.
  it("ignores the retired per-order cookie", async () => {
    mockState.cookies = { [`order_view_${REF}`]: "1" };

    expect(await isStripped()).toBe(true);
  });
});
