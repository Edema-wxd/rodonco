import "server-only";
import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";

// Retry on 5xx (Neon cold-start / compute wakeup) and network errors.
// Don't retry 4xx — those are real auth or query failures.
neonConfig.fetchFunction = async (url: string, init: RequestInit) => {
  let lastRes: Response | undefined;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || res.status < 500) return res;
      lastRes = res;
    } catch (err) {
      lastErr = err;
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
  }
  if (lastErr) throw lastErr;
  return lastRes!;
};

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

export * as schema from "../../../drizzle/schema";
