import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Module-level Redis singleton — lazy-initialized on first request.
// If env vars are missing the reference stays null and every call fails-open.
let redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redis) redis = new Redis({ url, token });
  return redis;
}

export function getClientIP(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitConfig {
  requests: number;
  window: Duration; // e.g. "1 m", "1 h", "60 s"
  prefix: string; // unique Redis namespace per limit, e.g. "rl:orders-init:minute"
  route: string;  // logged on hit, e.g. "/api/orders/init (5/min)"
}

export type RateLimitResult =
  | { limited: false }
  | { limited: true; response: NextResponse };

export async function rateLimit(
  ip: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const r = getRedis();

  if (!r) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        `[rate-limit] Upstash env vars missing — skipping limit for ${config.route}`
      );
    }
    return { limited: false };
  }

  try {
    const limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      prefix: config.prefix,
    });

    const { success, reset } = await limiter.limit(ip);

    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      console.warn(
        `[rate-limit] ${config.route} — limit exceeded for IP ${ip}, retry in ${retryAfter}s`
      );
      return {
        limited: true,
        response: NextResponse.json(
          { error: "Too many requests", retryAfter },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        ),
      };
    }

    return { limited: false };
  } catch (err) {
    console.warn(
      `[rate-limit] Upstash unreachable for ${config.route} — failing open:`,
      err
    );
    return { limited: false };
  }
}
