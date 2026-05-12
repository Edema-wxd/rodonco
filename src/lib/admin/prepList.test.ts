import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => {
  const mockOrderBy = vi.fn().mockResolvedValue([]);
  const mockGroupBy = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
  const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
  const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
  const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  return { mockOrderBy, mockGroupBy, mockWhere, mockInnerJoin, mockFrom, mockSelect };
});

vi.mock("@/lib/db", () => ({ db: { select: mocks.mockSelect } }));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  inArray: vi.fn((col: unknown, vals: unknown) => ({ col, vals })),
  sum: vi.fn((col: unknown) => ({ col })),
}));

vi.mock("../../../drizzle/schema", () => ({
  order_items: { product_name: "product_name", variant_label: "variant_label", prep_option: "prep_option", quantity: "quantity", order_id: "order_id" },
  orders: { week_of: "week_of", status: "status", id: "id" },
}));

vi.mock("./week", () => ({ currentWeekOf: vi.fn(() => "2026-05-03") }));

import { getPrepList } from "./prepList";

describe("getPrepList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockOrderBy.mockResolvedValue([]);
    mocks.mockGroupBy.mockReturnValue({ orderBy: mocks.mockOrderBy });
    mocks.mockWhere.mockReturnValue({ groupBy: mocks.mockGroupBy });
    mocks.mockInnerJoin.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockFrom.mockReturnValue({ innerJoin: mocks.mockInnerJoin });
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
  });

  it("coerces sum() string result to number", async () => {
    mocks.mockOrderBy.mockResolvedValueOnce([
      { product_name: "Tomatoes", variant_label: null, prep_option: "Chopped", total_quantity: "5" },
    ]);
    const result = await getPrepList("2026-05-03");
    expect(result[0]?.total_quantity).toBe(5);
    expect(typeof result[0]?.total_quantity).toBe("number");
  });

  it("coerces null sum() to 0", async () => {
    mocks.mockOrderBy.mockResolvedValueOnce([
      { product_name: "Peppers", variant_label: null, prep_option: null, total_quantity: null },
    ]);
    const result = await getPrepList("2026-05-03");
    expect(result[0]?.total_quantity).toBe(0);
  });

  it("passes inArray with paid and processing statuses", async () => {
    await getPrepList("2026-05-03");
    const { inArray } = await import("drizzle-orm");
    expect(inArray).toHaveBeenCalledWith("status", ["paid", "processing"]);
  });

  it("returns empty array when no rows", async () => {
    const result = await getPrepList("2026-05-03");
    expect(result).toEqual([]);
  });
});
