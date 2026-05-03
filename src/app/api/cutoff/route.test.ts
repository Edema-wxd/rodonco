import { describe, it, vi, beforeEach } from "vitest";

// These tests go GREEN when src/app/api/cutoff/route.ts is implemented in Wave 1 (Plan 06-02).
// DO NOT implement the route here — these are contracts only.

vi.mock("@/lib/db", () => ({
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
  schema: {
    ordering_config: {},
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

describe("GET /api/cutoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.todo("returns 401 when Authorization header is missing");
  it.todo("returns 401 when Authorization header has wrong CRON_SECRET value");
  it.todo("returns 200 with { ok: true } when Authorization header matches CRON_SECRET");
  it.todo("calls db.update(ordering_config).set({ is_ordering_open: false }) on success");
  it.todo("is idempotent — calling twice does not error");
});
