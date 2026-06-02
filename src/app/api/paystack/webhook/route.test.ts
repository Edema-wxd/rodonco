// src/app/api/paystack/webhook/route.test.ts
// Tests for H2: webhook routing of charge.failed, refund.processed, charge.dispute.create.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

vi.mock("server-only", () => ({}));

// ── Hoist shared mock state ───────────────────────────────────────────────────

const { mockState, mockDb, mockLogActivity } = vi.hoisted(() => {
  const mockState = {
    foundOrder: null as Record<string, unknown> | null,
  };

  const mockDb = {
    selectResult: [] as Record<string, unknown>[],
    updated: false,
    lastUpdate: null as Record<string, unknown> | null,
  };

  const mockLogActivity = vi.fn().mockResolvedValue(undefined);

  return { mockState, mockDb, mockLogActivity };
});

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/admin/activityLog", () => ({
  logActivity: mockLogActivity,
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIP: vi.fn(() => "1.2.3.4"),
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

vi.mock("@/lib/shop/orderingConfig", () => ({
  getOrderingConfig: vi.fn().mockResolvedValue({
    is_ordering_open: true,
    next_delivery_date: "2026-06-06",
  }),
}));

vi.mock("@/lib/email/sendOrderEmails", () => ({
  sendOrderEmails: vi.fn().mockResolvedValue(undefined),
}));

// Drizzle mock: select returns mockDb.selectResult; update tracks the call.
vi.mock("@/lib/db", () => {
  const makeSelectChain = () => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockImplementation(() => Promise.resolve(mockDb.selectResult)),
      })),
    }),
  });

  const makeUpdateChain = (set: Record<string, unknown>) => {
    mockDb.lastUpdate = set;
    mockDb.updated = true;
    return {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };
  };

  return {
    db: {
      select: vi.fn(() => makeSelectChain()),
      update: vi.fn((_table: unknown, set: unknown) => makeUpdateChain(set as Record<string, unknown>)),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    },
    schema: {
      orders: {
        reference: "orders.reference",
        status: "orders.status",
        id: "orders.id",
      },
      order_items: { order_id: "order_items.order_id" },
    },
  };
});

vi.mock("@/lib/paystack/verifySignature", () => ({
  verifyPaystackSignature: vi.fn(() => true),
}));

// ── Set required env vars ─────────────────────────────────────────────────────

process.env.PAYSTACK_SECRET_KEY = "test-secret";

// ── Import after mocks ────────────────────────────────────────────────────────

import { POST } from "./route";

// ── Helpers ───────────────────────────────────────────────────────────────────

const SECRET = "test-secret";

function makeSignedRequest(event: string, data: Record<string, unknown>) {
  const body = JSON.stringify({ event, data });
  const sig = createHmac("sha512", SECRET).update(body).digest("hex");
  return new Request("http://localhost/api/paystack/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": sig,
    },
    body,
  });
}

const PENDING_ORDER = { id: "order-uuid", reference: "RDC-abc123", status: "pending", total_ngn: 5000 };
const PAID_ORDER = { id: "order-uuid", reference: "RDC-abc123", status: "paid", total_ngn: 5000 };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/paystack/webhook — H2 event routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.selectResult = [];
    mockDb.updated = false;
    mockDb.lastUpdate = null;
  });

  // ── charge.failed ──────────────────────────────────────────────────────────

  describe("charge.failed", () => {
    it("returns 200", async () => {
      mockDb.selectResult = [PENDING_ORDER];
      const req = makeSignedRequest("charge.failed", {
        reference: "RDC-abc123",
        amount: 500000,
        gateway_response: "Insufficient funds",
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.received).toBe(true);
    });

    it("logs system.payment_failed when order is pending", async () => {
      mockDb.selectResult = [PENDING_ORDER];
      const req = makeSignedRequest("charge.failed", {
        reference: "RDC-abc123",
        amount: 500000,
        gateway_response: "Declined",
      });
      await POST(req);
      const call = mockLogActivity.mock.calls[0][0] as Record<string, unknown>;
      expect(call.action).toBe("system.payment_failed");
      expect(call.entityLabel).toBe("RDC-abc123");
    });

    it("does not log if order is not found", async () => {
      mockDb.selectResult = [];
      const req = makeSignedRequest("charge.failed", {
        reference: "RDC-unknown",
        amount: 500000,
      });
      await POST(req);
      expect(mockLogActivity).not.toHaveBeenCalled();
    });

    it("does not mutate order status", async () => {
      mockDb.selectResult = [PENDING_ORDER];
      const req = makeSignedRequest("charge.failed", {
        reference: "RDC-abc123",
        amount: 500000,
      });
      await POST(req);
      expect(mockDb.updated).toBe(false);
    });
  });

  // ── refund.processed ──────────────────────────────────────────────────────

  describe("refund.processed", () => {
    it("returns 200", async () => {
      mockDb.selectResult = [PAID_ORDER];
      const req = makeSignedRequest("refund.processed", {
        reference: "RDC-abc123",
        amount: 500000,
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it("updates order status to refunded", async () => {
      mockDb.selectResult = [PAID_ORDER];
      const req = makeSignedRequest("refund.processed", {
        reference: "RDC-abc123",
        amount: 500000,
      });
      await POST(req);
      expect(mockDb.updated).toBe(true);
    });

    it("logs order.refunded with reference", async () => {
      mockDb.selectResult = [PAID_ORDER];
      const req = makeSignedRequest("refund.processed", {
        reference: "RDC-abc123",
        amount: 500000,
      });
      await POST(req);
      const call = mockLogActivity.mock.calls[0][0] as Record<string, unknown>;
      expect(call.action).toBe("order.refunded");
      expect(call.entityLabel).toBe("RDC-abc123");
    });

    it("does not update if order is not paid", async () => {
      mockDb.selectResult = [];
      const req = makeSignedRequest("refund.processed", {
        reference: "RDC-abc123",
        amount: 500000,
      });
      await POST(req);
      expect(mockDb.updated).toBe(false);
      expect(mockLogActivity).not.toHaveBeenCalled();
    });
  });

  // ── charge.dispute.create ─────────────────────────────────────────────────

  describe("charge.dispute.create", () => {
    it("returns 200", async () => {
      const req = makeSignedRequest("charge.dispute.create", {
        reference: "RDC-abc123",
        amount: 500000,
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it("logs system.payment_disputed", async () => {
      const req = makeSignedRequest("charge.dispute.create", {
        reference: "RDC-abc123",
        amount: 500000,
      });
      await POST(req);
      const call = mockLogActivity.mock.calls[0][0] as Record<string, unknown>;
      expect(call.action).toBe("system.payment_disputed");
      expect(call.entityLabel).toBe("RDC-abc123");
    });

    it("does not mutate any order", async () => {
      const req = makeSignedRequest("charge.dispute.create", {
        reference: "RDC-abc123",
        amount: 500000,
      });
      await POST(req);
      expect(mockDb.updated).toBe(false);
    });
  });

  // ── unhandled events still return 200 ────────────────────────────────────

  it("returns 200 for unrecognised events", async () => {
    const req = makeSignedRequest("transfer.success", { reference: "x", amount: 0 });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
