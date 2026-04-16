# Technology Stack

**Project:** Rodo & Co — Food Prep Ordering Platform
**Researched:** 2026-04-15
**Overall confidence:** HIGH (all major choices verified against current docs/releases)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (already installed: ^15.5.15) | Full-stack React framework | App Router gives server components, route handlers, cron-friendly API routes, and parallel routes (`@drawer`) in one deployment unit |
| React | 19.x (already installed: ^19.0.0) | UI runtime | Ships with Next.js 15; required for new React compiler optimizations. No separate install needed |
| TypeScript | ^5 (already installed) | Type safety | Strict mode enforced — catches kobo/display price bugs at compile time |

**Next.js 15 breaking change you must handle:** Async request APIs. `cookies()`, `headers()`, `params`, and `searchParams` are now async — they return Promises in Next.js 15. Any Route Handler or Server Component accessing these must `await` them. The codemods exist (`npx @next/codemod@canary next-async-request-api .`) but run them carefully.

**Caching semantics change:** GET Route Handlers are no longer cached by default in Next.js 15. This is correct behavior for this project (orders list, config checks should always be fresh) — no action needed, but do not assume any GET route is cached.

---

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | v4 (already installed: ^4.0.0) | Utility-first CSS | Already in scaffold. v4 uses CSS-first config — no `tailwind.config.js`, all config in CSS file. Do not create a `tailwind.config.js` |
| shadcn/ui | latest (install fresh via CLI) | Accessible component primitives | Fully compatible with React 19 + Tailwind v4 as of late 2024. New projects default to `new-york` style |

**Tailwind v4 + shadcn/ui breaking changes to know:**
- `tailwindcss-animate` is deprecated. shadcn now uses `tw-animate-css`. Install `tw-animate-css` not `tailwindcss-animate`.
- All HSL color tokens are now OKLCH. Do not fight this.
- `toast` component is deprecated in shadcn — use `sonner` directly.
- Run `npx shadcn@latest init` (not `@shadcn-ui/cli`) — the package name changed.
- forwardRef is removed from all primitives; they now use data-slot attributes for styling.

**Installation:**
```bash
npx shadcn@latest init
# Select: new-york style, yes to Tailwind v4, TypeScript
```

---

### Animation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| motion | ^12.x | Page transitions, drawer slide-ins, cart animations | Framer Motion was rebranded to `motion` in late 2024 — the old `framer-motion` package is no longer actively developed |

**Critical:** Do NOT install `framer-motion`. Install `motion` instead. Change all imports from `"framer-motion"` to `"motion/react"`.

**Server Component constraint:** Every file using Motion components must have `"use client"` at the top — Motion relies on browser APIs unavailable during SSR. Wrap animated sections in a client boundary component rather than marking whole page files as client.

```bash
npm install motion
```

---

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | ^5.x | Cart state, ordering window state | v5 uses `useSyncExternalStore` natively — fully concurrent-safe with React 19. Smallest API surface of any global state solution |

**Zustand v5 is fully compatible with React 19.** No peer dep warnings. Use the standard `create()` pattern. For localStorage persistence, use the `persist` middleware from `zustand/middleware`:

```typescript
import { persist } from 'zustand/middleware'
// Store: cart items, total, ordering window status
```

Do not use Jotai or Recoil — Zustand's devtools integration is better for this cart complexity level and it has zero React 19 issues.

---

### Forms & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Hook Form | ^7.x | Checkout form, admin forms | Uncontrolled form pattern has zero re-render cost; critical for the live-price-recalc product drawer |
| @hookform/resolvers | ^3.x | Bridges RHF with Zod | Must use v3.x with Zod v3 |
| Zod | ^3.x | Schema validation | **Do NOT upgrade to Zod v4 yet** |

**Critical Zod warning:** Zod v4 shipped in early 2026 and breaks `@hookform/resolvers`. The `zodResolver` type breaks because `Resolver<input<T>>` is no longer assignable to `Resolver<output<T>>`. As of April 2026, `@hookform/resolvers` v3.x does not support Zod v4. Pin to Zod v3 until `@hookform/resolvers` v4+ ships and is stable.

```bash
npm install react-hook-form @hookform/resolvers zod
# Do NOT do: npm install zod@4
```

Zod v3 is fully functional for all use cases in this project (checkout validation, product schema, admin forms).

---

### Database & Auth

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @supabase/supabase-js | ^2.99.x | DB client, storage client, admin auth | Single client handles PostgREST queries, Auth, and Storage. v2 is the stable line |
| @supabase/ssr | latest | SSR-safe client creation | Required for correct cookie handling in Next.js App Router Route Handlers and Server Components |

