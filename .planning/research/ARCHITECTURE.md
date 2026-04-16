# Architecture Patterns

**Domain:** Food prep ordering platform (weekly subscription-adjacent, guest checkout, NGN payments)
**Project:** Rodo & Co
**Researched:** 2026-04-15
**Overall confidence:** HIGH (Next.js and Supabase patterns from official docs; Paystack from official docs + community verification)

---

## Recommended Architecture

```
Browser
  └── Next.js 15 App Router (Vercel)
        ├── Public pages (SC) → Supabase via service role (Route Handlers only)
        ├── @drawer slot (parallel + intercepting route) → product config
        ├── Cart (Zustand + localStorage, Client Component only)
        ├── /api/webhooks/paystack → HMAC verify → service role write
        ├── /api/cutoff → Vercel Cron → service role update ordering_config
        └── /(admin) route group → Supabase email/password session
```

**Key principle:** Customers never touch Supabase directly. Every DB read/write on the customer path goes through a Next.js Route Handler using the service role key. RLS is still enabled on all tables — it provides defense-in-depth if a Route Handler is misconfigured — but the primary enforcement layer is the server-side boundary itself.

---

## Component Boundaries

| Component | Type | Responsibility | Communicates With |
|-----------|------|---------------|-------------------|
| `app/(shop)/page.tsx` | Server Component | Fetch products + ordering_config; pass as props | Supabase (via server util) |
| `app/(shop)/shop/page.tsx` | Server Component | Product grid with cutoff banner | Supabase, `@drawer` slot |
| `app/(shop)/@drawer/default.tsx` | Server Component | Returns `null` when drawer inactive | — |
| `app/(shop)/@drawer/(.)products/[id]/page.tsx` | Server Component | Intercept product route, render inside Drawer shell | Supabase (product detail) |
| `app/products/[id]/page.tsx` | Server Component | Full standalone product page (hard nav / refresh) | Supabase |
| `<ProductDrawer>` | Client Component | Animation shell, router.back() close, Framer Motion | `useRouter` |
| `<AddToCartButton>` | Client Component | Reads cart store, calls `addItem`, enforces cutoff state | Zustand cart store |
| `<CartSidebar>` | Client Component | Reads + mutates cart store | Zustand cart store |
| `<CheckoutForm>` | Client Component | RHF + Zod, calls `/api/checkout/initiate` | Route Handler |
| `app/api/checkout/initiate/route.ts` | Route Handler | Validate body, call Paystack initialize, return access_code | Paystack API |
| `app/api/webhooks/paystack/route.ts` | Route Handler | Verify HMAC, idempotency check, write order + items | Supabase service role |
| `app/orders/confirm/page.tsx` | Server Component | Fetch order by Paystack reference, display summary | Supabase (via Route Handler) |
| `app/api/cutoff/route.ts` | Route Handler | Verify CRON_SECRET, toggle ordering_config.is_open = false | Supabase service role |
| `app/(admin)/admin/...` | Server + Client mix | CRUD products, view orders, trigger reminders | Supabase service role |
| Zustand cart store | Client-only module | Cart state + localStorage persistence | Browser only |

---

## Data Flow

### Customer Browse and Add to Cart

```
User visits /shop
  → app/(shop)/shop/page.tsx (SC)
  → createServerSupabaseClient() fetches products WHERE is_active = true
  → ordering_config row fetched (is_open, closes_at)
  → ProductGrid rendered (SC), passes is_open as prop
  → <AddToCartButton is_open={is_open}> (CC) — disabled if !is_open
  → User clicks product card → Link href="/products/[id]"
  → @drawer slot intercepts with (.)products/[id]
  → Drawer opens (client animation), product data fetched server-side inside drawer
  → User configures qty/prep → clicks "Add to cart"
  → Zustand addItem() called → localStorage updated
```

### Checkout and Payment

