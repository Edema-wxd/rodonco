# Phase 4: Admin Panel - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the internal operations interface for Rodo & Co staff:
- Admin login page at `/admin` (NextAuth v5 Credentials — already wired in Phase 02.1)
- Orders management: filterable table, expandable rows with prep details, status updates, CSV export
- Product CRUD: create/edit products with variants, prep options, and Uploadthing image upload
- Analytics dashboard: order counts, revenue, top products, status breakdown
- Settings: manual ordering window toggle (`ordering_config.is_ordering_open`)

Auth (NextAuth middleware protecting `/admin/*`) was completed in Phase 02.1. This phase builds the UI and Route Handlers on top of that foundation.

</domain>

<decisions>
## Implementation Decisions

### Navigation Structure
- **D-01:** Admin uses a **persistent left sidebar** with four sections: Orders, Products, Analytics, Settings.
- **D-02:** Sidebar sections map to routes: `/admin/orders`, `/admin/products`, `/admin/analytics`, `/admin/settings`.
- **D-03:** The ordering window toggle (INFRA-03) lives on the **Settings page** — not embedded in Analytics.
- **D-04:** The existing `src/app/admin/layout.tsx` shell (header + max-7xl container) is the base. Refactor it to include the sidebar alongside `{children}`.

### Login Page
- **D-05:** Login form at `/admin` — **centered card on neutral background** (`bg-gray-50`). Fields: Email, Password. One "Sign In" button. No logo or heavy branding — this is an internal tool.
- **D-06:** After successful login, redirect to **`/admin/orders`** (the daily-use view).
- **D-07:** Login uses `signIn("credentials", { email, password, redirectTo: "/admin/orders" })` from `next-auth/react` (Client Component). Server-side session checks use `auth()` from `src/auth.ts`. Error states shown inline (e.g. "Invalid credentials" below the form).

### Orders Table
- **D-08:** Order details revealed via **inline expandable row** — clicking a row expands it in-place to show order items, prep instructions per item, allergy notes, and delivery address. No modal or drawer.
- **D-09:** Status update (ORD-05: `paid → processing → delivered`) via a **dropdown directly in the Status column** of each row. Change triggers a PATCH Route Handler call immediately.
- **D-10:** Default sort: newest first (`orders.created_at DESC`).
- **D-11:** Filters: status dropdown (`paid` / `processing` / `delivered` / `all`) and delivery week date picker.
- **D-12:** CSV export (ORD-04) downloads the **current filtered view** — client-side generation from the loaded data is fine at MVP scale.

### Product CRUD
- **D-13:** Create/edit product form opens in a **right-side drawer** — consistent with the customer-side product drawer pattern. Clicking "+ New Product" or a product row opens the drawer; the products table remains visible behind it.
- **D-14:** Variants and prep options managed as **inline editable lists** within the drawer: "+ Add variant" appends a new row, "×" removes. All saved atomically on form submit (single POST/PATCH call for product + variants + prep options together).
- **D-15:** Uploadthing image upload (`productImage` endpoint from Phase 02.1) placed at the top of the product form. Shows current image preview if one exists. Upload replaces `products.image_url`.
- **D-16:** `is_active` toggle (PROD-05) is a switch inside the product form drawer — not inline in the table (reduces accidental toggles).
- **D-17:** Product delete: a "Delete" button inside the drawer with a confirmation step (e.g., "Are you sure?" inline text, not a modal). Cascades to variants and prep options via DB foreign key `ON DELETE CASCADE`.

### Analytics Page
- **D-18:** Analytics shows four stat cards (ANLT-01 through ANLT-04): total orders this week, total revenue (NGN), top 5 products by quantity (list), status breakdown (counts per status). **No charts** — plain numbers and lists at MVP. No additional charting library.
- **D-19:** "This week" = current delivery week (Sunday–Saturday window matching `orders.week_of`).

### Settings Page
- **D-20:** Settings page has a single prominent control: the **ordering window toggle** (`is_ordering_open`). Shows current state, a toggle switch, and a "Save" button. Calls `PATCH /api/admin/config`.

### Authentication (from Phase 02.1 — confirmed for this phase)
- **D-21:** `auth()` from `src/auth.ts` is called in all admin Route Handlers and Server Components to verify session. Middleware already handles redirect; these calls are a defence-in-depth check.
- **D-22:** Sign-out button in the sidebar footer calls `signOut({ redirectTo: "/admin" })`.

