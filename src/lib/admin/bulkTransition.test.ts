import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
}));

vi.mock("../../../drizzle/schema", () => ({
  orders: {
    week_of: "week_of",
    status: "status",
    reference: "reference",
    customer_name: "customer_name",
    customer_email: "customer_email",
  },
}));

// Mock db — factory must not reference hoisted variables,
// so we create the chain fns inline and expose them via module state.
const mockReturning = vi.fn();
const mockWhere = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

import { bulkTransitionOrders } from "./bulkTransition";

const ROWS = [
  { reference: "RDC-1", customer_name: "Ada", customer_email: "ada@example.com" },
  { reference: "RDC-2", customer_name: "Bem", customer_email: "bem@example.com" },
  { reference: "RDC-3", customer_name: "Chi", customer_email: "chi@example.com" },
];

describe("bulkTransitionOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue(ROWS);
    mockWhere.mockReturnValue({ returning: mockReturning });
    mockSet.mockReturnValue({ where: mockWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
  });

  it("returns the count of rows the update touched", async () => {
    const { count } = await bulkTransitionOrders("2026-05-03", "paid", "processing");
    expect(count).toBe(3);
  });

  it("returns 0 when the update touched nothing (defensive coercion)", async () => {
    mockReturning.mockResolvedValueOnce(undefined);
    const { count, orders } = await bulkTransitionOrders("2026-05-03", "processing", "delivered");
    expect(count).toBe(0);
    expect(orders).toEqual([]);
  });

  it("returns the affected orders so callers can email each customer", async () => {
    const { orders } = await bulkTransitionOrders("2026-05-03", "paid", "processing");
    expect(orders).toEqual(ROWS);
  });

  it("selects reference, customer_name and customer_email in RETURNING", async () => {
    await bulkTransitionOrders("2026-05-03", "paid", "processing");
    expect(mockReturning).toHaveBeenCalledWith({
      reference: "reference",
      customer_name: "customer_name",
      customer_email: "customer_email",
    });
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
