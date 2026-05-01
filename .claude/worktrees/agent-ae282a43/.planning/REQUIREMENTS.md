# Requirements: Rodo & Co

**Defined:** 2026-04-15
**Core Value:** Customers can browse, configure, and pay for weekly food prep orders in one smooth flow — with zero friction between browsing and checkout.

---

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Next.js 15 App Router project configured with TypeScript strict mode, Tailwind CSS v4, shadcn/ui, Zustand, React Hook Form, Zod, and Framer Motion
- [ ] **FOUND-02**: Supabase project connected with server-side client (service role) and browser client (anon key)
- [ ] **FOUND-03**: All 6 database tables created with correct schema and RLS enabled: `products`, `product_variants`, `product_prep_options`, `orders`, `order_items`, `ordering_config`
- [ ] **FOUND-04**: `ordering_config` seeded with row 1 (`is_ordering_open = true`, next Saturday delivery date populated)
- [ ] **FOUND-05**: Environment variables documented in `.env.local.example`; `.env.local` in `.gitignore`

### Customer — Browse & Select

- [ ] **SHOP-01**: Landing page renders statically with hero section (headline, subheadline, CTA to `/shop`) and 3-step How It Works section
- [ ] **SHOP-02**: Shop page renders two product sections — Fresh Produce and Cooking Kits — populated from DB (`is_active = true` filter)
- [ ] **SHOP-03**: Cutoff banner displayed at top of shop page when `is_ordering_open = false`, showing next delivery date; revalidates every 60 seconds
- [ ] **SHOP-04**: Product card shows image, name, starting price, and `Add to Order` CTA
- [ ] **SHOP-05**: Clicking a product card opens product drawer without full page reload (Next.js parallel route / intercepting route)
- [ ] **SHOP-06**: Product drawer opens as bottom sheet on mobile, side panel on desktop, with 300ms ease-out animation (Framer Motion)
- [ ] **SHOP-07**: Fresh Produce drawer shows quantity selector (min 1) and optional prep options as radio buttons; no size selector
- [ ] **SHOP-08**: Cooking Kit drawer shows size variant selector (radio/tab group) and optional prep options
- [ ] **SHOP-09**: Drawer prep options are loaded dynamically per product from `product_prep_options` table
- [ ] **SHOP-10**: Drawer price recalculates live as user changes quantity, size, or prep option
- [ ] **SHOP-11**: Add to Cart button in drawer is disabled and shows tooltip when `is_ordering_open = false`

### Customer — Cart

- [ ] **CART-01**: Cart state managed by Zustand store and persisted to `localStorage` for session recovery
- [ ] **CART-02**: Cart supports add item, increment quantity, decrement quantity, remove item, and clear cart operations
- [ ] **CART-03**: Cart accessible as a drawer/sidebar from anywhere in the app
- [ ] **CART-04**: Navbar shows cart icon with item count badge
- [ ] **CART-05**: Cart drawer shows itemised list, subtotal, and `Free delivery on Saturdays` note

### Customer — Checkout & Payment

- [ ] **CHKT-01**: Checkout page is accessible without account or login
- [ ] **CHKT-02**: Checkout form collects: customer name, Nigerian phone number (Zod-validated), email, delivery address, allergy notes (optional), and terms agreement checkbox
- [ ] **CHKT-03**: Checkout page renders full-screen blocked state (no form shown) when `is_ordering_open = false`
- [ ] **CHKT-04**: Submitting checkout calls `POST /api/orders/init`, which creates a `pending` order in DB and returns a Paystack reference
- [ ] **CHKT-05**: Paystack inline popup opens after order init; user completes payment on Paystack's UI
- [ ] **CHKT-06**: Paystack webhook (`POST /api/paystack/webhook`) verifies HMAC signature, sets order status to `paid`, and triggers notifications
- [ ] **CHKT-07**: User is redirected to `/order/[ref]` after successful payment

### Customer — Order Confirmation

- [ ] **CONF-01**: Order confirmation page fetches order by Paystack `reference` from DB
- [ ] **CONF-02**: Confirmation page displays: order reference, customer name, itemised order summary, delivery address, and next Saturday delivery date
- [ ] **CONF-03**: If reference not found or status is not `paid`, page renders a clear error state

### Admin — Authentication

- [ ] **AUTH-01**: Admin login page at `/admin` with Supabase email/password authentication
- [ ] **AUTH-02**: All `/admin/*` routes protected by server-side auth guard in `app/admin/layout.tsx`
- [ ] **AUTH-03**: Unauthenticated access to admin routes redirects to `/admin` login

### Admin — Orders

