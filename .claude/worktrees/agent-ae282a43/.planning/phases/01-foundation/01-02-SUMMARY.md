---
plan: 01-02
status: complete
wave: 2
---

# Plan 01-02 Execution Summary

## Tasks Completed

### Task 1 — Migration SQL, seed SQL, and three Supabase client files
- `supabase/migrations/0001_initial_schema.sql`: All 6 tables with RLS enabled
- `supabase/seed.sql`: Seeds ordering_config row 1 with is_ordering_open=true
- `src/lib/supabase/admin.ts`: Service role client (bypasses RLS, server-only)
- `src/lib/supabase/server.ts`: SSR cookie client using `await cookies()` (Next.js 15)
- `src/lib/supabase/client.ts`: Browser anon client using `createBrowserClient`
- TypeScript clean: `npx tsc --noEmit` passed with 0 errors
- Committed atomically

### Task 2 — Push migration and seed to live Supabase project (user action)
- `npx supabase@latest db push` applied `0001_initial_schema.sql`
- Seed applied via `npx supabase@latest db query --file supabase/seed.sql`
  (Note: `supabase db seed` subcommand does not exist in this CLI version)

## Tables Created

| Table | Key Columns | Anon SELECT | Notes |
|-------|-------------|-------------|-------|
| `products` | id, name, type, is_active | Yes (is_active=true only) | |
| `product_variants` | id, product_id, label, price_ngn | Yes | price_ngn in kobo |
| `product_prep_options` | id, product_id, label, extra_cost_ngn | Yes | extra_cost_ngn in kobo |
| `orders` | id, reference (UNIQUE), status, total_ngn, week_of | No | service_role only |
| `order_items` | id, order_id, product_id, quantity, unit_price_ngn | No | service_role only |
| `ordering_config` | id (CHECK id=1), is_ordering_open, next_delivery_date | Yes | single-row enforced |

## RLS Policies

- **anon_read_active_products** — products SELECT where is_active=true
- **anon_read_variants** — product_variants SELECT (all)
- **anon_read_prep_options** — product_prep_options SELECT (all)
- **anon_read_ordering_config** — ordering_config SELECT (all)
- orders: zero anon policies (deny-all for anon)
- order_items: zero anon policies (deny-all for anon)

## Seed Data Applied

`ordering_config` row 1: `is_ordering_open=true`, `next_delivery_date` = next Saturday from seed date

## Client Files

| File | Export | Key Pattern |
|------|--------|-------------|
| `admin.ts` | `supabaseAdmin` | `SUPABASE_SERVICE_ROLE_KEY` (no NEXT_PUBLIC_ prefix) |
| `server.ts` | `createSupabaseServerClient()` | `await cookies()` — Next.js 15 async API |
| `client.ts` | `createSupabaseBrowserClient()` | `createBrowserClient` with anon key |

## Security Checks

- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` absent from all source files: PASS
- orders/order_items anon RLS: deny-all (no permissive policies)
- single-row ordering_config enforced by `CHECK (id = 1)` constraint
