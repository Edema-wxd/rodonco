# Roadmap: Rodo & Co

## Overview

A 3-week build delivering a complete food-prep ordering platform for the Nigerian market. The journey starts with database foundations and tooling, moves through a static shop UI, adds full interactivity (drawer, cart, cutoff enforcement), builds the admin panel in parallel with payment integration, wires up Paystack webhooks and Resend email, and finishes with Vercel Cron automation and go-live hardening. Every customer-facing feature depends on the DB schema and Zustand hydration guard being correct from day one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - DB schema, env config, Supabase clients, Zustand cart store with SSR hydration guard, and @drawer slot skeleton
- [x] **Phase 2: Static Shop UI** - Landing page, shop product grid, product cards — fully server-rendered with placeholder data (completed 2026-04-30)
- [ ] **Phase 2.1: Migrate Supabase to Neon and Uploadthing** (INSERTED) - Swap database to Neon serverless Postgres, auth to Neon Auth, and media storage to Uploadthing
- [ ] **Phase 3: Interactive Shop** - Product drawer (parallel route), cart sidebar, live price recalculation, and cutoff enforcement in UI
- [ ] **Phase 4: Admin Panel** - Auth guard, orders table, product CRUD, analytics dashboard, and manual ordering-config toggle
- [ ] **Phase 5: Payments + Email** - Paystack inline popup, webhook handler, order creation, Resend confirmation and admin-alert emails, order confirmation page
- [x] **Phase 6: Automation + Launch** - Vercel Cron cutoff job, delivery reminder emails, pre-launch key swap, and go-live hardening (completed 2026-05-04)
- [x] **Phase 7: Missing Pages + Route Completeness** (INSERTED) - Global 404 page, Privacy/Terms/Cookie Policy legal pages, dedicated Plans page, and Footer dead-link cleanup (completed 2026-05-07)
- [ ] **Phase 8: Missing Admin Structures** (INSERTED) - Weekly prep/packing list, delivery manifest, customer search, analytics week picker, ordering config week management, pending order visibility, and bulk status transitions

## Phase Details

### Phase 1: Foundation
**Goal**: The project scaffold is fully wired — database schema live with RLS, all environment variables documented, Supabase server and admin clients created, Zustand cart store with localStorage persistence and SSR hydration guard in place, and the @drawer parallel route slot skeleton scaffolded so no downstream phase has to retrofit these primitives
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05
**Success Criteria** (what must be TRUE):
  1. All 6 database tables exist in Supabase with RLS enabled and correct column types; `ordering_config` row 1 is seeded with `is_ordering_open = true`
  2. `lib/supabase/admin.ts` (service role) and `lib/supabase/server.ts` (SSR cookie client) exist and import without error; `SUPABASE_SERVICE_ROLE_KEY` is never prefixed `NEXT_PUBLIC_`
  3. `useCartStore` (Zustand + `persist` middleware) and `useHasHydrated` hook exist; a test component wrapping them renders on both server and client without a React hydration error
  4. `app/(customer)/shop/@drawer/default.tsx` returns `null`; `app/(customer)/layout.tsx` accepts and renders the `drawer` slot prop; hard-refreshing any shop URL does not 404
  5. `.env.local.example` documents all required variables; `.env.local` is confirmed in `.gitignore`
**Plans:** 3 plans
Plans:
- [ ] 01-01-PLAN.md — Install npm deps, shadcn init, TypeScript types, env docs
- [ ] 01-02-PLAN.md — Supabase DB migration with RLS, seed, three client files
- [ ] 01-03-PLAN.md — Zustand cart store, hydration hook, route skeleton, Navbar