```
User clicks Checkout
  → CheckoutForm (CC) submits via fetch POST /api/checkout/initiate
  → Route Handler validates input (Zod server-side)
  → Route Handler calls Paystack /transaction/initialize
  → Returns { access_code, reference } to client
  → Client opens Paystack inline popup (PaystackPop.openIframe)
  → On payment success, Paystack calls /api/webhooks/paystack (server-to-server)
  → Webhook handler verifies HMAC, checks idempotency, writes order
  → Webhook returns 200 immediately
  → Client receives Paystack onSuccess callback
  → Client navigates to /orders/confirm?reference=xxx
  → Confirm page (SC) fetches order by reference from Supabase
```

### Weekly Cutoff Automation

```
Thursday 22:59 UTC
  → Vercel Cron fires GET /api/cutoff
  → Handler checks Authorization: Bearer CRON_SECRET
  → Supabase UPDATE ordering_config SET is_open = false WHERE id = 1
  → All subsequent product pages and AddToCartButton reads reflect is_open = false
  → Sunday reset is manual (admin panel toggle) at MVP
```

---

## Pattern 1: Product Drawer via Parallel + Intercepting Routes

**What:** The shop page uses a `@drawer` parallel route slot. A product card `<Link href="/products/[id]">` navigates to the product URL. Inside `app/(shop)/@drawer/`, an intercepting route `(.)products/[id]` catches this navigation and renders the product inside an animated drawer panel instead of a full page transition. On hard refresh or direct URL visit, `/products/[id]/page.tsx` renders the full standalone product page.

**File structure:**

```
app/
  (shop)/
    layout.tsx              ← accepts { children, drawer } props
    shop/
      page.tsx              ← product grid
    @drawer/
      default.tsx           ← export default function Default() { return null }
      [...catchAll]/
        page.tsx            ← export default function CatchAll() { return null }
      (.)products/
        [id]/
          page.tsx          ← <Drawer><ProductConfig ... /></Drawer>
  products/
    [id]/
      page.tsx              ← full page version (hard nav / direct URL)
```

**Layout:**

```tsx
// app/(shop)/layout.tsx
export default function ShopLayout({
  children,
  drawer,
}: {
  children: React.ReactNode
  drawer: React.ReactNode
}) {
  return (
    <>
      {children}
      {drawer}   {/* renders null via default.tsx when no drawer active */}
    </>
  )
}
```

**Drawer shell (Client Component):**

```tsx
// app/ui/ProductDrawer.tsx
'use client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function ProductDrawer({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
      >
        <button onClick={() => router.back()}>Close</button>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

**Critical note on `(..)` vs `(.)` syntax:** The intercepting route folder is `(.)products` (single dot = same segment level) even though the file is two directories deep in the file system, because `@drawer` is a slot and slots are NOT counted as segments. This is confirmed in the official Next.js docs: "The `(..)` convention is based on route segments, not the file-system. It does not consider `@slot` folders."

**Confidence:** HIGH — sourced directly from Next.js 15 official docs (version 16.2.3, updated 2026-04-15).

---

## Pattern 2: Supabase RLS for Customer vs Admin Access

**What:** All tables have RLS enabled. Customers never authenticate with Supabase — they are `anon` role from Supabase's perspective. However, customers never call Supabase directly; every customer request goes through a Next.js Route Handler using the `service_role` key. The RLS policies are configured to allow the `anon` role to read products (public catalogue), and that is the only customer-facing permission granted via RLS. Order writes happen exclusively from server-side Route Handlers using the service role.

**Table policies:**

```sql
-- products: public catalogue, anon can read active products
create policy "Anyone can view active products"
  on products for select
  to anon
  using (is_active = true);

-- orders: no anon access at all; service_role bypasses RLS entirely
-- (no policy needed for customer path — service_role skips RLS)

-- ordering_config: anon can read (needed for cutoff banner in SC)
create policy "Anyone can view ordering config"
  on ordering_config for select
  to anon
  using (true);
```

**Two Supabase client utilities:**

```typescript
// lib/supabase/server.ts  — used in Server Components and Route Handlers
//   that need RLS enforcement (admin session verification)
import { createServerClient } from '@supabase/ssr'
export function createSupabaseServerClient() { /* cookies() pattern */ }

