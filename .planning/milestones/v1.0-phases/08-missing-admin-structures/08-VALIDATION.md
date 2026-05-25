---
phase: 8
slug: missing-admin-structures
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x with jsdom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 8-??-01 | prep-list | 1 | OPS-01 | — | N/A | Unit (mock DB) | `npx vitest run src/lib/admin/prepList.test.ts` | ❌ W0 | ⬜ pending |
| 8-??-02 | analytics | 1 | OPS-02 | — | N/A | Unit (mock DB) | `npx vitest run src/lib/admin/analytics.test.ts` | ❌ W0 | ⬜ pending |
| 8-??-03 | orders-search | 1 | OPS-03 | — | N/A | Unit (RTL) | `npx vitest run src/components/admin/orders/OrdersTable.test.tsx` | ✅ | ⬜ pending |
| 8-??-04 | manifest | 1 | OPS-04 | — | N/A | Unit (mock DB) | `npx vitest run src/lib/admin/manifest.test.ts` | ❌ W0 | ⬜ pending |
| 8-??-05 | settings | 1 | OPS-05 | — | N/A | Unit | `npx vitest run src/lib/admin/schemas.test.ts` | ✅ | ⬜ pending |
| 8-??-06 | pending-orders | 1 | OPS-06 | — | N/A | Unit (mock DB) | `npx vitest run src/lib/admin/pendingOrders.test.ts` | ❌ W0 | ⬜ pending |
| 8-??-07 | bulk-transition | 2 | OPS-07 | — | N/A | Unit (mock DB) | `npx vitest run src/lib/admin/bulkTransition.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/admin/prepList.test.ts` — stubs for OPS-01 aggregate query
- [ ] `src/lib/admin/manifest.test.ts` — stubs for OPS-04 manifest query
- [ ] `src/lib/admin/pendingOrders.test.ts` — stubs for OPS-06 pending filter
- [ ] `src/lib/admin/bulkTransition.test.ts` — stubs for OPS-07 bulk update
- [ ] `src/lib/admin/analytics.test.ts` — stubs for OPS-02 `weekOverride` parameter (may not exist yet)

Extend existing:
- [ ] `src/lib/admin/schemas.test.ts` — add OPS-05 `next_delivery_date`/`cutoff_message` fields and OPS-07 transition validation
- [ ] `src/components/admin/orders/OrdersTable.test.tsx` — add OPS-03 search field assertions

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Prep list page renders table with correct row count | OPS-01 | RSC page, hard to unit test | Navigate to /admin/prep-list, select a delivery week, verify aggregate rows |
| Analytics week picker updates displayed week | OPS-02 | Client-side navigation | Click week picker, select a past week, verify revenue/order counts change |
| Delivery manifest is printable without sidebar | OPS-04 | CSS print media query | Click Print button in manifest page, verify sidebar hidden in print preview |
| Pending orders view shows count badge in sidebar | OPS-06 | Visual integration | Navigate to /admin, verify pending count badge appears in AdminSidebar |
| Bulk transition confirms and shows count of updated orders | OPS-07 | UX flow | Select week, click bulk transition, verify toast with count |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
