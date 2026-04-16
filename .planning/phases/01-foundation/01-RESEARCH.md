# Phase 1: Foundation - Research

**Researched:** 2026-04-15
**Domain:** Next.js 15 App Router scaffold — Supabase schema + RLS, multi-client setup, Zustand SSR-safe cart, parallel route skeleton, TypeScript env typing
**Confidence:** HIGH (all major claims verified against project research files, official docs, and current codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Supabase CLI with `supabase/migrations/` folder — SQL migration files committed to git, pushed via `supabase db push`. Schema is version-controlled and reproducible.
- **D-02:** Seed data (the `ordering_config` row 1) lives in `supabase/seed.sql`, not in the migration file itself. Applied separately via `supabase db seed`. Keeps schema and data separate.
- **D-03:** RLS must be enabled in the migration SQL itself — not added manually in the dashboard after the fact.
- **D-04:** Two distinct client factories: `lib/supabase/admin.ts` (service role key) and `lib/supabase/server.ts` (SSR cookie client via `@supabase/ssr`).
- **D-05:** `SUPABASE_SERVICE_ROLE_KEY` is NEVER prefixed `NEXT_PUBLIC_`. The admin client is server-only and must never be imported in Client Components.
- **D-06:** A browser-side client `lib/supabase/client.ts` using the anon key.
- **D-07:** Store holds cart items only — no UI state. `isCartOpen` lives in React local state.
- **D-08:** localStorage persistence key: `rodo-cart`.
- **D-09:** SSR hydration guard: implement `useHasHydrated` hook that returns false on server and true after `store.persist.onFinishHydration` fires. All cart-count UI gates on `useHasHydrated`.
- **D-10:** Cart item shape: `{ productId, productName, variantLabel, prepOption, quantity, unitPriceNgn, subtotalNgn }`. All price fields are integer kobo.
- **D-11:** Full route skeleton scaffolded in Phase 1. Creates: `app/(customer)/layout.tsx`, `app/(customer)/shop/@drawer/default.tsx`, `app/admin/layout.tsx`.
- **D-12:** `app/(customer)/shop/@drawer/default.tsx` returns `null`. Must be created in the same commit as the `@drawer` slot folder.
- **D-13:** Navbar is a real shell component `components/layout/Navbar.tsx` — correct HTML structure, logo placeholder, cart icon slot with empty badge.
- **D-14:** `app/(customer)/layout.tsx` renders the Navbar. `app/admin/layout.tsx` has its own layout.
- **D-15:** Add `types/env.d.ts` — declares all 11 environment variables in `NodeJS.ProcessEnv` interface.
- **D-16:** All shared application types live in `types/index.ts`.
- **D-17:** `tsconfig.json` strict mode already confirmed enabled.
- **D-18:** Use `motion` package (not `framer-motion`). Import from `"motion/react"`.
- **D-19:** Pin Zod to v3. Do NOT install v4.
- **D-20:** shadcn/ui initialized with Tailwind v4 mode. Use `tw-animate-css`. Use `sonner` for toasts.

### Claude's Discretion

- Exact SQL column order within migration file
- RLS policy names (e.g., `"customers_read_active_products"`)
- Supabase Storage bucket creation (can be done via dashboard; not blocked by Phase 1)
- Whether to install all npm dependencies in one commit or split by concern

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Next.js 15 App Router project configured with TypeScript strict mode, Tailwind CSS v4, shadcn/ui, Zustand, React Hook Form, Zod, and `motion` (rebranded from Framer Motion) | Package install commands, shadcn/ui v4 init pattern, compatibility matrix verified |
| FOUND-02 | Supabase project connected with server-side client (service role) and browser client (anon key) | Two-client pattern in `lib/supabase/admin.ts` + `lib/supabase/server.ts` + `lib/supabase/client.ts` documented |
| FOUND-03 | All 6 database tables created with correct schema and RLS enabled: `products`, `product_variants`, `product_prep_options`, `orders`, `order_items`, `ordering_config` | Full SQL schema with RLS documented; migration file pattern established |
| FOUND-04 | `ordering_config` seeded with row 1 (`is_ordering_open = true`, next Saturday delivery date populated) | `supabase/seed.sql` pattern; seed command documented |
| FOUND-05 | Environment variables documented in `.env.local.example`; `.env.local` in `.gitignore` | All 11 env vars listed; `types/env.d.ts` pattern documented |

</phase_requirements>

---

## Summary

Phase 1 establishes every primitive that all subsequent phases depend on. It has no visible UI — its deliverables are infrastructure: a live database schema with RLS, three Supabase client files, a Zustand cart store guarded against SSR hydration mismatches, a Next.js parallel route skeleton with the `@drawer` slot correctly scaffolded, and complete TypeScript environment typing. Every downstream phase assumes these exist and will not function without them.

The central risks in this phase are not conceptual — the architecture is well-understood. They are execution traps: forgetting `@drawer/default.tsx` when creating the slot folder (causes hard-refresh 404s that are painful to discover later), accessing cart state without the `useHasHydrated` guard (causes React hydration errors in the Navbar badge), and prefixing `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_` (full database exposure). Each of these has a simple fix at creation time and an expensive fix if discovered in a later phase.

The Supabase CLI (`supabase`) is not installed on this machine. The plan must include a `supabase` CLI install step (or use `npx supabase`) before any migration commands can run. The `supabase db push` command is the [BLOCKING] task between writing migration files and verifying the schema.

**Primary recommendation:** Build in layers — packages first, then DB schema + push, then Supabase clients, then Zustand store + hydration hook, then route skeleton, then types. Each layer has no upstream dependency on the next and can be verified in isolation.

---

## Standard Stack

### Core (Phase 1 installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.x (v2.99.x+ confirmed) | DB client, service role writes | Single SDK for PostgREST, Auth, Storage; v2 is stable line [VERIFIED: project STACK.md] |
| `@supabase/ssr` | latest | SSR-safe Supabase client creation | Required for correct cookie handling in Next.js App Router Server Components and Route Handlers [VERIFIED: project STACK.md] |
| `zustand` | ^5.x | Cart state + localStorage persistence | v5 uses `useSyncExternalStore` natively — fully concurrent-safe with React 19 [VERIFIED: project STACK.md] |
| `motion` | ^12.x | Animation (drawer, transitions) | `framer-motion` rebranded in late 2024; install `motion`, import from `"motion/react"` [VERIFIED: project STACK.md] |
| `sonner` | latest | Toast notifications | shadcn's built-in `toast` deprecated in v4 era; `sonner` is the replacement [VERIFIED: project STACK.md] |
| `zod` | ^3.x (DO NOT upgrade to v4) | Schema validation | v4 breaks `@hookform/resolvers` v3 as of April 2026 [VERIFIED: project STACK.md] |
| `react-hook-form` | ^7.x | Form state management | Uncontrolled form pattern, zero re-render cost [VERIFIED: project STACK.md] |
| `@hookform/resolvers` | ^3.x | Bridge RHF ↔ Zod | Must use v3.x with Zod v3 [VERIFIED: project STACK.md] |
| `tw-animate-css` | latest | CSS animations for shadcn | Replaces deprecated `tailwindcss-animate` in Tailwind v4 [VERIFIED: project STACK.md] |

### Already Installed (do not reinstall)

| Library | Version | Notes |
|---------|---------|-------|
| `next` | ^15.5.15 | Already in package.json [VERIFIED: package.json] |
| `react` / `react-dom` | ^19.0.0 | Already in package.json [VERIFIED: package.json] |
| `tailwindcss` | ^4.0.0 | Already in devDependencies; globals.css uses `@import "tailwindcss"` [VERIFIED: package.json, globals.css] |
| `@vercel/speed-insights` | ^2.0.0 | Already installed; referenced in root layout — do not add again [VERIFIED: package.json, layout.tsx] |
| `typescript` | ^5 | Already in devDependencies [VERIFIED: package.json] |

### shadcn/ui Initialization (one-time CLI command, not npm install)

```bash
npx shadcn@latest init
# Select: new-york style, yes to Tailwind v4, TypeScript
# This modifies globals.css and creates components.json — do NOT manually create tailwind.config.js
```

[VERIFIED: project STACK.md — note package name is `shadcn`, not `@shadcn-ui/cli`]

### Installation Command (Phase 1 new packages only)

```bash
npm install @supabase/supabase-js @supabase/ssr zustand motion sonner zod react-hook-form @hookform/resolvers tw-animate-css
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `motion` | `framer-motion` | `framer-motion` is no longer actively developed — `motion` is the successor [LOCKED: D-18] |
| Zod v3 | Zod v4 | Zod v4 breaks `@hookform/resolvers` v3 as of April 2026 [LOCKED: D-19] |
| `tw-animate-css` | `tailwindcss-animate` | `tailwindcss-animate` deprecated in Tailwind v4 era [LOCKED: D-20] |
| `sonner` | shadcn toast | shadcn toast deprecated in v4 era [LOCKED: D-20] |

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 creates)

```
src/
├── app/
│   ├── layout.tsx               # EXISTING — root layout, do NOT add Navbar here
│   ├── globals.css              # EXISTING — Tailwind v4 @import already present
│   ├── (customer)/
│   │   ├── layout.tsx           # CREATES — renders Navbar shell; accepts { children, drawer }
│   │   └── shop/
│   │       └── @drawer/
│   │           └── default.tsx  # CREATES — returns null; CRITICAL for hard-refresh 404 prevention
│   └── admin/
│       └── layout.tsx           # CREATES — admin shell; no customer Navbar
├── components/
│   └── layout/
│       └── Navbar.tsx           # CREATES — real shell with logo + cart icon slot (empty badge)
├── lib/
│   └── supabase/
│       ├── admin.ts             # CREATES — service role client (server-only)
│       ├── server.ts            # CREATES — SSR cookie client
│       └── client.ts            # CREATES — browser anon client
├── store/
│   └── cart.ts                  # CREATES — Zustand cart with persist middleware
├── hooks/
│   └── useHasHydrated.ts        # CREATES — SSR hydration guard
└── types/
    ├── env.d.ts                 # CREATES — NodeJS.ProcessEnv declarations for all 11 vars
    └── index.ts                 # CREATES — CartItem, Order, Product, etc.

supabase/
├── migrations/
│   └── 20260415000000_initial_schema.sql  # CREATES — all 6 tables + RLS
└── seed.sql                               # CREATES — ordering_config row 1

.env.local.example                         # CREATES — all 11 vars documented
```

### Pattern 1: Database Migration with RLS Inline

**What:** All 6 tables created in a single migration file. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `CREATE POLICY` statements are in the same file as the `CREATE TABLE` — not added manually in the Supabase dashboard.

**Why:** D-03 locks this. Manual dashboard RLS is not reproducible; migration files are version-controlled and reapplied by `supabase db push` against any fresh Supabase project.

**Table design notes (from PROJECT.md Section 04, locked):**
- All price fields are `integer` (kobo, NOT `numeric` or `decimal`)
- `ordering_config` is single-row — add `CHECK (id = 1)` constraint to enforce
- `orders.paystack_reference` must have `UNIQUE` constraint (idempotency guard)
- `products.type` should be an enum or CHECK constraint: `'fresh_produce' | 'cooking_kit'`
- `orders.status` should be a CHECK constraint or enum: `'pending' | 'paid' | 'processing' | 'delivered'`

**Correct RLS pattern:**

```sql
-- Example for products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('fresh_produce', 'cooking_kit')),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anon can read active products (needed for shop page Server Components)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO anon
  USING (is_active = true);