### Phase 2: Static Shop UI
**Goal**: A visitor can open the site, read the landing page, browse the shop product grid, and see individual product cards — all server-rendered from real DB data, with no cart interaction yet
**Depends on**: Phase 1
**Requirements**: SHOP-01, SHOP-02, SHOP-03, SHOP-04, CART-04
**Success Criteria** (what must be TRUE):
  1. Landing page at `/` renders hero headline, subheadline, CTA button linking to `/shop`, and a 3-step How It Works section visible without JavaScript
  2. Shop page at `/shop` renders two labelled sections (Fresh Produce, Cooking Kits) populated from `products WHERE is_active = true`
  3. Cutoff banner appears at the top of `/shop` when `ordering_config.is_ordering_open = false`, displays the next delivery date, and the page revalidates every 60 seconds
  4. Each product card shows image, name, starting price in NGN, and an `Add to Order` CTA
  5. Navbar renders at all times and shows a cart icon (badge may show skeleton/zero until Phase 3 hydration guard is wired to real cart)
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [x] 02-01-PLAN.md — Landing page hero + How It Works (SHOP-01)
- [x] 02-02-PLAN.md — Shop grid sections + product card + cutoff banner alignment (SHOP-02/03/04)
- [x] 02-03-PLAN.md — Vitest coverage for cart badge + formatting contracts (CART-04)

### Phase 02.1: Migrate Supabase to Neon and Uploadthing (INSERTED)

**Goal:** The app's infrastructure layer is fully migrated — Neon Postgres replaces Supabase PostgreSQL (all 7 tables in Drizzle schema-as-code, pushed live), NextAuth v5 Credentials provider replaces Supabase Auth (admin-only JWT sessions, middleware guards `/admin/*`), and Uploadthing v7 replaces Supabase Storage (productImage endpoint, auth-gated, typed client helpers ready for Phase 4). No customer-facing features change; all downstream phases (3–6) build on Neon + Drizzle + NextAuth + Uploadthing.
**Requirements**: D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12, D-13, D-14, D-15, D-16, D-17
**Depends on:** Phase 1
**Plans:** 3/3 plans complete

