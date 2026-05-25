---
phase: 06-automation-launch
plan: 02
subsystem: automation
tags: [cron, vercel, api-route, ordering]
dependency_graph:
  requires: [06-01]
  provides: [vercel-cron-config, cutoff-route]
  affects: [ordering_config.is_ordering_open]
tech_stack:
  added: []
  patterns: [vercel-cron, bearer-token-auth, drizzle-update]
key_files:
  created:
    - vercel.json
    - src/app/api/cutoff/route.ts
  modified:
    - src/app/api/cutoff/route.test.ts
decisions:
  - "Used plain Response('Unauthorized', { status: 401 }) for 401 (not NextResponse.json) to avoid leaking format hints"
  - "No auth() call — CRON_SECRET Bearer header is sole auth mechanism for server-to-server invocation"
  - "dynamic = force-dynamic prevents Next.js from caching the cron route response"
metrics:
  duration: "8m"
  completed: "2026-05-03"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 06 Plan 02: Vercel Cron + /api/cutoff Route Summary

Implemented Vercel Cron configuration and the /api/cutoff GET route handler that automatically closes the ordering window every Thursday at 22:59 UTC (23:59 WAT) by setting `ordering_config.is_ordering_open = false`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create vercel.json cron configuration | dbde6f2 | vercel.json |
| 2 | Implement /api/cutoff GET route handler and fill test stubs | ff20500 | src/app/api/cutoff/route.ts, src/app/api/cutoff/route.test.ts |

## What Was Built

**vercel.json** — Vercel Cron configuration at project root with a single entry invoking `/api/cutoff` at schedule `59 22 * * 4` (Thursday 22:59 UTC).

**src/app/api/cutoff/route.ts** — GET route handler that:
- Validates `Authorization: Bearer ${CRON_SECRET}` header, returns 401 immediately if missing or wrong
- Calls `db.update(schema.ordering_config).set({ is_ordering_open: false, updated_at: new Date() }).where(eq(schema.ordering_config.id, 1))`
- Returns `{ ok: true }` on success
- Is idempotent — safe to call multiple times
- Does NOT call `auth()` (Vercel invokes cron routes server-to-server with no session cookie)

**src/app/api/cutoff/route.test.ts** — 5 test stubs from Plan 01 replaced with real assertions, all passing green.

## Test Results

```
Tests  5 passed (5)
- returns 401 when Authorization header is missing
- returns 401 when Authorization header has wrong CRON_SECRET value
- returns 200 with { ok: true } when Authorization header matches CRON_SECRET
- calls db.update(ordering_config).set({ is_ordering_open: false }) on success
- is idempotent — calling twice does not error
```

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Coverage

| Threat | Mitigation Applied |
|--------|-------------------|
| T-06-01 Spoofing | CRON_SECRET Bearer check in place; 401 body is plain "Unauthorized" (no format hints) |
| T-06-04 Info Disclosure | Route logs nothing about the secret |

## Known Stubs

None — route is fully wired to Drizzle DB.

## Self-Check: PASSED

- vercel.json exists at project root: FOUND
- src/app/api/cutoff/route.ts exists: FOUND
- src/app/api/cutoff/route.test.ts updated: FOUND
- Commit dbde6f2 exists: FOUND
- Commit ff20500 exists: FOUND
- 5 tests pass green: VERIFIED
