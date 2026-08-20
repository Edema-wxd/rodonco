// src/app/api/admin/orders/bulk-status/route.test.ts
// Tests the customer notifications fired by the bulk status transition, and
// the dedupe guarantee: re-running the same transition emails nobody twice.
//
// bulkTransitionOrders is faked over an in-memory table that reproduces its
// real semantics — UPDATE ... WHERE status = from_status ... RETURNING — so
// the second run genuinely matches no rows rather than being told not to.

import { describe, it, vi, expect as _expect, beforeEach } from "vitest";

// Re-export with relaxed type so objectContaining compiles cleanly (repo pattern,
// see src/app/api/admin/reminders/route.test.ts). The runtime object is the real
// vitest expect; the cast is purely cosmetic for tsc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expect = _expect as any;

vi.mock("server-only", () => ({}));

interface FakeOrderRow {
  reference: string;
  customer_name: string;
  customer_email: string;
  status: string;
  week_of: string;
}

const { mockAuth, mockBatchSend, mockLogEmail, mockLogActivity, table } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockBatchSend: vi.fn(),
  mockLogEmail: vi.fn(),
  mockLogActivity: vi.fn(),
  table: { rows: [] as FakeOrderRow[] },
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/admin/activityLog", () => ({ logActivity: mockLogActivity }));
vi.mock("@/lib/email/resendClient", () => ({ resend: { batch: { send: mockBatchSend } } }));
vi.mock("@/lib/email/logEmail", () => ({ logEmail: mockLogEmail }));

vi.mock("@/lib/admin/bulkTransition", () => ({
  bulkTransitionOrders: vi.fn(async (weekOf: string, fromStatus: string, toStatus: string) => {
    const matched = (table.rows as FakeOrderRow[]).filter(
      (row: FakeOrderRow) => row.week_of === weekOf && row.status === fromStatus,
    );
    matched.forEach((row: FakeOrderRow) => {
      row.status = toStatus;
    });
    const orders = matched.map((row: FakeOrderRow) => ({
      reference: row.reference,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
    }));
    return { count: orders.length, orders };
  }),
}));

const WEEK = "2026-08-22";

async function callRoute(body: unknown, withSession = true) {
  mockAuth.mockResolvedValueOnce(withSession ? { user: { email: "admin@test.com" } } : null);

  const { POST } = await import("./route");
  const req = new Request("http://localhost/api/admin/orders/bulk-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

/** The send is fire-and-forget — let its microtasks and renders settle. */
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 30));
}

function allRecipients() {
  return mockBatchSend.mock.calls.flatMap((call: unknown[]) =>
    (call[0] as { to: string[] }[]).map((email) => email.to[0]),
  );
}

describe("POST /api/admin/orders/bulk-status — customer notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockLogActivity.mockResolvedValue(undefined);
    mockBatchSend.mockResolvedValue({ data: { data: [{ id: "re_1" }, { id: "re_2" }] }, error: null });
    table.rows = [
      { reference: "RDC-1", customer_name: "Ada", customer_email: "ada@example.com", status: "paid", week_of: WEEK },
      { reference: "RDC-2", customer_name: "Bem", customer_email: "bem@example.com", status: "paid", week_of: WEEK },
      { reference: "RDC-3", customer_name: "Chi", customer_email: "chi@example.com", status: "delivered", week_of: WEEK },
    ];
    process.env.AUTH_SECRET = "test_auth_secret_abc123";
    process.env.NEXT_PUBLIC_APP_URL = "https://rodoandco.com";
  });

  it("emails every order the transition actually moved", async () => {
    const res = await callRoute({ week_of: WEEK, from_status: "paid", to_status: "processing" });
    await flush();

    expect(await res.json()).toEqual({ updated: 2 });
    expect(mockBatchSend).toHaveBeenCalledTimes(1);
    expect(allRecipients()).toEqual(["ada@example.com", "bem@example.com"]);
  });

  it("uses a single batched send rather than one call per order", async () => {
    await callRoute({ week_of: WEEK, from_status: "paid", to_status: "processing" });
    await flush();

    expect(mockBatchSend).toHaveBeenCalledTimes(1);
    expect(mockBatchSend.mock.calls[0][0]).toHaveLength(2);
  });

  it("does not re-email on a re-run of the same transition", async () => {
    await callRoute({ week_of: WEEK, from_status: "paid", to_status: "processing" });
    await flush();
    expect(allRecipients()).toEqual(["ada@example.com", "bem@example.com"]);

    const second = await callRoute({ week_of: WEEK, from_status: "paid", to_status: "processing" });
    await flush();

    expect(await second.json()).toEqual({ updated: 0 });
    // Still only the first run's two recipients.
    expect(mockBatchSend).toHaveBeenCalledTimes(1);
    expect(allRecipients()).toEqual(["ada@example.com", "bem@example.com"]);
  });

  it("emails only the newly moved orders when a second transition follows", async () => {
    await callRoute({ week_of: WEEK, from_status: "paid", to_status: "processing" });
    await flush();
    mockBatchSend.mockClear();

    await callRoute({ week_of: WEEK, from_status: "processing", to_status: "delivered" });
    await flush();

    // RDC-3 was already delivered before either run — it must not be emailed.
    expect(allRecipients()).toEqual(["ada@example.com", "bem@example.com"]);
  });

  it("sends nothing when the transition moved no rows", async () => {
    table.rows = [];

    const res = await callRoute({ week_of: WEEK, from_status: "paid", to_status: "processing" });
    await flush();

    expect(await res.json()).toEqual({ updated: 0 });
    expect(mockBatchSend).not.toHaveBeenCalled();
  });

  it("still reports a successful transition when the email send fails", async () => {
    mockBatchSend.mockRejectedValue(new Error("resend is down"));

    const res = await callRoute({ week_of: WEEK, from_status: "paid", to_status: "processing" });
    await flush();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ updated: 2 });
    expect(mockLogEmail).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", orderReference: "RDC-1" }),
    );
  });

  it("returns 401 without sending when there is no session", async () => {
    const res = await callRoute({ week_of: WEEK, from_status: "paid", to_status: "processing" }, false);
    await flush();

    expect(res.status).toBe(401);
    expect(mockBatchSend).not.toHaveBeenCalled();
  });
});