// lib/supabase/admin.ts  — used ONLY in server-side code for order writes,
//   webhook handlers, cron jobs. NEVER import in Client Components.
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // server-only env var
)
```

**Admin panel auth:** Supabase email/password auth with server-side session validation. The `/(admin)` route group has a layout that calls `createSupabaseServerClient()`, checks the session, and redirects to `/admin/login` if unauthenticated. Admin operations use `supabaseAdmin` (service role) for all writes.

**Confidence:** HIGH — sourced from official Supabase RLS docs and Supabase GitHub discussions.

---

## Pattern 3: Paystack Webhook Handler (Idempotency + Signature Verification)

**What:** A POST Route Handler at `/api/webhooks/paystack` that: (1) reads the raw request body as text before any JSON parsing, (2) verifies the HMAC-SHA512 signature, (3) checks if this event reference has already been processed (idempotency), (4) writes the order to the database, (5) fires email notifications, (6) returns 200 immediately.

**Implementation:**

```typescript
// app/api/webhooks/paystack/route.ts
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  // 1. Get raw body BEFORE any parsing — critical for HMAC verification
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  // 2. Verify HMAC-SHA512
  const expectedSig = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest('hex')

  if (signature !== expectedSig) {
    return new Response('Unauthorized', { status: 401 })
  }

  const event = JSON.parse(rawBody)

  // 3. Only handle charge.success
  if (event.event !== 'charge.success') {
    return new Response('OK', { status: 200 })
  }

  const reference = event.data.reference

  // 4. Idempotency check — has this reference already created an order?
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('paystack_reference', reference)
    .maybeSingle()

  if (existing) {
    // Already processed — return 200 so Paystack stops retrying
    return new Response('OK', { status: 200 })
  }

  // 5. Write order atomically
  // (wrap in try/catch; on error return 500 so Paystack retries)
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      paystack_reference: reference,
      customer_name: event.data.metadata.customer_name,
      customer_email: event.data.customer.email,
      customer_phone: event.data.metadata.customer_phone,
      delivery_address: event.data.metadata.delivery_address,
      allergy_notes: event.data.metadata.allergy_notes,
      amount_kobo: event.data.amount,
      status: 'paid',
    })
    .select()
    .single()

  if (error) {
    return new Response('Internal Error', { status: 500 })
  }

  // Insert order_items from metadata.cart (cart passed as Paystack metadata)
  await supabaseAdmin.from('order_items').insert(
    event.data.metadata.cart.map((item: CartItem) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      prep_option_id: item.prepOptionId,
      quantity: item.quantity,
      unit_price_kobo: item.unitPriceKobo,
    }))
  )

  // 6. Fire emails asynchronously (do not await to keep response fast)
  void sendOrderConfirmationEmail(order)
  void sendAdminNewOrderAlert(order)

  return new Response('OK', { status: 200 })
}
```

**Cart as Paystack metadata:** Pass the serialized cart as `metadata` in the `/api/checkout/initiate` call to Paystack's `/transaction/initialize`. Paystack echoes this back in the webhook event, removing the need for a pending-orders table.

**Idempotency key:** `paystack_reference` column has a `UNIQUE` constraint. Even if the webhook fires twice and the idempotency check somehow races, the DB insert will fail on the constraint and return 500, causing Paystack to retry — which the idempotency check will then catch.

**Webhook response timing:** Return 200 as fast as possible (under 5 seconds per Paystack requirement). Email sending must be fire-and-forget (`void`) or queued. Do not await external calls before responding.

**Confidence:** HIGH — Paystack official docs confirm x-paystack-signature header and HMAC-SHA512. Pattern verified against multiple community implementations.

---

## Pattern 4: Zustand Cart Store with localStorage Persistence

**What:** A Zustand store using the `persist` middleware backed by `localStorage`. The critical challenge in Next.js App Router is hydration mismatch: the server renders with no cart state, the client hydrates with localStorage state, causing React to throw a hydration error if cart data is rendered during SSR.

**Solution: `useHasHydrated` gate**

```typescript
// store/cart.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  productId: string
  variantId: string | null
  prepOptionId: string | null
  name: string
  unitPriceKobo: number
  quantity: number
  imageUrl: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId: string | null) => void
  updateQuantity: (productId: string, variantId: string | null, qty: number) => void
  clearCart: () => void
  totalKobo: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        }),
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        })),
      updateQuantity: (productId, variantId, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity: qty }
              : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      totalKobo: () => get().items.reduce((sum, i) => sum + i.unitPriceKobo * i.quantity, 0),
    }),
    {
      name: 'rodo-cart',
      // storage defaults to localStorage — correct for this use case
    }
  )
)
```

**Hydration guard hook:**

```typescript
// hooks/useHasHydrated.ts
import { useEffect, useState } from 'react'

