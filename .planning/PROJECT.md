# Rodo & Co

## What This Is

Rodo & Co is a food prep ordering platform where customers order fresh ingredients and cooking kits, select their preferred preparation style, and receive delivery every Saturday. Built for the Nigerian market (NGN payments via Paystack), the platform enforces a weekly ordering window (Sunday–Thursday) and automates delivery-day reminders. The admin panel covers the full weekly ops workflow: orders, product management, prep list generation, delivery manifest, and bulk status transitions. Prepared by VARYN Studio.

**Current State (v1.0 shipped 2026-05-25):**
- 10 phases complete, 44 plans, 69 requirements shipped
- Stack: Next.js 15, TypeScript strict, Tailwind v4, Drizzle/Neon, NextAuth v5, UploadThing, Paystack, Resend, Vercel
- Codebase: 532 files, ~86k lines added over 44-day build

## Core Value

Customers can browse, configure, and pay for weekly food prep orders in one smooth flow — with zero friction between browsing and checkout.

## Requirements

### Validated

**Foundation** *(Validated in Phases 1, 2.1)*
- ✓ Next.js 15 App Router + TypeScript strict + Tailwind v4 + shadcn/ui + Zustand + RHF + Zod v3 + `motion` — v1.0
- ✓ Neon Postgres + Drizzle ORM + NextAuth v5 Credentials + UploadThing v7 (migrated from Supabase in Phase 2.1) — v1.0
- ✓ 11-table Drizzle schema (products, variants, prep options, orders, order items, ordering config, product images, site settings, admins, abandoned carts, activity logs) — v1.0
- ✓ ordering_config seeded + admins seeded; all env vars documented in .env.local.example — v1.0

**Customer Browse & Select** *(Validated in Phases 2, 3)*
- ✓ Landing page hero + How It Works section, shop product grid with cutoff banner — v1.0
- ✓ Product drawer (parallel route @drawer) — quantity, size variants, prep options, live price recalc — v1.0
- ✓ Zustand cart with localStorage persistence, SSR hydration guard, cart sidebar — v1.0
- ✓ Cutoff enforcement: disabled add-to-cart when closed — v1.0

**Checkout & Payment** *(Validated in Phase 5)*
- ✓ No-account checkout form (name, phone, email, address, allergy notes, terms) — v1.0
- ✓ Paystack inline popup, HMAC-verified webhook, idempotency via orders.reference UNIQUE constraint — v1.0
- ✓ Order confirmation page at /order/[ref] with itemised summary — v1.0
- ✓ Resend: customer confirmation email + admin new-order alert on every successful payment — v1.0

