---
phase: 06-automation-launch
verified: 2026-05-04T07:40:00Z
status: human_needed
score: 8/8 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 5/8
  gaps_closed:
    - "vercel.json exists at project root with cron entry for /api/cutoff at 59 22 * * 4"
    - "/api/cutoff GET handler validates CRON_SECRET and sets is_ordering_open = false idempotently"
    - "Test suite passes green for the cutoff route.test.ts (5 tests passing, not todo)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Verify live Paystack keys are wired in Vercel Production environment"
    expected: "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY starts with pk_live_; PAYSTACK_SECRET_KEY starts with sk_live_"
    why_human: "Cannot verify Vercel dashboard environment variables programmatically; this is an operator action performed in the Vercel project settings"
  - test: "Verify Paystack live dashboard webhook URL is registered"
    expected: "Paystack Dashboard -> Settings -> API Keys & Webhooks shows https://<production-domain>/api/paystack/webhook as the registered webhook URL"
    why_human: "External Paystack dashboard state cannot be verified programmatically; requires browser login to Paystack"
  - test: "Trigger the /api/cutoff cron manually from Vercel dashboard and verify ordering window closes"
    expected: "Vercel Cron dashboard shows a successful run; ordering_config.is_ordering_open is set to false in the production DB"
    why_human: "Requires production deployment to be live and Vercel dashboard access; cannot simulate Vercel Cron invocation locally"
---

# Phase 6: Automation + Launch — Verification Report (Re-verification)

**Phase Goal:** The ordering window closes automatically every Thursday at 22:59 UTC via Vercel Cron, admin can trigger bulk delivery reminder emails, and the platform passes a pre-launch hardening checklist — live Paystack keys wired, environment assertions in place, and the webhook URL registered in the Paystack live dashboard
**Verified:** 2026-05-04T07:40:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (previous status: gaps_found, score: 5/8)

---

## Re-verification Summary

The three gaps from the previous verification (all rooted in the plan 02 worktree never being merged into `mvp`) have been resolved. Commits `aba10d1`, `7c541af`, and `efa77b7` are now present on the current branch. `vercel.json` and `src/app/api/cutoff/route.ts` both exist. The cutoff route tests pass green (5/5). All previously-verified items pass regression checks with no regressions.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | vercel.json exists at project root with cron entry for /api/cutoff at 59 22 * * 4 | VERIFIED | File exists; `node -e "require('./vercel.json')"` confirms path=/api/cutoff schedule=59 22 * * 4 |
| 2 | /api/cutoff GET handler validates Authorization: Bearer CRON_SECRET and returns 401/200 appropriately | VERIFIED | route.ts exists; checks `authHeader !== Bearer ${cronSecret}`; returns plain 401 or NextResponse.json({ ok: true }) |
| 3 | The handler sets ordering_config.is_ordering_open = false idempotently; running twice has no side effect | VERIFIED | db.update(schema.ordering_config).set({ is_ordering_open: false, updated_at: new Date() }).where(eq(..., 1)); test "is idempotent — calling twice does not error" passes |
| 4 | All 5 tests in route.test.ts pass green | VERIFIED | `npm test src/app/api/cutoff/route.test.ts` → 5 passed (0 todo) |
| 5 | getPaidOrdersForWeek(weekOf) queries only paid orders for the specified week | VERIFIED | src/lib/admin/reminders.ts: and(eq(week_of, weekOf), eq(status, 'paid')); 4 tests pass |
| 6 | POST /api/admin/reminders returns 401 without admin session; returns { sent: N } with valid session | VERIFIED | auth() guard present in route.ts; 5 tests pass green |
| 7 | Resend batch.send is called with one email per paid order | VERIFIED | resend.batch.send() used (not emails.send loop); test "returns { sent: 2 } and calls batch.send with 2 emails" passes |
| 8 | validateEnv() throws at build time if NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY does not start with pk_live_ in production | VERIFIED | validateEnv.ts wired into next.config.ts at module top; 5 validateEnv tests pass green |
| 9 | All routes return X-Frame-Options: DENY and X-Content-Type-Options: nosniff | VERIFIED | next.config.ts headers() covers source: "/(.*)" with X-Frame-Options: DENY and X-Content-Type-Options: nosniff |
| 10 | CSP allows https://js.paystack.co in script-src and frame-src; allows https://utfs.io in img-src | VERIFIED | next.config.ts CSP: js.paystack.co appears 2 times (script-src + frame-src); utfs.io appears 2 times (img-src) |
| 11 | error.tsx and global-error.tsx exist; error.tsx has no html/body, global-error.tsx includes html and body | VERIFIED | Both files exist; error.tsx: 'use client', unstable_retry, no html tag; global-error.tsx: 'use client', html lang="en", body with inline styles |
| 12 | ReminderForm renders a date input and Send Reminders button on /admin/settings with inline feedback | VERIFIED | ReminderForm.tsx exists with type="date" input, fetch POST, aria-live result state; settings/page.tsx imports and renders ReminderForm |
| 13 | LAUNCH-CHECKLIST.md exists at project root with CRON_SECRET, pk_live_, and webhook URL registration steps | VERIFIED | File exists at project root; contains CRON_SECRET, pk_live_, webhook section |

