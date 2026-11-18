import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mockAuth, mockGetOrder, mockRecentAt, mockSettings, mockSend, mockLogActivity } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetOrder: vi.fn(),
  mockRecentAt: vi.fn(),
  mockSettings: vi.fn(),
  mockSend: vi.fn(),
  mockLogActivity: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/admin/cartRecoveryServer", () => ({
  getRecoveryOrder: mockGetOrder,
  getRecentRecoveryEmailAt: mockRecentAt,
}));
vi.mock("@/lib/admin/config", () => ({ getSiteSettings: mockSettings }));
vi.mock("@/lib/email/sendCartRecoveryEmail", () => ({ sendCartRecoveryEmail: mockSend }));
vi.mock("@/lib/admin/activityLog", () => ({ logActivity: mockLogActivity }));

const pendingOrder = {
  id: "order-1",
  reference: "RC-1234",
  status: "pending",
  customer_name: "Ada Okafor",
  customer_email: "ada@example.com",
  customer_phone: "08031234567",
  total_ngn: 18500,
  items: [
    { id: "i1", product_name: "Tomatoes", variant_label: null, prep_option: null, quantity: 1, subtotal_ngn: 1500 },
  ],
};

async function post() {
  const { POST } = await import("./route");
  return POST(new Request("http://localhost/api/admin/orders/order-1/recovery-email", { method: "POST" }), {
    params: Promise.resolve({ id: "order-1" }),
  });
}

describe("POST /api/admin/orders/[id]/recovery-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockGetOrder.mockResolvedValue(pendingOrder);
    mockRecentAt.mockResolvedValue(null);
    mockSettings.mockResolvedValue({ whatsapp_number: "08086451542", contact_email: "hello@example.com" });
    mockSend.mockResolvedValue({ ok: true });
    mockLogActivity.mockResolvedValue(undefined);
  });

  it("returns 401 without a session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await post();
    expect(res.status).toBe(401);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns 404 when the order doesn't exist", async () => {
    mockGetOrder.mockResolvedValue(null);
    expect((await post()).status).toBe(404);
  });

  it("refuses orders that are no longer unpaid", async () => {
    mockGetOrder.mockResolvedValue({ ...pendingOrder, status: "paid" });
    const res = await post();
    expect(res.status).toBe(409);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("refuses a second reminder within 24 hours", async () => {
    mockRecentAt.mockResolvedValue(new Date("2026-11-18T10:00:00Z"));
    const res = await post();
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("last 24 hours");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends the reminder with the store's WhatsApp number and logs the activity", async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const [order, settings] = mockSend.mock.calls[0];
    expect(order.reference).toBe("RC-1234");
    expect(settings.whatsappNumber).toBe("08086451542");
    expect(settings.contactEmail).toBe("hello@example.com");
    expect(mockLogActivity).toHaveBeenCalledTimes(1);
    expect(mockLogActivity.mock.calls[0][0].action).toBe("order.recovery_email_sent");
  });

  it("returns 502 and logs no activity when the send fails", async () => {
    mockSend.mockResolvedValue({ ok: false, error: "boom" });
    const res = await post();
    expect(res.status).toBe(502);
    expect(mockLogActivity).not.toHaveBeenCalled();
  });
});
