---
phase: 03-interactive-shop
date: 2026-04-29
status: draft
---

# Phase 03: Interactive Shop — Validation Strategy

This phase is heavy on **UI routing + state** (parallel routes drawer, cart sidebar, ordering window enforcement). Validation is split into:

- **Automated checks (required in every plan)**: `npx tsc --noEmit`, `npm run build`
- **Targeted automated tests (Wave 1)**: Vitest unit tests for cart store key semantics
- **Manual smoke (required)**: browser checks for drawer refresh/back behavior and closed-window enforcement

## Automated Checks (global)

Run for every plan before completion:

- `npx tsc --noEmit`
- `npm run build`

## Per-Plan Validation Map

| Plan | What it validates | Automated | Manual |
|------|-------------------|-----------|--------|
| **03-01** Cart key correctness + tests | Cart merge/remove/update keys respect `(productId, variantLabel, prepOption)` | `npm test` (Vitest) + `npx tsc --noEmit` | — |
| **03-02** Ordering config loader + checkout block | Ordering closed blocks `/checkout` and banner wiring compiles | `npx tsc --noEmit` + `npm run build` | Toggle ordering closed (DB), verify checkout shows blocked state |
| **03-03** Cart sidebar UX | Sidebar opens on first add only; merge/edit/remove works; view-only when closed | `npx tsc --noEmit` + `npm run build` | Add an item → sidebar auto-opens once; subsequent adds do not auto-open; closed state disables qty edits |
| **03-04** Shop grid + deep-link + refresh fallback | `/shop/{id}` renders drawer overlay with grid behind on refresh | `npx tsc --noEmit` + `npm run build` | Navigate `/shop` → click product → `/shop/{id}`; refresh `/shop/{id}` keeps grid behind |
| **03-05** Drawer UX + pricing + add-to-cart | Motion drawer, no defaults, subtotal-only, warning >20, add-to-cart closes and triggers first-add auto-open, closed state tooltip | `npx tsc --noEmit` + `npm run build` | In drawer: ensure selection required; subtotal updates; qty warning after 20; add closes drawer; closed window disables CTA + shows tooltip |

## Required Manual Smoke Checklist (phase-level)

1. **Deep-link overlay**: open `/shop/{id}` directly and confirm grid appears behind drawer; refresh preserves it.
2. **Close controls**: backdrop + X + swipe-down close; back button closes to `/shop` preserving scroll.
3. **No defaults**: options exist → Add disabled until explicit selection.
4. **Ordering closed enforcement**: Add disabled everywhere; cart qty edits disabled; checkout blocked; sticky banner visible on shop+drawer+cart.

