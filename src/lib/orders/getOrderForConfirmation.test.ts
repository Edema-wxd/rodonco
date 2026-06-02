import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { mockSelectChain } = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();

  mockLimit.mockResolvedValue([]);
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });

  return {
    mockSelectChain: { select: mockSelect, from: mockFrom, where: mockWhere, limit: mockLimit },
  };
});

vi.mock("@/lib/db", () => ({
  db: { select: mockSelectChain.select },
  schema: {
    orders: {
      reference: "orders.reference",
      id: "orders.id",
      status: "orders.status",
    },
    order_items: {
      order_id: "order_items.order_id",
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ type: "eq", col, val }),
}));

import { getOrderForConfirmation } from "./getOrderForConfirmation";

const paidOrderRow = {
  id: "order-1",
  reference: "RDC-test1234",
  status: "paid",
  customer_name: "Ada",
  customer_email: "ada@example.com",
  customer_phone: "08012345678",
  delivery_address: "1 Test St",
  allergy_notes: null,
  total_ngn: 500000,
  week_of: "2026-06-07",
  created_at: new Date("2026-06-01T10:00:00Z"),
  notified_at: null,
};

const pendingOrderRow = { ...paidOrderRow, status: "pending" };

const itemRows = [
  {
    id: "item-1",
    order_id: "order-1",
    product_id: "prod-abc",
    product_name: "Jollof Rice",
    variant_label: null,
    prep_option: null,
    quantity: 2,
    unit_price_ngn: 250000,
    subtotal_ngn: 500000,
  },
];

describe("getOrderForConfirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectChain.limit.mockResolvedValue([]);
    mockSelectChain.where.mockReturnValue({ limit: mockSelectChain.limit });
    mockSelectChain.from.mockReturnValue({ where: mockSelectChain.where });
    mockSelectChain.select.mockReturnValue({ from: mockSelectChain.from });
  });

  it("returns { kind: 'not-found' } when no order row exists", async () => {
    mockSelectChain.limit.mockResolvedValue([]);

    const result = await getOrderForConfirmation("RDC-doesnotexist");

    expect(result).toEqual({ kind: "not-found" });
  });

  it("returns { kind: 'pending' } when order exists but status is not paid", async () => {
    const limit1 = vi.fn().mockResolvedValue([pendingOrderRow]);
    const where1 = vi.fn().mockReturnValue({ limit: limit1 });
    const from1 = vi.fn().mockReturnValue({ where: where1 });
    mockSelectChain.select.mockReturnValue({ from: from1 });

    const result = await getOrderForConfirmation("RDC-test1234");

    expect(result).toEqual({ kind: "pending" });
  });

  it("returns { kind: 'paid', order, items } for a paid order", async () => {
    const limit1 = vi.fn().mockResolvedValue([paidOrderRow]);
    const where1 = vi.fn().mockReturnValue({ limit: limit1 });
    const from1 = vi.fn().mockReturnValue({ where: where1 });

    const where2 = vi.fn().mockResolvedValue(itemRows);
    const from2 = vi.fn().mockReturnValue({ where: where2 });

    mockSelectChain.select
      .mockReturnValueOnce({ from: from1 })
      .mockReturnValueOnce({ from: from2 });

    const result = await getOrderForConfirmation("RDC-test1234");

    expect(result.kind).toBe("paid");
    if (result.kind === "paid") {
      expect(result.order.reference).toBe("RDC-test1234");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].product_name).toBe("Jollof Rice");
    }
  });

  it("returns { kind: 'error' } on DB exception", async () => {
    const limit = vi.fn().mockRejectedValue(new Error("DB connection failed"));
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    mockSelectChain.select.mockReturnValue({ from });

    const result = await getOrderForConfirmation("RDC-test1234");

    expect(result).toEqual({ kind: "error" });
  });
});