### Claude's Discretion
- Shadcn/ui component selection (which components to install — Table, Sheet, Select, Badge, Switch, etc.)
- Exact Tailwind styling details within the established neutral/white admin aesthetic
- Pagination vs infinite scroll for orders (pagination is simpler and appropriate for admin)
- Whether to colocate Route Handlers under `app/api/admin/` or alongside pages — use `app/api/admin/` for clarity
- Analytics data fetching: Server Component direct DB query (no separate API route needed)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authentication (Phase 02.1 — already built)
- `src/auth.ts` — exports `auth`, `signIn`, `signOut`, `handlers`. Use `auth()` for session checks in Server Components and Route Handlers.
- `middleware.ts` — protects `/admin/:path*` via NextAuth. Do not duplicate this guard in `app/admin/layout.tsx`.
- `scripts/seed-admin.ts` — how the initial admin row is seeded (reference for `admins` table structure).

### Database schema
- `drizzle/schema.ts` — Drizzle table definitions. All DB queries use these exports with the `db` instance.
- `src/lib/db/index.ts` — server-only `db` export. Import ONLY in server files.

### Uploadthing (Phase 02.1 — already built)
- `src/app/api/uploadthing/core.ts` — `productImage` file router endpoint. Phase 4 consumes `<UploadButton routeConfig="productImage" />` or the `useUploadThing` hook.
- `src/utils/uploadthing.ts` — typed client helpers (`generateUploadButton`, `generateReactHelpers`).

### Requirements for this phase
- `.planning/REQUIREMENTS.md` §Admin sections — AUTH-01/02/03, ORD-01–05, PROD-01–05, ANLT-01–04, INFRA-03, INFRA-04

### Existing admin shell
- `src/app/admin/layout.tsx` — base layout shell to refactor (add sidebar).
- `src/app/admin/page.tsx` — placeholder login page to replace with actual form.

### No external design specs
Requirements fully captured in decisions above. Reference shadcn/ui docs for component APIs.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/auth.ts` — `auth()`, `signIn()`, `signOut()` ready to use. No setup needed.
- `src/lib/db/index.ts` — `db` instance for all Drizzle queries (server-only).
- `drizzle/schema.ts` — `products`, `product_variants`, `product_prep_options`, `orders`, `order_items`, `ordering_config`, `admins` table exports.
- `src/app/api/uploadthing/` — upload infrastructure complete. Phase 4 only needs to add the `<UploadButton>` component.
- `src/components/ui/button.tsx` — only shadcn component currently installed; more will need to be added (Table, Sheet, Select, Badge, Switch, Input, Label, etc.).

### Established Patterns
- **Route groups:** Customer pages use `(customer)` route group. Admin should use the existing `admin/` directory (no route group needed — it's already separated).
- **Server Components for data fetching:** Phase 3 fetches directly from DB in Server Components — follow the same pattern for admin pages (no client-side fetch for initial data).
- **Drizzle query pattern:** `db.select().from(table).where(eq(...))` — see Phase 03 plans for examples.
- **Tailwind + neutral palette:** Admin shell uses `bg-gray-50`, `bg-white`, `border-b`. Keep admin UI in neutral grays (not the brand warm palette from the customer shop).

### Integration Points
- `src/app/admin/layout.tsx` — refactor to sidebar layout. All admin pages render inside `{children}`.
- `src/app/admin/page.tsx` — replace placeholder with actual login form (calls `signIn()`).
- New routes needed: `/admin/orders`, `/admin/products`, `/admin/analytics`, `/admin/settings`
- New API routes: `PATCH /api/admin/orders/[id]` (status update), `POST /api/admin/products`, `PATCH /api/admin/products/[id]`, `DELETE /api/admin/products/[id]`, `PATCH /api/admin/config` (ordering toggle)

</code_context>

<specifics>
## Specific Ideas

- Admin layout should feel like a lightweight internal tool — neutral grays, no decorative elements. The customer shop has warm brand feel; the admin is the opposite: utility-first.
- The ordering toggle on Settings is the most operationally critical control — make it visually prominent (large switch, clear state label "Ordering is OPEN / CLOSED", confirmation before closing).
- CSV export for orders should include: Reference, Customer name, Phone, Email, Delivery address, Week of, Items (comma-joined names+qty), Total NGN. Used as the market shopping list.

</specifics>

<deferred>
## Deferred Ideas

- WhatsApp notification channel (ADM-01 in v2 requirements)
- Bulk order status update (ADM-02)
- Admin configurable cutoff time (ADM-03)
- Delivery reminder email trigger (NOTF-01) — this is scoped to Phase 6, not Phase 4

</deferred>

---

*Phase: 04-admin-panel*
*Context gathered: 2026-04-30*