**Two clients, two roles — never mix them:**

| Client | Key Used | RLS | Where Created |
|--------|----------|-----|---------------|
| `adminClient` | `SUPABASE_SERVICE_ROLE_KEY` | Bypassed entirely | Server-only files (`/api/**`, server actions) — never exported to client |
| `anonClient` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enforced | Not needed in this project — customers never hit DB directly |

This project's architecture (customers → Route Handlers → service role client → DB) means you only need one production client: the service role client inside Route Handlers. RLS is your safety net, not your primary access control for customer data.

**RLS policy design for this project:**

```sql
-- orders: only service role can insert/read (no anon/authenticated policy needed)
-- products: anon can SELECT active products only
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  TO anon
  USING (is_active = true);

-- ordering_config: anon can read (single row, controls cutoff display)
CREATE POLICY "Public can read ordering config"
  ON ordering_config FOR SELECT
  TO anon
  USING (true);
```

**Supabase Node.js version note:** `@supabase/supabase-js` v2.79.0+ dropped Node.js 18 support. Vercel's default runtime is Node.js 20 — no issue here.

**Storage pattern for product images:** Use a single public bucket named `products`. Images stored as `{product-id}/{filename}`. Public bucket means no signed URL needed for reads — just `supabase.storage.from('products').getPublicUrl(path)`. For admin uploads, gate behind admin auth in the Route Handler, then upload server-side using the service role client.

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

### Payments

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @paystack/inline-js | latest | Checkout popup | Official Paystack JS library for inline payment modal |
| @types/paystack__inline-js | latest | TypeScript types | Community-maintained DefinitelyTyped package |

**Paystack integration architecture for this project:**

1. Customer submits checkout form → Route Handler creates Paystack transaction (server-side, using secret key) → returns `access_code`
2. Client receives `access_code` → opens Paystack inline popup via `@paystack/inline-js`
3. Paystack fires webhook to `/api/webhooks/paystack` → Route Handler verifies HMAC → creates order in DB → fires Resend emails

**Webhook Route Handler — critical gotchas:**

```typescript
// /app/api/webhooks/paystack/route.ts

export const runtime = "nodejs"; // REQUIRED — Edge runtime has text encoding issues

export async function POST(req: Request) {
  // Step 1: Read raw body as TEXT first — never call req.json() before this
  const rawBody = await req.text();
  
  // Step 2: Verify HMAC signature against raw text
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");
  
  const signature = req.headers.get("x-paystack-signature");
  if (hash !== signature) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // Step 3: ONLY NOW parse to JSON
  const event = JSON.parse(rawBody);
  // ... handle event
}
```

**Auth middleware must exclude the webhook route.** If you add Next.js middleware for admin auth, add a matcher that skips `/api/webhooks/**`:

```typescript
// middleware.ts
export const config = {
  matcher: ['/((?!api/webhooks).*)'],
};
```

**Environment variable discipline:**
- `PAYSTACK_SECRET_KEY` — server only. Never prefix with `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` — safe for client (opens the popup).
- Test keys and live keys are different — webhook signature will fail if mismatched.

```bash
npm install @paystack/inline-js
npm install -D @types/paystack__inline-js
```

---

### Email

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| resend | ^4.x | Email delivery API | Best-in-class DX, React Email native support, generous free tier |
| @react-email/components | latest | Email templates | Build emails as React components with full TypeScript support |

**Pattern:**
```typescript
// /src/lib/email/resend.ts — server only
import { Resend } from 'resend';
export const resend = new Resend(process.env.RESEND_API_KEY);
```

Email templates live in `/src/emails/` as React components. Import template, render, send — all in the Route Handler after Paystack webhook verification. Never call Resend from client-side code.

**Three email flows in this project:**
1. Order confirmation → customer (fires from `/api/webhooks/paystack` after HMAC verification)
2. New order alert → admin (fires from same webhook handler)
3. Delivery reminder → all paid orders for a week (admin-triggered from admin panel, calls a Route Handler that queries orders + bulk-sends via Resend batch API)

```bash
npm install resend @react-email/components
```

---

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | — | Hosting, serverless functions, cron | Already decided; seamless Next.js deployment |
| Vercel Cron | — | Thursday cutoff automation | Native to Vercel, zero additional service needed |

