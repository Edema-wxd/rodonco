---
phase: 07-missing-pages-route-completeness
plan: "02"
subsystem: frontend-static
tags: [privacy, terms, legal-pages, static-pages, route-completeness, footer-links]
dependency_graph:
  requires:
    - 07-01 (Footer.tsx with Legal column links to /privacy and /terms)
  provides:
    - src/app/(customer)/privacy/page.tsx
    - src/app/(customer)/terms/page.tsx
  affects:
    - Footer Legal column links (/privacy, /terms) now resolve to on-brand pages
    - Both routes return 200 instead of triggering not-found.tsx
tech_stack:
  added: []
  patterns:
    - Static server component inside (customer) route group (Navbar + Footer auto-inherited)
    - Metadata export pattern for Next.js App Router SEO titles
    - Asymmetric card corners: rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px]
    - Design system: bg-stone-100 root, Quicksand H1, Lexend labels/links, Inter body
key_files:
  created:
    - src/app/(customer)/privacy/page.tsx
    - src/app/(customer)/terms/page.tsx
  modified: []
decisions:
  - "Server components only — no 'use client' directive; pages are static HTML with no interactivity"
  - "No Navbar/Footer import in either page — (customer)/layout.tsx auto-injects both"
  - "Placeholder legal copy marked clearly as client deliverable via JSX comments"
  - "Cookie Policy link in Privacy page points to /cookie-policy — that route will need its own plan if activated"
metrics:
  duration: "4 minutes"
  completed: "2026-05-07T00:00:00Z"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 7 Plan 02: Privacy Policy and Terms of Service Pages Summary

**One-liner:** Two static server-component legal pages at /privacy and /terms, inheriting (customer) layout, using Quicksand H1/Lexend labels/Inter body per design system, with placeholder copy marked as client deliverables.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Privacy Policy page at /privacy | 8db06fb | src/app/(customer)/privacy/page.tsx |
| 2 | Terms of Service page at /terms | bb95110 | src/app/(customer)/terms/page.tsx |

## What Was Built

### src/app/(customer)/privacy/page.tsx
Static server component at `/privacy`. Inherits Navbar and Footer from `(customer)/layout.tsx` — no manual imports needed. Exports `metadata` with title "Privacy Policy | Rodo & Co". Structure: hero section with back-link, section label ("Legal"), Quicksand H1 ("Privacy Policy"), Inter intro paragraph, then a 2-column card grid with four sections: Information We Collect, How We Use Your Data, Your Rights, Cookies. Footer CTA links back to `/`. All legal copy is placeholder text marked with `{/* PLACEHOLDER — client to supply */}` comments.

### src/app/(customer)/terms/page.tsx
Static server component at `/terms`. Structurally identical to privacy/page.tsx. Exports `metadata` with title "Terms of Service | Rodo & Co". H1 "Terms of Service". Four card sections: Orders & Payments, Cancellations & Refunds, Delivery, Contact. Placeholder legal copy marked as client deliverable.

### Design System Compliance (both pages)
- Root wrapper: `bg-stone-100`
- H1: `font-black leading-[1.05] text-zinc-800` + `style={{ fontFamily: "var(--font-quicksand)" }}`
- Section label: `text-xs font-black uppercase tracking-wider text-red-600` + Lexend
- Back link: `text-sm font-black uppercase tracking-wider text-red-700` + Lexend
- Body copy: `text-base leading-7 text-stone-600` + Inter
- Cards: `rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60`

## Verification Results

```
# File existence
test -f src/app/(customer)/privacy/page.tsx   → PASS
test -f src/app/(customer)/terms/page.tsx     → PASS

# No client directive
grep -c '"use client"' privacy/page.tsx       → 0
grep -c '"use client"' terms/page.tsx         → 0

# No manual Navbar/Footer imports
grep -c 'import.*Navbar' privacy/page.tsx     → 0
grep -c 'import.*Footer' privacy/page.tsx     → 0
grep -c 'import.*Navbar' terms/page.tsx       → 0
grep -c 'import.*Footer' terms/page.tsx       → 0

# Design system
grep -c 'bg-stone-100' privacy/page.tsx       → 3
grep -c 'bg-stone-100' terms/page.tsx         → 3
grep -c 'var(--font-quicksand)' privacy       → 1
grep -c 'var(--font-quicksand)' terms         → 1
grep -c 'outline-stone-200/60' privacy        → 4
grep -c 'outline-stone-200/60' terms          → 4

# Metadata titles
grep -c 'Privacy Policy | Rodo' privacy       → 1
grep -c 'Terms of Service | Rodo' terms       → 1

# TypeScript
npx tsc --noEmit                              → exit 0
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

Legal copy in both pages is intentional placeholder text (marked with JSX comments). This is the expected state — legal copy is a client deliverable, not a code deliverable. The structural layout is complete and on-brand; copy replacement requires no code changes.

One link in privacy/page.tsx points to `/cookie-policy` — that route does not yet exist and would trigger not-found.tsx if clicked. It is a forward-reference placeholder, consistent with the plan's scope boundary.

## Threat Flags

No new security-relevant surface introduced. Both pages are static public server components with no DB queries, no user input, and no internal path exposure. Placeholder copy does not reveal system internals. Existing CSP headers in next.config.ts apply automatically.

## Self-Check: PASSED

- src/app/(customer)/privacy/page.tsx exists: FOUND
- src/app/(customer)/terms/page.tsx exists: FOUND
- Commit 8db06fb exists: FOUND
- Commit bb95110 exists: FOUND
- npx tsc --noEmit: exit 0