export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false)
  useEffect(() => {
    setHasHydrated(true)
  }, [])
  return hasHydrated
}
```

**Usage in cart badge:**

```tsx
// components/CartBadge.tsx  — 'use client'
export function CartBadge() {
  const hasHydrated = useHasHydrated()
  const count = useCartStore((s) => s.items.length)
  if (!hasHydrated) return <CartIconSkeleton />
  return <CartIcon count={count} />
}
```

This pattern ensures the server and initial client render both output the same (empty/skeleton) UI. After hydration, the real cart state from localStorage populates. Without this, React throws a hydration error because the server renders a count of 0 while the client immediately reads e.g. 3 from localStorage.

**Prices in kobo:** Store `unitPriceKobo` as integers. Display divides by 100: `(priceKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })`.

**Confidence:** HIGH — based on Zustand official GitHub discussions (issues #1145, #1382, #2788) and Next.js hydration documentation.

---

## Pattern 5: Server Components vs Client Components Boundaries

**Rule of thumb:** Push data fetching as high as possible into Server Components. Only reach for `'use client'` when you need browser APIs, event handlers, or external state (Zustand).

| Component | Type | Reason |
|-----------|------|--------|
| Product grid page | SC | DB fetch at page level, no interactivity needed |
| Product card | SC | Renders static product data |
| `<AddToCartButton>` | CC | Needs `onClick`, reads Zustand cart + ordering_config cutoff |
| `<CartSidebar>` | CC | Needs Zustand reads/writes, animation |
| `<CartBadge>` | CC | Reads Zustand (must be CC), hydration guard needed |
| Checkout form | CC | React Hook Form, controlled inputs |
| Cutoff banner | SC | Reads `is_open` from props passed by parent SC |
| Product drawer shell | CC | `useRouter` for close, Framer Motion animation |
| Product detail inside drawer | SC | Product data fetched server-side in the intercept page |
| Order confirm page | SC | DB fetch by reference, no interactivity |
| Admin product table | CC | Sorting, filtering, row expand all need client state |
| Admin auth wrapper | SC | Session check in layout, redirect if unauthed |

**Pattern: Pass server data into client islands**

```tsx
// app/(shop)/shop/page.tsx  — Server Component
export default async function ShopPage() {
  const products = await getActiveProducts()       // server DB call
  const config = await getOrderingConfig()         // server DB call
  return (
    <ProductGrid products={products}>
      {/* AddToCartButton is a CC island; receives is_open as prop from SC */}
      {products.map(p => (
        <ProductCard key={p.id} product={p}>
          <AddToCartButton product={p} isOpen={config.is_open} />
        </ProductCard>
      ))}
    </ProductGrid>
  )
}
```

**Server Actions vs Route Handlers:**

Use **Route Handlers** for:
- Paystack webhook (must disable body parsing, raw text needed)
- Paystack checkout initiation (returns data to client, not a form submission)
- Vercel Cron endpoint (`/api/cutoff`)
- Any endpoint called by external services

Use **Server Actions** for:
- Admin form submissions (product create/update, status changes)
- Delivery reminder trigger (admin button click → server action)

Do NOT use Server Actions for the customer checkout flow. The Paystack inline popup is controlled by the Paystack JS SDK on the client — the flow is: Client calls Route Handler to initialize → gets access_code → opens Paystack popup. Server Actions are not the right shape for this.

**Confidence:** HIGH — aligns with Next.js 15 official guidance and e-commerce patterns.

---

## Pattern 6: Vercel Cron for Weekly Cutoff

**What:** A GET Route Handler at `/api/cutoff` protected by a `CRON_SECRET` bearer token. Vercel fires it on Thursday 22:59 UTC. The handler flips `ordering_config.is_open = false`.

**vercel.json:**

```json
{
  "crons": [
    {
      "path": "/api/cutoff",
      "schedule": "59 22 * * 4"
    }
  ]
}
```

Day-of-week `4` = Thursday in Vercel's UTC-based cron (0=Sunday, 4=Thursday). Confirmed by Vercel docs: "Day of Week: 0 - 6 (Sun-Sat)".

**Route Handler:**

```typescript
// app/api/cutoff/route.ts
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from('ordering_config')
    .update({ is_open: false, updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) {
    console.error('Cutoff cron failed:', error)
    return new Response('Error', { status: 500 })
  }

  return new Response('Cutoff applied', { status: 200 })
}
```

**CRON_SECRET:** Vercel automatically injects the `CRON_SECRET` environment variable as a bearer token on cron-triggered requests. Set the same value in your Vercel project environment variables. This prevents anyone with the URL from triggering a cutoff manually.

**Sunday re-open:** At MVP, re-opening for the new week is a manual toggle in the admin panel (admin updates `ordering_config.is_open = true`). A second cron job (`"schedule": "0 0 * * 0"` = Sunday midnight UTC) can be added in a later phase.

**Confidence:** HIGH — sourced from official Vercel Cron docs.

---

## Suggested Build Order (Dependency Graph)

Dependencies flow downward. Each layer must exist before the layer above it can be fully built.

```
Layer 0 — Database foundation
  Supabase schema: products, product_variants, product_prep_options,
                   orders, order_items, ordering_config
  RLS policies (anon read for products + ordering_config)
  Seed data: 1 ordering_config row

