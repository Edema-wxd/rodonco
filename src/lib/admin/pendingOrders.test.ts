import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  count: vi.fn(() => ({})),
  desc: vi.fn((col: unknown) => col),
}));

vi.mock("../../../drizzle/schema", () => ({
  orders: { status: "status", id: "id" },
  order_items: {},
}));

import { getPendingOrdersCount } from "./pendingOrders";

describe("getPendingOrders", () => {
  it.todo("returns only status=pending orders");
});

describe("getPendingOrdersCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 when no pending orders exist", async () => {
    const { db } = await import("@/lib/db");
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ c: 0 }]),
      }),
    });
    const result = await getPendingOrdersCount();
    expect(result).toBe(0);
  });

  it("coerces count string to number", async () => {
    const { db } = await import("@/lib/db");
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ c: "3" }]),
      }),
    });
    const result = await getPendingOrdersCount();
    expect(result).toBe(3);
  });

  it("filters by status = pending", async () => {
    const { db } = await import("@/lib/db");
    const mockWhere = vi.fn().mockResolvedValue([{ c: 0 }]);
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({ where: mockWhere }),
    });
    const { eq } = await import("drizzle-orm");
    await getPendingOrdersCount();
    expect(eq).toHaveBeenCalledWith("status", "pending");
  });
});
