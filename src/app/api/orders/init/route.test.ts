// src/app/api/orders/init/route.test.ts
// TDD tests for POST /api/orders/init.
// Covers: validation, ordering-closed guard, DB insert, Paystack init, response shape, error cases.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mock server-only ---
vi.mock("server-only", () => ({}));

// --- Hoist all mock state and mock functions ---
const { mockState, mockDbInsert, mockDbSelect } = vi.hoisted(() => {
  const mockState = {
    isOrderingOpen: true,
    deliveryFeeNgn: 0,
    paystackResult: {
      access_code: "test_access_code",
      authorization_url: "https://checkout.paystack.com/abc",
      reference: "RDC-test1234567",
    },
    pendingReuseResult: null as {
      id: string;
      reference: string;
      total_ngn: number;
      week_of: string;
      payment_method: string;
    } | null,
    paystackError: null as Error | null,
    flutterwaveResult: {
      link: "https://checkout.flutterwave.com/v3/hosted/pay/abc",
      reference: "RDC-test1234567",
    },
    flutterwaveError: null as Error | null,
  };

  const mockDbInsert = vi.fn();
  const mockDbSelect = vi.fn();

  return { mockState, mockDbInsert, mockDbSelect };
});

// --- Mock dependencies ---
vi.mock("@/lib/shop/orderingConfig", () => ({
  getOrderingConfig: vi.fn(async () => ({
    is_ordering_open: mockState.isOrderingOpen,
    cutoff_message: null,
    next_delivery_date: "2026-05-09",
    delivery_fee_ngn: mockState.deliveryFeeNgn,
  })),
}));

vi.mock("@/lib/orders/findPendingReuse", () => ({
  findPendingReuse: vi.fn(async () => mockState.pendingReuseResult),
}));

vi.mock("@/lib/paystack/initialize", () => ({
  initializePaystackTransaction: vi.fn(async () => {
    if (mockState.paystackError) throw mockState.paystackError;
    return mockState.paystackResult;
  }),
}));

vi.mock("@/lib/flutterwave/initialize", () => ({
  initializeFlutterwaveTransaction: vi.fn(async () => {
    if (mockState.flutterwaveError) throw mockState.flutterwaveError;
    return mockState.flutterwaveResult;
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockDbInsert,
    select: mockDbSelect,
    // reused-order sync (total_ngn / payment_method) — chainable, result ignored
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    }),
    // fire-and-forget abandoned_carts cleanup — must exist but result is ignored
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({ rowCount: 0 }),
    }),
  },
  schema: {
    orders: {
      id: "orders.id",
      reference: "orders.reference",
      customer_name: "orders.customer_name",
      customer_email: "orders.customer_email",
      customer_phone: "orders.customer_phone",
      delivery_address: "orders.delivery_address",
      allergy_notes: "orders.allergy_notes",
      status: "orders.status",
      total_ngn: "orders.total_ngn",
      week_of: "orders.week_of",
    },
    order_items: {},
    abandoned_carts: {
      customer_email: "abandoned_carts.customer_email",
    },
    product_variants: {
      product_id: "product_variants.product_id",
      label: "product_variants.label",
      price_ngn: "product_variants.price_ngn",
      is_default: "product_variants.is_default",
    },
    product_prep_options: {
      product_id: "product_prep_options.product_id",
      label: "product_prep_options.label",
      extra_cost_ngn: "product_prep_options.extra_cost_ngn",
    },
  },
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test1234567"),
}));

// Import after mocks
import { POST } from "./route";
import { initializePaystackTransaction } from "@/lib/paystack/initialize";

// ─────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────

const validCart = [
  {
    productId: "prod-abc",
    productName: "Fresh Tomatoes",
    variantLabel: "1kg",
    prepOption: null,
    quantity: 2,
    unitPriceNgn: 150000,
    subtotalNgn: 300000,
  },
];

const validPayload = {
  name: "Adaeze Okafor",
  email: "adaeze@example.com",
  phone: "08012345678",
  delivery_address: "12 Victoria Island, Lagos",
  allergy_notes: null,
  terms: true,
  cart: validCart,
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/orders/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Sets up db.select() to return a matching variant for "prod-abc/1kg" (price_ngn: 150000)
// and empty prep options — used by the server-side price authority in the route.
function setupSuccessfulDbSelect() {
  const variantWhere = vi.fn().mockResolvedValue([
    { product_id: "prod-abc", label: "1kg", price_ngn: 150000, is_default: false },
  ]);
  const prepWhere = vi.fn().mockResolvedValue([]);

  mockDbSelect
    .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: variantWhere }) })
    .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: prepWhere }) });
}

function setupSuccessfulDbInsert() {
  const returning = vi.fn().mockResolvedValue([{ id: "new-order-uuid", reference: "RDC-test1234567" }]);
  const values = vi.fn().mockReturnValue({ returning });

  // Second call for order_items (no returning needed)
  const values2 = vi.fn().mockResolvedValue([]);

  mockDbInsert
    .mockReturnValueOnce({ values })
    .mockReturnValueOnce({ values: values2 });
}

// ─────────────────────────────────────────
// Tests
// ─────────────────────────────────────────

