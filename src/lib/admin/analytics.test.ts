import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          // Used by getWeeklyAnalytics for statusBreakdown: .where(...).groupBy(...)
          groupBy: vi.fn().mockResolvedValue([]),
          // Used by totalOrders and totalRevenue queries: .where(...) resolves directly
          then: (resolve: (v: unknown[]) => void) => resolve([]),
        }),
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  sum: vi.fn((col: unknown) => ({ col })),
  count: vi.fn(() => ({})),
  desc: vi.fn((col: unknown) => ({ col })),
  and: vi.fn((...args: unknown[]) => args),
  inArray: vi.fn((col: unknown, vals: unknown) => ({ col, vals })),
}));

vi.mock("./week", () => ({ currentWeekOf: vi.fn(() => "2026-05-03") }));

import { getWeeklyAnalytics } from "./analytics";

describe("getWeeklyAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes weekOverride to the week variable (not currentWeekOf)", async () => {
    // The function uses: const week = weekOverride ?? currentWeekOf()
    // With weekOverride = "2026-04-01", it should NOT call currentWeekOf
    const { currentWeekOf } = await import("./week");
    await getWeeklyAnalytics("2026-04-01");
    expect(currentWeekOf).not.toHaveBeenCalled();
  });

  it.todo("defaults to currentWeekOf() when no weekOverride provided");
});
