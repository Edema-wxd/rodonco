# Requirements: Rodo & Co

**Defined:** 2026-04-15
**Core Value:** Customers can browse, configure, and pay for weekly food prep orders in one smooth flow — with zero friction between browsing and checkout.

---

## v1 Requirements

### Foundation

- [x] **FOUND-01**: Next.js 15 App Router project configured with TypeScript strict mode, Tailwind CSS v4, shadcn/ui, Zustand, React Hook Form, Zod (pinned to v3), and the `motion` library (the rebranded framer-motion).
- [x] **FOUND-02**: Neon serverless Postgres connected via Drizzle ORM (lib/db.ts) and drizzle-kit for migrations; NextAuth v5 Credentials provider configured for admin auth (auth.ts + middleware.ts); Uploadthing v7 configured for product image storage (no third-party BaaS clients — migration from prior stack is complete).
- [x] **FOUND-03**: All 11 database tables exist in Neon with the schema declared in drizzle/schema.ts: `products`, `product_variants`, `product_prep_options`, `orders`, `order_items`, `ordering_config`, `product_images`, `site_settings`, `admins`, `abandoned_carts`, `activity_logs`.
- [x] **FOUND-04**: `ordering_config` row 1 seeded in Neon with `is_ordering_open = true` and `next_delivery_date` populated to the upcoming Saturday; admins table seeded via `npm run seed:admin`.
- [x] **FOUND-05**: Environment variables documented in `.env.local.example` and confirmed not committed (.env.local in .gitignore): DATABASE_URL, DIRECT_DATABASE_URL, AUTH_SECRET, UPLOADTHING_TOKEN, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, PAYSTACK_SECRET_KEY, PAYSTACK_WEBHOOK_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL, ADMIN_NOTIFICATION_EMAIL, ADMIN_EMAIL, ADMIN_PASSWORD, CRON_SECRET, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, NEXT_PUBLIC_APP_URL.

### Customer — Browse & Select

- [x] **SHOP-01**: Landing page renders statically with hero section (headline, subheadline, CTA to `/shop`) and 3-step How It Works section
- [x] **SHOP-02**: Shop page renders two product sections — Fresh Produce and Cooking Kits — populated from DB (`is_active = true` filter)
- [x] **SHOP-03**: Cutoff banner displayed at top of shop page when `is_ordering_open = false`, showing next delivery date; revalidates every 60 seconds
- [x] **SHOP-04**: Product card shows image, name, starting price, and `Add to Order` CTA
- [x] **SHOP-05**: Clicking a product card opens product drawer without full page reload (Next.js parallel route / intercepting route)
- [x] **SHOP-06**: Product drawer opens as bottom sheet on mobile, side panel on desktop, with 300ms ease-out animation (Framer Motion)
- [x] **SHOP-07**: Fresh Produce drawer shows quantity selector (min 1) and optional prep options as radio buttons; no size selector
- [x] **SHOP-08**: Cooking Kit drawer shows size variant selector (radio/tab group) and optional prep options
- [x] **SHOP-09**: Drawer prep options are loaded dynamically per product from `product_prep_options` table
- [x] **SHOP-10**: Drawer price recalculates live as user changes quantity, size, or prep option
- [x] **SHOP-11**: Add to Cart button in drawer is disabled and shows tooltip when `is_ordering_open = false`

### Customer — Cart

- [x] **CART-01**: Cart state managed by Zustand store and persisted to `localStorage` for session recovery
- [x] **CART-02**: Cart supports add item, increment quantity, decrement quantity, remove item, and clear cart operations
- [x] **CART-03**: Cart accessible as a drawer/sidebar from anywhere in the app
- [x] **CART-04**: Navbar shows cart icon with item count badge
- [x] **CART-05**: Cart drawer shows itemised list, subtotal, and `Free delivery on Saturdays` note

### Customer — Checkout & Payment

- [x] **CHKT-01**: Checkout page is accessible without account or login
- [x] **CHKT-02**: Checkout form collects: customer name, Nigerian phone number (Zod-validated), email, delivery address, allergy notes (optional), and terms agreement checkbox
- [x] **CHKT-03**: Checkout page renders full-screen blocked state (no form shown) when `is_ordering_open = false`
- [x] **CHKT-04**: Submitting checkout calls `POST /api/orders/init`, which creates a `pending` order in DB and returns a Paystack reference
- [x] **CHKT-05**: Paystack inline popup opens after order init; user completes payment on Paystack's UI
- [x] **CHKT-06**: Paystack webhook (`POST /api/paystack/webhook`) verifies HMAC signature, sets order status to `paid`, and triggers notifications
- [x] **CHKT-07**: User is redirected to `/order/[ref]` after successful payment

### Customer — Order Confirmation

- [x] **CONF-01**: Order confirmation page fetches order by Paystack `reference` from DB
- [x] **CONF-02**: Confirmation page displays: order reference, customer name, itemised order summary, delivery address, and next Saturday delivery date
- [x] **CONF-03**: If reference not found or status is not `paid`, page renders a clear error state

