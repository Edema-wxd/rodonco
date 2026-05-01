import { describe, expect, it } from "vitest";

import {
  orderStatusPatchSchema,
  orderingConfigPatchSchema,
  productPayloadSchema,
} from "./schemas";

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

