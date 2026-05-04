import { describe, it, vi, expect as _expect, beforeEach } from "vitest";

// Re-export with relaxed type so arrayContaining / objectContaining compile cleanly.
// The runtime object is the real vitest expect; the cast is purely cosmetic for tsc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expect = _expect as any;

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: mockAuth }));

const mockGetPaidOrders = vi.fn();
vi.mock("@/lib/admin/reminders", () => ({
  getPaidOrdersForWeek: mockGetPaidOrders,
}));

const mockBatchSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    batch: { send: mockBatchSend },
  })),
}));

async function callRoute(body: unknown, withSession = true) {
  if (withSession) {
    mockAuth.mockResolvedValueOnce({ user: { email: "admin@test.com" } });
  } else {
    mockAuth.mockResolvedValueOnce(null);
  }

  const { POST } = await import("./route");
  const req = new Request("http://localhost/api/admin/reminders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("POST /api/admin/reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockBatchSend.mockResolvedValue({ data: [{}], error: null });
    process.env.RESEND_FROM_EMAIL = "noreply@rodoandco.com";
  });

  it("returns 401 when no session exists", async () => {
    const res = await callRoute({ week_of: "2025-01-11" }, false);
    expect(res.status).toBe(401);
  });

  it("returns 400 when week_of is missing", async () => {
    const res = await callRoute({});
    expect(res.status).toBe(400);
  });

  it("returns 400 when week_of is not a Saturday", async () => {
    const res = await callRoute({ week_of: "2025-01-13" }); // Monday
    expect(res.status).toBe(400);
  });

  it("returns { sent: 0 } when no paid orders for the week", async () => {
    mockGetPaidOrders.mockResolvedValueOnce([]);
    const res = await callRoute({ week_of: "2025-01-11" }); // Saturday
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ sent: 0 });
  });

  it("returns { sent: 2 } and calls batch.send with 2 emails", async () => {
    mockGetPaidOrders.mockResolvedValueOnce([
      { id: "1", customer_name: "Ada", customer_email: "ada@test.com" },
      { id: "2", customer_name: "Bola", customer_email: "bola@test.com" },
    ]);
    const res = await callRoute({ week_of: "2025-01-11" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ sent: 2 });
    expect(mockBatchSend).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ to: ["ada@test.com"] }),
        expect.objectContaining({ to: ["bola@test.com"] }),
      ])
    );
  });
});