-- ordering_config: anon can read (needed for cutoff banner)
CREATE POLICY "Anyone can view ordering config"
  ON ordering_config FOR SELECT
  TO anon
  USING (true);

-- orders, order_items: NO anon policy — service_role bypasses RLS
-- (no CREATE POLICY statement = deny all for anon by default)
```

[VERIFIED: project ARCHITECTURE.md, PITFALLS.md]

### Pattern 2: Three Supabase Clients

**What:** Three separate client factory files at `lib/supabase/`, each with a distinct role and key.

```typescript
// lib/supabase/admin.ts  — SERVER ONLY, never import in Client Components
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // never NEXT_PUBLIC_
)
```

```typescript
// lib/supabase/server.ts  — Server Components + Route Handlers needing cookie-based session
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()  // Next.js 15: cookies() is async, must await
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

```typescript
// lib/supabase/client.ts  — Browser Client Components (admin login page, future auth)
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**CRITICAL:** `cookies()` in Next.js 15 is async — it returns a Promise. The `server.ts` factory must `await cookies()`. Calling it synchronously is a Next.js 15 breaking change. [VERIFIED: project STACK.md, ARCHITECTURE.md]

[Source: ARCHITECTURE.md Pattern 2; STACK.md "Next.js 15 breaking change"]

### Pattern 3: Zustand Cart Store with SSR Hydration Guard

**What:** Two files — the store itself (`store/cart.ts`) with `persist` middleware, and a standalone hook (`hooks/useHasHydrated.ts`). Every component that renders cart-dependent data (count badge, totals) must gate on `useHasHydrated`.

**The problem:** Server renders with empty cart (no localStorage). Client hydrates with localStorage state. If cart count renders on first pass, server HTML (`0`) mismatches client DOM (`3`) → React hydration error.

**The solution:**

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

```typescript
// store/cart.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  productId: string
  productName: string
  variantLabel: string | null
  prepOption: string | null
  quantity: number
  unitPriceNgn: number  // stored as kobo integer despite field name per D-10
  subtotalNgn: number   // stored as kobo integer per D-10
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantLabel: string | null) => void
  updateQuantity: (productId: string, variantLabel: string | null, qty: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const exists = state.items.find(
          (i) => i.productId === item.productId && i.variantLabel === item.variantLabel
        )
        if (exists) {
          return {
            items: state.items.map((i) =>
              i.productId === item.productId && i.variantLabel === item.variantLabel
                ? { ...i, quantity: i.quantity + item.quantity, subtotalNgn: (i.quantity + item.quantity) * i.unitPriceNgn }
                : i
            )
          }
        }
        return { items: [...state.items, item] }
      }),
      removeItem: (productId, variantLabel) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantLabel === variantLabel)
          )
        })),
      updateQuantity: (productId, variantLabel, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantLabel === variantLabel
              ? { ...i, quantity: qty, subtotalNgn: qty * i.unitPriceNgn }
              : i
          )
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'rodo-cart' }  // D-08: localStorage key
  )
)
```

```tsx
// Usage in Navbar badge — 'use client'
export function CartBadge() {
  const hasHydrated = useHasHydrated()
  const count = useCartStore((s) => s.items.length)
  if (!hasHydrated) return <span className="w-4 h-4" />  // placeholder, same DOM shape
  return <span>{count}</span>
}
```

[VERIFIED: project ARCHITECTURE.md Pattern 4, PITFALLS.md Pitfall 6]

### Pattern 4: `@drawer` Parallel Route Skeleton

**What:** The `(customer)` layout accepts a `drawer` slot prop. The `@drawer/default.tsx` file returns `null` so unmatched slots on hard refresh render nothing instead of 404ing.

**CRITICAL file that must exist:**

```typescript
// app/(customer)/shop/@drawer/default.tsx
export default function DrawerDefault() {
  return null
}
```

**Layout that consumes the slot:**

```tsx
// app/(customer)/layout.tsx
import { Navbar } from '@/components/layout/Navbar'

