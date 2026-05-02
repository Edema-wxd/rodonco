// src/app/api/orders/init/route.test.ts
// TDD tests for POST /api/orders/init.
// Covers: validation, ordering-closed guard, DB insert, Paystack init, response shape, error cases.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mock server-only ---
vi.mock("server-only", () => ({}));

// --- Hoist mock state ---
const { mockState } = vi.hoisted(() => ({
  mockState: {
    isOrderingOpen: true,
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
    } | null,
    dbInsertError: null as Error | null,
    paystackError: null as Error | null,
  },
}));

// --- Mock dependencies ---
vi.mock("@/lib/shop/orderingConfig", () => ({
  getOrderingConfig: vi.fn(async () => ({
    is_ordering_open: mockState.isOrderingOpen,
    cutoff_message: null,
    next_delivery_date: "2026-05-09",
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

const mockDbInsert = vi.fn();
const mockDbSelect = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockDbInsert,
    select: mockDbSelect,
  },
  schema: {
    orders: { id: "orders.id", reference: "orders.reference" },
    order_items: {},
  },
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test1234567"),
}));

// Import after mocks
import { POST } from "./route";

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

function setupSuccessfulDbInsert() {
  const mockOrderId = "new-order-uuid";
  const returningOrder = vi.fn().mockResolvedValue([{ id: mockOrderId, reference: "RDC-test1234567" }]);
  const valuesOrder = vi.fn().mockReturnValue({ returning: returningOrder });
  const intoOrder = vi.fn().mockReturnValue({ values: valuesOrder });

  const returningItems = vi.fn().mockResolvedValue([]);
  const valuesItems = vi.fn().mockReturnValue({ returning: returningItems });
  const intoItems = vi.fn().mockReturnValue({ values: valuesItems });

  mockDbInsert
    .mockReturnValueOnce({ values: valuesOrder })
    .mockReturnValueOnce({ values: valuesItems });

  return { mockOrderId };
}

// ─────────────────────────────────────────
// Tests
// ─────────────────────────────────────────

describe("POST /api/orders/init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state
    mockState.isOrderingOpen = true;
    mockState.pendingReuseResult = null;
    mockState.dbInsertError = null;
    mockState.paystackError = null;
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
    it("returns 200 with reference, access_code, amount_kobo", async () => {
      setupSuccessfulDbInsert();

      const req = makeRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.reference).toBeDefined();
      expect(body.access_code).toBe("test_access_code");
      expect(body.amount_kobo).toBe(300000); // sum of subtotals
    });

    it("generates reference with RDC- prefix", async () => {
      setupSuccessfulDbInsert();

      const req = makeRequest(validPayload);
      const res = await POST(req);

      const body = await res.json();
      expect(body.reference).toMatch(/^RDC-/);
    });

    it("inserts order into DB before calling Paystack", async () => {
      setupSuccessfulDbInsert();
      const { initializePaystackTransaction } = await import("@/lib/paystack/initialize");

      const req = makeRequest(validPayload);
      await POST(req);

      // DB insert should have been called
      expect(mockDbInsert).toHaveBeenCalled();
      // Paystack should also be called
      expect(initializePaystackTransaction).toHaveBeenCalled();
    });
  });

  describe("success path — reuse existing pending order", () => {
    it("reuses existing pending order and returns its reference", async () => {
      mockState.pendingReuseResult = {
        id: "existing-order-id",
        reference: "RDC-existing123",
        total_ngn: 300000,
        week_of: "2026-05-09",
      };

      const req = makeRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.reference).toBe("RDC-existing123");
      // DB insert should NOT have been called when reusing
      expect(mockDbInsert).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("returns 503 when Paystack fails", async () => {
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
