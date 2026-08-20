// src/app/api/admin/orders/[id]/route.test.ts
// Tests the customer status-change notification wired into the admin PATCH.
// The real send helper runs — only Resend and the email log are mocked — so
// these cover the notify policy end to end, and prove a failed send still
// leaves the admin's status update successful.

import { describe, it, vi, expect as _expect, beforeEach } from "vitest";

// Re-export with relaxed type so objectContaining compiles cleanly (repo pattern,
// see src/app/api/admin/reminders/route.test.ts). The runtime object is the real
// vitest expect; the cast is purely cosmetic for tsc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expect = _expect as any;

vi.mock("server-only", () => ({}));

const { mockAuth, mockBatchSend, mockLogEmail, mockLogActivity, mockDbState } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockBatchSend: vi.fn(),
  mockLogEmail: vi.fn(),
  mockLogActivity: vi.fn(),
  mockDbState: {
    order: null as null | {
      reference: string;
      status: string;
      customer_name: string;
      customer_email: string;
    },
    updates: [] as unknown[],
  },
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/admin/activityLog", () => ({ logActivity: mockLogActivity }));
vi.mock("@/lib/email/resendClient", () => ({ resend: { batch: { send: mockBatchSend } } }));
vi.mock("@/lib/email/logEmail", () => ({ logEmail: mockLogEmail }));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (mockDbState.order ? [mockDbState.order] : []),
        }),
      }),
    }),
    update: () => ({
      set: (values: unknown) => ({
        where: async () => {
          mockDbState.updates.push(values);
        },
      }),
    }),
  },
}));

async function patchStatus(status: string) {
  const { PATCH } = await import("./route");
  const req = new Request("http://localhost/api/admin/orders/order-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return PATCH(req, { params: Promise.resolve({ id: "order-1" }) });
}

/** The send is fire-and-forget — let its microtasks and renders settle. */
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 30));
}

function sentEmails() {
  return mockBatchSend.mock.calls[0]?.[0] as { to: string[]; subject: string; html: string }[];
}

describe("PATCH /api/admin/orders/[id] — customer status notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockLogActivity.mockResolvedValue(undefined);
    mockBatchSend.mockResolvedValue({ data: { data: [{ id: "re_1" }] }, error: null });
    mockDbState.order = {
      reference: "RDC-1",
      status: "paid",
      customer_name: "Ada",
      customer_email: "ada@example.com",
    };
    mockDbState.updates = [];
    process.env.AUTH_SECRET = "test_auth_secret_abc123";
    process.env.NEXT_PUBLIC_APP_URL = "https://rodoandco.com";
  });

  it("emails the customer when the order moves to processing", async () => {
    const res = await patchStatus("processing");
    await flush();

    expect(res.status).toBe(200);
    expect(mockBatchSend).toHaveBeenCalledTimes(1);
    expect(sentEmails()[0].to).toEqual(["ada@example.com"]);
    expect(sentEmails()[0].subject).toBe("We're preparing your order RDC-1");
  });

  it("emails the customer when the order moves to delivered", async () => {
    mockDbState.order!.status = "processing";
    await patchStatus("delivered");
    await flush();

    expect(mockBatchSend).toHaveBeenCalledTimes(1);
    expect(sentEmails()[0].subject).toBe("Your order RDC-1 has been delivered");
  });

  it("emails the customer when the order is cancelled", async () => {
    await patchStatus("cancelled");
    await flush();

    expect(mockBatchSend).toHaveBeenCalledTimes(1);
    expect(sentEmails()[0].subject).toBe("Your order RDC-1 has been cancelled");
  });

  it("does not email on the transition to paid — the receipt already covers it", async () => {
    mockDbState.order!.status = "pending";
    const res = await patchStatus("paid");
    await flush();

    expect(res.status).toBe(200);
    expect(mockBatchSend).not.toHaveBeenCalled();
  });

  it("does not email on the transition to pending", async () => {
    await patchStatus("pending");
    await flush();

    expect(mockBatchSend).not.toHaveBeenCalled();
  });

  it("does not re-email when the status is re-saved unchanged", async () => {
    mockDbState.order!.status = "delivered";
    const res = await patchStatus("delivered");
    await flush();

    expect(res.status).toBe(200);
    expect(mockDbState.updates).toEqual([{ status: "delivered" }]);
    expect(mockBatchSend).not.toHaveBeenCalled();
  });

  it("still returns a successful status update when the email send fails", async () => {
    mockBatchSend.mockRejectedValue(new Error("resend is down"));

    const res = await patchStatus("processing");
    await flush();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    // The status write itself went through.
    expect(mockDbState.updates).toEqual([{ status: "processing" }]);
    expect(mockLogEmail).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", orderReference: "RDC-1" }),
    );
  });

  it("still returns a successful status update when Resend reports an error", async () => {
    mockBatchSend.mockResolvedValue({ data: null, error: { message: "rate limited" } });

    const res = await patchStatus("delivered");
    await flush();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("does not attempt a send when the order no longer exists", async () => {
    mockDbState.order = null;

    const res = await patchStatus("processing");
    await flush();

    expect(res.status).toBe(200);
    expect(mockBatchSend).not.toHaveBeenCalled();
  });
});
