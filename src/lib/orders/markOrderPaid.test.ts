import { describe, it, expect as _expect, vi, beforeEach } from "vitest";

// Re-export with relaxed type so objectContaining compiles cleanly under tsc.
// The runtime object is the real vitest expect; the cast is purely cosmetic.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expect = _expect as any;

vi.mock("server-only", () => ({}));

// ── Mutable mock state driving the drizzle chain ──────────────────────────────
const mockState = {
  paidLookup: [] as Record<string, unknown>[], // result of the "already paid?" select
  orderLookup: [] as Record<string, unknown>[], // result of the "fetch order" select
  updateReturning: [] as Record<string, unknown>[], // result of the atomic update
  itemsLookup: [] as Record<string, unknown>[], // order_items select
};

// select() is called 3x in order: (1) already-paid, (2) fetch order, (3) items.
let selectCall = 0;

const mockSendOrderEmails = vi.fn().mockResolvedValue(undefined);
const mockLogActivity = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => {
      const call = selectCall++;
      return {
        from: vi.fn(() => ({
          where: vi.fn(() => {
            // items select has no .limit(); order selects do.
            const result =
              call === 0
                ? mockState.paidLookup
                : call === 1
                  ? mockState.orderLookup
                  : mockState.itemsLookup;
            const promise = Promise.resolve(result);
            return Object.assign(promise, {
              limit: vi.fn(() => Promise.resolve(result)),
            });
          }),
        })),
      };
    }),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve(mockState.updateReturning)),
        })),
      })),
    })),
  },
  schema: {
    orders: { reference: "orders.reference", status: "orders.status", id: "orders.id" },
    order_items: { order_id: "order_items.order_id" },
  },
}));

vi.mock("@/lib/email/sendOrderEmails", () => ({
  sendOrderEmails: (...args: unknown[]) => mockSendOrderEmails(...args),
}));

vi.mock("@/lib/shop/orderingConfig", () => ({
  getOrderingConfig: vi.fn().mockResolvedValue({ next_delivery_date: "2026-08-02" }),
}));

vi.mock("@/lib/admin/activityLog", () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}));

import { markOrderPaid } from "./markOrderPaid";

const PENDING_ORDER = {
  id: "order-uuid",
  reference: "RDC-abc123",
  status: "pending",
  total_ngn: 5000,
  week_of: "2026-08-02",
  customer_name: "Tunde",
  customer_email: "tunde@example.com",
  customer_phone: "07011223344",
  delivery_address: "22 Allen Ave",
  allergy_notes: null,
  created_at: new Date("2026-07-28T10:00:00Z"),
  notified_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  selectCall = 0;
  mockState.paidLookup = [];
  mockState.orderLookup = [];
  mockState.updateReturning = [];
  mockState.itemsLookup = [];
});

describe("markOrderPaid", () => {
  it("promotes a pending order to paid and sends emails on the winning transition", async () => {
    mockState.paidLookup = []; // not already paid
    mockState.orderLookup = [PENDING_ORDER];
    mockState.updateReturning = [{ ...PENDING_ORDER, status: "paid" }];
    mockState.itemsLookup = [
      {
        id: "item-1",
        order_id: "order-uuid",
        product_id: "p1",
        product_name: "Tomatoes",
        variant_label: null,
        prep_option: null,
        quantity: 1,
        unit_price_ngn: 5000,
        subtotal_ngn: 5000,
      },
    ];

    const result = await markOrderPaid({ reference: "RDC-abc123", amountKobo: 500000 });

    expect(result).toEqual({ kind: "paid", transitioned: true });
    expect(mockSendOrderEmails).toHaveBeenCalledTimes(1);
  });

  it("is idempotent — already-paid orders return transitioned:false and send no email", async () => {
    mockState.paidLookup = [{ ...PENDING_ORDER, status: "paid" }];

    const result = await markOrderPaid({ reference: "RDC-abc123", amountKobo: 500000 });

    expect(result).toEqual({ kind: "paid", transitioned: false });
    expect(mockSendOrderEmails).not.toHaveBeenCalled();
  });

  it("returns not-found when the reference has no order", async () => {
    mockState.paidLookup = [];
    mockState.orderLookup = [];

    const result = await markOrderPaid({ reference: "RDC-missing", amountKobo: 500000 });

    expect(result).toEqual({ kind: "not-found" });
    expect(mockSendOrderEmails).not.toHaveBeenCalled();
  });

  it("rejects an amount mismatch, logs it, and does not send email", async () => {
    mockState.paidLookup = [];
    mockState.orderLookup = [PENDING_ORDER]; // expects 5000 * 100 = 500000 kobo

    const result = await markOrderPaid({ reference: "RDC-abc123", amountKobo: 400000 });

    expect(result).toEqual({
      kind: "amount-mismatch",
      expectedKobo: 500000,
      receivedKobo: 400000,
    });
    expect(mockSendOrderEmails).not.toHaveBeenCalled();
    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "system.payment_amount_mismatch" })
    );
  });

  it("treats a lost update race as already-paid (no email)", async () => {
    mockState.paidLookup = [];
    mockState.orderLookup = [PENDING_ORDER];
    mockState.updateReturning = []; // another caller won the transition

    const result = await markOrderPaid({ reference: "RDC-abc123", amountKobo: 500000 });

    expect(result).toEqual({ kind: "paid", transitioned: false });
    expect(mockSendOrderEmails).not.toHaveBeenCalled();
  });
});