**Score:** 8/8 must-have truths verified

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `vercel.json` | VERIFIED | Exists at project root; path=/api/cutoff, schedule=59 22 * * 4; valid JSON |
| `src/app/api/cutoff/route.ts` | VERIFIED | Exports GET; CRON_SECRET check present; is_ordering_open=false set; force-dynamic; no auth() call |
| `src/app/api/cutoff/route.test.ts` | VERIFIED | 5 real assertions (not it.todo); all 5 pass green |
| `src/lib/admin/reminders.ts` | VERIFIED (regression) | Exports getPaidOrdersForWeek; server-only; and(eq, eq) compound WHERE; 4 tests pass |
| `src/app/api/admin/reminders/route.ts` | VERIFIED (regression) | POST export; auth() guard; Zod validation; resend.batch.send; 5 tests pass |
| `src/components/admin/settings/ReminderForm.tsx` | VERIFIED (regression) | 'use client'; type="date" input; fetch to /api/admin/reminders; aria-live result |
| `src/app/admin/settings/page.tsx` | VERIFIED (regression) | ReminderForm imported and rendered below OrderingToggle; force-dynamic preserved |
| `src/lib/validateEnv.ts` | VERIFIED (regression) | Exports validateEnv(); AUTH_SECRET checked (not NEXTAUTH_SECRET); pk_live_ gated on production |
| `next.config.ts` | VERIFIED (regression) | validateEnv() at module top; headers() with X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, CSP; Paystack + UploadThing in CSP |
| `src/app/error.tsx` | VERIFIED (regression) | 'use client'; unstable_retry; no html/body tags |
| `src/app/global-error.tsx` | VERIFIED (regression) | 'use client'; unstable_retry; html lang="en" + body; inline styles |
| `LAUNCH-CHECKLIST.md` | VERIFIED (regression) | Exists at project root; 9-section runbook |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| vercel.json | /api/cutoff | Vercel Cron at 59 22 * * 4 | WIRED | schedule: "59 22 * * 4", path: "/api/cutoff" |
| src/app/api/cutoff/route.ts | ordering_config.is_ordering_open | db.update().set({ is_ordering_open: false }) | WIRED | Line 18–22: db.update(schema.ordering_config).set({ is_ordering_open: false, updated_at: new Date() }).where(eq(schema.ordering_config.id, 1)) |
| src/app/api/admin/reminders/route.ts | src/lib/admin/reminders.ts | getPaidOrdersForWeek() call | WIRED (regression) | getPaidOrdersForWeek(parsed.data.week_of) |
| src/components/admin/settings/ReminderForm.tsx | /api/admin/reminders | fetch POST in handleSubmit | WIRED (regression) | fetch("/api/admin/reminders", { method: "POST", ... }) |
| src/app/admin/settings/page.tsx | ReminderForm.tsx | ReminderForm import and render | WIRED (regression) | Import + JSX render confirmed |
| next.config.ts | src/lib/validateEnv.ts | validateEnv() call at module top | WIRED (regression) | import { validateEnv } + validateEnv() |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| cutoff route tests pass (5 tests) | npm test src/app/api/cutoff/route.test.ts | 5 passed | PASS |
| vercel.json valid JSON with correct schedule | node -e "require('./vercel.json')" | path=/api/cutoff schedule=59 22 * * 4 | PASS |
| route.ts has no auth() call | grep -c "auth()" route.ts | 0 matches | PASS |
| route.ts has CRON_SECRET, is_ordering_open=false, force-dynamic | grep checks | 1 each | PASS |
| validateEnv tests pass (5 tests) | npm test src/lib/validateEnv.test.ts | 5 passed | PASS |
| reminders lib tests pass (4 tests) | npm test src/lib/admin/reminders.test.ts | 4 passed | PASS |
| reminders route tests pass (5 tests) | npm test src/app/api/admin/reminders/route.test.ts | 5 passed | PASS |
| All phase 6 test artifacts pass (19 total) | npm test all phase 6 tests | 19 passed, 0 failing, 0 todo | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INFRA-01 | 06-02-PLAN.md | Vercel Cron Job configured in vercel.json to call GET /api/cutoff at Thu 22:59 UTC (59 22 * * 4) | SATISFIED | vercel.json exists with correct schedule; commits aba10d1 + 7c541af now on current branch |
| INFRA-02 | 06-01-PLAN.md, 06-02-PLAN.md | /api/cutoff validates CRON_SECRET header before toggling is_ordering_open | SATISFIED | route.ts checks Authorization: Bearer ${CRON_SECRET}; returns 401 immediately if missing/wrong; 5 tests pass green |
| NOTF-01 | 06-01-PLAN.md, 06-03-PLAN.md | Admin can select delivery week and trigger reminder emails to all paid orders | SATISFIED (regression) | reminders.ts + route.ts + ReminderForm all verified; 9 tests pass green |