Layer 1 — Server utilities
  lib/supabase/admin.ts        (service role client)
  lib/supabase/server.ts       (SSR client for admin auth)
  lib/paystack.ts              (Paystack API wrapper)

Layer 2 — Zustand cart store
  store/cart.ts                (persist middleware, kobo prices)
  hooks/useHasHydrated.ts

Layer 3 — Public shop UI (no payments yet)
  app/(shop)/layout.tsx        (@drawer slot wired)
  app/(shop)/shop/page.tsx     (product grid, SC)
  app/(shop)/@drawer/...       (intercepting route structure)
  app/products/[id]/page.tsx   (full page fallback)
  components/AddToCartButton   (reads cart + is_open)
  components/CartSidebar       (reads/writes cart)

Layer 4 — Checkout flow (no live payments)
  app/checkout/page.tsx        (RHF + Zod form, CC)
  app/api/checkout/initiate/route.ts  (calls Paystack initialize)
  app/orders/confirm/page.tsx  (SC, fetch by reference)

Layer 5 — Paystack integration
  app/api/webhooks/paystack/route.ts
  Paystack metadata: cart serialization strategy
  Email triggers via Resend

Layer 6 — Admin panel
  app/(admin)/admin/layout.tsx (auth guard)
  app/(admin)/admin/login/page.tsx
  app/(admin)/admin/orders/page.tsx
  app/(admin)/admin/products/page.tsx
  app/api/admin/...            (product CRUD, order status, reminders)

Layer 7 — Automation
  vercel.json cron config
  app/api/cutoff/route.ts
  Admin ordering_config toggle UI
