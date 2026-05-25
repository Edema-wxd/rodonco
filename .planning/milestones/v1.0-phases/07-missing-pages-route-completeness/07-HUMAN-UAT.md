---
status: partial
phase: 07-missing-pages-route-completeness
source: [07-VERIFICATION.md]
started: 2026-05-07T08:10:00.000Z
updated: 2026-05-07T08:10:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. All new pages return HTTP 200
expected: Start dev server (`npm run dev`). Navigate to `/privacy`, `/terms`, `/cookie-policy`, `/plans` — each page loads with Navbar and Footer visible, not a 404 or Next.js error screen.
result: [pending]

### 2. Custom 404 page renders
expected: Navigate to `/foo/bar` (any unmatched URL). The custom "Nothing here yet." page renders with Navbar at top and Footer at bottom — not the Next.js default white screen with no navigation.
result: [pending]

### 3. Visual design system matches homepage
expected: All 5 new pages (404 + 4 above) use stone-100 background, Quicksand H1, asymmetric card corners (`rounded-tl-[48px] rounded-br-[48px]`), red-600 CTAs, and correct font sizing matching the homepage.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
