// src/lib/orders/findPendingReuse.test.ts
// TDD tests for findPendingReuse helper (CONTEXT D-05).
// Strategy: query pending orders by email, then verify cart fingerprint by
// reconstructing it from stored order_items — avoids a schema migration.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only so the import doesn't fail in test environment
vi.mock("server-only", () => ({}));

// We mock the DB module to avoid real DB calls in unit tests
const mockDb = {
  select: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: mockDb,
  schema: {
    orders: {
      customer_email: "orders.customer_email",
      status: "orders.status",
    },
    order_items: {
      order_id: "order_items.order_id",
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ type: "eq", col, val }),
  and: (...conditions: unknown[]) => ({ type: "and", conditions }),
}));

import { findPendingReuse } from "./findPendingReuse";
import type { CartItem } from "@/types";

describe("findPendingReuse", () => {
  const testEmail = "customer@example.com";

  const testCartItems: CartItem[] = [
    {
      productId: "prod-abc",
      productName: "Fresh Tomatoes",
      variantLabel: "1kg",
      prepOption: null,
      quantity: 2,
      unitPriceNgn: 150000,
      subtotalNgn: 300000,
    },
    {
      productId: "prod-xyz",
      productName: "Cooking Kit",
      variantLabel: null,
      prepOption: "Chopped",
      quantity: 1,
      unitPriceNgn: 200000,
      subtotalNgn: 200000,
    },
  ];

  const mockPendingOrder = {
    id: "order-uuid-123",
    reference: "RDC-abc1234567",
    customer_email: testEmail,
    status: "pending",
    total_ngn: 500000,
    week_of: "2026-05-09",
  };

  // Order items that match testCartItems (same product/variant/prep/qty)
  const matchingOrderItems = [
    {
      order_id: "order-uuid-123",
      product_id: "prod-abc",
      variant_label: "1kg",
      prep_option: null,
      quantity: 2,
    },
    {
      order_id: "order-uuid-123",
      product_id: "prod-xyz",
      variant_label: null,
      prep_option: "Chopped",
      quantity: 1,
    },
  ];

  function buildDbChain(returnValue: unknown[]) {
    const limit = vi.fn().mockResolvedValue(returnValue);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    mockDb.select.mockReturnValue({ from });
    return { from, where, limit };
  }

  function buildDbChainNoWhere(returnValue: unknown[]) {
    const where = vi.fn().mockResolvedValue(returnValue);
    const from = vi.fn().mockReturnValue({ where });
    mockDb.select.mockReturnValue({ from });
    return { from, where };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no pending orders exist for this email", async () => {
    buildDbChain([]);

    const result = await findPendingReuse(testEmail, testCartItems);

    expect(result).toBeNull();
  });

  it("returns null when pending order exists but cart items differ", async () => {
    // First call: returns pending orders for email
    const limit1 = vi.fn().mockResolvedValue([mockPendingOrder]);
    const where1 = vi.fn().mockReturnValue({ limit: limit1 });
    const from1 = vi.fn().mockReturnValue({ where: where1 });

    // Second call: returns order items that DO NOT match (different qty)
    const differentItems = [
      {
        order_id: "order-uuid-123",
        product_id: "prod-abc",
        variant_label: "1kg",
        prep_option: null,
        quantity: 99, // different!
      },
    ];
    const where2 = vi.fn().mockResolvedValue(differentItems);
    const from2 = vi.fn().mockReturnValue({ where: where2 });

    mockDb.select
      .mockReturnValueOnce({ from: from1 })
      .mockReturnValueOnce({ from: from2 });

    const result = await findPendingReuse(testEmail, testCartItems);

    expect(result).toBeNull();
  });

  it("returns the matching order when email and cart contents match", async () => {
    // First call: returns pending orders for email
    const limit1 = vi.fn().mockResolvedValue([mockPendingOrder]);
    const where1 = vi.fn().mockReturnValue({ limit: limit1 });
    const from1 = vi.fn().mockReturnValue({ where: where1 });

    // Second call: returns matching order items
    const where2 = vi.fn().mockResolvedValue(matchingOrderItems);
    const from2 = vi.fn().mockReturnValue({ where: where2 });

    mockDb.select
      .mockReturnValueOnce({ from: from1 })
      .mockReturnValueOnce({ from: from2 });

    const result = await findPendingReuse(testEmail, testCartItems);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(mockPendingOrder.id);
    expect(result?.reference).toBe(mockPendingOrder.reference);
  });

  it("handles DB errors gracefully by returning null", async () => {
    const limit = vi.fn().mockRejectedValue(new Error("DB connection failed"));
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    mockDb.select.mockReturnValue({ from });

    const result = await findPendingReuse(testEmail, testCartItems);

    expect(result).toBeNull();
  });
});
