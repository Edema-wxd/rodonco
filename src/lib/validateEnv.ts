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

  // PAYSTACK_SECRET_KEY: required in all environments — webhook signature verification
  // and server-side Paystack API calls fail without it. Don't wait until first webhook
  // to discover it's missing.
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error(
      "[validateEnv] PAYSTACK_SECRET_KEY must be set. Add it to .env.local (dev) or Vercel environment variables (production)."
    );
  }

  // DATABASE_URL: required in all environments — every request that touches the DB
  // fails without it. Fail at boot, not on first query.
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "[validateEnv] DATABASE_URL must be set. Add it to .env.local (dev) or Vercel environment variables (production)."
    );
  }

  // Upstash: required in production. Rate-limit.ts fails open when Redis is
  // unreachable at runtime (intentional — don't take checkout down on a Redis
  // blip), so missing env vars at boot would mean ZERO rate limiting with only
  // a console.warn signal. Fail closed at boot instead.
  if (process.env.NODE_ENV === "production") {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        "[validateEnv] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production. " +
          "Without them the rate limiter fails open silently — checkout/webhook endpoints would be unprotected."
      );
    }
  }
}
