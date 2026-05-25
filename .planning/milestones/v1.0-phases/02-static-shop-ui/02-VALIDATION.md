---
phase: 02
slug: static-shop-ui
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-30
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (jsdom) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10–60 seconds (varies) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SHOP-01 | — | N/A | unit/e2e-lite | `npm test` | ✅ | ⬜ pending |
| 02-02-01 | 02 | 1 | SHOP-02/SHOP-03/SHOP-04 | — | N/A | unit/e2e-lite | `npm test` | ✅ | ⬜ pending |
| 02-03-01 | 03 | 2 | CART-04 | — | N/A | unit | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Landing page + shop page visuals match UI-SPEC and CONTEXT decisions | SHOP-01/02/04 | Visual/layout validation is subjective | Run `npm run dev`, open `/` and `/shop`, verify sections, spacing, and card layout. |
| Banner/ordering open state behavior in UI | SHOP-03 | Depends on live DB config | Toggle `ordering_config.is_ordering_open` and refresh `/shop` to confirm banner behavior. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify instructions
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

