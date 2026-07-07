import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { mockSelectChain } = vi.hoisted(() => {
  const mockOrderBy = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();

  mockOrderBy.mockResolvedValue([]);
  mockWhere.mockReturnValue({ orderBy: mockOrderBy });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });

  return {
    mockSelectChain: { select: mockSelect, from: mockFrom, where: mockWhere, orderBy: mockOrderBy },
  };
});

vi.mock("@/lib/db", () => ({
  db: { select: mockSelectChain.select },
  schema: {
    orders: {
      customer_email: "orders.customer_email",
      created_at: "orders.created_at",
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ type: "eq", col, val }),
  desc: (col: unknown) => ({ type: "desc", col }),
}));

import { getOrdersByEmail } from "./getOrdersByEmail";

const orderRow = {
  id: "order-1",
  reference: "RDC-test1234",
  status: "paid",
  customer_name: "Ada",
  customer_email: "ada@example.com",
  customer_phone: "08012345678",
  delivery_address: "1 Test St",
  allergy_notes: null,
  total_ngn: 5000,
  week_of: "2026-06-07",
  created_at: new Date("2026-06-01T10:00:00Z"),
  notified_at: null,
};

describe("getOrdersByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectChain.orderBy.mockResolvedValue([]);
    mockSelectChain.where.mockReturnValue({ orderBy: mockSelectChain.orderBy });
    mockSelectChain.from.mockReturnValue({ where: mockSelectChain.where });
    mockSelectChain.select.mockReturnValue({ from: mockSelectChain.from });
  });

  it("returns an empty array when no orders exist for the email", async () => {
    const result = await getOrdersByEmail("nobody@example.com");
    expect(result).toEqual([]);
  });

  it("returns mapped orders, most recent first", async () => {
    mockSelectChain.orderBy.mockResolvedValue([orderRow]);

    const result = await getOrdersByEmail("ADA@example.com");

    expect(result).toHaveLength(1);
    expect(result[0].reference).toBe("RDC-test1234");
    expect(result[0].created_at).toBe("2026-06-01T10:00:00.000Z");
  });

  it("lowercases the email before querying", async () => {
    await getOrdersByEmail("Mixed@Case.com");
    expect(mockSelectChain.where).toHaveBeenCalledWith({
      type: "eq",
      col: "orders.customer_email",
      val: "mixed@case.com",
    });
  });
});
