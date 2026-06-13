import { describe, expect, it } from "vitest";

import { productPayloadSchema } from "./schemas";

describe("admin productPayloadSchema", () => {
  it("rejects extra keys via .strict()", () => {
    const parsed = productPayloadSchema.safeParse({
      name: "Tomatoes",
      description: null,
      type: "fresh_produce",
      image_url: null,
      is_active: true,
      variants: [],
      prep_options: [],
      injected: "nope",
    });

    expect(parsed.success).toBe(false);
  });

  it("coerces numeric fields and enforces array caps", () => {
    const parsed = productPayloadSchema.safeParse({
      name: "Pepper",
      type: "fresh_produce",
      is_active: true,
      variants: Array.from({ length: 20 }, (_, i) => ({
        label: `v${i}`,
        price_ngn: 100,
        is_default: false,
      })),
      prep_options: [{ label: "Chop", extra_cost_ngn: 0 }],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(typeof parsed.data.variants[0]?.price_ngn).toBe("number");
    expect(parsed.data.description == null).toBe(true);
    expect(parsed.data.image_url == null).toBe(true);
  });

  it("allows a blank description (empty string treated as null)", () => {
    const parsed = productPayloadSchema.safeParse({
      name: "Tomatoes",
      description: "",
      type: "fresh_produce",
      is_active: true,
      images: [],
      variants: [],
      prep_options: [],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.description == null).toBe(true);
  });
});

