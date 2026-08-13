// src/app/api/flutterwave/webhook/route.test.ts
// Tests for the Flutterwave webhook: signature gate, charge.completed success →
// markOrderPaid, failed charge logging, and validation.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ── Hoist shared mock state ───────────────────────────────────────────────────

const { mockDb, mockLogActivity, mockMarkOrderPaid, mockVerify } = vi.hoisted(() => {
  const mockDb = {
    selectResult: [] as Record<string, unknown>[],
  };
  const mockLogActivity = vi.fn().mockResolvedValue(undefined);
  const mockMarkOrderPaid = vi.fn().mockResolvedValue({ kind: "paid", transitioned: true });
  const mockVerify = vi.fn(() => true);
  return { mockDb, mockLogActivity, mockMarkOrderPaid, mockVerify };
});

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/admin/activityLog", () => ({ logActivity: mockLogActivity }));

vi.mock("@/lib/rate-limit", () => ({
  getClientIP: vi.fn(() => "1.2.3.4"),
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

vi.mock("@/lib/orders/markOrderPaid", () => ({ markOrderPaid: mockMarkOrderPaid }));

vi.mock("@/lib/flutterwave/verifySignature", () => ({
  verifyFlutterwaveSignature: mockVerify,
}));

vi.mock("@/lib/db", () => {
  const makeSelectChain = () => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockImplementation(() => Promise.resolve(mockDb.selectResult)),
      }),
    }),
  });
  return {
    db: { select: vi.fn(() => makeSelectChain()) },
    schema: {
      orders: { reference: "orders.reference", status: "orders.status", id: "orders.id" },
    },
  };
});

// ── Set required env vars ─────────────────────────────────────────────────────

process.env.FLW_WEBHOOK_HASH = "test-hash";

// ── Import after mocks ────────────────────────────────────────────────────────

import { POST } from "./route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(data: Record<string, unknown>, hash = "test-hash") {
  return new Request("http://localhost/api/flutterwave/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "verif-hash": hash },
    body: JSON.stringify({ event: "charge.completed", data }),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/flutterwave/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.selectResult = [];
    mockVerify.mockReturnValue(true);
    mockMarkOrderPaid.mockResolvedValue({ kind: "paid", transitioned: true });
  });

  it("rejects an invalid verif-hash with 401", async () => {
    mockVerify.mockReturnValue(false);
    const res = await POST(makeRequest({ tx_ref: "RDC-abc123", status: "successful", amount: 5000 }, "wrong"));
    expect(res.status).toBe(401);
    expect(mockMarkOrderPaid).not.toHaveBeenCalled();
  });

  it("returns 400 when tx_ref is missing", async () => {
    const res = await POST(makeRequest({ status: "successful", amount: 5000 }));
    expect(res.status).toBe(400);
  });

  it("promotes the order to paid on a successful charge (naira → kobo)", async () => {
    const res = await POST(makeRequest({ tx_ref: "RDC-abc123", status: "successful", amount: 5000 }));
    expect(res.status).toBe(200);
    expect(mockMarkOrderPaid).toHaveBeenCalledWith({ reference: "RDC-abc123", amountKobo: 500000 });
  });

  it("logs a failed charge without promoting the order", async () => {
    mockDb.selectResult = [{ id: "o1", reference: "RDC-abc123", status: "pending" }];
    const res = await POST(makeRequest({ tx_ref: "RDC-abc123", status: "failed", amount: 5000, processor_response: "Declined" }));
    expect(res.status).toBe(200);
    expect(mockMarkOrderPaid).not.toHaveBeenCalled();
    const call = mockLogActivity.mock.calls[0][0] as Record<string, unknown>;
    expect(call.action).toBe("system.payment_failed");
    expect(call.entityLabel).toBe("RDC-abc123");
  });

  it("still returns 200 on an amount mismatch (no Flutterwave retry)", async () => {
    mockMarkOrderPaid.mockResolvedValue({ kind: "amount-mismatch", expectedKobo: 500000, receivedKobo: 100 });
    const res = await POST(makeRequest({ tx_ref: "RDC-abc123", status: "successful", amount: 1 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mismatch).toBe(true);
  });
});
