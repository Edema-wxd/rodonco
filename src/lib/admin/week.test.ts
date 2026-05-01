import { describe, expect, it } from "vitest";

import { currentWeekOf } from "./week";

describe("currentWeekOf", () => {
  it("returns the Sunday of the current UTC week for a mid-week date", () => {
    // 2026-05-06 is a Wednesday
    const reference = new Date("2026-05-06T12:00:00.000Z");
    expect(currentWeekOf(reference)).toBe("2026-05-03");
  });

  it("returns the same date when reference is a Sunday", () => {
    const reference = new Date("2026-05-03T00:00:00.000Z");
    expect(currentWeekOf(reference)).toBe("2026-05-03");
  });

  it("always returns YYYY-MM-DD format", () => {
    const s = currentWeekOf(new Date("2026-05-06T12:00:00.000Z"));
    expect(/^\d{4}-\d{2}-\d{2}$/.test(s)).toBe(true);
  });
});

