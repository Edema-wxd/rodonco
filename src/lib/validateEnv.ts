/**
 * validateEnv — build-time environment assertion.
 * Called from next.config.ts before bundling begins.
 *
 * Throws with a descriptive message if required env vars are missing or malformed.
 * The pk_live_ check is gated on NODE_ENV === "production" so local dev still works
 * with test Paystack keys. AUTH_SECRET and RESEND_API_KEY are required in all envs.
 */
export function validateEnv(): void {
  // pk_live_ assertion: production only (per D-13, Pitfall 5)
  if (process.env.NODE_ENV === "production") {
    const pubKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!pubKey?.startsWith("pk_live_")) {
      throw new Error(
        "[validateEnv] NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY must start with pk_live_ in production. " +
          "Got: " +
          (pubKey ? pubKey.slice(0, 10) + "..." : "undefined")
      );
    }
  }

  // AUTH_SECRET: required in all environments (NextAuth v5 convention — see src/types/env.d.ts)
  if (!process.env.AUTH_SECRET) {
    throw new Error(
      "[validateEnv] AUTH_SECRET must be set. Add it to .env.local (dev) or Vercel environment variables (production)."
    );
  }

  // RESEND_API_KEY: required in all environments
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "[validateEnv] RESEND_API_KEY must be set. Add it to .env.local (dev) or Vercel environment variables (production)."
    );
  }

  // Upstash: warn-only — rate limiting is fail-open, so missing vars degrade gracefully
  if (process.env.NODE_ENV === "production") {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn(
        "[validateEnv] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. " +
          "Rate limiting is disabled — strongly recommended for production."
      );
    }
  }
}
