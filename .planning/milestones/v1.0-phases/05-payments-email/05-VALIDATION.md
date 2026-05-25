---
phase: 05
slug: payments-email
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-02
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.x |
| **Config file** | `vitest.config` / project defaults (already used in repo) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | CHKT-02 | T-05-W01 | Zod rejects invalid Nigerian phone payload | unit | `npm run test` | ⬜ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | CHKT-04 | T-05-03 | Init route rejects closed ordering window + empty cart server-side | unit / integration stub | `npm run test` | ⬜ W0 | ⬜ pending |
| 05-04-01 | 04 | 3 | CHKT-06 | T-05-04 | Webhook rejects bad HMAC without parsing first | unit | `npm run test` | ⬜ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Checkout form + Pay Now client tests (mock `/api/orders/init` response shapes)
- [ ] Webhook verification unit tests (HMAC vectors)
- Existing Vitest/JSDOM already installed (`package.json`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|---------------------|
| Paystack test payment | CHKT-05 | Requires Paystack sandbox + browser popup | Checkout with test card; confirm `paid` row + webhook |
| Resend deliverability | NOTF-02/03 | Real DNS + inbox | Confirm customer + admin receive HTML |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (`test:watch` not used for gates)
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter once Wave 0 is green after execution

**Approval:** pending
