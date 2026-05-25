# Phase 5: Payments + Email - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the full purchase flow end-to-end:
- Checkout form at `/checkout` (RHF + Zod, no account required) with cart order summary sidebar
- `POST /api/orders/init` — creates a `pending` order in DB, initialises a Paystack transaction, returns reference
- Paystack inline popup opens; customer pays without leaving the page
- `POST /api/paystack/webhook` — raw body read first, HMAC-SHA512 verification, idempotency check, marks order `paid`, triggers Resend emails
- Customer order confirmation email (full receipt) + admin new-order alert (full order details) via Resend + React Email
- Order confirmation page at `/order/[ref]`

Out of scope: delivery reminder emails (Phase 6), Vercel Cron cutoff (Phase 6), admin manual email trigger (Phase 6), pending order garbage collection (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Checkout Form Layout
- **D-01:** Checkout page uses a **two-column layout on desktop**: left column is the RHF form (name, Nigerian phone, email, delivery address, allergy notes, terms checkbox); right column is a **cart order summary** reading from the Zustand store (itemised list with product name, qty, prep option, subtotal per item, and total NGN). Single column on mobile.
- **D-02:** Empty cart redirect — if the cart is empty when `/checkout` is loaded (e.g., direct URL navigation), **redirect immediately to `/shop`**.
- **D-03:** "Pay Now" button shows a **loading spinner + "Processing..."** label while `POST /api/orders/init` is in-flight. Button is disabled during this period to prevent double-submit.

### Payment Cancellation & Retry
- **D-04:** If the customer closes the Paystack popup without paying, **stay on the checkout page** and show a brief toast: "Payment cancelled — your cart is still saved." Form fields remain filled.
- **D-05:** On retry, **reuse the existing pending order** if one exists matching the same customer email + identical cart contents (same items, quantities, variants, prep options). If the cart has changed or no matching pending order exists, create a new one. This avoids orphaned DB rows on retry.
- **D-06:** Cart form state is **preserved across cancellation** — fields stay filled so the customer can retry without re-entering details.

### Paystack Reference Generation
- **D-07:** The server **generates the Paystack reference** using a short unique ID (e.g., `RDC-{nanoid(10)}`). The DB order is created with this reference before calling Paystack's transaction init API. Our reference is the source of truth for the idempotency check in the webhook.

### Post-Payment Cart & Confirmation
- **D-08:** Cart is **cleared on redirect** — when Paystack calls `onSuccess`, the Zustand cart is cleared immediately before pushing to `/order/[ref]`.
- **D-09:** Order confirmation page at `/order/[ref]` is **display-only**: order reference, customer name, itemised order summary, delivery address, next Saturday delivery date, and a "Continue shopping" link back to `/shop`. No print/share/download at MVP.
- **D-10:** If `/order/[ref]` is loaded with a reference not found, or with a status that is not `paid`, render a **clear error state** ("Order not found" or "Payment not confirmed") with a link to contact support.

### Emails
- **D-11:** Resend sender: **"Rodo & Co" \<orders@rodoandco.com\>** — placeholder domain until client provides production domain. Configured via `RESEND_FROM_ADDRESS` env var.
- **D-12:** Customer confirmation email uses **React Email components** (`@react-email/components`) — typed, testable, consistent with the Next.js stack. Resend has first-class React Email support.
- **D-13:** Customer confirmation email is a **full receipt**: order reference, customer name, itemised order (product name, qty, variant/size label, prep option, subtotal per item), delivery address, total NGN, next Saturday delivery date. Styled with brand warm palette.
- **D-14:** Admin new-order alert email contains **full order details**: reference, customer name + phone + email, itemised order with prep instructions, delivery address, total NGN. Admin can action the order without logging into the dashboard.
- **D-15:** Resend errors are **caught and logged** but must NOT cause the webhook to return non-200. Email send is fire-and-forget after order status update.

### Webhook Safety (from STATE.md — already decided)
- **D-16:** `POST /api/paystack/webhook` calls **`req.text()`** before any JSON parsing — body stream is one-time-read; parsing JSON first silently breaks HMAC verification.
- **D-17:** Idempotency check: query `orders WHERE paystack_reference = ref AND status = 'paid'` before processing. If already paid, return 200 immediately (no re-processing).

### Claude's Discretion
- Exact Tailwind styling of the checkout two-column layout and responsive breakpoints
- React Email template visual design (within the warm brand palette)
- Exact `nanoid` length / prefix format for the reference (as long as it's collision-resistant and recognisable)
- Whether to use `useTransition` or a simple `useState` for the Pay Now loading state
- `week_of` derivation: use `ordering_config.next_delivery_date` at order creation time

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cart & Checkout (Phase 3 foundation)
- `src/store/cart.ts` — canonical CartItem merge semantics, `clearCart` action, localStorage persistence
- `src/hooks/useHasHydrated.ts` — SSR hydration guard (cart reads must be guarded)
- `src/app/(customer)/checkout/page.tsx` — existing stub with ordering-closed guard already wired; replace the form stub

### Types
- `src/types/index.ts` — `CartItem`, `Order`, `OrderItem`, `OrderingConfig` types; all prices are integer kobo

### Database schema
- `drizzle/schema.ts` — `orders`, `order_items`, `ordering_config`, `products` table definitions; all DB writes use `db` from `src/lib/db/index.ts`
- `src/lib/db/index.ts` — server-only `db` export; import ONLY in server files

### Auth (ordering config reads)
- `src/lib/shop/orderingConfig.ts` — `getOrderingConfig()` used by checkout page; also provides `next_delivery_date` for email and `week_of` on order creation

### Admin API patterns (Phase 4 — reference for Route Handler conventions)
- `src/app/api/admin/orders/[id]/route.ts` — example of `auth()` + Zod + Drizzle PATCH pattern
- `src/app/api/admin/config/route.ts` — example of config read/write pattern

### Requirements for this phase
- `.planning/REQUIREMENTS.md` §CHKT-01–07, CONF-01–03, NOTF-02, NOTF-03

### No external design specs
Requirements fully captured in decisions above. Reference Paystack Inline JS docs and Resend + React Email docs for integration APIs.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/store/cart.ts` — `useCartStore` with `items`, `clearCart`, and item manipulation actions; already persisted to localStorage with hydration guard
- `src/components/layout/Navbar.tsx` — cart icon badge; `clearCart` must be called on payment success before redirect
- `src/app/(customer)/checkout/page.tsx` — stub already reads `getOrderingConfig()` and shows the closed banner; replace the open-state branch with the real form
- shadcn/ui components installed: `Button`, `Input`, `Textarea`, `Card`, `Badge`, `Select` — all usable for checkout form and email layout
- `src/types/index.ts` — `CartItem` shape is the exact data needed for `order_items` insert and email line items

### Established Patterns
- **Server Components for initial data**: checkout page is a Server Component; cart summary renders as a Client Component (reads Zustand)
- **Route Handlers under `src/app/api/`**: new routes `POST /api/orders/init` and `POST /api/paystack/webhook` go here
- **Drizzle query pattern**: `db.insert(orders).values({...}).returning()` — see Phase 4 plans for examples
- **Zod validation in Route Handlers**: strict schema before any DB write (see `src/app/api/admin/orders/[id]/route.ts`)
- **Kobo arithmetic**: all prices in kobo integers; display divides by 100; never store floats

### Integration Points
- `src/app/(customer)/checkout/page.tsx` — replace form stub; add cart summary Client Component
- New routes to create: `src/app/api/orders/init/route.ts`, `src/app/api/paystack/webhook/route.ts`
- New page: `src/app/(customer)/order/[ref]/page.tsx`
- Zustand `clearCart()` called from checkout Client Component on Paystack `onSuccess`
- Resend + React Email: new `src/lib/email/` directory for templates and send helpers

</code_context>

<specifics>
## Specific Ideas

- Paystack inline popup is loaded via `@paystack/inline-js` npm package or the CDN script — downstream agents should prefer the npm package for type safety
- The reference format `RDC-{nanoid}` makes order references human-recognisable in emails and admin table (e.g., "RDC-a3f8kq2p1x")
- The two-column checkout layout mirrors standard e-commerce (Stripe Checkout, Shopify) — customer reviews what they're buying while filling in delivery details

</specifics>

<deferred>
## Deferred Ideas

- Pending order garbage collection (orphaned `pending` orders from abandoned carts) — Phase 6 or future maintenance job
- Delivery reminder email trigger (NOTF-01) — Phase 6
- Vercel Cron cutoff automation (INFRA-01/02) — Phase 6
- WhatsApp notification channel (ADM-01, v2)

</deferred>

---

*Phase: 05-payments-email*
*Context gathered: 2026-05-02*