Plans:
- [x] 02.1-01-PLAN.md — Install Drizzle + Neon packages, declare all 7 tables in schema.ts, push schema to Neon, smoke test connectivity
- [x] 02.1-02-PLAN.md — NextAuth v5 config (auth.ts), route handler, middleware (middleware.ts), seed-admin.ts script
- [x] 02.1-03-PLAN.md — Uploadthing v7 FileRouter (core.ts, route.ts), typed client helpers, NextSSRPlugin in root layout
- [x] 02.1-04-PLAN.md — Uninstall @supabase/* packages, delete lib/supabase/*.ts files, update env.d.ts + .env.local.example

### Phase 3: Interactive Shop
**Goal**: A customer can open a product drawer, configure quantity and prep options (or size for kits), see the price update live, add to cart, view and edit their cart in a sidebar, and be blocked from adding items when the ordering window is closed
**Depends on**: Phase 2
**Requirements**: SHOP-05, SHOP-06, SHOP-07, SHOP-08, SHOP-09, SHOP-10, SHOP-11, CART-01, CART-02, CART-03, CART-05
**Success Criteria** (what must be TRUE):
  1. Clicking a product card opens the product drawer without a full page reload; the drawer slides in as a bottom sheet on mobile and a side panel on desktop with a 300ms ease-out animation
  2. Fresh Produce drawer shows quantity selector (min 1) and optional prep options as radio buttons; Cooking Kit drawer additionally shows a size variant selector; price recalculates live on every change
  3. Cart state persists to `localStorage` and survives page refresh; the cart icon badge shows the correct item count after hydration without a React hydration error
  4. Cart sidebar opens from anywhere in the app, lists items with quantities and subtotal, and `Free delivery on Saturdays` note; items can be incremented, decremented, and removed
  5. When `is_ordering_open = false`, the Add to Cart button in the drawer is disabled and shows a tooltip; no item can be added to cart during a closed window
**Plans**: TBD
**UI hint**: yes

### Phase 4: Admin Panel
**Goal**: An authenticated admin can log in, view and manage all orders, perform full product CRUD with image upload, see a live analytics summary, and manually toggle the ordering window open or closed
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, ORD-01, ORD-02, ORD-03, ORD-04, ORD-05, PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, ANLT-01, ANLT-02, ANLT-03, ANLT-04, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Visiting any `/admin/*` route without an active Supabase session redirects immediately to `/admin` login; logging in with valid credentials grants access and persists across browser refresh
  2. Orders table shows all columns (Reference, Customer name, Phone, Date, Status, Total NGN); rows are expandable to reveal per-item prep instructions; table is filterable by status and delivery week; CSV export downloads the current filtered view
  3. Admin can create a new product, upload an image (stored in Supabase Storage `products` bucket), add size variants, add prep options, set pricing in kobo, and toggle `is_active` — all changes are immediately reflected on the shop page
  4. Analytics page shows: total orders for the current week, total revenue in NGN, top 5 products by quantity, and order status breakdown — all sourced directly from DB queries
  5. Admin can toggle `is_ordering_open` in `ordering_config` from the dashboard; every ordering-state check across the app reads this value on each request with no caching
**Plans**: TBD
**UI hint**: yes

### Phase 5: Payments + Email
**Goal**: A customer can complete a real NGN payment via Paystack inline popup, have their order persisted on webhook confirmation with HMAC verification and idempotency protection, receive an email confirmation, and land on an order confirmation page; admin receives a new-order alert email on every successful payment
**Depends on**: Phase 3, Phase 4
**Requirements**: CHKT-01, CHKT-02, CHKT-03, CHKT-04, CHKT-05, CHKT-06, CHKT-07, CONF-01, CONF-02, CONF-03, NOTF-02, NOTF-03
**Success Criteria** (what must be TRUE):
  1. Checkout page at `/checkout` renders the full RHF + Zod form (name, Nigerian phone, email, address, allergy notes, terms checkbox) without requiring a customer account; when `is_ordering_open = false` the entire page shows a blocked state with no form
  2. Submitting the checkout form calls `POST /api/orders/init`, which creates a `pending` order in DB and returns a Paystack reference; the Paystack inline popup opens and the customer can complete payment without leaving the page
  3. `POST /api/paystack/webhook` reads raw body first, verifies HMAC-SHA512 signature, performs idempotency check against **`orders.reference`** (UNIQUE constraint — this is also the Paystack transaction reference), sets order status to `paid`, and returns 200 in under 5 seconds
  4. Customer receives a Resend order confirmation email and admin receives a new-order alert email on every `charge.success` event; Resend errors are caught and logged without causing the webhook to return non-200
  5. Order confirmation page at `/order/[ref]` fetches the order by Paystack reference, displays order reference, customer name, itemised summary, delivery address, and next Saturday delivery date; a reference not found or with non-`paid` status renders a clear error state
**Plans**: 8 plans
**UI hint**: yes

Plans:
- [x] 05-01-PLAN.md — Dependencies + checkout Zod + Paystack initialize helper (`CHKT-02`)
- [x] 05-02-PLAN.md — Checkout page UI + Inline JS + wiring to `/api/orders/init` (`CHKT-01`, `CHKT-03`, `CHKT-05`)
- [x] 05-03-PLAN.md — `POST /api/orders/init` pending order + Paystack initialize (`CHKT-04`)
- [x] 05-04-PLAN.md — Paystack webhook HMAC + `paid` transition + Resend emails (`CHKT-06`, `CHKT-07`, `NOTF-02`, `NOTF-03`)
- [x] 05-05-PLAN.md — Order confirmation `/order/[ref]` (`CONF-01`–`CONF-03`)
- [ ] 05-06-PLAN.md — Gap closure: render `order.customer_name` on confirmation (`CONF-02`)
- [ ] 05-07-PLAN.md — Gap closure: webhook amount mismatch guard (`CHKT-06`)
- [ ] 05-08-PLAN.md — Gap closure: DB-authoritative pricing in init route (`CHKT-04`)

### Phase 6: Automation + Launch
**Goal**: The ordering window closes automatically every Thursday at 22:59 UTC via Vercel Cron, admin can trigger bulk delivery reminder emails, and the platform passes a pre-launch hardening checklist — live Paystack keys wired, environment assertions in place, and the webhook URL registered in the Paystack live dashboard
**Depends on**: Phase 5
**Requirements**: INFRA-01, INFRA-02, NOTF-01
**Success Criteria** (what must be TRUE):
  1. `vercel.json` contains a cron entry for `/api/cutoff` at `59 22 * * 4` (Thursday 22:59 UTC = Thursday 23:59 WAT); the route validates `Authorization: Bearer CRON_SECRET` and sets `ordering_config.is_ordering_open = false` idempotently; running it twice has no side effect
  2. Admin can select a delivery week and trigger delivery reminder emails to all `paid` orders for that week; the Route Handler bulk-sends via Resend and returns a count of emails dispatched
  3. Production deployment uses live Paystack keys (`pk_live_`, `sk_live_`); the startup environment assertion verifies `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` starts with `pk_live_` in production; the Paystack live dashboard webhook URL points to the production domain
**Plans:** 4 plans

Plans:

**Wave 0** *(must complete before Wave 1)*
- [x] 06-01-PLAN.md — Test stubs (Wave 0): cutoff route, reminders lib, reminders route, validateEnv

**Wave 1** *(blocked on Wave 0 — 06-02 and 06-03 run in parallel)*
- [x] 06-02-PLAN.md — vercel.json cron config + /api/cutoff GET handler (INFRA-01, INFRA-02)
- [x] 06-03-PLAN.md — Reminders backend + ReminderForm UI + settings page wiring (NOTF-01)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 06-04-PLAN.md — validateEnv module + next.config.ts security headers + error boundaries + LAUNCH-CHECKLIST.md

**Cross-cutting constraints:**
- `/api/cutoff` must NOT call `auth()` — Vercel cron invocation has no session cookie
- `global-error.tsx` must include `<html>` and `<body>` tags (replaces root layout)
- CSP must allowlist `https://js.paystack.co` and `https://utfs.io` or Phase 5 payments + Phase 4 image uploads break
- `validateEnv()` must check `AUTH_SECRET` not `NEXTAUTH_SECRET` (NextAuth v5 convention in this codebase)

### Phase 7: Missing Pages + Route Completeness (INSERTED)
**Goal**: Every route linked from the Navbar and Footer resolves to a real, on-brand page. Ships the global 404, three legal pages (Privacy, Terms, Cookie Policy), a dedicated Plans page replacing the Navbar placeholder, and Footer dead-link cleanup. All pages match the homepage design system (stone-100 bg, Lexend/Quicksand/Inter fonts, asymmetric rounded cards, red-600/green-800 accents).
**Depends on**: Phase 6
**Requirements**: R1 (404), R2 (Privacy), R3 (Terms), R4 (Cookie Policy), R5 (Plans), R6 (Footer cleanup)
**Success Criteria** (what must be TRUE):
  1. `/privacy`, `/terms`, `/cookie-policy`, `/plans` all return HTTP 200 — no broken links from Footer or Navbar
  2. Any unmatched URL (e.g. `/foo/bar`) renders the custom 404 page with Navbar and Footer visible — not Next.js's default white screen
  3. The "Plans" Navbar link points to `/plans` and the page renders without errors
  4. The Footer contains no links that resolve to 404 — the 5 unbuilt marketing pages are removed from Footer.tsx
  5. All 5 new pages visually match the homepage design system — stone-100 bg, brand fonts, asymmetric card corners, brand accent colors
  6. `tsc --noEmit` passes with zero errors after all changes
**Plans:** 3 plans

Plans:

**Wave 0** *(no blockers)*
- [x] 07-01-PLAN.md — Global not-found.tsx + Footer link cleanup (R1, R6)

**Wave 1** *(parallel, blocked on Wave 0)*
- [x] 07-02-PLAN.md — Privacy Policy + Terms of Service pages (R2, R3)
- [x] 07-03-PLAN.md — Cookie Policy + Plans page + Navbar fix (R4, R5)

**Design System Constraints:**
- Background: `bg-stone-100` on all customer pages
- Fonts: Quicksand for H1s, Lexend for labels/buttons/badges, Inter for body copy
- Section label: `text-xs font-black uppercase tracking-wider text-red-600`
- H1: `text-5xl font-black leading-[1.05] text-zinc-800` in Quicksand
- Cards: `bg-white rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] shadow-sm outline outline-1 outline-stone-200/60 p-10`
- CTA: red-600 rounded-full pill (primary); stone-200 rounded-full (secondary)
- Body: `text-base leading-7 text-stone-600` in Inter

**Files Touched:**
- `src/app/not-found.tsx` — Create (root level, catches all unmatched routes)
- `src/app/(customer)/privacy/page.tsx` — Create
- `src/app/(customer)/terms/page.tsx` — Create
- `src/app/(customer)/cookie-policy/page.tsx` — Create
- `src/app/(customer)/plans/page.tsx` — Create
- `src/components/landing/Footer.tsx` — Remove 5 dead links, keep Wall of Love + 3 legal
- `src/components/layout/Navbar.tsx` — Update Plans href from `/shop` to `/plans`

### Phase 8: Missing Admin Structures (INSERTED)
**Goal**: The admin panel is operationally complete — every gap that breaks the weekly prep workflow is closed. Staff can generate a per-week prep/packing list, view a delivery manifest, search for a customer by name or phone, see historical analytics for any week, update the customer-facing delivery date from Settings, see and clean up abandoned checkout orders, and bulk-transition order statuses in one action instead of one-by-one.
**Depends on**: Phase 4
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06, OPS-07
**Success Criteria** (what must be TRUE):
  1. Admin can select a delivery week and view a prep list: aggregate quantities per `product_name + variant_label + prep_option` across all `paid` and `processing` orders for that week — sourced from a single Drizzle JOIN query
  2. Analytics page has a week picker; `getWeeklyAnalytics()` `weekOverride` parameter is wired to the UI — past weeks' revenue and order counts are accessible without a code change
  3. Orders table has a search field that filters across `customer_name`, `customer_phone`, and `customer_email` in real time
  4. Admin can view a per-week delivery manifest showing customer name, phone, address, and order items — printable, sortable by address or name — without exporting to a spreadsheet
  5. Settings page exposes `next_delivery_date` and `cutoff_message` fields from `ordering_config` with a save action; changes are reflected immediately in the customer-facing cutoff banner
  6. Admin can see `pending` (abandoned checkout) orders in a separate view with a count badge; orders can be manually deleted or ignored
  7. Admin can bulk-transition all `paid` → `processing` or all `processing` → `delivered` orders for a selected delivery week in a single action
**Plans:** 5 plans

Plans:

**Wave 0** *(must complete before Wave 1)*
- [x] 08-01-PLAN.md — Test stubs: prepList, manifest, pendingOrders, bulkTransition, analytics; extend schemas.test.ts + OrdersTable.test.tsx (OPS-01–OPS-07)

**Wave 1** *(blocked on Wave 0 — 08-02 and 08-03 run in parallel)*
- [ ] 08-02-PLAN.md — schemas.ts extension + DeliveryConfigForm + OrdersTable search + analytics week picker (OPS-02, OPS-03, OPS-05)
- [ ] 08-03-PLAN.md — pendingOrders lib + AdminLayout badge + AdminSidebar 3 new nav items (OPS-06 prep)

**Wave 2** *(blocked on Wave 1 — 08-04 and 08-05 run in parallel)*
- [ ] 08-04-PLAN.md — prepList lib + RSC page + PrepListTable; manifest lib + RSC page + ManifestTable with print (OPS-01, OPS-04)
- [ ] 08-05-PLAN.md — pending orders page + DELETE handler; bulkTransition lib + bulk-status API + BulkTransitionPanel (OPS-06, OPS-07)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 2.1 → 3 → 4 → 5 → 6 → 7 → 8

Note: Phase 4 (Admin Panel) depends only on Phase 1 and can be built in parallel with Phases 2-3, but is executed in sequence here for clarity.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Planning complete | - |
| 2. Static Shop UI | 3/3 | Complete   | 2026-04-30 |
| 2.1 Migrate Supabase to Neon + Uploadthing | 3/4 | In Progress|  |
| 3. Interactive Shop | 0/TBD | Not started | - |
| 4. Admin Panel | 0/TBD | Not started | - |
| 5. Payments + Email | 0/5 | Planning complete | - |
| 6. Automation + Launch | 4/4 | Complete | 2026-05-04 |
| 7. Missing Pages + Route Completeness | 3/3 | Complete | 2026-05-07 |
| 8. Missing Admin Structures | 0/5 | Planning complete | - |
