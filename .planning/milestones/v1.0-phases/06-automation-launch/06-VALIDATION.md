---
phase: 6
slug: automation-launch
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-02
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 6-cron-01 | cron | 1 | INFRA-02 | T-6-01 | Returns 401 when Authorization header missing or wrong | unit | `npm test -- --reporter=verbose src/app/api/cutoff/route.test.ts` | No — Wave 0 | ⬜ pending |
| 6-cron-02 | cron | 1 | INFRA-01, INFRA-02 | — | Returns 200 and sets is_ordering_open=false with correct CRON_SECRET | unit | `npm test -- --reporter=verbose src/app/api/cutoff/route.test.ts` | No — Wave 0 | ⬜ pending |
| 6-reminders-01 | reminders | 1 | NOTF-01 | T-6-02 | getPaidOrdersForWeek() returns only paid orders for the given week | unit | `npm test -- src/lib/admin/reminders.test.ts` | No — Wave 0 | ⬜ pending |
| 6-reminders-02 | reminders | 1 | NOTF-01 | T-6-03 | POST /api/admin/reminders returns 401 without session | unit | `npm test -- src/app/api/admin/reminders/route.test.ts` | No — Wave 0 | ⬜ pending |
| 6-env-01 | hardening | 2 | D-12, D-13 | — | validateEnv() throws when PAYSTACK key is test key in production | unit | `npm test -- src/lib/validateEnv.test.ts` | No — Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/api/cutoff/route.test.ts` — stubs for INFRA-01/INFRA-02 (mock `process.env.CRON_SECRET`, mock Drizzle `db.update`)
- [ ] `src/lib/admin/reminders.test.ts` — stubs for NOTF-01 helper query logic
- [ ] `src/app/api/admin/reminders/route.test.ts` — stub for 401 guard on reminder route
- [ ] `src/lib/validateEnv.test.ts` — stubs for D-12/D-13 assertion logic (pure function, easy to unit test)

Model: `src/lib/admin/schemas.test.ts` (pure Zod validation pattern) — follow the same structure.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vercel Cron fires at 22:59 UTC Thursday | INFRA-01 | Cannot simulate Vercel Cron environment locally | Deploy to Vercel staging, wait for Thursday 22:59 UTC, check `/api/cutoff` logs in Vercel dashboard |
| Paystack popup loads without CSP errors | D-09 | Requires browser + live Paystack JS | Open shop in production browser, open devtools Console, verify no CSP violation errors |
| Bulk reminder emails arrive in inbox | NOTF-01 | Requires Resend live key and real email addresses | From `/admin/settings`, select a Saturday, click Send Reminders, verify emails in target inboxes |
| LAUNCH-CHECKLIST.md steps execute cleanly | D-11 | Operational runbook — requires Vercel dashboard and Paystack dashboard access | Follow LAUNCH-CHECKLIST.md step by step before go-live |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
