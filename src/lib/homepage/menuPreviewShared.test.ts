import { describe, expect, it } from "vitest";

import { menuPreviewPatchSchema } from "@/lib/admin/schemas";
import {
  DEFAULT_MENU_PREVIEW_CONFIG,
  MENU_PREVIEW_MAX_PRODUCTS,
  selectMenuPreviewProducts,
} from "./menuPreviewShared";

const kitA = { id: "a", type: "cooking_kit" };
const kitB = { id: "b", type: "cooking_kit" };
const kitC = { id: "c", type: "cooking_kit" };
const kitD = { id: "d", type: "cooking_kit" };
const produce = { id: "p", type: "fresh_produce" };
const all = [kitA, produce, kitB, kitC, kitD];

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("selectMenuPreviewProducts", () => {
  it("falls back to the first 3 cooking kits when nothing is curated", () => {
    expect(selectMenuPreviewProducts(all, [])).toEqual([kitA, kitB, kitC]);
  });

  it("keeps the curated order and allows any product type", () => {
    expect(selectMenuPreviewProducts(all, ["d", "p", "a"])).toEqual([kitD, produce, kitA]);
  });

  it("drops curated ids that are no longer active", () => {
    expect(selectMenuPreviewProducts(all, ["gone", "c"])).toEqual([kitC]);
  });

  it("falls back when every curated product is inactive", () => {
    expect(selectMenuPreviewProducts(all, ["gone"])).toEqual([kitA, kitB, kitC]);
  });
});

describe("menuPreviewPatchSchema", () => {
  it("accepts the defaults", () => {
    expect(menuPreviewPatchSchema.safeParse(DEFAULT_MENU_PREVIEW_CONFIG).success).toBe(true);
  });

  it("accepts internal paths and http(s) URLs, rejects others", () => {
    const withHref = (cta_href: string) =>
      menuPreviewPatchSchema.safeParse({ ...DEFAULT_MENU_PREVIEW_CONFIG, cta_href }).success;
    expect(withHref("/shop")).toBe(true);
    expect(withHref("https://wa.me/234")).toBe(true);
    expect(withHref("//evil.com")).toBe(false);
    expect(withHref("javascript:alert(1)")).toBe(false);
  });

  it("rejects blank required text, duplicate and too many products", () => {
    const parse = (patch: object) =>
      menuPreviewPatchSchema.safeParse({ ...DEFAULT_MENU_PREVIEW_CONFIG, ...patch }).success;
    expect(parse({ heading: "   " })).toBe(false);
    expect(parse({ product_ids: [uuid(1), uuid(1)] })).toBe(false);
    expect(
      parse({ product_ids: Array.from({ length: MENU_PREVIEW_MAX_PRODUCTS + 1 }, (_, i) => uuid(i)) }),
    ).toBe(false);
    expect(parse({ extra: true })).toBe(false);
  });
});