describe("POST /api/orders/init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state
    mockState.isOrderingOpen = true;
    mockState.deliveryFeeNgn = 0;
    mockState.pendingReuseResult = null;
    mockState.paystackError = null;
    mockState.flutterwaveError = null;
    mockState.paystackResult = {
      access_code: "test_access_code",
      authorization_url: "https://checkout.paystack.com/abc",
      reference: "RDC-test1234567",
    };
    mockState.flutterwaveResult = {
      link: "https://checkout.flutterwave.com/v3/hosted/pay/abc",
      reference: "RDC-test1234567",
    };
    delete process.env.FLW_SECRET_KEY;
  });

  describe("validation", () => {
    it("returns 400 when body is not valid JSON", async () => {
      const req = new NextRequest("http://localhost:3000/api/orders/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{{",
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it("returns 400 when cart is empty", async () => {
      const req = makeRequest({ ...validPayload, cart: [] });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("returns 400 when required fields are missing", async () => {
      const req = makeRequest({ name: "Test" }); // missing email, phone, etc.

      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("returns 400 when phone is invalid format", async () => {
      const req = makeRequest({ ...validPayload, phone: "123" });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("returns 400 when email is invalid", async () => {
      const req = makeRequest({ ...validPayload, email: "not-an-email" });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("returns 400 when terms is false", async () => {
      const req = makeRequest({ ...validPayload, terms: false });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("returns 400 when cart item has non-integer price", async () => {
      const badCart = [{ ...validCart[0], unitPriceNgn: 1500.5 }];
      const req = makeRequest({ ...validPayload, cart: badCart });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe("ordering closed guard", () => {
    it("returns 422 when ordering is closed", async () => {
      mockState.isOrderingOpen = false;

      const req = makeRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toMatch(/ordering.*closed/i);
    });
  });

  describe("success path — new order", () => {
    it("returns 200 with reference, authorization_url, amount_kobo", async () => {
      setupSuccessfulDbSelect();
      setupSuccessfulDbInsert();

      const req = makeRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.reference).toBeDefined();
      expect(body.provider).toBe("paystack");
      expect(body.access_code).toBe("test_access_code");
      expect(body.authorization_url).toBe("https://checkout.paystack.com/abc");
      // totalNgn = 150000 * 2 + delivery(0) = 300000; amount_kobo = totalNgn * 100
      expect(body.amount_kobo).toBe(30000000);
    });

    it("generates reference with RDC- prefix", async () => {
      setupSuccessfulDbSelect();
      setupSuccessfulDbInsert();

      const req = makeRequest(validPayload);
      const res = await POST(req);

      const body = await res.json();
      expect(body.reference).toMatch(/^RDC-/);
    });

    it("inserts order into DB before calling Paystack", async () => {
      setupSuccessfulDbSelect();
      setupSuccessfulDbInsert();

      const req = makeRequest(validPayload);
      await POST(req);

      // DB insert should have been called for both orders and order_items
      expect(mockDbInsert).toHaveBeenCalledTimes(2);
      expect(initializePaystackTransaction).toHaveBeenCalled();
    });
  });

  describe("success path — reuse existing pending order", () => {
    it("reuses the pending order row but issues a FRESH reference (avoids Paystack duplicate-reference)", async () => {
      setupSuccessfulDbSelect();
      mockState.pendingReuseResult = {
        id: "existing-order-id",
        reference: "RDC-existing123",
        total_ngn: 300000,
        week_of: "2026-05-09",
        payment_method: "paystack",
      };

      const req = makeRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      // Must NOT re-use the old reference — Paystack rejects re-initializing it.
      expect(body.reference).not.toBe("RDC-existing123");
      expect(body.reference).toMatch(/^RDC-/);
      // Order row is reused (no new insert), and Paystack is initialised with the
      // fresh reference we just wrote to that row.
      expect(mockDbInsert).not.toHaveBeenCalled();
      // Paystack is initialised with the fresh reference (not the stale one).
      expect(vi.mocked(initializePaystackTransaction).mock.calls[0][0].reference).toBe(
        body.reference,
      );
    });
  });

  describe("provider — Flutterwave (alternative gateway)", () => {
    it("returns 422 when provider=flutterwave but FLW_SECRET_KEY is not configured", async () => {
      // FLW_SECRET_KEY is deleted in beforeEach
      const req = makeRequest({ ...validPayload, provider: "flutterwave" });
      const res = await POST(req);

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toMatch(/not available/i);
    });

    it("returns 200 with a redirect_url when provider=flutterwave and keys are set", async () => {
      process.env.FLW_SECRET_KEY = "FLWSECK_TEST-xxxx";
      setupSuccessfulDbSelect();
      setupSuccessfulDbInsert();

      const req = makeRequest({ ...validPayload, provider: "flutterwave" });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.provider).toBe("flutterwave");
      expect(body.redirect_url).toBe("https://checkout.flutterwave.com/v3/hosted/pay/abc");
      expect(body.access_code).toBeUndefined();
      expect(body.amount_kobo).toBe(30000000);
    });
  });

  describe("error handling", () => {
    it("returns 503 when Paystack fails", async () => {
      setupSuccessfulDbSelect();
      setupSuccessfulDbInsert();
      mockState.paystackError = new Error("Paystack API unavailable");

      const req = makeRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toBeDefined();
      // Must not leak internal error details
      expect(body.error).not.toContain("Paystack API unavailable");
    });

    it("never returns a stack trace in error response", async () => {
      const req = makeRequest({ invalid: "payload" });
      const res = await POST(req);

      const body = await res.json();
      const bodyStr = JSON.stringify(body);
      expect(bodyStr).not.toContain("at ");
      expect(bodyStr).not.toContain(".ts:");
    });
  });

  describe("only accepts POST", () => {
    it("route file exports only POST handler", async () => {
      const routeModule = await import("./route");
      expect(typeof routeModule.POST).toBe("function");
      // Should not export GET, PUT, DELETE
      expect((routeModule as Record<string, unknown>).GET).toBeUndefined();
      expect((routeModule as Record<string, unknown>).DELETE).toBeUndefined();
    });
  });
});
