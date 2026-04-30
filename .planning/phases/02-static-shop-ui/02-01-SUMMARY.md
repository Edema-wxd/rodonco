---
phase: 02
plan: 01
slug: static-shop-ui
status: complete
completed_at: 2026-04-30
subsystem: customer-landing
requirements:
  - SHOP-01
commits:
  - 0143463
  - 96e4c05
key_files:
  - src/app/(customer)/page.tsx
  - src/components/landing/HowItWorks.tsx
---

# Phase 02 Plan 01: Landing page hero + How It Works — Summary

Implemented the Phase 2 landing page UI contract for SHOP-01 as a fully server-rendered `/` route: hero headline/subheadline with a single green CTA link to `/shop`, followed by a visually distinct “How It Works” 3-step section.

## What Shipped

- **Hero (locked decisions D-01..D-03)**: White/light hero with headline, subheadline, and a single CTA.
- **CTA styling**: Uses shadcn `buttonVariants` for sizing/shape and applies the placeholder brand green `#16a34a` with a darker hover `#15803d`.
- **How It Works (locked decisions D-04..D-06)**: Server component with 3 steps (Browse → Customise → Deliver), each with a Lucide icon marked decorative (`aria-hidden="true"`), label, and description; rendered below hero on `/` with `bg-secondary`.

## Verification

- **Automated**: `npm test` (green after each task commit)
- **Manual smoke**: `npm run dev` → open `/` and confirm hero + How It Works render with JS disabled (per plan verification notes)

## Deviations from Plan

None — executed as written.

## Known Stubs

None for this plan (landing content is intentionally static placeholder copy per UI-SPEC).

## Self-Check: PASSED

- Summary file exists: `.planning/phases/02-static-shop-ui/02-01-SUMMARY.md`
- Commits exist: `0143463`, `96e4c05`

