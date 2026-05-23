# Rodo & Co — Product Audit
**Date:** 2026-05-22  
**Branch:** `mvp`  
**Stack:** Next.js 15, Drizzle ORM, Neon Postgres, NextAuth v5, Uploadthing v7, Paystack, Resend  
**Auditor:** Claude Code

---

## Summary

Rodo & Co is a Nigerian food-prep ordering platform. Customers browse a weekly menu, add fresh produce or cooking kits to a cart, pay via Paystack, and receive Saturday delivery. The codebase completed 8 of 9 planned milestones. The platform is deployable and operationally functional. Key gaps are in the admin surface for abandoned cart recovery, customer-facing self-service order lookup, and a handful of UI/data-wiring inconsistencies.

---

## 1. What Is Working

### Customer-Facing Shop

| Feature | Notes |
|---|---|
| Landing page | Hero, How It Works, menu preview, testimonials, clean promise sections |
| Shop grid | Two sections (Fresh Produce, Cooking Kits) loaded from live DB; 60s ISR revalidation |
| Product drawer | Parallel route (`@drawer`), quantity selector, prep options for produce, variant sizes for kits, live price recalculation |
| Cutoff banner | Reads `ordering_config.is_ordering_open`; shown on shop and checkout when closed |
| Cart sidebar | Zustand-persisted to localStorage; survives refresh; increment/decrement/remove; animated slide-in |
| Cart badge | SSR-safe hydration guard via `useHasHydrated` |
| Ordering window enforcement | Drawer `Add to Cart` button disabled when ordering is closed; checkout page shows blocked state |
| Checkout form | RHF + Zod; name, Nigerian phone regex (`0[7-9][0-9]{9}`), email, address, allergy notes, terms checkbox |
| Payment | Paystack inline popup; no page leave required |
| Order confirmation | `/order/[ref]` shows reference, customer name, items, delivery address, next delivery date |

### Payment & Security

| Feature | Notes |
|---|---|
| HMAC-SHA512 webhook verification | Raw body read before parsing; unsigned events rejected 401 |
| Idempotency | Duplicate `charge.success` events return 200 without reprocessing |
| Amount mismatch guard | Webhook cross-checks `data.amount` (kobo) against `total_ngn × 100`; logs mismatch, returns 200 |
| Server-side price authority | `/api/orders/init` ignores client-submitted prices; recomputes from DB variants + prep options |
| Pending order reuse | `findPendingReuse()` prevents duplicate DB rows on re-submission |

### Transactional Emails (Resend)

| Email | Trigger |
|---|---|
| Customer order receipt | `charge.success` webhook; includes itemised order, delivery date |
| Admin new-order alert | Same webhook; fire-and-forget, failures logged not propagated |
| Delivery reminder bulk send | Admin-triggered from Settings; targets all `paid` orders for a selected week |

### Admin Panel

| Feature | Notes |
|---|---|
| Auth guard | NextAuth v5 Credentials; middleware protects `/admin/*`; JWT sessions persist across refresh |
| Orders table | Search by name/phone/email; filter by status and delivery week; expandable rows for item detail; status change per row |
| CSV export | Exports currently filtered view |
| Pending orders view | Shows `pending`-status (abandoned checkout) orders; per-row delete |
| Products CRUD | Create/edit/delete; UploadThing image upload; size variants; prep options; `is_active` toggle |
| Analytics | Total orders, total revenue, top 5 products, status breakdown; week picker to browse any historical week |
| Prep list | Aggregates `qty × (product + variant + prep_option)` for all `paid`/`processing` orders for a selected week |
| Delivery manifest | Per-week list of customer name, phone, address, order items; printable |
| Bulk status transitions | `paid → processing` and `processing → delivered` in one action for a selected week |
| Ordering toggle | Instantly opens or closes the ordering window; reflected across the app on next request |
| Delivery config | Admin sets `next_delivery_date`, `cutoff_message`, `delivery_fee_ngn` from Settings |
| Contact settings | Admin stores WhatsApp number, contact email, Instagram handle in `site_settings` DB table |
| Activity log | Timestamped feed of: auth events, order status changes, product CRUD, settings updates — with admin email attribution |