**Orphaned requirements check:** REQUIREMENTS.md maps INFRA-01, INFRA-02, NOTF-01 to Phase 6. All three are claimed and satisfied. No orphans.

---

### Anti-Patterns Found

No anti-patterns found. All phase 6 production files are fully implemented. No it.todo() entries remain in any production code path.

---

### Human Verification Required

#### 1. Live Paystack Keys Wired

**Test:** In Vercel project settings (Production environment), confirm NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY starts with pk_live_ and PAYSTACK_SECRET_KEY starts with sk_live_
**Expected:** Both keys present with live_ prefix; validateEnv() will block any next build in production without them
**Why human:** Vercel dashboard environment variables cannot be inspected programmatically from the codebase

#### 2. Paystack Webhook URL Registered

**Test:** Log into Paystack Dashboard -> Settings -> API Keys & Webhooks and verify the webhook URL is set to https://<production-domain>/api/paystack/webhook
**Expected:** Webhook URL matches the production deployment domain; Paystack live events will route to the platform
**Why human:** External Paystack dashboard state is inaccessible programmatically; requires operator login

#### 3. Vercel Cron Job Visible and Triggerable

**Test:** After deploying to production with vercel.json in place, open Vercel Dashboard -> Project -> Cron Jobs and confirm /api/cutoff appears at schedule 59 22 * * 4. Trigger a manual run and verify the response is 200 and ordering_config.is_ordering_open is set to false in the production DB.
**Expected:** Cron job listed; manual trigger returns { ok: true }; DB row updated
**Why human:** Requires production deployment and Vercel dashboard access; Vercel Cron behavior cannot be simulated locally without a production deploy

---

### Gaps Summary

No programmatically-verifiable gaps remain. All three previously-identified gaps have been resolved by the merge of the plan 02 worktree. The three human verification items above are operator-side actions that require production access and cannot be verified from the codebase.

---

_Verified: 2026-05-04T07:40:00Z_
_Verifier: Claude (gsd-verifier)_
