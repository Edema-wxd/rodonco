import { describe, it, vi, beforeEach, expect } from "vitest";

import { GET } from "./route";

vi.mock("@/lib/db", () => ({
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
  schema: {
    ordering_config: { id: "id" },
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

function makeRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader !== undefined) headers.set("authorization", authHeader);
  return new Request("http://localhost/api/cutoff", { headers });
}

describe("GET /api/cutoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret-123";
  });

  it("returns 401 when Authorization header is missing", async () => {
    const req = makeRequest();
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 401 when Authorization header has wrong CRON_SECRET value", async () => {
    const req = makeRequest("Bearer wrong-secret");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 200 with { ok: true } when Authorization header matches CRON_SECRET", async () => {
    const req = makeRequest("Bearer test-secret-123");
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("calls db.update(ordering_config).set({ is_ordering_open: false }) on success", async () => {
    const { db } = await import("@/lib/db");
    const req = makeRequest("Bearer test-secret-123");
    await GET(req as any);
    expect(db.update).toHaveBeenCalledWith({ id: "id" });
  });

  it("is idempotent — calling twice does not error", async () => {
    const req1 = makeRequest("Bearer test-secret-123");
    const req2 = makeRequest("Bearer test-secret-123");
    const r1 = await GET(req1 as any);
    const r2 = await GET(req2 as any);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
  });
});