### Automation & Infrastructure

| Feature | Notes |
|---|---|
| Auto-cutoff cron | Vercel Cron hits `/api/cutoff` every Thursday at 22:59 UTC; CRON_SECRET auth; idempotent |
| Environment validation | `validateEnv()` called at startup; asserts live Paystack keys in production |
| Security headers | CSP configured in `next.config.ts`; allowlists `js.paystack.co` and `utfs.io` |
| Error boundaries | `error.tsx` (route-level) and `global-error.tsx` (root-level with `<html>/<body>`) |
| Abandoned cart capture | `POST /api/orders/draft` saves customer info + cart to `abandoned_carts` table on checkout form submit before payment |
| Custom 404 | `not-found.tsx` with Navbar and Footer; matches brand design |
| Vercel Speed Insights | Wired in root layout |

### Content Pages

All routes resolve to real pages — no dead links.

| Page | Route |
|---|---|
| Home | `/` |
| Shop | `/shop` |
| How It Works | `/how-it-works` |
| Plans | `/plans` |
| Wall of Love | `/wall-of-love` |
| Privacy Policy | `/privacy` |
| Terms of Service | `/terms` |
| Cookie Policy | `/cookie-policy` |
| Order Confirmation | `/order/[ref]` |

---

## 2. Nice to Have

These are gaps where infrastructure or schema already exists but the feature is incomplete or unpolished.

### Admin: Abandoned Cart View
- **What exists:** `abandoned_carts` table in schema, `POST /api/orders/draft` captures data on checkout submit
- **What's missing:** Zero admin UI to view, filter, export, or mark-as-contacted these records
- **Impact:** The recovery data is accumulating in the DB with no way to act on it from the admin panel

### Site Settings Not Surfaced Publicly
- **What exists:** `site_settings` table stores WhatsApp, contact email, Instagram handle; admin UI can update them
- **What's missing:** The Footer renders placeholder social icon divs (`<div className="h-5 w-5 rounded bg-zinc-400" />`); the stored values are never read in any customer-facing component
- **Impact:** Social links, contact email, and WhatsApp number are dead in the footer regardless of what admin sets

### Plans Page Contains Placeholder Pricing
- The `/plans` page hardcodes `From ₦2,500 / item` and `From ₦8,500 / kit` with `{/* PLACEHOLDER */}` comments throughout
- These are not pulled from the DB or config — client must supply final pricing copy

### Wall of Love — Hardcoded Testimonials
- `/wall-of-love` and the Testimonials section on the homepage are hardcoded arrays
- No admin CMS or even a config file — any update requires a code change

### Delivery Fee Not Shown in Cart Sidebar
- Cart sidebar shows items and subtotal with "Free delivery on Saturdays" hardcoded
- The actual `delivery_fee_ngn` from config is only visible at checkout
- If a delivery fee is set, the customer has no warning before hitting the checkout page

### Orders Table — No Server-Side Pagination
- `getAdminOrders()` fetches all orders in a single query with no `LIMIT`/`OFFSET`
- At scale (hundreds/thousands of orders) this will be slow and memory-heavy
- Client-side filtering operates on the full in-memory dataset

### Email Contact Address is Hardcoded
- `CustomerOrderReceipt.tsx` hardcodes `orders@rodoandco.com` as the reply-to contact
- Should read from `site_settings.contact_email` so admin can update it without a deploy

### Font Variable Collision (Bug)
- In `src/app/layout.tsx`, both `Quicksand` and `Lexend` are assigned `variable: "--font-quicksand"`
- Lexend's variable should be `--font-lexend`; it currently shadows Quicksand across the app
- Visual impact depends on load order, but Lexend is never independently addressable

### No Per-Page SEO Metadata
- Root layout has a global title/description
- Shop, individual product pages, legal pages (some have `metadata` exports), and the home page have no `openGraph`, `twitter`, or page-specific `description` metadata
- No OG image configured anywhere

