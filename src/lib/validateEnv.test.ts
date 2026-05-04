import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// These tests validate src/lib/validateEnv.ts — build-time env assertion function.
// Each test uses dynamic import() inside the test body to pick up the mutated process.env
// (static top-level imports are module-cached and won't see env changes).

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      AUTH_SECRET: "valid-secret-abc",
      RESEND_API_KEY: "re_test_123",
      NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: "pk_live_validkey",
      NODE_ENV: "production",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws when NODE_ENV=production and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY does not start with pk_live_", async () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = "pk_test_invalidkey";
    const { validateEnv } = await import("./validateEnv");
    expect(() => validateEnv()).toThrow("pk_live_");
  });

  it("does not throw when NODE_ENV=development and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY starts with pk_test_", async () => {
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = "pk_test_devkey";
    const { validateEnv } = await import("./validateEnv");
    expect(() => validateEnv()).not.toThrow();
  });

  it("throws when AUTH_SECRET is empty or missing", async () => {
    process.env.AUTH_SECRET = "";
    const { validateEnv } = await import("./validateEnv");
    expect(() => validateEnv()).toThrow("AUTH_SECRET");
  });

  it("throws when RESEND_API_KEY is empty or missing", async () => {
    delete process.env.RESEND_API_KEY;
    const { validateEnv } = await import("./validateEnv");
    expect(() => validateEnv()).toThrow("RESEND_API_KEY");
  });

  it("does not throw when all required vars are set correctly in production", async () => {
    // All vars set in beforeEach with valid values
    const { validateEnv } = await import("./validateEnv");
    expect(() => validateEnv()).not.toThrow();
  });
});
