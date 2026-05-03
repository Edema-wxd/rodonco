import { describe, it, beforeEach, afterEach, vi } from "vitest";

// These tests go GREEN when src/lib/validateEnv.ts is implemented in Wave 2 (Plan 06-04).
// validateEnv() is a pure function — import it directly once the file exists.

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it.todo("throws when NODE_ENV=production and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY does not start with pk_live_");
  it.todo("does not throw when NODE_ENV=development and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY starts with pk_test_");
  it.todo("throws when AUTH_SECRET is empty or missing");
  it.todo("throws when RESEND_API_KEY is empty or missing");
  it.todo("does not throw when all required vars are set correctly in production");
});