### No Rate Limiting on Public API Routes
- `/api/orders/init` (creates DB rows + calls Paystack API) has no rate limiting
- `/api/paystack/webhook` (HMAC-verified, but still) processes without rate control
- No Redis/Upstash in the dependency tree; would require adding infrastructure

### Phase 9 Not Started
- Roadmap lists Phase 9: "Tech debt: cache revalidation + requirements cleanup"
- 0 plans written; listed as `[To be planned]`

---

## 3. What Is Missing

These are features with no current implementation and no obvious foundation in the existing code.

### Customer Order Self-Lookup
- Customers land on `/order/[ref]` only if they saved the URL or received the confirmation email
- No "find my order" form where a customer can enter their email to retrieve their orders
- If an email is missed or a confirmation page is lost, the customer has no self-service path

### Customer Order Cancellation
- No mechanism for a customer to cancel a paid order
- No mechanism for admin to issue a partial cancel of individual items
- Admin can change order status to `cancelled` manually, but no customer-facing flow

### Refund / Reversal Handling
- Paystack has refund APIs; no handler exists for refund webhooks (`charge.dispute.*`, `refund.processed`)
- No refund tracking column on the `orders` table

### Customer Accounts / Order History
- Guest checkout only — intentional per the design — but means repeat customers cannot see past orders without old emails
- No customer-facing "my orders" page

### Real-Time Admin Notifications
- Admin must manually refresh orders page to see new orders
- No browser push, WebSocket, polling, or email-to-admin badge integration

### Admin: Customer Order History
- From the admin orders table you can search for a customer, but clicking a customer name does not navigate to a customer profile showing all their orders over time

### WhatsApp Integration
- `whatsapp_number` is stored in `site_settings` but no click-to-WhatsApp link exists anywhere in the customer UI
- No WhatsApp order notification to the customer post-payment

### Favicon / PWA Assets
- No `favicon.ico`, `apple-touch-icon`, or `manifest.json` referenced in the root layout
- Browser tabs show a default favicon

### Instagram / Social Links in Footer
- Footer renders three grey placeholder boxes instead of actual icon links
- `instagram_handle` in `site_settings` is never consumed publicly

### Cancellation / Ordering-Closed Email to Customer
- When the ordering window closes, no email is sent to customers with items in their cart
- No notification flow for window-open events either

---

## 4. Known Inconsistencies / Tech Debt

| Area | Issue |
|---|---|
| Font variables | `Lexend` declared with `--font-quicksand` CSS variable name — should be `--font-lexend` |
| Footer copyright | Shows `© 2025` hardcoded — should be dynamic or updated to 2026 |
| Schema comment | `schema.ts` references old Supabase migration file in the comment header (line 3) |
| `how-it-works` page | Exists at `/how-it-works` and is linked from the landing page, but is not in the Navbar or Footer |
| `wall-of-love` | In Footer under "Company" but not in Navbar |
| Analytics includes pending | `getWeeklyAnalytics()` counts all orders for the week including `pending`/`cancelled` — may inflate order/revenue numbers |
| Reminder form week selector | Delivery reminder emails target all `paid` orders for a week; no preview count before sending |
| `delivery_fee_ngn` units | Stored as NGN integer but displayed with NGN formatting; the cart sidebar divides by 100 treating values as kobo — if a real fee is set, verify the unit is consistent across init route and display |

---

## 5. Risk Flags

| Risk | Severity | Notes |
|---|---|---|
| No API rate limiting | Medium | `/api/orders/init` can be spammed; each call creates a DB row and hits Paystack |
| Orders table N+1 risk | Low-Medium | Full table scan on every admin orders page load; no LIMIT |
| Abandoned cart data — no retention policy | Low | Data accumulates with `contacted_at` never set; no cleanup job |
| Hardcoded contact email in receipt | Low | Customer replies go to an address that may not be monitored if settings change |
| Font variable collision | Low | Visual consistency risk; Lexend never renders as itself |
| Plans page placeholder content | Medium | Live page contains `{/* PLACEHOLDER */}` comment text — client copy must replace before marketing launch |

---

*Generated from codebase at commit `e6c52fb` on branch `mvp`.*
