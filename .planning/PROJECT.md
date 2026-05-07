# Rodo & Co

## What This Is

Rodo & Co is a food prep ordering platform where customers order fresh ingredients and cooking kits, select their preferred preparation style, and receive delivery every Saturday. Built for the Nigerian market (NGN payments via Paystack), the platform enforces a weekly ordering window (Sunday–Thursday) and automates delivery-day reminders. Prepared by VARYN Studio for the client.

## Core Value

Customers can browse, configure, and pay for weekly food prep orders in one smooth flow — with zero friction between browsing and checkout.

## Requirements

### Validated

**Route Completeness** *(Validated in Phase 7: Missing Pages + Route Completeness)*
- [x] Global 404 page — root-level `not-found.tsx` with Navbar + Footer, no CartSidebar (avoids DB query on dead-end routes)
- [x] Legal pages — `/privacy`, `/terms`, `/cookie-policy` as static server components inside `(customer)` layout, placeholder copy marked for client review
- [x] Plans page — `/plans` marketing page with weekly ordering model overview and placeholder pricing
- [x] Footer dead-link cleanup — 5 dead hrefs removed, "Our Mission" column dropped, grid updated to `sm:grid-cols-3`
- [x] Navbar Plans fix — Plans href corrected from `/shop` to `/plans`

**Admin Panel** *(Validated in Phase 4: Admin Panel)*
- [x] Admin auth — NextAuth v5 Credentials login backed by `admins` table, server-side route guard via `src/middleware.ts`
- [x] Orders view — filterable table, expandable rows with prep instructions, status updates, CSV export
- [x] Product management — CRUD products, variants, prep options, image upload via UploadThing (`productImage` endpoint), URL stored in `products.image_url`
- [x] Analytics dashboard — orders count, revenue, top 5 products, status breakdown (sourced from Drizzle aggregate queries)

### Active

**Customer Experience**
- [ ] Landing page — hero, how it works, CTA
- [ ] Shop page — fresh produce + cooking kit product grid with cutoff banner
- [ ] Product selection drawer — quantity, size (kits), prep options, live price recalc
- [ ] Cart system — Zustand state, localStorage persistence, add/remove/edit
- [ ] Checkout form — name, phone (NG), email, address, allergy notes, terms checkbox
- [ ] Cutoff enforcement — disabled add-to-cart when closed; blocked checkout page when closed
- [ ] Paystack payment — inline popup, webhook handler, order creation on confirmation
- [ ] Order confirmation page — fetched by Paystack reference after payment

**Admin Panel**
- [ ] Delivery reminders — admin triggers email reminders to all paid orders for a given week

**Infrastructure**
- [ ] Weekly cutoff automation — Vercel Cron (Thu 22:59 UTC) calls `/api/cutoff` to close orders
- [ ] New order email alert — auto-fires to admin on every successful Paystack webhook
- [ ] Customer order confirmation email — fires on successful payment via Resend
- [ ] Supabase DB schema — 5 tables: products, product_variants, product_prep_options, orders, order_items, ordering_config

### Out of Scope

- User accounts for customers — no-account checkout is the explicit design decision
- Real-time inventory tracking — product availability is managed by admin via is_active flag
- Multi-currency / non-NGN payments — Paystack NGN only at MVP
- Mobile app — web-first, mobile-responsive
- Advanced analytics / third-party BI — MVP analytics pulled from DB directly

## Context

- **Existing scaffold:** Bare Next.js 15 project (`next`, `react`, `react-dom`, Tailwind v4) already initialized in this repo. Build on top of it — upgrade to Next.js 14 App Router conventions or keep 15 (spec says 14, but 15 is already installed — use 15 with App Router).
- **Payment market:** Nigerian market. Prices stored in kobo (integer) to avoid float issues. Display divides by 100.
- **Delivery schedule:** Orders open Sunday, close Thursday midnight WAT, processing Friday, delivery Saturday. `ordering_config` table is the single source of truth.
- **Client assets pending:** Brand assets, product photography, copy, prep options list, kit sizes, and pricing spreadsheet are all pending from client. Build with placeholders.
- **Open client decisions:** UI direction (moodboard), kit size labels, prep options per product, Paystack account/keys — all pending client action.
- **Reference UIs:** Hello Fresh, Home Chef, Chowdeck (especially Chowdeck's add-on drawer for product selection).

## Constraints

- **Tech Stack:** Next.js 15 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, Zustand, React Hook Form + Zod, Framer Motion, Supabase, Paystack, Resend, Vercel
- **Database:** Supabase PostgreSQL with RLS. Customers never access DB directly — all via server-side Route Handlers
- **Payments:** Paystack only. Webhook HMAC verification required. No live keys in repo.
- **Email:** Resend for all transactional email — confirmations, admin alerts, delivery reminders
- **Deployment:** Vercel. Vercel Cron for Thursday cutoff (schedule: `59 22 * * 4`)
- **Security:** `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` server-only. Never exposed to browser.
- **Timeline:** 3-week build. Week 1: UI structure. Week 2: Functionality. Week 3: Payments + launch.
- **Pending client blockers:** Kit sizes + prep options needed before Week 2; brand assets + Paystack keys before Week 3

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Prices stored as integer kobo | Avoids floating point precision bugs in financial calculations | — Pending |
| No customer accounts | Reduces friction; customers checkout as guests | — Pending |
| `ordering_config` single-row table as master switch | Simple, single source of truth for cutoff state | — Pending |
| Product drawer as parallel route (`@drawer`) | No full page reload when opening product; URL-addressable | — Pending |
| Vercel Cron for cutoff (not Supabase Edge Function) | Simpler ops; Vercel manages the scheduler | — Pending |
| Next.js 15 (already installed) vs spec-stated 14 | Scaffold already on 15; App Router is identical, no regression | — Pending |
| NextAuth v5 Credentials over Supabase Auth (Phase 2) | Neon migration removed Supabase; NextAuth v5 + JWT sessions is lighter and server-only | ✓ Validated Phase 4 |
| UploadThing over Supabase Storage (Phase 2) | Neon migration removed Supabase; UploadThing `productImage` endpoint is typed and auth-gated | ✓ Validated Phase 4 |
| Neon Postgres + Drizzle over Supabase PostgreSQL (Phase 2) | Full ORM control, schema-as-code, no RLS complexity for admin-only writes | ✓ Validated Phase 4 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-04 — Phase 6 (Automation + Launch) complete*
