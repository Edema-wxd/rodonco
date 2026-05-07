---
phase: 07-missing-pages-route-completeness
plan: "01"
subsystem: frontend-static
tags: [404-page, footer, tdd, dead-links, route-completeness]
dependency_graph:
  requires: []
  provides:
    - src/app/not-found.tsx
    - src/components/landing/Footer.tsx (cleaned)
    - src/components/landing/Footer.test.tsx
  affects:
    - All unmatched URLs now render branded 404 page
    - Footer no longer links to 5 non-existent pages
tech_stack:
  added: []
  patterns:
    - Root-level not-found.tsx with manual Navbar/Footer import (no (customer) layout inheritance)
    - TDD RED/GREEN cycle for Footer dead-link removal
    - next/image mock pattern in Vitest tests (vi.mock with img passthrough)
key_files:
  created:
    - src/app/not-found.tsx
    - src/components/landing/Footer.test.tsx
  modified:
    - src/components/landing/Footer.tsx
decisions:
  - "not-found.tsx placed at root app level — catches ALL unmatched routes including /admin/*, not just (customer)/ routes"
  - "CartSidebar excluded from 404 page — avoids DB query (orderingConfig) on every 404 hit"
  - "Footer.tsx staged from main working tree as baseline then edited — file existed only as untracked work in main repo"
metrics:
  duration: "3 minutes"
  completed: "2026-05-07T06:43:13Z"
  tasks_completed: 3
  files_created: 2
  files_modified: 1
---

# Phase 7 Plan 01: Custom 404 Page + Footer Dead-Link Cleanup Summary

**One-liner:** Root-level branded 404 page with Navbar/Footer manually imported; Footer footerLinks trimmed from 3 columns to 2 by removing all 5 dead hrefs (/sustainability, /sourcing, /chef-partners, /careers, /press).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Footer.test.tsx — dead-link assertions (TDD RED) | 875206f | src/components/landing/Footer.test.tsx, src/components/landing/Footer.tsx (baseline) |
| 2 | Footer.tsx — remove 5 dead links + fix grid | 0e55433 | src/components/landing/Footer.tsx |
| 3 | not-found.tsx — root-level custom 404 page | f041c60 | src/app/not-found.tsx |

## What Was Built

### src/app/not-found.tsx
Root-level custom 404 page. Manually imports `Navbar` (client component) and `Footer` (server component) since `not-found.tsx` is outside the `(customer)` route group and does not inherit `(customer)/layout.tsx`. Uses the design system: `bg-stone-100` main section, Quicksand H1 ("Nothing here yet."), Lexend section label ("404 — Page not found") and CTA text, Inter body copy. Red pill CTA links to `/`. No `"use client"` directive. No CartSidebar import (prevents DB query on every 404 hit).

### src/components/landing/Footer.tsx (edited)
Removed entire "Our Mission" column (Sustainability, Sourcing, Chef Partners — all 3 dead routes). Removed Careers and Press from "Company" column. Result: 2 link columns — "Company" (Wall of Love only) and "Legal" (Privacy, Terms, Cookie Policy). Updated grid wrapper from `sm:grid-cols-4` to `sm:grid-cols-3` to match the reduced column count.

### src/components/landing/Footer.test.tsx
Vitest unit test using `@testing-library/react`. Mocks `next/image` with a plain `<img>` passthrough. Two test cases: (1) "does not render dead links" — asserts 5 hrefs absent from rendered Footer DOM; (2) "renders live links" — asserts 4 live hrefs present. Both tests GREEN after Task 2 edit.

## Verification Results

```
Footer.test.tsx:
  ✓ does not render dead links
  ✓ renders live links
  2 passed

tsc --noEmit: exit 0
```

### Acceptance Criteria

| Check | Result |
|-------|--------|
| href="/sustainability" in Footer.tsx | 0 |
| href="/sourcing" in Footer.tsx | 0 |
| href="/chef-partners" in Footer.tsx | 0 |
| href="/careers" in Footer.tsx | 0 |
| href="/press" in Footer.tsx | 0 |
| sm:grid-cols-3 in Footer.tsx | 1 |
| sm:grid-cols-4 in Footer.tsx | 0 |
| import { Navbar } in not-found.tsx | 1 |
| import { Footer } in not-found.tsx | 1 |
| "use client" in not-found.tsx | 0 |
| CartSidebar in not-found.tsx | 0 |
| bg-stone-100 in not-found.tsx | 1 |
| var(--font-quicksand) in not-found.tsx | 1 |
| var(--font-lexend) in not-found.tsx | 2 |
| var(--font-inter) in not-found.tsx | 1 |
| Vitest Footer test suite | 2/2 GREEN |
| tsc --noEmit | exit 0 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] Footer.tsx not present in worktree git history**
- **Found during:** Task 1 setup
- **Issue:** Footer.tsx was untracked in the main working tree only — not committed to the `mvp` branch. The worktree was reset to commit `2cb3e86` which predates Footer.tsx creation. The file was absent from the worktree filesystem.
- **Fix:** Copied `src/components/landing/Footer.tsx` from the main repo's working tree into the worktree filesystem as the baseline, then staged it in Task 1's commit alongside the test file.
- **Files modified:** src/components/landing/Footer.tsx (created as baseline)
- **Commit:** 875206f (staged as new file alongside Footer.test.tsx)

## Known Stubs

None — not-found.tsx renders static content only ("Nothing here yet." / "Back to home"). Footer cleanup removes stubs (dead links) rather than introducing them.

## Threat Flags

No new security-relevant surface introduced. Both files are static public content. Existing CSP headers in next.config.ts apply automatically. 404 page intentionally has no DB queries or user input.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (test commit) | 875206f | PASS — "does not render dead links" failed as expected |
| GREEN (feat commit) | 0e55433 | PASS — both tests pass after Footer.tsx edit |
| REFACTOR | N/A | No refactor needed |

## Self-Check: PASSED

- src/app/not-found.tsx exists: FOUND
- src/components/landing/Footer.tsx exists: FOUND
- src/components/landing/Footer.test.tsx exists: FOUND
- Commit 875206f exists: FOUND
- Commit 0e55433 exists: FOUND
- Commit f041c60 exists: FOUND
