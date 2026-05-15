import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
}));

vi.mock("../../../drizzle/schema", () => ({
  orders: { week_of: "week_of", status: "status" },
}));

// Mock db — factory must not reference hoisted variables,
// so we create the chain fns inline and expose them via module state.
const mockWhere = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

import { bulkTransitionOrders } from "./bulkTransition";

describe("bulkTransitionOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockResolvedValue({ rowCount: 3 });
    mockSet.mockReturnValue({ where: mockWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
  });

  it("returns the rowCount from the update result", async () => {
    const count = await bulkTransitionOrders("2026-05-03", "paid", "processing");
    expect(count).toBe(3);
  });

  it("returns 0 when rowCount is null (defensive coercion)", async () => {
    mockWhere.mockResolvedValueOnce({ rowCount: null });
    const count = await bulkTransitionOrders("2026-05-03", "processing", "delivered");
    expect(count).toBe(0);
  });

  it("calls eq with the correct fromStatus", async () => {
    await bulkTransitionOrders("2026-05-03", "paid", "processing");
    const { eq } = await import("drizzle-orm");
    expect(eq).toHaveBeenCalledWith("status", "paid");
  });

  it("calls eq with the correct week_of", async () => {
    await bulkTransitionOrders("2026-05-03", "paid", "processing");
    const { eq } = await import("drizzle-orm");
    expect(eq).toHaveBeenCalledWith("week_of", "2026-05-03");
  });

  it("sets toStatus in the update", async () => {
    await bulkTransitionOrders("2026-05-03", "paid", "processing");
    expect(mockSet).toHaveBeenCalledWith({ status: "processing" });
  });
});