```

**Why this order:**
- Layer 0 must precede everything — no data, no app
- Layer 1 is a pure utility layer, no UI dependencies
- Layer 2 (cart store) is pure client state, no DB dependency — build early to validate UX
- Layer 3 (shop UI) can be built with static placeholder data before Layer 0 is complete in dev, but needs Layer 0 for real data
- Layer 4 (checkout form) can be built with a mock initiate endpoint before Layer 5 has live keys
- Layer 5 (Paystack) is blocked by pending client action (Paystack keys). Architecture is ready; integration is a client blocker
- Layer 6 (admin) is parallel to Layers 3-5 but depends on Layer 0 and Layer 1
- Layer 7 is last — automation wrapping an otherwise complete system

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling Supabase from Client Components
**What:** Importing Supabase client in a `'use client'` component and querying the DB directly from the browser.
**Why bad:** Exposes connection details; bypasses server-side enforcement; `SUPABASE_SERVICE_ROLE_KEY` would leak to the browser if accidentally imported.
**Instead:** All DB access goes through Server Components (for reads rendered at page level) or Route Handlers (for mutation/dynamic reads). The `supabaseAdmin` module must only ever be imported in server-side files.

### Anti-Pattern 2: Awaiting Email Sends Inside Webhook Handler Before Responding
**What:** `await sendOrderConfirmationEmail(order)` before returning the 200 response.
**Why bad:** Paystack expects a response within ~5 seconds. Resend API calls add latency. Paystack will retry if it times out, causing duplicate emails and orders.
**Instead:** Fire emails with `void` (fire-and-forget) or use a queue. The idempotency check handles any retry scenarios.

### Anti-Pattern 3: Parsing JSON Before HMAC Verification in Webhook
**What:** Using Next.js's default JSON body parsing (`await req.json()`) before signature verification.
**Why bad:** HMAC-SHA512 must be computed on the **raw string** payload. JSON.stringify(JSON.parse(raw)) is not guaranteed to be byte-for-byte identical to the original raw body (key ordering may differ). Use `await req.text()`, verify HMAC, then `JSON.parse(rawBody)`.
**Instead:** Always read `req.text()` first in the webhook handler.

### Anti-Pattern 4: Storing Cart in URL or Server-Side Session
**What:** Encoding cart state in query params or a server-side session store.
**Why bad:** This project has no customer accounts. There is no session to bind to. URL encoding is fragile for complex cart objects.
**Instead:** Zustand + localStorage is the correct choice for guest checkout carts. It persists across tabs, survives refresh, and is zero-server-cost.

### Anti-Pattern 5: Missing `default.tsx` in `@drawer` Slot
**What:** Omitting the `default.tsx` and `[...catchAll]/page.tsx` files in `@drawer`.
**Why bad:** On hard navigation (refresh, direct URL), Next.js cannot determine the active state of unmatched slots. Without `default.tsx`, it renders a 404 for the slot, breaking the layout.
**Instead:** Always include `@drawer/default.tsx` returning `null` and `@drawer/[...catchAll]/page.tsx` returning `null`.

---

## Scalability Considerations

This is a weekly ordering platform for a single client. Volume is predictably low-to-medium at MVP. These notes are for future reference, not immediate concern.

| Concern | MVP (< 1K orders/week) | Future (10K+ orders/week) |
|---------|----------------------|--------------------------|
| DB reads for product page | Direct Supabase query per request | Add `unstable_cache` or ISR on product pages |
| Webhook processing | Synchronous in Route Handler | Move order write to a queue (Upstash QStash) |
| Order confirmation emails | Resend direct call, fire-and-forget | Resend batch API or queue |
| Admin analytics | Raw SQL queries | Materialized views or pre-aggregated summary table |
| Ordering config reads | Per-request DB read | Cache with 30s revalidation (`next: { revalidate: 30 }`) |

---

## Sources

- Next.js 15 Official Docs — Parallel Routes: https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes (version 16.2.3, updated 2026-04-15)
- Next.js 15 Official Docs — Intercepting Routes: https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes (version 16.2.3, updated 2026-04-13)
- Supabase RLS Docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Service Role Discussion: https://github.com/orgs/supabase/discussions/30739
- Paystack Webhooks Docs: https://paystack.com/docs/payments/webhooks/
- Paystack Webhook in Next.js App Router: https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi
- Vercel Cron Jobs Docs: https://vercel.com/docs/cron-jobs
- Zustand Persist + Next.js Hydration (GitHub issue): https://github.com/pmndrs/zustand/discussions/1382
- Zustand Persist in Next.js guide: https://dev.to/abdulsamad/how-to-use-zustands-persist-middleware-in-nextjs-4lb5
- Webhook idempotency patterns: https://dev.to/whoffagents/webhook-processing-at-scale-idempotency-signature-verification-and-async-queues-45b3