### Admin — Authentication

- [x] **AUTH-01**: Admin login page at `/admin` with NextAuth Credentials authentication (email/password backed by the `admins` table in Postgres)
- [x] **AUTH-02**: All `/admin/*` routes protected by server-side auth guard in `app/admin/layout.tsx`
- [x] **AUTH-03**: Unauthenticated access to admin routes redirects to `/admin` login

### Admin — Orders

- [x] **ORD-01**: Orders table shows: Reference, Customer name, Phone, Date, Status, Total (NGN), Actions
- [x] **ORD-02**: Order rows are expandable to show full order items with prep instructions per item
- [x] **ORD-03**: Orders filterable by status (`paid` / `processing` / `delivered`) and delivery week
- [x] **ORD-04**: CSV export downloads current filtered view (used for market shopping list)
- [x] **ORD-05**: Status dropdown allows moving order through `paid → processing → delivered`

### Admin — Products

- [x] **PROD-01**: Admin can add new products and edit name, description, type, active status
- [x] **PROD-02**: Admin can upload product images via UploadThing; URL stored in `products.image_url`
- [x] **PROD-03**: Admin can add, edit, and remove size variants and prices per product
- [x] **PROD-04**: Admin can add, edit, and remove prep options per product
- [x] **PROD-05**: Admin can toggle `is_active` to show/hide products on the shop page

### Admin — Notifications

- [x] **NOTF-01**: Admin can select a delivery week and trigger delivery reminder emails to all `paid` orders for that week
- [x] **NOTF-02**: New order alert email fires automatically to admin on every successful Paystack payment (webhook-triggered)
- [x] **NOTF-03**: Customer order confirmation email fires automatically on successful payment (webhook-triggered)

### Admin — Analytics

- [x] **ANLT-01**: Analytics page shows total orders for the current week
- [x] **ANLT-02**: Analytics page shows total revenue for the current week (in NGN)
- [x] **ANLT-03**: Analytics page shows top 5 most ordered products by quantity
- [x] **ANLT-04**: Analytics page shows order status breakdown (paid / processing / delivered)

### Infrastructure & Cutoff

- [x] **INFRA-01**: Vercel Cron Job configured in `vercel.json` to call `GET /api/cutoff` at Thu 22:59 UTC (`59 22 * * 4`), closing the ordering window
- [x] **INFRA-02**: `/api/cutoff` validates `CRON_SECRET` header before toggling `is_ordering_open`
- [x] **INFRA-03**: Admin can manually toggle `is_ordering_open` from the admin dashboard (re-open on Sunday)
- [x] **INFRA-04**: All ordering state checks (drawer, checkout, API routes) read `is_ordering_open` on every request — no caching

### Route Completeness

- [x] **ROUTES-01**: Global 404 page (`src/app/not-found.tsx`) renders with Navbar and Footer for any unmatched URL (Phase 7 R1)
- [x] **ROUTES-02**: Privacy Policy page at `/privacy` returns HTTP 200 (Phase 7 R2)
- [x] **ROUTES-03**: Terms of Service page at `/terms` returns HTTP 200 (Phase 7 R3)
- [x] **ROUTES-04**: Cookie Policy page at `/cookie-policy` returns HTTP 200 (Phase 7 R4)
- [x] **ROUTES-05**: Plans page at `/plans` returns HTTP 200; Navbar "Plans" link points to `/plans` (Phase 7 R5)
- [x] **ROUTES-06**: Footer contains no dead links — unbuilt marketing pages removed from `Footer.tsx` (Phase 7 R6)

### Admin Operations

- [x] **ADMIN-OPS-01**: Weekly prep/packing list — aggregate quantities per `product_name + variant_label + prep_option` across all `paid` and `processing` orders for a selected delivery week, sourced from a single Drizzle JOIN query (Phase 8 OPS-01)
- [x] **ADMIN-OPS-02**: Analytics week picker — analytics page accepts a `weekOverride` parameter wired from a UI picker so historical weeks are inspectable without code changes (Phase 8 OPS-02)
- [x] **ADMIN-OPS-03**: Customer search — orders table search field filters across `customer_name`, `customer_phone`, and `customer_email` in real time (Phase 8 OPS-03)
- [x] **ADMIN-OPS-04**: Delivery manifest — per-week printable view of customer name, phone, address, and order items; sortable by name or address (Phase 8 OPS-04)
- [x] **ADMIN-OPS-05**: Settings — `next_delivery_date` and `cutoff_message` editable from the Settings page with immediate cutoff-banner reflection (Phase 8 OPS-05)
- [x] **ADMIN-OPS-06**: Pending order visibility — abandoned/unpaid orders viewable in a separate admin view with count badge; admin can delete individual pending orders (Phase 8 OPS-06)
- [x] **ADMIN-OPS-07**: Bulk status transitions — move all `paid → processing` or all `processing → delivered` orders for a selected delivery week in a single action (Phase 8 OPS-07)
- [x] **ADMIN-OPS-08**: Activity log — admin actions (product create/update/delete, settings updates, bulk transitions) are recorded to the `activity_logs` table and viewable from the admin activity page

