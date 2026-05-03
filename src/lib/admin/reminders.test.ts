import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
  schema: {
    orders: {
      week_of: "week_of",
      status: "status",
      id: "id",
      customer_name: "customer_name",
      customer_email: "customer_email",
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  and: vi.fn((...args) => args),
}));

import { getPaidOrdersForWeek } from "./reminders";

describe("getPaidOrdersForWeek", () => {
  // We'll get references to the mocks after import
  let mockWhere: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockAnd: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const dbMod = await import("@/lib/db");
    const ormMod = await import("drizzle-orm");

    mockEq = ormMod.eq as ReturnType<typeof vi.fn>;
    mockAnd = ormMod.and as ReturnType<typeof vi.fn>;

    // Re-wire the mock chain for each test
    mockWhere = vi.fn().mockResolvedValue([]);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (dbMod.db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });
  });

  it("returns an array of orders with id, customer_name, customer_email", async () => {
    const fakeOrders = [
      { id: "uuid-1", customer_name: "Ada", customer_email: "ada@test.com" },
    ];
    mockWhere.mockResolvedValueOnce(fakeOrders);
    const result = await getPaidOrdersForWeek("2025-01-11");
    expect(result).toEqual(fakeOrders);
  });

  it("passes week_of string directly to eq() without Date conversion", async () => {
    await getPaidOrdersForWeek("2025-01-11");
    expect(mockEq).toHaveBeenCalledWith("week_of", "2025-01-11");
  });

  it("filters by status = paid", async () => {
    await getPaidOrdersForWeek("2025-01-11");
    expect(mockEq).toHaveBeenCalledWith("status", "paid");
  });

  it("returns empty array when no paid orders exist for the week", async () => {
    mockWhere.mockResolvedValueOnce([]);
    const result = await getPaidOrdersForWeek("2025-06-07");
    expect(result).toEqual([]);
  });
});
