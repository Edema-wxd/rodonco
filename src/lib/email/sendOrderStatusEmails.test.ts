// src/lib/email/sendOrderStatusEmails.test.ts
// Covers the notify policy (which transitions email), the batched send, and
// the never-throw contract the admin routes depend on.

import { describe, it, vi, expect as _expect, beforeEach } from "vitest";

// Re-export with relaxed type so objectContaining compiles cleanly (repo pattern,
// see src/app/api/admin/reminders/route.test.ts). The runtime object is the real
// vitest expect; the cast is purely cosmetic for tsc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expect = _expect as any;

vi.mock("server-only", () => ({}));

const { mockBatchSend, mockLogEmail, mockLogActivity } = vi.hoisted(() => ({
  mockBatchSend: vi.fn(),
  mockLogEmail: vi.fn(),
  mockLogActivity: vi.fn(),
}));

vi.mock("@/lib/email/resendClient", () => ({
  resend: { batch: { send: mockBatchSend } },
}));

vi.mock("@/lib/email/logEmail", () => ({ logEmail: mockLogEmail }));

vi.mock("@/lib/admin/activityLog", () => ({
  logActivity: mockLogActivity.mockResolvedValue(undefined),
}));

import {
  sendOrderStatusEmail,
  sendOrderStatusEmails,
  shouldNotifyStatusChange,
} from "./sendOrderStatusEmails";

const ADA = { reference: "RDC-1", customer_name: "Ada", customer_email: "ada@example.com" };
const BEM = { reference: "RDC-2", customer_name: "Bem", customer_email: "bem@example.com" };

function sentEmails(callIndex = 0) {
  return mockBatchSend.mock.calls[callIndex]?.[0] as {
    to: string[];
    subject: string;
    html: string;
  }[];
}

describe("shouldNotifyStatusChange", () => {
  it("notifies on processing, delivered and cancelled", () => {
    expect(shouldNotifyStatusChange("paid", "processing")).toBe(true);
    expect(shouldNotifyStatusChange("processing", "delivered")).toBe(true);
    expect(shouldNotifyStatusChange("paid", "cancelled")).toBe(true);
  });

  it("does not notify on paid — the order receipt already covers it", () => {
    expect(shouldNotifyStatusChange("pending", "paid")).toBe(false);
  });

  it("does not notify on pending", () => {
    expect(shouldNotifyStatusChange("paid", "pending")).toBe(false);
  });

  it("does not notify when the status did not actually change", () => {
    expect(shouldNotifyStatusChange("delivered", "delivered")).toBe(false);
    expect(shouldNotifyStatusChange("processing", "processing")).toBe(false);
  });
});

describe("sendOrderStatusEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatchSend.mockResolvedValue({ data: { data: [{ id: "re_1" }, { id: "re_2" }] }, error: null });
    mockLogActivity.mockResolvedValue(undefined);
    process.env.AUTH_SECRET = "test_auth_secret_abc123";
    process.env.NEXT_PUBLIC_APP_URL = "https://rodoandco.com";
    process.env.RESEND_FROM_EMAIL = "orders@rodoandco.com";
  });

  it("sends one batched call for many orders rather than one call each", async () => {
    await sendOrderStatusEmails([ADA, BEM], "processing");

    expect(mockBatchSend).toHaveBeenCalledTimes(1);
    expect(sentEmails()).toHaveLength(2);
    expect(sentEmails()[0].to).toEqual(["ada@example.com"]);
    expect(sentEmails()[1].to).toEqual(["bem@example.com"]);
  });

  it("uses status-specific subject copy carrying the order reference", async () => {
    await sendOrderStatusEmails([ADA], "delivered");
    expect(sentEmails()[0].subject).toBe("Your order RDC-1 has been delivered");

    mockBatchSend.mockClear();
    await sendOrderStatusEmails([ADA], "cancelled");
    expect(sentEmails()[0].subject).toBe("Your order RDC-1 has been cancelled");
  });

  it("includes a Track your order CTA deep-linking to the order reference", async () => {
    await sendOrderStatusEmails([ADA], "processing");

    const html = sentEmails()[0].html;
    expect(html).toContain("Track your order");
    expect(html).toContain("/api/orders/verify-link");
    expect(html).toContain("ref=RDC-1");
  });

  it("still sends without the CTA when the tracking link cannot be built", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;

    await sendOrderStatusEmails([ADA], "delivered");

    expect(mockBatchSend).toHaveBeenCalledTimes(1);
    const html = sentEmails()[0].html;
    expect(html).not.toContain("Track your order");
    expect(html).toContain("RDC-1");
  });

  it("logs each send with the new email type and the order reference", async () => {
    await sendOrderStatusEmails([ADA, BEM], "processing");

    expect(mockLogEmail).toHaveBeenCalledTimes(2);
    expect(mockLogEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "order_status_update",
        to: "ada@example.com",
        status: "sent",
        resendId: "re_1",
        orderReference: "RDC-1",
      }),
    );
  });

  it("does nothing when there are no recipients", async () => {
    await sendOrderStatusEmails([], "processing");
    expect(mockBatchSend).not.toHaveBeenCalled();
  });

  it("chunks at Resend's 100-per-batch limit", async () => {
    const many = Array.from({ length: 150 }, (_, i) => ({
      reference: `RDC-${i}`,
      customer_name: `Customer ${i}`,
      customer_email: `c${i}@example.com`,
    }));

    await sendOrderStatusEmails(many, "processing");

    expect(mockBatchSend).toHaveBeenCalledTimes(2);
    expect(sentEmails(0)).toHaveLength(100);
    expect(sentEmails(1)).toHaveLength(50);
  });

  it("never throws when Resend returns an error, and logs the failure", async () => {
    mockBatchSend.mockResolvedValue({ data: null, error: { message: "rate limited" } });

    await expect(sendOrderStatusEmails([ADA], "processing")).resolves.toBeUndefined();
    expect(mockLogEmail).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", orderReference: "RDC-1" }),
    );
  });

  it("never throws when the Resend call itself rejects", async () => {
    mockBatchSend.mockRejectedValue(new Error("network down"));

    await expect(sendOrderStatusEmails([ADA], "delivered")).resolves.toBeUndefined();
    expect(mockLogEmail).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", orderReference: "RDC-1" }),
    );
  });
});

describe("sendOrderStatusEmail (single order)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatchSend.mockResolvedValue({ data: { data: [{ id: "re_1" }] }, error: null });
    mockLogActivity.mockResolvedValue(undefined);
    process.env.AUTH_SECRET = "test_auth_secret_abc123";
    process.env.NEXT_PUBLIC_APP_URL = "https://rodoandco.com";
  });

  it("sends for a notifying transition", async () => {
    await sendOrderStatusEmail(ADA, "paid", "processing");
    expect(mockBatchSend).toHaveBeenCalledTimes(1);
  });

  it("skips a non-notifying transition", async () => {
    await sendOrderStatusEmail(ADA, "pending", "paid");
    expect(mockBatchSend).not.toHaveBeenCalled();
  });

  it("skips a no-op transition", async () => {
    await sendOrderStatusEmail(ADA, "delivered", "delivered");
    expect(mockBatchSend).not.toHaveBeenCalled();
  });
});
