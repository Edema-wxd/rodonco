---
phase: 7
slug: missing-pages-route-completeness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x + jsdom + @testing-library/react |
| **Config file** | `vitest.config.ts` (root — already exists) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx vitest run && npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx vitest run && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green + manual route check in dev server
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 0 | R6 | — | No dead hrefs in Footer | unit | `npx vitest run src/components/landing/Footer.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 7-01-02 | 01 | 0 | R1 | — | not-found.tsx renders Navbar + Footer | smoke | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-01-03 | 01 | 0 | R1 | — | not-found.tsx at root (not inside (customer)) | smoke | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-02-01 | 02 | 1 | R2 | — | Privacy page file exists and compiles | smoke | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-02-02 | 02 | 1 | R3 | — | Terms page file exists and compiles | smoke | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-03-01 | 03 | 1 | R4 | — | Cookie Policy page exists and compiles | smoke | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-03-02 | 03 | 1 | R5 | — | Plans page exists and compiles | smoke | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-03-03 | 03 | 1 | R5 | — | Navbar Plans href is `/plans` not `/shop` | unit | `npx vitest run src/components/layout/Navbar.test.tsx` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/landing/Footer.test.tsx` — renders Footer, asserts `/sustainability`, `/sourcing`, `/chef-partners`, `/careers`, `/press` hrefs are NOT present (R6)
- [ ] No framework setup gaps — vitest.config.ts, setup.ts, and @testing-library/react are all installed

*Existing infrastructure covers all phase requirements — no new framework setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Any unmatched URL renders custom 404 (not Next.js default white screen) | R1 | Requires running dev server | `npm run dev`, navigate to `/foo/bar`, confirm custom 404 renders with Navbar + Footer |
| All 5 new pages return HTTP 200 | R1–R5 | Requires running dev server | `npm run dev`, visit `/privacy`, `/terms`, `/cookie-policy`, `/plans` — confirm 200 + Navbar visible |
| Footer has no broken links | R6 | Visual confirmation | `npm run dev`, open Footer, click each link — Wall of Love, Privacy, Terms, Cookie Policy should all work |
| All pages visually match design system | R1–R5 | Visual inspection | bg-stone-100, Quicksand H1, Lexend labels, Inter body, asymmetric card corners |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
