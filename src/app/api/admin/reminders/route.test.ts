import { describe, it, vi } from "vitest";

// These tests go GREEN when src/app/api/admin/reminders/route.ts is implemented in Wave 1 (Plan 06-03).

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/admin/reminders", () => ({
  getPaidOrdersForWeek: vi.fn().mockResolvedValue([]),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    batch: {
      send: vi.fn().mockResolvedValue({ data: [{}], error: null }),
    },
  })),
}));

describe("POST /api/admin/reminders", () => {
  it.todo("returns 401 when no session exists");
  it.todo("returns 400 when week_of is missing or invalid format");
  it.todo("returns { sent: 0 } when no paid orders for the week");
  it.todo("returns { sent: N } equal to the number of paid orders found");
  it.todo("calls resend.batch.send with one email per paid order");
});
