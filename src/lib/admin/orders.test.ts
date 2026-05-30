import { describe, expect, it, vi } from "vitest";

import { order_items, orders } from "../../../drizzle/schema";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => {
  const rows = [
    {
      id: "o1",
      reference: "REF-001",
      customer_name: "Ada Lovelace",
      customer_email: "ada@example.com",
      customer_phone: "+2348000000000",
      delivery_address: "12 Example Street",
      allergy_notes: null,
      status: "paid",
      total_ngn: 5000,
      week_of: "2026-05-03",
      created_at: new Date("2026-05-01T10:00:00.000Z"),
    },
  ];

  const items = [
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

  return {
    db: {
      select: vi.fn(() => ({
        from: (table: unknown) => {
          if (table === orders) {
            return {
              where: () => ({
                orderBy: async () => rows,
              }),
            };
          }
          if (table === order_items) {
            return {
              where: async () => items,
            };
          }
          throw new Error("Unexpected table");
        },
      })),
    },
  };
});

import { getAdminOrders } from "./orders";

describe("getAdminOrders", () => {
  it("returns newest-first orders with nested items", async () => {
    const res = await getAdminOrders();
    expect(res).toHaveLength(1);
    expect(res[0]?.reference).toBe("REF-001");
    expect(res[0]?.items).toHaveLength(1);
    expect(res[0]?.items[0]?.product_name).toBe("Tomatoes");
  });
});