- [ ] **ORD-01**: Orders table shows: Reference, Customer name, Phone, Date, Status, Total (NGN), Actions
- [ ] **ORD-02**: Order rows are expandable to show full order items with prep instructions per item
- [ ] **ORD-03**: Orders filterable by status (`paid` / `processing` / `delivered`) and delivery week
- [ ] **ORD-04**: CSV export downloads current filtered view (used for market shopping list)
- [ ] **ORD-05**: Status dropdown allows moving order through `paid → processing → delivered`

### Admin — Products

- [ ] **PROD-01**: Admin can add new products and edit name, description, type, active status
- [ ] **PROD-02**: Admin can upload product images to Supabase Storage; URL stored in `products.image_url`
- [ ] **PROD-03**: Admin can add, edit, and remove size variants and prices per product
- [ ] **PROD-04**: Admin can add, edit, and remove prep options per product
- [ ] **PROD-05**: Admin can toggle `is_active` to show/hide products on the shop page

### Admin — Notifications

- [ ] **NOTF-01**: Admin can select a delivery week and trigger delivery reminder emails to all `paid` orders for that week
- [ ] **NOTF-02**: New order alert email fires automatically to admin on every successful Paystack payment (webhook-triggered)
- [ ] **NOTF-03**: Customer order confirmation email fires automatically on successful payment (webhook-triggered)

### Admin — Analytics

- [ ] **ANLT-01**: Analytics page shows total orders for the current week
- [ ] **ANLT-02**: Analytics page shows total revenue for the current week (in NGN)
- [ ] **ANLT-03**: Analytics page shows top 5 most ordered products by quantity
- [ ] **ANLT-04**: Analytics page shows order status breakdown (paid / processing / delivered)

### Infrastructure & Cutoff

- [ ] **INFRA-01**: Vercel Cron Job configured in `vercel.json` to call `GET /api/cutoff` at Thu 22:59 UTC (`59 22 * * 4`), closing the ordering window
- [ ] **INFRA-02**: `/api/cutoff` validates `CRON_SECRET` header before toggling `is_ordering_open`
- [ ] **INFRA-03**: Admin can manually toggle `is_ordering_open` from the admin dashboard (re-open on Sunday)
- [ ] **INFRA-04**: All ordering state checks (drawer, checkout, API routes) read `is_ordering_open` on every request — no caching

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
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| SHOP-01 | Phase 2 | Pending |
| SHOP-02 | Phase 2 | Pending |
| SHOP-03 | Phase 2 | Pending |
| SHOP-04 | Phase 2 | Pending |
| CART-04 | Phase 2 | Pending |
| SHOP-05 | Phase 3 | Pending |
| SHOP-06 | Phase 3 | Pending |
| SHOP-07 | Phase 3 | Pending |
| SHOP-08 | Phase 3 | Pending |
| SHOP-09 | Phase 3 | Pending |
| SHOP-10 | Phase 3 | Pending |
| SHOP-11 | Phase 3 | Pending |
| CART-01 | Phase 3 | Pending |
| CART-02 | Phase 3 | Pending |
| CART-03 | Phase 3 | Pending |
| CART-05 | Phase 3 | Pending |
| AUTH-01 | Phase 4 | Pending |
| AUTH-02 | Phase 4 | Pending |
| AUTH-03 | Phase 4 | Pending |
| ORD-01 | Phase 4 | Pending |
| ORD-02 | Phase 4 | Pending |
| ORD-03 | Phase 4 | Pending |
| ORD-04 | Phase 4 | Pending |
| ORD-05 | Phase 4 | Pending |
| PROD-01 | Phase 4 | Pending |
| PROD-02 | Phase 4 | Pending |
| PROD-03 | Phase 4 | Pending |
| PROD-04 | Phase 4 | Pending |
| PROD-05 | Phase 4 | Pending |
| ANLT-01 | Phase 4 | Pending |
| ANLT-02 | Phase 4 | Pending |
| ANLT-03 | Phase 4 | Pending |
| ANLT-04 | Phase 4 | Pending |
| INFRA-03 | Phase 4 | Pending |
| INFRA-04 | Phase 4 | Pending |
| CHKT-01 | Phase 5 | Pending |
| CHKT-02 | Phase 5 | Pending |
| CHKT-03 | Phase 5 | Pending |
| CHKT-04 | Phase 5 | Pending |
| CHKT-05 | Phase 5 | Pending |
| CHKT-06 | Phase 5 | Pending |
| CHKT-07 | Phase 5 | Pending |
| CONF-01 | Phase 5 | Pending |
| CONF-02 | Phase 5 | Pending |
| CONF-03 | Phase 5 | Pending |
| NOTF-02 | Phase 5 | Pending |
| NOTF-03 | Phase 5 | Pending |
| INFRA-01 | Phase 6 | Pending |
| INFRA-02 | Phase 6 | Pending |
| NOTF-01 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-15 — traceability updated after roadmap creation*
