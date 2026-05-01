# Phase 1: Foundation - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up every primitive that downstream phases build on. Nothing visible to the customer yet. Delivers: Supabase schema live with RLS (all 6 tables), version-controlled migration files, two Supabase clients (service role + SSR), Zustand cart store with localStorage persistence and SSR hydration guard, complete app route skeleton including `(customer)` and `(admin)` groups with `@drawer` default slot, a Navbar shell, shared TypeScript types, and env var documentation with type safety.

</domain>

<decisions>
## Implementation Decisions

### Database migrations
- **D-01:** Use Supabase CLI with `supabase/migrations/` folder — SQL migration files committed to git, pushed via `supabase db push`. Schema is version-controlled and reproducible.
- **D-02:** Seed data (the `ordering_config` row 1) lives in `supabase/seed.sql`, not in the migration file itself. Applied separately via `supabase db seed`. Keeps schema and data separate.
- **D-03:** RLS must be enabled in the migration SQL itself — not added manually in the dashboard after the fact. This is a hard requirement from the pitfalls research.

### Supabase clients
- **D-04:** Two distinct client factories: `lib/supabase/admin.ts` (service role key — for Route Handlers that need full DB access) and `lib/supabase/server.ts` (SSR cookie client via `@supabase/ssr` — for admin auth session management).
- **D-05:** `SUPABASE_SERVICE_ROLE_KEY` is NEVER prefixed `NEXT_PUBLIC_`. The admin client is server-only and must never be imported in Client Components.
- **D-06:** A browser-side client `lib/supabase/client.ts` using the anon key for any future client-side Supabase calls (e.g., Supabase Auth sign-in from the browser on the admin login page).

### Zustand cart store
- **D-07:** Store holds cart items only — no UI state. `isCartOpen` and similar drawer/sidebar open states live in React local state or context at the component level.
- **D-08:** localStorage persistence key: `rodo-cart`.
- **D-09:** SSR hydration guard pattern: implement `useHasHydrated` hook that returns false on server and true after `store.persist.onFinishHydration` fires. All cart-count UI (Navbar badge, cart totals) must gate on `useHasHydrated` returning true to prevent hydration mismatch errors.
- **D-10:** Cart item shape exactly as specced in the technical document: `{ productId, productName, variantLabel, prepOption, quantity, unitPriceNgn, subtotalNgn }`. All price fields are integer kobo.

### App route skeleton
- **D-11:** Full route skeleton scaffolded in Phase 1 — not deferred. Creates: `app/(customer)/layout.tsx`, `app/(customer)/shop/@drawer/default.tsx`, `app/admin/layout.tsx`.
- **D-12:** `app/(customer)/shop/@drawer/default.tsx` returns `null`. This prevents hard-refresh 404s on product URLs. Must be created in the same commit as the `@drawer` slot folder.
- **D-13:** Navbar is a real shell component `components/layout/Navbar.tsx` — correct HTML structure, logo placeholder, cart icon slot with empty badge. Phase 3 wires up the Zustand store to the badge. Not a comment placeholder.
- **D-14:** `app/(customer)/layout.tsx` renders the Navbar. `app/admin/layout.tsx` has its own layout (no customer Navbar, auth guard wired in Phase 4).

### TypeScript setup
- **D-15:** Add `types/env.d.ts` — declares all 11 environment variables in `NodeJS.ProcessEnv` interface. Accessing an undeclared env var becomes a TypeScript error. Keeps in sync with `.env.local.example`.
- **D-16:** All shared application types (`CartItem`, `Order`, `Product`, `ProductVariant`, `PrepOption`, `OrderItem`, `OrderingConfig`) live in `types/index.ts` — single file, simple imports.
- **D-17:** `tsconfig.json` — strict mode confirmed enabled. No changes needed beyond what Next.js scaffold provides.

### Package decisions (from project research)
- **D-18:** Use `motion` package (not `framer-motion`). Import from `"motion/react"`. The package was rebranded in late 2024.
- **D-19:** Pin Zod to v3. Do NOT install v4 — it breaks `@hookform/resolvers` v3.
- **D-20:** shadcn/ui initialized with Tailwind v4 mode. Use `tw-animate-css` (not the deprecated `tailwindcss-animate`). Use `sonner` for toasts.

### Claude's Discretion
- Exact SQL column order within migration file
- RLS policy names (e.g., `"customers_read_active_products"`)
- Supabase Storage bucket creation (can be done via dashboard for MVP; not blocked by Phase 1)
- Whether to install all npm dependencies in one commit or split by concern

</decisions>

<specifics>
## Specific Ideas

- The spec (Section 04) defines the exact database schema for all 6 tables — column names, types, constraints, and descriptions. The migration must follow this exactly. No deviation.
- The spec notes: "Price fields use integer kobo (1 NGN = 100 kobo) to avoid floating point issues. Divide by 100 for display." All `price_ngn` and `total_ngn` columns are `integer`, not `numeric` or `decimal`.
- `ordering_config` is a single-row config table. The spec explicitly says: "do not add more rows." Seed row must have `id = 1`.
- The Supabase pitfalls research flagged: customers have no direct DB access — all reads/writes go through server-side Route Handlers. RLS should be set up to reflect this (customer-facing tables deny anon direct writes).

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database schema (source of truth)
- `.planning/PROJECT.md` — Section "Context" covers client patterns and constraint summary
- `.planning/REQUIREMENTS.md` — FOUND-01 through FOUND-05 define acceptance criteria for this phase
- `.planning/research/STACK.md` — Package versions, shadcn/ui v4 setup, Zod v3 pin, `motion` import
- `.planning/research/ARCHITECTURE.md` — Two Supabase client pattern, RLS design, Zustand hydration guard
- `.planning/research/PITFALLS.md` — Zustand SSR hydration mismatch, `@drawer/default.tsx` 404, service role key exposure
- `.planning/research/SUMMARY.md` — Distilled critical flags from all research

### Project spec (original technical document)
- The original Rodo & Co Technical Specification v1.0 is embedded in the project setup history. Key sections: 04 (DB Schema), 06 (Folder Structure), 07 (Environment Variables). All decisions in this file are locked — do not deviate from column names, types, or constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/layout.tsx` — Existing root layout with `@vercel/speed-insights` already imported. The `(customer)` layout will be a child of this; do not duplicate SpeedInsights.
- `src/app/globals.css` — Tailwind CSS already imported. All styling continues through Tailwind.

### Established Patterns
- Bare Next.js 15 scaffold — no existing components, hooks, or utilities. Phase 1 establishes all conventions from scratch.
- TypeScript is already configured (`tsconfig.json` present). `next.config.ts` is empty — no custom config yet.

### Integration Points
- `src/app/layout.tsx` is the root shell — `(customer)/layout.tsx` fits inside it via Next.js route group nesting.
- `package.json` already has `next`, `react`, `react-dom`, `@vercel/speed-insights`, `tailwindcss`. Phase 1 installs additional packages: `@supabase/supabase-js`, `@supabase/ssr`, `zustand`, `motion`, `shadcn/ui`, `zod` (v3 pinned), `react-hook-form`, `@hookform/resolvers`, `tw-animate-css`, `sonner`.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. All items raised (migrations, Zustand, route structure, TypeScript) are Phase 1 concerns.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-16*
