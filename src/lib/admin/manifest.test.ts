import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const fakeOrderRows = [
  {
    id: "o1",
    customer_name: "Ada Lovelace",
    customer_phone: "+2348000000000",
    delivery_address: "12 Example Street",
    allergy_notes: null,
    total_ngn: 5000,
    week_of: "2026-05-03",
    status: "paid",
    created_at: new Date("2026-05-01T10:00:00Z"),
  },
];

const fakeItemRows = [
  {
    id: "i1",
    order_id: "o1",
    product_name: "Tomatoes",
    variant_label: null,
    prep_option: "Chopped",
    quantity: 2,
    unit_price_ngn: 500,
    subtotal_ngn: 1000,
  },
];

const mocks = vi.hoisted(() => {
  const mockOrderBy = vi.fn().mockResolvedValue([]);
  const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
  const mockFromOrders = vi.fn().mockReturnValue({ where: mockWhere });
  const mockFromItems = vi.fn().mockResolvedValue([]);
  let callCount = 0;
  const mockSelect = vi.fn(() => {
    callCount++;
    // Odd calls: orders query (has .where().orderBy()); even calls: items query (just .from())
    if (callCount % 2 === 1) {
      return { from: mockFromOrders };
    }
    return { from: mockFromItems };
  });
  return { mockOrderBy, mockWhere, mockFromOrders, mockFromItems, mockSelect, getCallCount: () => callCount, resetCallCount: () => { callCount = 0; } };
});

vi.mock("@/lib/db", () => ({ db: { select: mocks.mockSelect } }));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  inArray: vi.fn((col: unknown, vals: unknown) => ({ col, vals })),
  desc: vi.fn((col: unknown) => col),
}));

vi.mock("../../../drizzle/schema", () => ({
  orders: { week_of: "week_of", status: "status", id: "id", created_at: "created_at" },
  order_items: { order_id: "order_id" },
}));

vi.mock("./week", () => ({ currentWeekOf: vi.fn(() => "2026-05-03") }));

import { getManifestOrders } from "./manifest";

describe("getManifestOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resetCallCount();
    // Restore default implementations after clearAllMocks
    mocks.mockOrderBy.mockResolvedValue(fakeOrderRows);
    mocks.mockWhere.mockReturnValue({ orderBy: mocks.mockOrderBy });
    mocks.mockFromOrders.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockFromItems.mockResolvedValue(fakeItemRows);
    mocks.mockSelect.mockImplementation(() => {
      const c = mocks.getCallCount();
      // increment via the internal logic — use a fresh counter approach
      return c % 2 === 0
        ? { from: mocks.mockFromOrders }
        : { from: mocks.mockFromItems };
    });
  });

  it("returns orders with nested items", async () => {
    // Set up: first select → orders, second select → items
    mocks.mockSelect
      .mockReturnValueOnce({ from: mocks.mockFromOrders })
      .mockReturnValueOnce({ from: mocks.mockFromItems });

    const result = await getManifestOrders("2026-05-03");
    expect(result).toHaveLength(1);
    expect(result[0]?.customer_name).toBe("Ada Lovelace");
    expect(result[0]?.items).toHaveLength(1);
    expect(result[0]?.items[0]?.product_name).toBe("Tomatoes");
  });

  it("returns empty array when no orders for week", async () => {
    const emptyOrderBy = vi.fn().mockResolvedValue([]);
    const emptyWhere = vi.fn().mockReturnValue({ orderBy: emptyOrderBy });
    const emptyFromOrders = vi.fn().mockReturnValue({ where: emptyWhere });

    mocks.mockSelect
      .mockReturnValueOnce({ from: emptyFromOrders })
      .mockReturnValueOnce({ from: vi.fn().mockResolvedValue([]) });

    const result = await getManifestOrders("2026-01-01");
    expect(result).toEqual([]);
  });

  it("uses inArray with paid and processing statuses", async () => {
    mocks.mockSelect
      .mockReturnValueOnce({ from: mocks.mockFromOrders })
      .mockReturnValueOnce({ from: mocks.mockFromItems });

    await getManifestOrders("2026-05-03");
    const { inArray } = await import("drizzle-orm");
    expect(inArray).toHaveBeenCalledWith("status", ["paid", "processing"]);
  });
});
