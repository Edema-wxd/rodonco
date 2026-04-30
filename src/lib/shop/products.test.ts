import { describe, expect, it, vi, beforeEach } from "vitest";

import * as actualSchema from "../../../drizzle/schema";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
  schema: actualSchema,
}));

import { db } from "@/lib/db";
import { getActiveProductsWithStartingPriceForShop } from "./products";

type DbSelect = typeof db.select;

function asMockSelect(fn: DbSelect) {
  return fn as unknown as ReturnType<typeof vi.fn> & { mockReturnValueOnce: any; mockImplementationOnce: any };
}

describe("getActiveProductsWithStartingPriceForShop", () => {
  beforeEach(() => {
    asMockSelect(db.select).mockReset?.();
    vi.restoreAllMocks();
  });

  it("returns starting_price_ngn as the MIN variant price for each active product", async () => {
    const selectMock = asMockSelect(db.select);

    // 1) getActiveProductsForShop query chain
    const orderBy = vi.fn().mockResolvedValue([
      {
        id: "p1",
        name: "Apple",
        description: null,
        type: "fresh_produce",
        image_url: null,
        is_active: true,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "p2",
        name: "Beef stew kit",
        description: null,
        type: "cooking_kit",
        image_url: null,
        is_active: true,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValueOnce({ from });

    // 2) min-price aggregate query chain
    const groupBy = vi.fn().mockResolvedValue([
      { product_id: "p1", starting_price_ngn: 12_500 },
      { product_id: "p2", starting_price_ngn: 20_000 },
    ]);
    const where2 = vi.fn().mockReturnValue({ groupBy });
    const from2 = vi.fn().mockReturnValue({ where: where2 });
    selectMock.mockReturnValueOnce({ from: from2 });

    const rows = await getActiveProductsWithStartingPriceForShop();
    expect(rows).toHaveLength(2);
    expect(rows.find((p) => p.id === "p1")?.starting_price_ngn).toBe(12_500);
    expect(rows.find((p) => p.id === "p2")?.starting_price_ngn).toBe(20_000);
  });

  it("defaults missing variant prices to 0 (and remains DB-free)", async () => {
    const selectMock = asMockSelect(db.select);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const orderBy = vi.fn().mockResolvedValue([
      {
        id: "p1",
        name: "Apple",
        description: null,
        type: "fresh_produce",
        image_url: null,
        is_active: true,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "p2",
        name: "Beef stew kit",
        description: null,
        type: "cooking_kit",
        image_url: null,
        is_active: true,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValueOnce({ from });

    const groupBy = vi.fn().mockResolvedValue([{ product_id: "p1", starting_price_ngn: 12_500 }]);
    const where2 = vi.fn().mockReturnValue({ groupBy });
    const from2 = vi.fn().mockReturnValue({ where: where2 });
    selectMock.mockReturnValueOnce({ from: from2 });

    const rows = await getActiveProductsWithStartingPriceForShop();
    expect(rows.find((p) => p.id === "p1")?.starting_price_ngn).toBe(12_500);
    expect(rows.find((p) => p.id === "p2")?.starting_price_ngn).toBe(0);
    expect(consoleError).toHaveBeenCalled();
  });
});