---

## v2 Requirements

### Enhanced Customer Experience

- **UX-01**: "Add to Calendar" link on order confirmation page for Saturday delivery date
- **UX-02**: Sunday auto-reopen via second Vercel Cron (complementing manual admin toggle)
- **UX-03**: Order status tracking page for customers post-delivery

### Enhanced Admin

- **ADM-01**: WhatsApp notification channel (alternative to email reminders)
- **ADM-02**: Bulk order status update
- **ADM-03**: Admin configurable cutoff time (not hardcoded to Thursday midnight)
- **ADM-04**: Weekly revenue trend charts

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Customer accounts / login | Explicitly excluded — no-account checkout is by design |
| Real-time inventory / stock counts | Admin manages via `is_active` toggle |
| Multi-currency payments | NGN / Paystack only at MVP |
| Native mobile app | Web-first, mobile-responsive |
| Third-party analytics (GA, Mixpanel) | DB-direct analytics sufficient at MVP |
| Coupon / discount codes | Out of brief scope |
| Subscription / recurring orders | One-off weekly orders only |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| SHOP-01 | Phase 2 | Complete |
| SHOP-02 | Phase 2 | Complete |
| SHOP-03 | Phase 2 | Complete |
| SHOP-04 | Phase 2 | Complete |
| CART-04 | Phase 2 | Complete |
| SHOP-05 | Phase 3 | Complete |
| SHOP-06 | Phase 3 | Complete |
| SHOP-07 | Phase 3 | Complete |
| SHOP-08 | Phase 3 | Complete |
| SHOP-09 | Phase 3 | Complete |
| SHOP-10 | Phase 3 | Complete |
| SHOP-11 | Phase 3 | Complete |
| CART-01 | Phase 3 | Complete |
| CART-02 | Phase 3 | Complete |
| CART-03 | Phase 3 | Complete |
| CART-05 | Phase 3 | Complete |
| AUTH-01 | Phase 4 | Complete |
| AUTH-02 | Phase 4 | Complete |
| AUTH-03 | Phase 4 | Complete |
| ORD-01 | Phase 4 | Complete |
| ORD-02 | Phase 4 | Complete |
| ORD-03 | Phase 4 | Complete |
| ORD-04 | Phase 4 | Complete |
| ORD-05 | Phase 4 | Complete |
| PROD-01 | Phase 4 | Complete |
| PROD-02 | Phase 4 | Complete |
| PROD-03 | Phase 4 | Complete |
| PROD-04 | Phase 4 | Complete |
| PROD-05 | Phase 4 | Complete |
| ANLT-01 | Phase 4 | Complete |
| ANLT-02 | Phase 4 | Complete |
| ANLT-03 | Phase 4 | Complete |
| ANLT-04 | Phase 4 | Complete |
| INFRA-03 | Phase 4 | Complete |
| INFRA-04 | Phase 4 | Complete |
| CHKT-01 | Phase 5 | Complete |
| CHKT-02 | Phase 5 | Complete |
| CHKT-03 | Phase 5 | Complete |
| CHKT-04 | Phase 5 | Complete |
| CHKT-05 | Phase 5 | Complete |
| CHKT-06 | Phase 5 | Complete |
| CHKT-07 | Phase 5 | Complete |
| CONF-01 | Phase 5 | Complete |
| CONF-02 | Phase 5 | Complete |
| CONF-03 | Phase 5 | Complete |
| NOTF-02 | Phase 5 | Complete |
| NOTF-03 | Phase 5 | Complete |
| INFRA-01 | Phase 6 | Complete |
| INFRA-02 | Phase 6 | Complete |
| NOTF-01 | Phase 6 | Complete |
| ROUTES-01 | Phase 7 | Complete |
| ROUTES-02 | Phase 7 | Complete |
| ROUTES-03 | Phase 7 | Complete |
| ROUTES-04 | Phase 7 | Complete |
| ROUTES-05 | Phase 7 | Complete |
| ROUTES-06 | Phase 7 | Complete |
| ADMIN-OPS-01 | Phase 8 | Complete |
| ADMIN-OPS-02 | Phase 8 | Complete |
| ADMIN-OPS-03 | Phase 8 | Complete |
| ADMIN-OPS-04 | Phase 8 | Complete |
| ADMIN-OPS-05 | Phase 8 | Complete |
| ADMIN-OPS-06 | Phase 8 | Complete |
| ADMIN-OPS-07 | Phase 8 | Complete |
| ADMIN-OPS-08 | Phase 8 | Complete |

**Coverage:**
- v1 requirements: 69 total
- Mapped to phases: 69
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-05-22 — Phase 9 audit: FOUND block rewritten for Neon/Drizzle/NextAuth/Uploadthing stack, ADMIN-OPS + ROUTES sections added, traceability updated through Phase 8*
