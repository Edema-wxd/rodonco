import { describe, expect, it } from "vitest";

import { formatNgn } from "./format";

describe("formatNgn", () => {
  it("formats NGN with a naira symbol", () => {
    expect(formatNgn(2500)).toContain("₦");
  });

  it("formats numeric strings", () => {
    expect(formatNgn("2500")).toContain("₦");
  });

  it("null/undefined formats as ₦0", () => {
    expect(formatNgn(null)).toContain("₦0");
    expect(formatNgn(undefined)).toContain("₦0");
  });
});

