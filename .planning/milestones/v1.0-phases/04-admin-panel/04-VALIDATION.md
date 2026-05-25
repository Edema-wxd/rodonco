---
phase: 4
slug: admin-panel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.0 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 02 | 1 | AUTH-01 | — | Login form calls signIn from next-auth/react (not @/auth) | unit | `npm run test -- src/components/admin` | Planned (W1) | ⬜ pending |
| 4-01-02 | 01 | 1 | AUTH-02 | T-4-01 | Unauthenticated admin route → redirect to /admin login | manual | manual browser test | N/A | ⬜ pending |
| 4-01-03 | 01 | 1 | AUTH-03 | T-4-01 | Session persists across browser refresh | manual | manual browser test | N/A | ⬜ pending |
| 4-02-01 | 03 | 1 | ORD-01 | — | Orders table renders all required columns | unit | `npm run test -- src/components/admin/orders` | Planned (W1) | ⬜ pending |
| 4-02-02 | 03 | 1 | ORD-02 | — | Row expands inline on click showing prep details | unit | `npm run test -- src/components/admin/orders` | Planned (W1) | ⬜ pending |
| 4-02-03 | 03 | 1 | ORD-03 | — | Filter by status and delivery week updates rows | unit | `npm run test -- src/components/admin/orders` | Planned (W1) | ⬜ pending |
| 4-02-04 | 03 | 1 | ORD-04 | — | CSV export generates correct content from current filter | unit | `npm run test -- src/components/admin/orders` | Planned (W1) | ⬜ pending |
| 4-02-05 | 03 | 1 | ORD-05 | T-4-02 | Status PATCH validates z.enum(["paid","processing","delivered"]) | unit | `npm run test -- src/components/admin/orders` | Planned (W1) | ⬜ pending |
| 4-03-01 | 04 | 1 | PROD-01 | T-4-03 | Product form validates required fields via Zod | unit | `npm run test -- src/components/admin/products` | Planned (W1) | ⬜ pending |
| 4-03-02 | 04 | 1 | PROD-02 | T-4-04 | UploadButton renders in drawer; unauthorized upload blocked by auth() in core.ts | unit (render) | `npm run test -- src/components/admin/products` | Planned (W1) | ⬜ pending |
| 4-03-03 | 04 | 1 | PROD-03 | — | useFieldArray appends/removes variant rows correctly | unit | `npm run test -- src/components/admin/products` | Planned (W1) | ⬜ pending |
| 4-03-04 | 04 | 1 | PROD-04 | — | useFieldArray appends/removes prep option rows correctly | unit | `npm run test -- src/components/admin/products` | Planned (W1) | ⬜ pending |
| 4-03-05 | 04 | 1 | PROD-05 | T-4-03 | is_active switch included in form submit; only whitelisted fields sent | unit | `npm run test -- src/components/admin/products` | Planned (W1) | ⬜ pending |
| 4-04-01 | 05 | 1 | ANLT-01 | — | Total orders stat card renders weekly count | unit (render) | `npm run test -- src/components/admin/analytics` | Planned (W1) | ⬜ pending |
| 4-04-02 | 05 | 1 | ANLT-02 | — | Revenue formatted as NGN (Number() conversion from Drizzle sum string) | unit | `npm run test -- src/components/admin/analytics` | Planned (W1) | ⬜ pending |
| 4-04-03 | 05 | 1 | ANLT-03 | — | Top 5 products list renders correctly | unit (render) | `npm run test -- src/components/admin/analytics` | Planned (W1) | ⬜ pending |
| 4-04-04 | 05 | 1 | ANLT-04 | — | Status breakdown counts render per status | unit (render) | `npm run test -- src/components/admin/analytics` | Planned (W1) | ⬜ pending |
| 4-05-01 | 06 | 1 | INFRA-03 | T-4-05 | Toggle sends PATCH to /api/admin/config with auth session | unit (mock fetch) | `npm run test -- src/components/admin/settings` | Planned (W1) | ⬜ pending |
| 4-05-02 | 05 | 3 | INFRA-04 | — | ordering_config read has no caching (no-store / revalidate:0) | manual | manual — change DB value, verify page reflects immediately | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/admin/week.ts` + `src/lib/admin/week.test.ts` — currentWeekOf() is stable and tested (D-19)
- [ ] `src/lib/admin/format.ts` + `src/lib/admin/format.test.ts` — formatNgn() stable and tested (ANLT-02)
- [ ] `src/lib/admin/schemas.ts` + `src/lib/admin/schemas.test.ts` — `.strict()` payload validation ready for Route Handlers (ORD-05, PROD-01..05, INFRA-03)
- [ ] `src/lib/admin/csv.ts` + `src/lib/admin/csv.test.ts` — CSV export contract locked (ORD-04)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Unauthenticated `/admin/*` redirect | AUTH-02 | Requires live browser session state | Visit `/admin/orders` logged out → verify redirect to `/admin` |
| Session persistence across refresh | AUTH-03 | Requires browser storage inspection | Log in, hard-refresh, verify admin route loads without re-login |
| No ordering_config caching | INFRA-04 | Requires live DB mutation + render check | Toggle ordering open in DB directly, reload settings page, verify UI reflects change |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
