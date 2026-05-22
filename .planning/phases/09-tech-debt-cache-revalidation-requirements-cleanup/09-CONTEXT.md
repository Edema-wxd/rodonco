# Phase 9: Tech debt: cache revalidation + requirements cleanup - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Two distinct housekeeping tasks:

1. **Cache revalidation** — Fix the stale-cache bug where admin mutations (ordering config toggle, product CRUD) don't immediately update the customer-facing shop. Switch from passive TTL-based ISR to active tag-based invalidation via `revalidateTag`.

2. **Requirements cleanup** — Reconcile `REQUIREMENTS.md` with what's actually shipped across Phases 1–8: tick completed items, update stale tech references (Supabase → Neon/Drizzle/Uploadthing, 6 → 7 tables), and add new requirements for Phase 7–8 features not originally captured.

No new features. No new pages. No schema changes.

</domain>

<decisions>
## Implementation Decisions

### Cache invalidation — Strategy
- **D-01:** Use `revalidateTag` (tag-based, surgical) — not `revalidatePath`. Tags allow targeted invalidation without rebuilding unrelated pages.
- **D-02:** Two tags to introduce: `"ordering-config"` (for the ordering toggle / delivery config) and `"shop-products"` (for the product list and product detail pages).

### Cache invalidation — Which mutations trigger it
- **D-03:** Only **config + product mutations** trigger revalidation — not order status changes (those don't affect the shop display):
  - `PATCH /api/admin/config` → `revalidateTag("ordering-config")`
  - `POST /api/admin/products` → `revalidateTag("shop-products")`
  - `PATCH /api/admin/products/[id]` → `revalidateTag("shop-products")`
  - `DELETE /api/admin/products/[id]` → `revalidateTag("shop-products")`

### Cache invalidation — Ordering config cache
- **D-04:** Remove the `revalidate: 15` TTL from `orderingConfig.ts`'s `unstable_cache` call. Replace with `tags: ["ordering-config"]`. The cache is then only busted when the admin explicitly changes the config — no more passive 15s expiry.

### Cache invalidation — Product pages
- **D-05:** Tag product fetches in the shop with `"shop-products"`. This applies to the server-side data fetch in the shop page AND individual product pages. On product create/edit/delete, `revalidateTag("shop-products")` fires in the admin route handler — both the grid and the detail pages refresh immediately.
- **D-06:** Remove `export const revalidate = 60` from `/shop/page.tsx` and `/shop/products/[id]/page.tsx` once tag-based busting is in place. Pages become static (cached until tagged invalidation) rather than ISR.

### Requirements cleanup — Audit scope
- **D-07:** Full audit: tick shipped items as `[x]`, update stale tech references, and add new requirements for Phase 7–8 features.

### Requirements cleanup — Outdated foundation requirements
- **D-08:** Update FOUND-01 through FOUND-05 in-place to reflect the actual shipped stack:
  - FOUND-01: Neon + Drizzle ORM (not Supabase), NextAuth v5, Uploadthing (remove Framer Motion reference since it was removed)
  - FOUND-02: Remove Supabase client references — there is no Supabase client anymore
  - FOUND-03: 7 tables (add `admins` table which was missing from original count)
  - FOUND-04: Neon DB, not Supabase seed
  - FOUND-05: Update env var list to current `.env.local.example` contents
  - Mark all FOUND-01 through FOUND-05 as `[x]`

### Requirements cleanup — New Phase 7–8 requirements
- **D-09:** Add a new `### Admin Operations` section with `ADMIN-OPS-XX` IDs covering Phase 7–8 features not originally in scope:
  - Weekly prep/packing list (grouped by product/prep option)
  - Delivery manifest (itemised per customer)
  - Pending order visibility (orders in `pending` state, admin can delete)
  - Bulk status transitions (move multiple orders from paid → processing, etc.)
  - Analytics week picker (filter analytics dashboard by delivery week)
  - Activity log (admin action history)

### Requirements cleanup — Traceability table
- **D-10:** Update the traceability table at the bottom of REQUIREMENTS.md: add Phase 7 and Phase 8 rows, update the total count from 46 to the new total.

### Claude's Discretion
- Exact env var names to list in updated FOUND-05 (read `.env.local.example` directly)
- The exact ADMIN-OPS ID numbering and requirement text wording
- Whether to keep `export const dynamic = "force-dynamic"` on shop pages or remove it now that tag-based caching takes over (keep it absent — `force-dynamic` was never on shop pages)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cache revalidation — files to modify
- `src/lib/shop/orderingConfig.ts` — adds `tags: ["ordering-config"]`, removes `revalidate: 15`
- `src/app/api/admin/config/route.ts` — add `revalidateTag("ordering-config")` after DB update
- `src/app/api/admin/products/route.ts` — add `revalidateTag("shop-products")` after create
- `src/app/api/admin/products/[id]/route.ts` — add `revalidateTag("shop-products")` after PATCH/DELETE
- `src/app/(customer)/shop/page.tsx` — add fetch tag, remove `export const revalidate = 60`
- `src/app/(customer)/shop/products/[id]/page.tsx` — add fetch tag, remove `export const revalidate = 60`
- `src/lib/shop/products.ts` — may need tags added to DB fetch calls
- `src/lib/shop/productDetails.ts` — may need tags added to DB fetch calls

### Requirements cleanup — file to audit
- `.planning/REQUIREMENTS.md` — the file to update in-place
- `drizzle/schema.ts` — source of truth for current table count and names
- `.env.local.example` (if exists) — source of truth for current env vars

### Phase scope
- `.planning/ROADMAP.md` §Phase 9 — Goal and success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `unstable_cache` in `src/lib/shop/orderingConfig.ts` — already uses Next.js cache; just needs `tags` array added and `revalidate` removed
- `revalidateTag` from `"next/cache"` — import and call in each admin route handler after mutation

### Established Patterns
- Admin routes already import `auth` from `@/auth` and check session — no auth changes needed
- All admin route handlers return `NextResponse.json({ ok: true })` on success — add `revalidateTag` before the return
- Shop pages use server-side DB calls via lib functions — tags need to propagate through those lib calls into Next.js's fetch cache

### Integration Points
- `src/lib/shop/products.ts` and `src/lib/shop/productDetails.ts` are called by shop pages — if they use `unstable_cache` or tagged fetches, tags must be passed through
- `revalidateTag` must be called server-side (in Route Handlers or Server Actions) — cannot be called from client components

</code_context>

<specifics>
## Specific Ideas

- The ordering config `unstable_cache` key is currently `["shop-ordering-config-v1"]` — the new tags array should use `"ordering-config"` as the tag string (shorter, cleaner, matches the revalidateTag call site)
- Product pages (`/shop/products/[id]`) currently have a parallel route drawer setup — verify tag-based revalidation works for both the page and the drawer route

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 9-tech-debt-cache-revalidation-requirements-cleanup*
*Context gathered: 2026-05-22*
