import { describe, it, vi } from "vitest";

// These tests go GREEN when src/lib/admin/reminders.ts is implemented in Wave 1 (Plan 06-03).
// getPaidOrdersForWeek(weekOf: string) queries orders WHERE week_of = weekOf AND status = 'paid'.

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
  schema: {
    orders: {
      week_of: "week_of",
      status: "status",
      id: "id",
      customer_name: "customer_name",
      customer_email: "customer_email",
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  and: vi.fn((...args) => args),
}));

describe("getPaidOrdersForWeek", () => {
  it.todo("returns an array of orders with id, customer_name, customer_email");
  it.todo("passes week_of string directly to eq() without Date conversion");
  it.todo("filters by status = 'paid'");
  it.todo("returns empty array when no paid orders exist for the week");
});
