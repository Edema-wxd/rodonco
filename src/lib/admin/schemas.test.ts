import { describe, expect, it } from "vitest";

import {
  orderStatusPatchSchema,
  orderingConfigPatchSchema,
  productPayloadSchema,
} from "./schemas";

// NOTE: bulkStatusTransitionSchema is imported only in todo stubs below — it does not exist yet.

describe("admin schemas", () => {
  it("orderStatusPatchSchema is strict and rejects invalid status", () => {
    const bad = orderStatusPatchSchema.safeParse({ status: "pending" });
    expect(bad.success).toBe(false);

    const extra = orderStatusPatchSchema.safeParse({ status: "paid", extra: true });
    expect(extra.success).toBe(false);
  });

  it("orderingConfigPatchSchema is strict", () => {
    const ok = orderingConfigPatchSchema.safeParse({ is_ordering_open: true });
    expect(ok.success).toBe(true);

    const extra = orderingConfigPatchSchema.safeParse({
      is_ordering_open: true,
      cutoff_message: "nope",
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
  it.skip("accepts next_delivery_date and cutoff_message", () => {
    // This test is SKIPPED until schemas.ts is updated in Wave 1 (expected RED pre-implementation)
    const ok = orderingConfigPatchSchema.safeParse({
      next_delivery_date: "2026-05-10",
      cutoff_message: "Closed for the week",
    });
    expect(ok.success).toBe(true);
  });

  it.skip("rejects payload with no fields set (at-least-one refine)", () => {
    // This test is SKIPPED until schemas.ts is updated in Wave 1 (expected RED pre-implementation)
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
  // Import will fail until schemas.ts exports this — mark as todo for now
  it.todo("accepts paid → processing transition");
  it.todo("accepts processing → delivered transition");
  it.todo("rejects paid → delivered (invalid hop)");
  it.todo("rejects missing week_of field");
});

