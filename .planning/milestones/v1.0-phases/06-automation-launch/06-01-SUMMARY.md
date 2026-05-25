---
phase: 06-automation-launch
plan: "01"
subsystem: testing
tags: [tdd, test-stubs, wave-0, vitest, cron, reminders, env-validation]
dependency_graph:
  requires: []
  provides: [wave-0-test-contracts]
  affects: [06-02, 06-03, 06-04]
tech_stack:
  added: []
  patterns: [vitest-todo-stubs, vi.mock-chain, process.env-isolation]
key_files:
  created:
    - src/app/api/cutoff/route.test.ts
    - src/lib/validateEnv.test.ts
    - src/lib/admin/reminders.test.ts
    - src/app/api/admin/reminders/route.test.ts
  modified: []
decisions:
  - "Used vi.mock() for @/lib/db, drizzle-orm, @/auth, and resend to keep stubs fully isolated from infrastructure"
  - "All test cases use it.todo() so vitest reports them as todo (skipped), not failures — npm test exits 0"
  - "Stub files contain no implementation logic — contracts only, per plan spec"
metrics:
  duration_minutes: 2
  completed_date: "2026-05-03"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 6 Plan 01: Wave 0 Test Stubs Summary

Wave 0 Vitest todo-stub contracts for INFRA-02 (CRON_SECRET auth), NOTF-01 (getPaidOrdersForWeek bulk reminders), and D-12/D-13 (validateEnv env assertion) — establishing behavior contracts before Wave 1 and Wave 2 implement the production code.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create cutoff route and validateEnv test stubs | 0ff7f99 | src/app/api/cutoff/route.test.ts, src/lib/validateEnv.test.ts |
| 2 | Create reminders lib and route test stubs | 85b5c96 | src/lib/admin/reminders.test.ts, src/app/api/admin/reminders/route.test.ts |

## What Was Built

Four Vitest test stub files establishing Wave 0 behavior contracts:

1. **`src/app/api/cutoff/route.test.ts`** — 5 todo contracts covering CRON_SECRET header auth (401 on missing/wrong, 200 on correct), db.update call verification, and idempotency. Mocks `@/lib/db` update chain and `drizzle-orm`.

2. **`src/lib/validateEnv.test.ts`** — 5 todo contracts covering production `pk_live_` key assertion, development `pk_test_` allowance, AUTH_SECRET/RESEND_API_KEY presence checks, and full-pass scenario. Uses `process.env` isolation with beforeEach/afterEach.

3. **`src/lib/admin/reminders.test.ts`** — 4 todo contracts for `getPaidOrdersForWeek(weekOf: string)`: return shape, direct string pass-through to `eq()`, `status = 'paid'` filter, and empty-array fallback. Mocks `@/lib/db` select chain with orders schema fields.

4. **`src/app/api/admin/reminders/route.test.ts`** — 5 todo contracts for `POST /api/admin/reminders`: 401 on no session, 400 on invalid week_of, `{ sent: 0 }` when no paid orders, `{ sent: N }` count accuracy, and Resend batch.send call verification. Mocks `@/auth`, `@/lib/admin/reminders`, and `resend`.

## Verification

```
npm test -- src/app/api/cutoff/route.test.ts src/lib/validateEnv.test.ts
# Test Files  2 skipped (2) | Tests  10 todo (10)

npm test -- src/lib/admin/reminders.test.ts src/app/api/admin/reminders/route.test.ts
# Test Files  2 skipped (2) | Tests  9 todo (9)
```

All 4 stub files exit 0. Pre-existing failures in `src/app/api/orders/init/route.test.ts` and `src/components/shop/OrderingClosedBanner.test.tsx` are unrelated to this plan.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — stub files are intentionally todo-only test contracts; they contain no implementation logic and no rendering of placeholder data.

## Threat Flags

None — test files use vi.mock() exclusively; no real credentials, no new network endpoints, no DB access.

## Self-Check: PASSED

Files exist:
- src/app/api/cutoff/route.test.ts: FOUND
- src/lib/validateEnv.test.ts: FOUND
- src/lib/admin/reminders.test.ts: FOUND
- src/app/api/admin/reminders/route.test.ts: FOUND

Commits exist:
- 0ff7f99: FOUND (test(06-01): add Wave 0 stubs for cutoff route and validateEnv)
- 85b5c96: FOUND (test(06-01): add Wave 0 stubs for reminders lib and route)
