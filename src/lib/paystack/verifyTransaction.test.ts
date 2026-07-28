import { describe, it, expect as _expect, vi, beforeEach, afterEach } from "vitest";

// Re-export with relaxed type so objectContaining compiles cleanly under tsc.
// The runtime object is the real vitest expect; the cast is purely cosmetic.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expect = _expect as any;

vi.mock("server-only", () => ({}));

import { verifyPaystackTransaction } from "./verifyTransaction";

const OLD_ENV = process.env.PAYSTACK_SECRET_KEY;

beforeEach(() => {
  process.env.PAYSTACK_SECRET_KEY = "sk_test_x";
  vi.restoreAllMocks();
});

afterEach(() => {
  process.env.PAYSTACK_SECRET_KEY = OLD_ENV;
});

function mockFetchOnce(response: { ok: boolean; json?: unknown; status?: number }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 500),
      json: async () => response.json,
    })
  );
}

describe("verifyPaystackTransaction", () => {
  it("returns the parsed transaction on a successful verify", async () => {
    mockFetchOnce({
      ok: true,
      json: {
        status: true,
        message: "Verification successful",
        data: {
          status: "success",
          amount: 500000,
          reference: "RDC-abc123",
          gateway_response: "Successful",
        },
      },
    });

    const result = await verifyPaystackTransaction("RDC-abc123");
    expect(result).toEqual({
      status: "success",
      amount: 500000,
      reference: "RDC-abc123",
      gateway_response: "Successful",
    });
  });

  it("calls the correct Paystack endpoint with the bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: true, data: { status: "success", amount: 1, reference: "r" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await verifyPaystackTransaction("RDC-abc123");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.paystack.co/transaction/verify/RDC-abc123",
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer sk_test_x" },
      })
    );
  });

  it("returns null when the secret key is not set", async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const result = await verifyPaystackTransaction("RDC-abc123");
    expect(result).toBeNull();
  });

  it("returns null on a non-2xx Paystack response", async () => {
    mockFetchOnce({ ok: false, status: 404, json: {} });
    const result = await verifyPaystackTransaction("RDC-abc123");
    expect(result).toBeNull();
  });

  it("returns null when the body has status:false or no data", async () => {
    mockFetchOnce({ ok: true, json: { status: false, message: "not found" } });
    const result = await verifyPaystackTransaction("RDC-abc123");
    expect(result).toBeNull();
  });

  it("returns null (never throws) when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const result = await verifyPaystackTransaction("RDC-abc123");
    expect(result).toBeNull();
  });
});
