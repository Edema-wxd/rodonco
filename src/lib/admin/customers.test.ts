import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ── Chainable, awaitable query-builder mock ──────────────────────────────────
// getAdminCustomers builds: db.select({...}).from().groupBy().$dynamic()
//   [.having()] .orderBy() [.limit()]  then `await`s the builder.
const { builder, rowsRef, spies } = vi.hoisted(() => {
  const rowsRef = { current: [] as unknown[] };
  const spies = {
    select: vi.fn(),
    having: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = (...a: unknown[]) => { spies.select(...a); return builder; };
  builder.from = chain;
  builder.groupBy = chain;
  builder.$dynamic = chain;
  builder.having = (...a: unknown[]) => { spies.having(...a); return builder; };
  builder.orderBy = (...a: unknown[]) => { spies.orderBy(...a); return builder; };
  builder.limit = (...a: unknown[]) => { spies.limit(...a); return builder; };
  // Thenable so `await query` resolves to the staged rows.
  builder.then = (resolve: (v: unknown) => unknown) => resolve(rowsRef.current);
  return { builder, rowsRef, spies };
});

vi.mock("@/lib/db", () => ({
  db: { select: (...a: unknown[]) => (builder.select as (...x: unknown[]) => unknown)(...a) },
}));

vi.mock("../../../drizzle/schema", () => ({
  orders: {
    customer_email: "orders.customer_email",
    customer_name: "orders.customer_name",
    customer_phone: "orders.customer_phone",
    status: "orders.status",
    total_ngn: "orders.total_ngn",
    created_at: "orders.created_at",
  },
}));

vi.mock("drizzle-orm", () => {
  const sql = (..._a: unknown[]) => {
    const chunk: Record<string, unknown> = { _sql: true };
    chunk.as = () => chunk;
    return chunk;
  };
  return {
    sql,
    ilike: (col: unknown, val: unknown) => ({ type: "ilike", col, val }),
    or: (...args: unknown[]) => ({ type: "or", args }),
  };
});

const getAdminOrders = vi.fn();
vi.mock("./orders", () => ({
  getAdminOrders: (...a: unknown[]) => getAdminOrders(...a),
}));

import { getAdminCustomers, getAdminCustomerByEmail } from "./customers";
import type { AdminOrder } from "./orders";

function makeOrder(p: Partial<AdminOrder> & Pick<AdminOrder, "id" | "reference" | "status" | "total_ngn" | "created_at">): AdminOrder {
  return {
    customer_name: p.customer_name ?? "Ada",
    customer_email: p.customer_email ?? "ada@example.com",
    customer_phone: p.customer_phone ?? "08000000000",
    delivery_address: p.delivery_address ?? "1 Test St",
    delivery_area: p.delivery_area ?? null,
    allergy_notes: p.allergy_notes ?? null,
    week_of: p.week_of ?? "2026-06-07",
    items: p.items ?? [],
    ...p,
  } as AdminOrder;
}

describe("getAdminCustomers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rowsRef.current = [];
  });

  it("maps rows and normalises timestamps to ISO strings", async () => {
    rowsRef.current = [
      {
        email: "ada@example.com",
        name: "Ada",
        phone: "08000000000",
        order_count: 3,
        paid_count: 1,
        total_spent_ngn: 100,
        first_order_at: new Date("2026-06-01T10:00:00Z"),
        last_order_at: new Date("2026-07-28T10:00:00Z"),
      },
    ];

    const result = await getAdminCustomers();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      email: "ada@example.com",
      name: "Ada",
      order_count: 3,
      paid_count: 1,
      total_spent_ngn: 100,
    });
    expect(result[0].first_order_at).toBe("2026-06-01T10:00:00.000Z");
    expect(result[0].last_order_at).toBe("2026-07-28T10:00:00.000Z");
  });

  it("does NOT apply a HAVING filter when no search term is given", async () => {
    await getAdminCustomers();
    expect(spies.having).not.toHaveBeenCalled();
  });

  it("applies a HAVING filter (not WHERE) when searching, so aggregates cover full history", async () => {
    await getAdminCustomers({ search: "ada" });
    expect(spies.having).toHaveBeenCalledTimes(1);
  });

  it("ignores a blank/whitespace search term", async () => {
    await getAdminCustomers({ search: "   " });
    expect(spies.having).not.toHaveBeenCalled();
  });

  it("applies a limit only when provided", async () => {
    await getAdminCustomers();
    expect(spies.limit).not.toHaveBeenCalled();

    await getAdminCustomers({ limit: 25 });
    expect(spies.limit).toHaveBeenCalledWith(25);
  });
});

describe("getAdminCustomerByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when the customer has no orders", async () => {
    getAdminOrders.mockResolvedValue([]);
    expect(await getAdminCustomerByEmail("nobody@example.com")).toBeNull();
  });

  it("queries orders by the (unmodified) email and lowercases it in the result", async () => {
    getAdminOrders.mockResolvedValue([
      makeOrder({ id: "o1", reference: "R1", status: "paid", total_ngn: 1000, created_at: "2026-06-10T00:00:00.000Z" }),
    ]);

    const detail = await getAdminCustomerByEmail("Ada@Example.com");

    expect(getAdminOrders).toHaveBeenCalledWith({ filters: { email: "Ada@Example.com" } });
    expect(detail?.email).toBe("ada@example.com");
  });

  it("counts only paid/processing/delivered toward paid_count and lifetime spend", async () => {
    // getAdminOrders returns newest-first.
    getAdminOrders.mockResolvedValue([
      makeOrder({ id: "o1", reference: "R1", status: "paid", total_ngn: 1000, created_at: "2026-06-10T00:00:00.000Z", customer_name: "Ada Latest", customer_phone: "08011112222" }),
      makeOrder({ id: "o2", reference: "R2", status: "pending", total_ngn: 500, created_at: "2026-06-05T00:00:00.000Z" }),
      makeOrder({ id: "o3", reference: "R3", status: "delivered", total_ngn: 2000, created_at: "2026-06-01T00:00:00.000Z" }),
      makeOrder({ id: "o4", reference: "R4", status: "cancelled", total_ngn: 9999, created_at: "2026-06-03T00:00:00.000Z" }),
    ]);

    const detail = await getAdminCustomerByEmail("ada@example.com");

    expect(detail).not.toBeNull();
    expect(detail!.order_count).toBe(4);
    expect(detail!.paid_count).toBe(2); // paid + delivered
    expect(detail!.total_spent_ngn).toBe(3000); // 1000 + 2000, excludes pending & cancelled
  });

  it("derives name/phone from the latest order and first/last from the range", async () => {
    getAdminOrders.mockResolvedValue([
      makeOrder({ id: "o1", reference: "R1", status: "paid", total_ngn: 1000, created_at: "2026-06-10T00:00:00.000Z", customer_name: "Ada Latest", customer_phone: "08011112222" }),
      makeOrder({ id: "o3", reference: "R3", status: "delivered", total_ngn: 2000, created_at: "2026-06-01T00:00:00.000Z", customer_name: "Ada Older", customer_phone: "08099998888" }),
    ]);

    const detail = await getAdminCustomerByEmail("ada@example.com");

    expect(detail!.name).toBe("Ada Latest");
    expect(detail!.phone).toBe("08011112222");
    expect(detail!.last_order_at).toBe("2026-06-10T00:00:00.000Z");
    expect(detail!.first_order_at).toBe("2026-06-01T00:00:00.000Z");
    expect(detail!.orders).toHaveLength(2);
  });
});