**Vercel Cron setup:**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/close-orders",
      "schedule": "59 22 * * 4"
    }
  ]
}
```

**Cron security — required:**
```typescript
// /app/api/cron/close-orders/route.ts
export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ... update ordering_config.is_open = false
}
```

Vercel automatically injects `CRON_SECRET` as a bearer token on production. Set `CRON_SECRET` in Vercel environment variables. Cron jobs **only fire on production deployments**, not preview branches.

**Cron idempotency:** The Route Handler must be safe to run twice (Vercel can deliver the same event more than once). Setting `is_open = false` when it is already `false` is harmless — this is naturally idempotent.

---

## Complete Installation Command

```bash
# State & forms
npm install zustand react-hook-form @hookform/resolvers zod

# UI & animation
npm install motion sonner
npx shadcn@latest init

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Payments
npm install @paystack/inline-js
npm install -D @types/paystack__inline-js

# Email
npm install resend @react-email/components
```

---

## Alternatives Considered and Rejected

| Category | Chosen | Rejected | Why Rejected |
|----------|--------|----------|--------------|
| Animation | motion (v12) | framer-motion | Deprecated; motion is the successor package |
| State | Zustand | Redux Toolkit | RTK is overkill for a cart; 10x the boilerplate |
| State | Zustand | Jotai | Jotai's atom model is harder to persist atomically for cart |
| Validation | Zod v3 | Zod v4 | Breaks @hookform/resolvers as of April 2026 |
| Email templates | @react-email/components | MJML | React Email has first-class Resend integration and TypeScript |
| DB client | @supabase/supabase-js | Prisma + direct Postgres | Supabase client handles auth, storage, and DB in one SDK; Prisma adds complexity with no benefit given Supabase is already the DB provider |
| Payments | Paystack inline | Paystack redirect (standard) | Inline popup keeps users on the page — zero redirect friction |
| Toast | sonner (via shadcn) | shadcn toast | shadcn toast is deprecated in v4 era |
| Cron | Vercel Cron | Supabase Edge Functions cron | Vercel Cron is simpler ops — no separate edge function deploy |
| Cron | Vercel Cron | pg_cron (Postgres extension) | pg_cron runs in DB, harder to trigger Resend emails from |

---

## Environment Variables

```bash
# Public (safe for browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=

# Server only (never NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
RESEND_API_KEY=
CRON_SECRET=
```

Add `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, and `CRON_SECRET` to `.env.local` for development and to Vercel environment variables for production. Never commit these to the repo.

---

## Compatibility Matrix

| Pair | Status | Notes |
|------|--------|-------|
| Next.js 15 + React 19 | Stable | Ships together; no issues |
| Tailwind v4 + shadcn/ui | Stable | New projects start in v4 mode natively |
| motion v12 + React 19 | Stable | Full React 19 support confirmed; requires `"use client"` |
| Zustand v5 + React 19 | Stable | Uses useSyncExternalStore; concurrent-safe |
| Zod v3 + @hookform/resolvers v3 | Stable | Pin to v3; do not upgrade Zod to v4 |
| Zod v4 + @hookform/resolvers v3 | BROKEN | Type mismatch; wait for resolvers v4 |
| @supabase/supabase-js v2 + Node.js 20 | Stable | v2.79.0+ requires Node.js 20+ |
| Paystack inline + Next.js 15 | Stable | Load popup client-side only; verify webhook with `req.text()` |

---

## Sources

- Next.js 15 release notes: https://nextjs.org/blog/next-15
- Next.js 15 async request APIs: https://nextjs.org/docs/app/guides/upgrading/version-16
- shadcn/ui Tailwind v4 docs: https://ui.shadcn.com/docs/tailwind-v4
- shadcn/ui React 19 docs: https://ui.shadcn.com/docs/react-19
- Motion rebranding + upgrade guide: https://motion.dev/docs/react-upgrade-guide
- Zustand v5 React 19 support: https://github.com/pmndrs/zustand/discussions/2842
- Zustand v5 migration: https://zustand.docs.pmnd.rs/reference/migrations/migrating-to-v5
- Zod v4 breaking changes: https://zod.dev/v4/changelog
- @hookform/resolvers Zod v4 breakage: https://github.com/colinhacks/zod/issues/4992
- Paystack webhook Next.js App Router: https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi
- Paystack InlineJS docs: https://paystack.com/docs/developer-tools/inlinejs/
- @paystack/inline-js npm: https://www.npmjs.com/package/@paystack/inline-js
- Supabase JS v2 npm: https://www.npmjs.com/package/@supabase/supabase-js
- Supabase RLS docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase service role + RLS: https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z
- Supabase SSR client: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Vercel Cron docs: https://vercel.com/docs/cron-jobs
- Resend Next.js docs: https://resend.com/docs/send-with-nextjs
- React Email: https://github.com/resend/react-email