**Admin Panel** *(Validated in Phases 4, 8)*
- ✓ NextAuth v5 Credentials login, server-side route guard on all /admin/* routes — v1.0
- ✓ Orders table: filterable, expandable rows, status transitions, CSV export — v1.0
- ✓ Product CRUD with UploadThing images, size variants, prep options, is_active toggle — v1.0
- ✓ Analytics dashboard: weekly counts, revenue, top 5 products, status breakdown, week picker — v1.0
- ✓ Weekly prep/packing list aggregated from paid+processing orders — v1.0
- ✓ Delivery manifest: printable, sortable by name/address — v1.0
- ✓ Customer search across name/phone/email — v1.0
- ✓ Pending orders view with count badge + delete — v1.0
- ✓ Bulk status transitions (paid→processing, processing→delivered) per delivery week — v1.0
- ✓ Settings: next_delivery_date + cutoff_message editable with immediate banner reflection — v1.0
- ✓ Activity log: admin actions recorded and viewable — v1.0

**Automation & Infrastructure** *(Validated in Phases 6, 9)*
- ✓ Vercel Cron cutoff (Thu 22:59 UTC), CRON_SECRET validated — v1.0
- ✓ Admin-triggered delivery reminder emails — v1.0
- ✓ validateEnv startup assertion, security headers, error boundaries — v1.0
- ✓ Tag-based revalidateTag cache invalidation — shop pages reflect admin mutations on next request — v1.0

**Route Completeness** *(Validated in Phase 7)*
- ✓ Global 404, Privacy, Terms, Cookie Policy, Plans pages — all HTTP 200, on-brand design — v1.0
- ✓ Footer dead-link cleanup; Navbar Plans link fixed — v1.0

### Active

*(Start fresh with /gsd:new-milestone — define v1.1 requirements)*

Known candidates from deferred items and audit warnings:
- [ ] Fix CONF-02: order confirmation "not-paid" variant never used (W-02 from audit)
- [ ] ReminderForm client-side Saturday validation hint (W-03 from audit)
- [ ] Legal page copy — replace PLACEHOLDERs when client delivers copy
- [ ] types/index.ts cleanup — align Supabase-era types with Drizzle schema
- [ ] Nyquist VALIDATION.md sign-off for phases 1, 2.1, 3, 4, 5, 6, 7, 8

### Out of Scope

- User accounts for customers — no-account checkout is the explicit design decision
- Real-time inventory tracking — product availability managed by admin via is_active flag
- Multi-currency / non-NGN payments — Paystack NGN only at MVP
- Mobile app — web-first, mobile-responsive
- Advanced analytics / third-party BI — MVP analytics pulled from DB directly
- Coupon / discount codes — out of brief scope
- Subscription / recurring orders — one-off weekly orders only

## Context

- **Stack (v1.0):** Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, shadcn/ui, Zustand, React Hook Form + Zod v3, `motion` (framer-motion rebranded), Drizzle ORM + Neon serverless Postgres, NextAuth v5 Credentials, UploadThing v7, Paystack inline + webhooks, Resend, Vercel (Cron + deployment)
- **Payment market:** Nigerian market. Prices stored in kobo (integer). Display divides by 100.
- **Delivery schedule:** Orders open Sunday, close Thursday midnight WAT (Vercel Cron), processing Friday, delivery Saturday.
- **Client assets pending:** Legal page copy (Privacy, Terms, Cookie Policy) marked PLACEHOLDER — client deliverable outstanding. Product photography and copy used placeholders during build.
- **Pre-existing TSC errors at v1.0 close:** 4 test files (Footer.test.tsx, analytics.test.ts, pendingOrders.test.ts, products.test.ts) — not Phase 9 regressions.

## Constraints

- **Tech Stack:** Next.js 15 (App Router), TypeScript strict, Tailwind CSS v4, shadcn/ui, Zustand, React Hook Form + Zod v3, Drizzle/Neon, NextAuth v5, UploadThing, Paystack, Resend, Vercel
- **Payments:** Paystack only. Webhook HMAC verification required. No live keys in repo.
- **Email:** Resend for all transactional email
- **Deployment:** Vercel. Vercel Cron for Thursday cutoff (`59 22 * * 4`)
- **Security:** `PAYSTACK_SECRET_KEY` and `AUTH_SECRET` server-only. Never exposed to browser.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Prices stored as integer kobo | Avoids floating point precision bugs in financial calculations | ✓ Good |
| No customer accounts | Reduces friction; customers checkout as guests | ✓ Good |
| `ordering_config` single-row table as master switch | Simple, single source of truth for cutoff state | ✓ Good |
| Product drawer as parallel route (`@drawer`) | No full page reload when opening product; URL-addressable | ✓ Good |
| Vercel Cron for cutoff (not Supabase Edge Function) | Simpler ops; Vercel manages the scheduler | ✓ Good |
| Next.js 15 (already installed) vs spec-stated 14 | Scaffold already on 15; App Router is identical, no regression | ✓ Good |
| NextAuth v5 Credentials over Supabase Auth | Neon migration removed Supabase; lighter server-only JWT sessions | ✓ Good |
| UploadThing over Supabase Storage | Typed auth-gated endpoint, simpler than Supabase Storage | ✓ Good |
| Neon Postgres + Drizzle over Supabase PostgreSQL | Full ORM control, schema-as-code, no RLS complexity | ✓ Good |
| Zod pinned to v3 | v4 breaks `@hookform/resolvers` v3 as of April 2026 | ✓ Good |
| `motion` package (not `framer-motion`) | Package was rebranded; all imports must be `"motion/react"` | ✓ Good |
| Webhook reads `req.text()` before JSON parsing | Body stream is one-time-read; JSON first silently breaks HMAC | ✓ Good |
| Tag-based revalidateTag over ISR TTLs | Instant shop refresh after admin mutations, no bounded stale window | ✓ Good (Phase 9) |
| `@drawer/default.tsx` in same commit as slot folder | Missing it causes hard-refresh 404s painful to retrofit | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-25 after v1.0 milestone*
