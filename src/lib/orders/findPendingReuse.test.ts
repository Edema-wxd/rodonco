// src/lib/orders/findPendingReuse.test.ts
// TDD tests for findPendingReuse helper (CONTEXT D-05).
// Strategy: query pending orders by email, then verify cart fingerprint by
// reconstructing it from stored order_items — avoids a schema migration.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only so the import doesn't fail in test environment
vi.mock("server-only", () => ({}));

// Mock cartToOrderDraft to use a controlled fingerprint function
vi.mock("@/lib/checkout/cartToOrderDraft", () => ({
  cartFingerprint: (items: Array<{ productId: string; variantLabel: string | null; prepOption: string | null; quantity: number }>) => {
    const segments = items.map((item) =>
      [item.productId, item.variantLabel ?? "", item.prepOption ?? "", String(item.quantity)].join(":")
    );
    segments.sort();
    return segments.join("|");
  },
}));

// Use vi.hoisted to create stable mock references for the db module
const { mockSelectChain } = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();

  // Default chain setup - can be overridden per test
  mockLimit.mockResolvedValue([]);
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });

  return {
    mockSelectChain: { select: mockSelect, from: mockFrom, where: mockWhere, limit: mockLimit },
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelectChain.select,
  },
  schema: {
    orders: {
      id: "orders.id",
      reference: "orders.reference",
      total_ngn: "orders.total_ngn",
      week_of: "orders.week_of",
      customer_email: "orders.customer_email",
      status: "orders.status",
    },
    order_items: {
      order_id: "order_items.order_id",
      product_id: "order_items.product_id",
      variant_label: "order_items.variant_label",
      prep_option: "order_items.prep_option",
      quantity: "order_items.quantity",
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
    total_ngn: 500000,
    week_of: "2026-05-09",
  };

  // Order items that match testCartItems (same product/variant/prep/qty)
  const matchingOrderItems = [
    {
      product_id: "prod-abc",
      variant_label: "1kg",
      prep_option: null,
      quantity: 2,
    },
    {
      product_id: "prod-xyz",
      variant_label: null,
      prep_option: "Chopped",
      quantity: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default: no results
    mockSelectChain.limit.mockResolvedValue([]);
    mockSelectChain.where.mockReturnValue({ limit: mockSelectChain.limit });
    mockSelectChain.from.mockReturnValue({ where: mockSelectChain.where });
    mockSelectChain.select.mockReturnValue({ from: mockSelectChain.from });
  });

  it("returns null when no pending orders exist for this email", async () => {
    // select().from().where().limit() => []
    mockSelectChain.limit.mockResolvedValue([]);

    const result = await findPendingReuse(testEmail, testCartItems);

    expect(result).toBeNull();
  });

  it("returns null when pending order exists but cart items differ", async () => {
    const differentItems = [
      {
        product_id: "prod-abc",
        variant_label: "1kg",
        prep_option: null,
        quantity: 99, // different!
      },
    ];

    // First select: returns pending order
    const limit1 = vi.fn().mockResolvedValue([mockPendingOrder]);
    const where1 = vi.fn().mockReturnValue({ limit: limit1 });
    const from1 = vi.fn().mockReturnValue({ where: where1 });

    // Second select: returns different items
    const where2 = vi.fn().mockResolvedValue(differentItems);
    const from2 = vi.fn().mockReturnValue({ where: where2 });

    mockSelectChain.select
      .mockReturnValueOnce({ from: from1 })
      .mockReturnValueOnce({ from: from2 });

    const result = await findPendingReuse(testEmail, testCartItems);

    expect(result).toBeNull();
  });

  it("returns the matching order when email and cart contents match", async () => {
    // First select: returns pending order
    const limit1 = vi.fn().mockResolvedValue([mockPendingOrder]);
    const where1 = vi.fn().mockReturnValue({ limit: limit1 });
    const from1 = vi.fn().mockReturnValue({ where: where1 });

    // Second select: returns matching items
    const where2 = vi.fn().mockResolvedValue(matchingOrderItems);
    const from2 = vi.fn().mockReturnValue({ where: where2 });

    mockSelectChain.select
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
    mockSelectChain.select.mockReturnValue({ from });

    const result = await findPendingReuse(testEmail, testCartItems);

    expect(result).toBeNull();
  });

  it("queries with limit 1 to find at most one pending order", async () => {
    mockSelectChain.limit.mockResolvedValue([]);

    await findPendingReuse(testEmail, testCartItems);

    expect(mockSelectChain.limit).toHaveBeenCalledWith(1);
  });
});
