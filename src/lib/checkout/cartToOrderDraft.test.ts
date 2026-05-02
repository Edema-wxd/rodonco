// src/lib/checkout/cartToOrderDraft.test.ts
// Tests for buildOrderItemsDraftFromCart and cartFingerprint helpers

import { describe, it, expect } from "vitest";
import { buildOrderItemsDraftFromCart, cartFingerprint } from "./cartToOrderDraft";
import type { CartItem } from "@/types";

const sampleItems: CartItem[] = [
  {
    productId: "prod-1",
    productName: "Jollof Rice Kit",
    variantLabel: "Large",
    prepOption: "Half-prepped",
    quantity: 2,
    unitPriceNgn: 500000, // 5000 NGN in kobo
    subtotalNgn: 1000000, // 10000 NGN in kobo
  },
  {
    productId: "prod-2",
    productName: "Tomatoes",
    variantLabel: null,
    prepOption: null,
    quantity: 1,
    unitPriceNgn: 150000, // 1500 NGN in kobo
    subtotalNgn: 150000,
  },
];

describe("buildOrderItemsDraftFromCart", () => {
  it("returns correct order items draft from cart items", () => {
    const orderId = "order-uuid-123";
    const result = buildOrderItemsDraftFromCart(sampleItems, orderId);

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      order_id: orderId,
      product_id: "prod-1",
      product_name: "Jollof Rice Kit",
      variant_label: "Large",
      prep_option: "Half-prepped",
      quantity: 2,
      unit_price_ngn: 500000,
      subtotal_ngn: 1000000,
    });

    expect(result[1]).toEqual({
      order_id: orderId,
      product_id: "prod-2",
      product_name: "Tomatoes",
      variant_label: null,
      prep_option: null,
      quantity: 1,
      unit_price_ngn: 150000,
      subtotal_ngn: 150000,
    });
  });

  it("returns integer kobo values only (no floats)", () => {
    const orderId = "order-uuid-999";
    const result = buildOrderItemsDraftFromCart(sampleItems, orderId);
    for (const item of result) {
      expect(Number.isInteger(item.unit_price_ngn)).toBe(true);
      expect(Number.isInteger(item.subtotal_ngn)).toBe(true);
    }
  });

  it("handles an empty cart returning empty array", () => {
    const result = buildOrderItemsDraftFromCart([], "order-uuid-empty");
    expect(result).toHaveLength(0);
  });

  it("computes correct total from cart items (sum of subtotals in kobo)", () => {
    // total = 1000000 + 150000 = 1150000
    const total = sampleItems.reduce((acc, i) => acc + i.subtotalNgn, 0);
    expect(total).toBe(1150000);
    expect(Number.isInteger(total)).toBe(true);
  });
});

describe("cartFingerprint", () => {
  it("returns a deterministic string for the same cart", () => {
    const fp1 = cartFingerprint(sampleItems);
    const fp2 = cartFingerprint(sampleItems);
    expect(fp1).toBe(fp2);
  });

  it("returns a different fingerprint when item quantity changes", () => {
    const modified = sampleItems.map((item, idx) =>
      idx === 0 ? { ...item, quantity: 3 } : item
    );
    const fp1 = cartFingerprint(sampleItems);
    const fp2 = cartFingerprint(modified);
    expect(fp1).not.toBe(fp2);
  });

  it("returns a different fingerprint when items differ by variant", () => {
    const modified = sampleItems.map((item, idx) =>
      idx === 0 ? { ...item, variantLabel: "Small" } : item
    );
    const fp1 = cartFingerprint(sampleItems);
    const fp2 = cartFingerprint(modified);
    expect(fp1).not.toBe(fp2);
  });

  it("returns a different fingerprint when items differ by prep option", () => {
    const modified = sampleItems.map((item, idx) =>
      idx === 0 ? { ...item, prepOption: "Fully-prepped" } : item
    );
    const fp1 = cartFingerprint(sampleItems);
    const fp2 = cartFingerprint(modified);
    expect(fp1).not.toBe(fp2);
  });

  it("returns a non-empty string", () => {
    const fp = cartFingerprint(sampleItems);
    expect(typeof fp).toBe("string");
    expect(fp.length).toBeGreaterThan(0);
  });

  it("returns same fingerprint regardless of item order (order-insensitive)", () => {
    const reversed = [...sampleItems].reverse();
    const fp1 = cartFingerprint(sampleItems);
    const fp2 = cartFingerprint(reversed);
    expect(fp1).toBe(fp2);
  });
});