export default function CustomerLayout({
  children,
  drawer,
}: {
  children: React.ReactNode
  drawer: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      {children}
      {drawer}
    </>
  )
}
```

**Why `(.)` not `(..)` for intercepting routes:** The `@drawer` folder is a slot, not a route segment. Next.js does not count slot folders when resolving intercepting route depth. Use `(.)` (same segment) even though the file is physically two directories deeper. [VERIFIED: project ARCHITECTURE.md Pattern 1]

**Phase 1 only creates the skeleton** — `default.tsx` returning null. The actual intercepting route `(.)products/[id]/page.tsx` is scaffolded in Phase 3.

### Pattern 5: TypeScript Environment Variable Declarations

**What:** `types/env.d.ts` augments the `NodeJS.ProcessEnv` interface so TypeScript flags any access to undeclared env vars as a type error.

```typescript
// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    // Public (browser-safe)
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: string

    // Server-only (never NEXT_PUBLIC_)
    SUPABASE_SERVICE_ROLE_KEY: string
    PAYSTACK_SECRET_KEY: string
    RESEND_API_KEY: string
    CRON_SECRET: string

    // Standard Node/Next.js
    NODE_ENV: 'development' | 'test' | 'production'
  }
}
```

Count of declared vars: 8 application vars + `NODE_ENV` = 9 declared here. CONTEXT.md mentions "11 env vars" — the remaining vars (e.g., `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`) should be confirmed and added. The planner should list all 11 in the env.d.ts task.

[Source: CONTEXT.md D-15; STACK.md Environment Variables section]

### Anti-Patterns to Avoid

- **`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`:** Any `NEXT_PUBLIC_` prefix on the service role key exposes the entire database to the browser. `supabaseAdmin` import in a Client Component is the trigger. [CRITICAL — PITFALLS.md Pitfall 8]
- **`cookies()` without await:** In Next.js 15, `cookies()` is async. Calling it synchronously in `server.ts` silently returns the wrong type. Always `await cookies()`. [PITFALLS.md via STACK.md]
- **`@drawer` folder without `default.tsx`:** Creating the `@drawer/` slot folder without its `default.tsx` means any hard-refresh of a shop URL 404s. Create them atomically in the same commit. [CRITICAL — PITFALLS.md Pitfall 7]
- **Cart state in Server Components:** `useCartStore` can only be called inside Client Components. Any attempt to access it in a Server Component will throw at runtime.
- **`tailwind.config.js` creation:** Tailwind v4 uses CSS-first config via `@import "tailwindcss"`. Creating a `tailwind.config.js` will conflict and break the build. [VERIFIED: project STACK.md]
- **`import { motion } from 'framer-motion'`:** Wrong package. Use `motion` package with `import { motion } from 'motion/react'`. [LOCKED: D-18]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage persistence with hydration guard | Custom useState + window.localStorage sync | Zustand `persist` middleware + `useHasHydrated` hook | Edge cases: server-side undefined, race conditions between hydration and render, tab sync |
| Supabase SSR cookie management | Manual cookie read/write in route handlers | `@supabase/ssr` `createServerClient` | Gets refresh token rotation, Next.js 15 cookie API, and session invalidation right |
| Toast notifications | Custom toast component | `sonner` | Browser stack management, accessibility, animation handled; shadcn's native toast deprecated |
| Form validation | Custom validator functions | Zod schemas + `zodResolver` | Type inference from schema to form values is a solved problem |
| Accessible UI primitives (Dialog, Select, etc.) | Custom modal/dropdown | shadcn/ui components | Radix UI accessibility primitives; focus trap, keyboard nav, ARIA all handled |

**Key insight:** The value of this phase is not custom code — it is wiring together the right primitives correctly from the start. Every item in this table represents a class of bugs that will cost days to diagnose if hand-rolled.

---

## Common Pitfalls

### Pitfall 1: `@drawer/default.tsx` Missing on Slot Creation
**What goes wrong:** `app/(customer)/shop/@drawer/` folder created, but `default.tsx` omitted. Works fine during client-side navigation. Hard-refresh or direct URL to any `/shop/*` URL returns 404 for the slot, breaking the layout.
**Why it happens:** Developers create the folder and the intercepting route pages, but forget the fallback file.
**How to avoid:** Create `default.tsx` returning `null` in the same atomic commit as the `@drawer/` folder. The plan task must list both files.
**Warning signs:** `/shop` works during soft navigation, 404s on browser refresh.
[VERIFIED: PITFALLS.md Pitfall 7]

### Pitfall 2: Zustand Cart Badge Hydration Mismatch
**What goes wrong:** `useCartStore((s) => s.items.length)` accessed directly in Navbar without `useHasHydrated` guard. Server renders `0`. Client hydrates from localStorage with e.g. `3`. React throws hydration error.
**Why it happens:** The `persist` middleware reads localStorage only on the client, after mount. The first render on both server and client must produce identical output.
**How to avoid:** `useHasHydrated` hook gates any cart-count-dependent render. Return a placeholder (same DOM shape) on server.
**Warning signs:** `Hydration failed because the initial UI does not match what was rendered on the server` in browser console; cart badge flickers.
[VERIFIED: PITFALLS.md Pitfall 6, ARCHITECTURE.md Pattern 4]

### Pitfall 3: `cookies()` Not Awaited in `server.ts`
**What goes wrong:** `const cookieStore = cookies()` (without `await`) in the Supabase server client factory. Next.js 15 made `cookies()` return a Promise. Accessing `.getAll()` on the Promise object instead of the resolved value returns undefined. Auth sessions never work.
**Why it happens:** Next.js 14 `cookies()` was synchronous. Migration guides and LLM training data still show the old pattern.
**How to avoid:** Always `const cookieStore = await cookies()` in `lib/supabase/server.ts`. Since the function is async, mark it `export async function createSupabaseServerClient()`.
**Warning signs:** `cookieStore.getAll is not a function` runtime error; Supabase server client always returns empty session.
[VERIFIED: STACK.md "Next.js 15 breaking change"]

### Pitfall 4: `SUPABASE_SERVICE_ROLE_KEY` Exposed in Client Bundle
**What goes wrong:** `process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` used in any file, or `lib/supabase/admin.ts` imported inside a `'use client'` component. The service role key bypasses all RLS — full database read/write/delete for anyone with DevTools.
**Why it happens:** Single-file Supabase setup, or copy-paste error from tutorial that uses a single client.
**How to avoid:** Keep three separate files. `admin.ts` import must only appear in Route Handlers, Server Actions, and server-only utilities. TypeScript path aliasing will not prevent this — it requires developer discipline and code review.
**Warning signs:** `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` anywhere in codebase. Service role key visible in browser Network tab.
[VERIFIED: PITFALLS.md Pitfall 8, ARCHITECTURE.md Pattern 2]

### Pitfall 5: RLS Enabled in Dashboard, Not Migration
**What goes wrong:** Tables created in migration SQL without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Developer then manually enables RLS in the Supabase dashboard. Works in development, but if the project is ever reset, cloned, or migrated to a new Supabase project, RLS is silently missing.
**Why it happens:** Dashboard toggle is visible and easy; developers forget to add the SQL.
**How to avoid:** Every `CREATE TABLE` in the migration file must be followed by `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;`. D-03 locks this.
**Warning signs:** `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` shows `rowsecurity = false` for any table.
[VERIFIED: PITFALLS.md Pitfall 9, CONTEXT.md D-03]

### Pitfall 6: Supabase CLI Not Installed
**What goes wrong:** `supabase db push` and `supabase db seed` commands fail with `command not found`. The migration files exist on disk but the schema is never applied to the live Supabase project.
**Why it happens:** Supabase CLI is not installed on this machine (verified: `supabase` not found via `which supabase`).
**How to avoid:** Install the CLI before attempting any migration commands. See Environment Availability section.
**Warning signs:** `supabase: command not found` when running migration tasks.
[VERIFIED: Environment check in this research session]

---

## Code Examples

### Migration File Structure

```sql
-- supabase/migrations/20260415000000_initial_schema.sql
-- Source: CONTEXT.md D-01, PROJECT.md schema section, ARCHITECTURE.md Pattern 2

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  type        TEXT        NOT NULL CHECK (type IN ('fresh_produce', 'cooking_kit')),
  image_url   TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT TO anon USING (is_active = true);

-- ============================================================
-- PRODUCT VARIANTS (size options for cooking kits)
-- ============================================================
CREATE TABLE product_variants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL,
  price_ngn   INTEGER     NOT NULL,  -- stored in kobo
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active product variants"
  ON product_variants FOR SELECT TO anon
  USING (is_active = true);

-- ============================================================
-- PRODUCT PREP OPTIONS
-- ============================================================
CREATE TABLE product_prep_options (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE product_prep_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active prep options"
  ON product_prep_options FOR SELECT TO anon USING (is_active = true);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  paystack_reference  TEXT        NOT NULL UNIQUE,  -- idempotency key
  customer_name       TEXT        NOT NULL,
  customer_email      TEXT        NOT NULL,
  customer_phone      TEXT        NOT NULL,
  delivery_address    TEXT        NOT NULL,
  allergy_notes       TEXT,
  total_ngn           INTEGER     NOT NULL,  -- stored in kobo
  status              TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'paid', 'processing', 'delivered')),
  delivery_date       DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- No anon policy: service_role bypasses RLS; anon cannot read orders

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID        NOT NULL REFERENCES products(id),
  variant_id      UUID        REFERENCES product_variants(id),
  prep_option_id  UUID        REFERENCES product_prep_options(id),
  product_name    TEXT        NOT NULL,
  variant_label   TEXT,
  prep_option     TEXT,
  quantity        INTEGER     NOT NULL CHECK (quantity > 0),
  unit_price_ngn  INTEGER     NOT NULL,  -- kobo
  subtotal_ngn    INTEGER     NOT NULL,  -- kobo
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- No anon policy: same as orders

-- ============================================================
-- ORDERING CONFIG (single-row table — id must always be 1)
-- ============================================================
CREATE TABLE ordering_config (
  id               INTEGER     PRIMARY KEY CHECK (id = 1),  -- enforces single-row
  is_ordering_open BOOLEAN     NOT NULL DEFAULT true,
  delivery_date    DATE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE ordering_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ordering config"
  ON ordering_config FOR SELECT TO anon USING (true);
```

### Seed File

```sql
-- supabase/seed.sql
-- Source: CONTEXT.md D-02, FOUND-04
-- Applied via: supabase db seed

INSERT INTO ordering_config (id, is_ordering_open, delivery_date)
VALUES (
  1,
  true,
  -- Next Saturday from seed date — update manually or compute at seed time
  (CURRENT_DATE + (6 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER % 7 + 7) :: DATE
)
ON CONFLICT (id) DO NOTHING;
```

### `.env.local.example`

```bash
# .env.local.example
# Copy to .env.local and fill in values. Never commit .env.local.

# ────────────────────────────────────────────────
# Supabase — get from Supabase Dashboard > Settings > API
# ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # SERVER ONLY — never NEXT_PUBLIC_

# ────────────────────────────────────────────────
# Paystack — get from Paystack Dashboard > Settings > API
# ────────────────────────────────────────────────
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_SECRET_KEY=sk_test_your_secret_key  # SERVER ONLY — never NEXT_PUBLIC_

# ────────────────────────────────────────────────
# Resend — get from resend.com > API Keys
# ────────────────────────────────────────────────
RESEND_API_KEY=re_your_api_key_here  # SERVER ONLY

# ────────────────────────────────────────────────
# Vercel Cron — set any strong random string; Vercel injects it automatically
# ────────────────────────────────────────────────
CRON_SECRET=your_random_secret_here  # SERVER ONLY

# ────────────────────────────────────────────────
# App
# ────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import { motion } from 'framer-motion'` | `import { motion } from 'motion/react'` | Late 2024 | Package renamed; install `motion` not `framer-motion` |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | Old package deprecated; `@supabase/ssr` is the current standard |
| `tailwindcss-animate` (shadcn) | `tw-animate-css` | Tailwind v4 release | `tailwindcss-animate` incompatible with v4 CSS-first config |
| `tailwind.config.js` | CSS `@import "tailwindcss"` + theme vars in CSS | Tailwind v4 | No JS config file; all config in CSS |
| `cookies()` synchronous | `await cookies()` | Next.js 15 | Async request APIs; silent bug if not awaited |
| `npx create-next-app` with `shadcn-ui` CLI | `npx shadcn@latest init` | 2024 | Package renamed from `shadcn-ui` to `shadcn` |
| shadcn `toast` component | `sonner` | shadcn v4 era | Native toast deprecated |
| Zustand `getDefaultMiddleware` pattern | Zustand v5 `create<T>()()` | Zustand v5 | New double-invoke pattern; v5 is fully React 19 compatible |
| `@hookform/resolvers` with Zod v4 | Zod v3 pinned until resolvers v4+ ships | April 2026 | Breaking type incompatibility |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All npm operations | Yes | v25.2.1 | — |
| npm | Package install | Yes | 11.11.1 | — |
| Supabase CLI (`supabase`) | `supabase db push`, `supabase db seed` | No | — | Use `npx supabase@latest` (downloads on first run) |
| TypeScript | Build, type-check | Yes | ^5 (devDep) | — |
| Next.js dev server | Smoke testing | Yes | ^15.5.15 | — |

**Missing dependencies with no fallback:**

None — `supabase` CLI can be run via `npx supabase@latest` without a global install.

**Missing dependencies with fallback:**

- `supabase` (global CLI): Not globally installed. Use `npx supabase@latest db push` and `npx supabase@latest db seed` throughout the plan. Alternatively, install globally with `brew install supabase/tap/supabase` or `npm install -g supabase`. The plan must ensure one of these approaches is executed before the [BLOCKING] migration push task.

---

## Validation Architecture

This phase has no automated test suite (no test framework configured, and Phase 1 is pure infrastructure with no business logic to unit test). Verification is done through a combination of CLI commands, TypeScript compilation, and targeted smoke tests.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured — Phase 1 does not install a test runner |
| Config file | None |
| Quick run command | `npx tsc --noEmit` (type-check only) |
| Full suite command | `npm run build` (full Next.js build smoke test) |

No unit test files need to be created in Phase 1. The planner should not include jest/vitest setup tasks — that is a separate concern not required by FOUND-01 through FOUND-05.

---

### Success Criteria 1: All 6 Tables Exist with RLS + Seed Row

**Verification method:** Run in Supabase SQL Editor (or via CLI):

```sql
-- Check all 6 tables exist with RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: 6 rows, all with rowsecurity = true

-- Check ordering_config seed row
SELECT id, is_ordering_open, delivery_date FROM ordering_config WHERE id = 1;
-- Expected: 1 row with is_ordering_open = true
```

**Automated CLI equivalent:**
```bash
npx supabase@latest db diff --schema public
# Should show empty diff (schema matches migration)
```

**What "RLS enabled" actually means:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` being present in the migration is necessary but not sufficient for actual enforcement. Verify via `rowsecurity = true` in `pg_tables`, not just by reading the migration file. The Supabase dashboard "Authentication > Policies" tab shows active policies per table.

**Anon read test (products and ordering_config only):**
```bash
# From terminal — confirms anon can read products (RLS policy working)
curl "https://your-project.supabase.co/rest/v1/products?select=id,name&is_active=eq.true" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
# Expected: 200 with empty array [] (no products seeded yet) or product rows

# Confirm anon CANNOT read orders (no policy = denied)
curl "https://your-project.supabase.co/rest/v1/orders?select=id" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
# Expected: 200 with [] (RLS blocks all rows) or 401
```

---

### Success Criteria 2: Supabase Clients Import Without Error

**Verification method:** TypeScript compilation catches import issues.

```bash
# From project root
npx tsc --noEmit
# Expected: 0 errors

# Additional check: Next.js build catches server-only violations
npm run build
# Expected: Build succeeds, no "attempted to import server-only" errors
```

**Manual check for service role key exposure:**
```bash
# Confirm SUPABASE_SERVICE_ROLE_KEY is never NEXT_PUBLIC_
grep -r "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY" ./src
# Expected: no output (zero matches)

# Confirm admin client only imports in server files
grep -r "supabase/admin" ./src/app --include="*.tsx" --include="*.ts" | grep -v "route.ts" | grep -v "actions.ts"
# Expected: no output (admin.ts only imported in route handlers)
```

**Functional smoke test (requires dev server):**
Create a temporary test Route Handler at `app/api/health/route.ts`:
```typescript
import { supabaseAdmin } from '@/lib/supabase/admin'
export async function GET() {
  const { data, error } = await supabaseAdmin.from('ordering_config').select('id').single()
  return Response.json({ ok: !error, data })
}
```
Hit `GET /api/health` → expect `{ ok: true, data: { id: 1 } }`. Delete the file after verification.

---

### Success Criteria 3: Zustand Store + `useHasHydrated` — No Hydration Error

**Verification method:** The hydration guard prevents mismatches, but verifying it requires a browser render. The closest without a browser is TypeScript compilation + a deliberate anti-pattern check.

**TypeScript check:**
```bash
npx tsc --noEmit
# Expected: 0 errors — store and hook compile cleanly
```

**Anti-pattern check (absence of wrong pattern):**
```bash
# Confirm no Server Component imports useCartStore
grep -r "useCartStore\|useHasHydrated" ./src/app --include="*.tsx" | grep -v "use client"
# Expected: only files that have 'use client' directive use these hooks
```

**Manual browser verification (required for full confidence):**
```bash
npm run dev
# Open http://localhost:3000
# Open browser DevTools Console
# Expected: ZERO "Hydration failed" errors
# Expected: Cart badge renders a placeholder initially, then count after hydration
```

**localStorage persistence check:**
```
1. Open /shop (or any customer route once Phase 2 exists)
2. Run in console: localStorage.getItem('rodo-cart')
3. Expected: null (fresh session) or JSON string matching CartItem[] shape
4. Expected key name: 'rodo-cart' (not 'cart', 'zustand-cart', etc.)
```

**Note on server-side verification:** There is no purely server-side way to verify that the hydration guard works — it is by definition a client-side runtime behavior. The TypeScript checks and anti-pattern grep provide static confidence; the browser test provides dynamic confidence.

---

### Success Criteria 4: `@drawer/default.tsx` Prevents Hard-Refresh 404

**Verification method:**

**File existence check (static):**
```bash
ls /Users/mac/Documents/GitHub/rodonco/src/app/\(customer\)/shop/@drawer/default.tsx
# Expected: file exists (ls returns 0 exit code)
```

**Content check:**
```bash
cat /Users/mac/Documents/GitHub/rodonco/src/app/\(customer\)/shop/@drawer/default.tsx
# Expected: contains "return null" — a default export returning null
```

**Layout prop check (static):**
```bash
grep -n "drawer" /Users/mac/Documents/GitHub/rodonco/src/app/\(customer\)/layout.tsx
# Expected: "drawer: React.ReactNode" in props type AND {drawer} in JSX return
```

**Dynamic test (requires dev server):**
```bash
npm run dev
# Navigate to http://localhost:3000/shop (or any (customer) route)
# In the browser address bar, press F5 (hard refresh)
# Expected: page loads without 404
# Expected: no "Missing default export" error in terminal

# Next.js CLI check:
npm run build
# Expected: successful build (Next.js validates slot structure at build time)
```

---

### Success Criteria 5: `.env.local.example` Documents All Variables; `.env.local` in `.gitignore`

**Verification method:**

```bash
# Check .env.local.example exists
ls /Users/mac/Documents/GitHub/rodonco/.env.local.example
# Expected: file exists

# Check all 11 vars are present (adjust count after planner confirms exact list)
grep -c "^[A-Z]" /Users/mac/Documents/GitHub/rodonco/.env.local.example
# Expected: count matches number of declared vars in types/env.d.ts

# Check .gitignore contains .env.local
grep "\.env\.local" /Users/mac/Documents/GitHub/rodonco/.gitignore
# Expected: ".env.local" line present (not just ".env")

# Confirm .env.local is NOT tracked by git (if it exists)
git -C /Users/mac/Documents/GitHub/rodonco ls-files --error-unmatch .env.local 2>&1
# Expected: "error: pathspec '.env.local' did not match any file(s)" (not tracked)
```

---

### Phase Gate Summary

Before calling this phase complete, ALL of the following must pass:

| Check | Command | Pass Condition |
|-------|---------|----------------|
| TypeScript clean | `npx tsc --noEmit` | 0 errors |
| Next.js build | `npm run build` | Successful build |
| 6 tables with RLS | Supabase SQL: `pg_tables` query | All 6 rows, `rowsecurity = true` |
| Seed row | Supabase SQL: ordering_config query | 1 row, `id=1`, `is_ordering_open=true` |
| No service role key exposure | `grep NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ./src` | 0 matches |
| `default.tsx` exists | `ls src/app/(customer)/shop/@drawer/default.tsx` | File present |
| `.env.local` gitignored | `grep "\.env\.local" .gitignore` | Match found |
| Admin client server-only | `grep -r "supabase/admin" ./src/app/**/*.tsx` | 0 matches (only in route.ts) |
| No hard-refresh 404 | Browser: hard refresh `/shop` route | 200 response, no 404 |
| Hydration guard present | `grep -r "useHasHydrated" ./src/components` | CartBadge (or equivalent) uses hook |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 11 env vars referenced in CONTEXT.md D-15 are the 8 listed in STACK.md plus `NODE_ENV`, `NEXT_PUBLIC_APP_URL`, and one more (e.g., `ADMIN_EMAIL`) | TypeScript Setup, `.env.local.example` example | `types/env.d.ts` will be missing some vars; TypeScript won't catch undeclared vars |
| A2 | `supabase/migrations/` should be at project root (not `src/supabase/`) based on standard Supabase CLI conventions | Architecture Patterns | `supabase db push` won't find migrations if path is wrong |
| A3 | The `ordering_config` column is named `is_ordering_open` (FOUND-03 says `is_ordering_open`, ARCHITECTURE.md says `is_open`) — FOUND-03 is the locked requirement | Migration SQL | Column name mismatch between migration and application code |
| A4 | Phase 1 does NOT create intercepting route pages inside `@drawer/` — that is Phase 3. Only `default.tsx` returning null is needed now | Architecture Patterns | If planner includes intercepting routes in Phase 1, it creates scope creep |

**Note on A3:** FOUND-03 uses `is_ordering_open` in the seed description. ARCHITECTURE.md Pattern 1 uses `is_open`. The migration SQL in this research uses `is_ordering_open` to match FOUND-04 and FOUND-05's explicit success criteria. The planner should verify this against the original technical spec.

---

## Open Questions

1. **Exact count and names of the 11 env vars**
   - What we know: STACK.md lists 7 app vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `CRON_SECRET`) plus `NODE_ENV` = 8
   - What's unclear: CONTEXT.md D-15 says "all 11 environment variables." The additional 3 are not explicitly listed.
   - Recommendation: Planner should include a task to enumerate all 11 from the original technical spec (Section 07 per CONTEXT.md canonical refs) before writing `types/env.d.ts`. Likely candidates: `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`, `RESEND_FROM_EMAIL`.

2. **`is_ordering_open` vs `is_open` column name**
   - What we know: FOUND-04 says `is_ordering_open = true`. ARCHITECTURE.md says `is_open` in the UPDATE statement.
   - What's unclear: Which is the locked column name from the original tech spec?
   - Recommendation: Use `is_ordering_open` (matches FOUND-04 wording). Planner should note this discrepancy as a consistency check task.

3. **`supabase db push` vs `supabase migration up` command**
   - What we know: CONTEXT.md D-01 specifies `supabase db push`. `supabase db push` applies all pending migrations to the linked remote project.
   - What's unclear: Whether the Supabase project is already linked (requires `supabase link --project-ref`).
   - Recommendation: The [BLOCKING] migration task should include both `npx supabase@latest link --project-ref <ref>` (if not already linked) and `npx supabase@latest db push`.

---

## Sources

### Primary (HIGH confidence)
- `/Users/mac/Documents/GitHub/rodonco/.planning/research/STACK.md` — verified stack, versions, compatibility matrix
- `/Users/mac/Documents/GitHub/rodonco/.planning/research/ARCHITECTURE.md` — all 6 patterns, Supabase client code, Zustand store code, drawer pattern
- `/Users/mac/Documents/GitHub/rodonco/.planning/research/PITFALLS.md` — all 15 pitfalls with code examples
- `/Users/mac/Documents/GitHub/rodonco/.planning/phases/01-foundation/01-CONTEXT.md` — all 20 locked decisions
- `/Users/mac/Documents/GitHub/rodonco/package.json` — confirmed current dependencies
- `/Users/mac/Documents/GitHub/rodonco/src/app/layout.tsx` — confirmed existing root layout structure
- `/Users/mac/Documents/GitHub/rodonco/src/app/globals.css` — confirmed Tailwind v4 CSS import

### Secondary (MEDIUM confidence)
- `/Users/mac/Documents/GitHub/rodonco/.planning/REQUIREMENTS.md` — FOUND-01 through FOUND-05 acceptance criteria
- `/Users/mac/Documents/GitHub/rodonco/.planning/PROJECT.md` — schema table list, column conventions

### Environment Checks (VERIFIED in this session)
- `which supabase` → not installed; `npx supabase@latest` is the fallback
- `node --version` → v25.2.1 (compatible)
- `npm --version` → 11.11.1 (compatible)
- `cat globals.css` → `@import "tailwindcss"` present (Tailwind v4 confirmed)
- `cat tsconfig.json` → `"strict": true` confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against project STACK.md which cites official sources
- Architecture: HIGH — all patterns sourced from project ARCHITECTURE.md and PITFALLS.md
- Pitfalls: HIGH — PITFALLS.md is comprehensive and sourced from official docs
- Validation: MEDIUM — verification commands are correct but some require browser/live DB that can't be pre-validated

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable stack choices; Zustand, Next.js, Supabase all stable release lines)
