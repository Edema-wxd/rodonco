import { describe, expect, it } from "vitest";

import {
  orderStatusPatchSchema,
  orderingConfigPatchSchema,
  productPayloadSchema,
  bulkStatusTransitionSchema,
} from "./schemas";

// NOTE: bulkStatusTransitionSchema is imported only in todo stubs below — it does not exist yet.

describe("admin schemas", () => {
  it("orderStatusPatchSchema is strict and rejects invalid status", () => {
    const bad = orderStatusPatchSchema.safeParse({ status: "pending" });
    expect(bad.success).toBe(false);

    const extra = orderStatusPatchSchema.safeParse({ status: "paid", extra: true });
    expect(extra.success).toBe(false);
  });

  it("orderingConfigPatchSchema rejects extra keys", () => {
    const ok = orderingConfigPatchSchema.safeParse({ is_ordering_open: true });
    expect(ok.success).toBe(true);

    const extra = orderingConfigPatchSchema.safeParse({
      is_ordering_open: true,
      unknown_field: "nope",
    });
    expect(extra.success).toBe(false);
  });

  it("productPayloadSchema rejects negative price_ngn", () => {
    const res = productPayloadSchema.safeParse({
      name: "Test product",
      type: "fresh_produce",
      is_active: true,
      variants: [{ label: "Small", price_ngn: -1, is_default: true }],
      prep_options: [],
    });
    expect(res.success).toBe(false);
  });

  it("productPayloadSchema is strict and rejects extra keys", () => {
    const res = productPayloadSchema.safeParse({
      name: "Test product",
      type: "fresh_produce",
      is_active: true,
      variants: [],
      prep_options: [],
      hacked: "nope",
    });
    expect(res.success).toBe(false);
  });
});

// --- Phase 8 additions ---
describe("orderingConfigPatchSchema (extended — OPS-05)", () => {
  it("accepts next_delivery_date and cutoff_message", () => {
    const ok = orderingConfigPatchSchema.safeParse({
      next_delivery_date: "2026-05-10",
      cutoff_message: "Closed for the week",
    });
    expect(ok.success).toBe(true);
  });

  it("rejects payload with no fields set (at-least-one refine)", () => {
    const bad = orderingConfigPatchSchema.safeParse({});
    expect(bad.success).toBe(false);
  });

  it("still accepts is_ordering_open alone", () => {
    // CAUTION: this CURRENTLY passes. After schema update it must still pass.
    const ok = orderingConfigPatchSchema.safeParse({ is_ordering_open: false });
    expect(ok.success).toBe(true);
  });
});

describe("bulkStatusTransitionSchema (OPS-07)", () => {
  it("accepts paid → processing transition", () => {
    const ok = bulkStatusTransitionSchema.safeParse({
      week_of: "2026-05-03",
      from_status: "paid",
      to_status: "processing",
    });
    expect(ok.success).toBe(true);
  });

  it("accepts processing → delivered transition", () => {
    const ok = bulkStatusTransitionSchema.safeParse({
      week_of: "2026-05-03",
      from_status: "processing",
      to_status: "delivered",
    });
    expect(ok.success).toBe(true);
  });

  it("rejects paid → delivered (invalid hop)", () => {
    const bad = bulkStatusTransitionSchema.safeParse({
      week_of: "2026-05-03",
      from_status: "paid",
      to_status: "delivered",
    });
    expect(bad.success).toBe(false);
  });

  it("rejects missing week_of field", () => {
    const bad = bulkStatusTransitionSchema.safeParse({
      from_status: "paid",
      to_status: "processing",
    });
    expect(bad.success).toBe(false);
  });
});

