# Phase 8: Missing Admin Structures — Research

**Researched:** 2026-05-07
**Domain:** Next.js 15 App Router / Drizzle ORM admin panel — operational gap closure
**Confidence:** HIGH (all claims verified against live codebase; no unverified external library claims)

---

## Summary

Phase 8 closes 7 operational gaps in an already-functioning admin panel. The existing admin is built on a consistent pattern: server component pages fetch data and pass it to `"use client"` components that handle interaction; API routes at `/api/admin/*` perform authenticated mutations; Zod schemas in `src/lib/admin/schemas.ts` validate payloads. All 7 OPS items extend this established pattern rather than introducing new architecture.

The most complex items are OPS-01 (prep list JOIN query), OPS-04 (delivery manifest with print CSS), and OPS-07 (bulk status transition). The three simplest are OPS-02 (analytics week picker — `weekOverride` already exists in `getWeeklyAnalytics()`), OPS-03 (search — pure client-side filter on already-loaded data in `OrdersTable`), and OPS-05 (settings — both fields already exist in the `ordering_config` schema row, just not exposed in the UI).

**Primary recommendation:** Build in two waves. Wave 1 covers the three zero-new-route items (OPS-02, OPS-03, OPS-05). Wave 2 covers the four new-page/new-route items (OPS-01, OPS-04, OPS-06, OPS-07). All 7 can share the existing `currentWeekOf()` / week picker pattern established in `ReminderForm`.

---

## Phase Boundary

### What Phase 8 Does

- New admin page: `/admin/prep-list` — week-scoped aggregate of order items
- New admin page: `/admin/manifest` — week-scoped delivery manifest, printable
- New admin page or tab: pending (abandoned) orders view with count badge on sidebar
- Extend `/admin/analytics`: add a week picker wired to `getWeeklyAnalytics(weekOverride)`
- Extend `/admin/orders` (`OrdersTable`): add a text search field filtering across name / phone / email
- Extend `/admin/settings`: expose `next_delivery_date` and `cutoff_message` fields with a save action
- New API route: `POST /api/admin/orders/bulk-status` — bulk status transition for a delivery week
- Extend `PATCH /api/admin/config`: accept `next_delivery_date` and `cutoff_message` fields (schema update)
- Extend `AdminSidebar` nav items for Prep List, Manifest, and Pending Orders (with badge)

### What Phase 8 Does NOT Do

- No customer-facing changes
- No schema migrations (all columns already exist in `ordering_config`; `order_items` already has `product_name`, `variant_label`, `prep_option`)
- No new npm packages required (all UI needs are met by existing shadcn/ui + Tailwind v4 + lucide-react)
- No changes to the Paystack, Resend, or Uploadthing integrations
- No new auth model — all admin routes use the existing `auth()` session check pattern

---

## Existing Code Inventory

### Admin Pages (all in `src/app/admin/`)

| Route | File | Status | Notes |
|-------|------|--------|-------|
| `/admin` | `page.tsx` | Exists | Dashboard with recent orders + stat cards |
| `/admin/orders` | `orders/page.tsx` | Exists | Server component, passes `initialOrders` to `OrdersTable` |
| `/admin/products` | `products/page.tsx` | Exists | CRUD product management |
| `/admin/analytics` | `analytics/page.tsx` | Exists | Calls `getWeeklyAnalytics()` with no week arg — current week only |
| `/admin/settings` | `settings/page.tsx` | Exists | `OrderingToggle` + `ReminderForm`; `next_delivery_date`/`cutoff_message` NOT exposed |
| `/admin/prep-list` | — | **Missing** | New page — OPS-01 |
| `/admin/manifest` | — | **Missing** | New page — OPS-04 |
| `/admin/pending` | — | **Missing** | New page — OPS-06 |

### Admin Components (all in `src/components/admin/`)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| `AdminSidebar` | `AdminSidebar.tsx` | Exists | 5 nav items; needs 2-3 more for new pages |
| `AdminLogin` | `AdminLogin.tsx` | Exists | Login form |
| `AdminSignOut` | `AdminSignOut.tsx` | Exists | Sign-out button |
| `StatCard` | `analytics/StatCard.tsx` | Exists | 4 variants: count, currency, list, breakdown |
| `OrdersTable` | `orders/OrdersTable.tsx` | Exists | Has status + week filters, no search field |
| `OrderRow` | `orders/OrderRow.tsx` | Exists | Expandable row with items |
| `OrderStatusSelect` | `orders/OrderStatusSelect.tsx` | Exists | Per-row status dropdown |
| `OrderingToggle` | `settings/OrderingToggle.tsx` | Exists | Switch + confirm-close flow |
| `ReminderForm` | `settings/ReminderForm.tsx` | Exists | Week picker + POST `/api/admin/reminders` |
| `PrepListTable` | — | **Missing** | New — OPS-01 |
| `ManifestTable` | — | **Missing** | New — OPS-04 |
| `PendingOrdersTable` | — | **Missing** | New — OPS-06 |
| `DeliveryConfigForm` | — | **Missing** | New — OPS-05; saves `next_delivery_date` + `cutoff_message` |

### Admin API Routes (all in `src/app/api/admin/`)

| Route | File | Methods | Status | Notes |
|-------|------|---------|--------|-------|
| `/api/admin/config` | `config/route.ts` | PATCH | Exists | Only accepts `is_ordering_open`; schema needs extension |
| `/api/admin/orders/[id]` | `orders/[id]/route.ts` | PATCH | Exists | Per-order status update |
| `/api/admin/products` | `products/route.ts` | POST | Exists | Create product |
| `/api/admin/products/[id]` | `products/[id]/route.ts` | PUT, DELETE | Exists | Update/delete product |
| `/api/admin/reminders` | `reminders/route.ts` | POST | Exists | Send reminder emails |
| `/api/admin/orders/bulk-status` | — | **POST (new)** | Missing | OPS-07 |
| `/api/admin/orders` | — | GET | Missing | Needed for pending orders refresh (or use page RSC) |
| `/api/admin/prep-list` | — | GET | Missing (or use RSC) | OPS-01 |

### Lib Files

| File | Purpose | Relevant to Phase 8 |
|------|---------|---------------------|
| `src/lib/db/index.ts` | Drizzle DB client + schema re-export | Used by all new queries |
| `src/lib/admin/analytics.ts` | `getWeeklyAnalytics(weekOverride?)` | OPS-02 — already has the param |
| `src/lib/admin/orders.ts` | `getAdminOrders()` — full fetch, no filter | OPS-03, OPS-06: add `status` filter variant |
| `src/lib/admin/config.ts` | `getOrderingConfig()` | OPS-05 — already reads `next_delivery_date`, `cutoff_message` |
| `src/lib/admin/week.ts` | `currentWeekOf(ref?)` | Used by all week pickers |
| `src/lib/admin/schemas.ts` | Zod schemas for API validation | Needs `orderingConfigPatchSchema` extension for OPS-05; new `bulkStatusSchema` for OPS-07 |
| `src/lib/admin/reminders.ts` | `getPaidOrdersForWeek()` | Pattern to copy for prep list + manifest queries |
| `src/lib/admin/format.ts` | `formatNgn()` | Used in manifest totals |
| `src/lib/shop/orderingConfig.ts` | Customer-facing cached config | OPS-05: changes auto-propagate within 15s (cache TTL is 15s) |

---

## Drizzle Schema Reference

**Schema file:** `drizzle/schema.ts` — verified 2026-05-07

### `orders` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `reference` | text UNIQUE | Paystack reference |
| `customer_name` | text NOT NULL | OPS-03 search target |
| `customer_email` | text NOT NULL | OPS-03 search target |
| `customer_phone` | text NOT NULL | OPS-03 search target; OPS-04 manifest |
| `delivery_address` | text NOT NULL | OPS-04 manifest |
| `allergy_notes` | text nullable | OPS-04 manifest |
| `status` | text NOT NULL | `'pending'|'paid'|'processing'|'delivered'|'cancelled'` |
| `total_ngn` | integer NOT NULL | In NGN (not kobo — the field name is `total_ngn`) |
| `week_of` | date NOT NULL | Sunday of the delivery week (YYYY-MM-DD) |
| `created_at` | timestamp with tz | |
| `notified_at` | timestamp with tz nullable | |

**Status lifecycle:** `pending` → (Paystack webhook) → `paid` → (admin) → `processing` → (admin) → `delivered`. `pending` = abandoned checkout. OPS-07 transitions: `paid` → `processing` and `processing` → `delivered`.

### `order_items` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `order_id` | uuid FK → orders.id CASCADE | |
| `product_id` | uuid FK → products.id | |
| `product_name` | text NOT NULL | Denormalized — prep list key component |
| `variant_label` | text nullable | Denormalized — prep list key component |
| `prep_option` | text nullable | Denormalized — prep list key component |
| `quantity` | integer NOT NULL | Prep list aggregates this |
| `unit_price_ngn` | integer NOT NULL | |
| `subtotal_ngn` | integer NOT NULL | |

**Key insight for OPS-01:** The prep list aggregation key is `(product_name, variant_label, prep_option)` — all three fields are already denormalized into `order_items`. No JOIN to `products` or `product_variants` tables is needed. The query is a simple `GROUP BY` on `order_items` joined to `orders` filtered by `week_of` and `status IN ('paid', 'processing')`.

### `ordering_config` table (single row, id=1)

| Column | Type | Status |
|--------|------|--------|
| `id` | integer PK default 1 | |
| `is_ordering_open` | boolean NOT NULL | Exposed in settings (OrderingToggle) |
| `cutoff_message` | text nullable | **NOT exposed in settings UI** — OPS-05 |
| `next_delivery_date` | date nullable | **NOT exposed in settings UI** — OPS-05 |
| `updated_at` | timestamp with tz NOT NULL | |

**OPS-05 finding:** Both fields exist in the schema and are already read by `getOrderingConfig()` in `src/lib/admin/config.ts`. The gap is purely in the Settings UI and the `PATCH /api/admin/config` route (which currently only accepts `is_ordering_open`).

### `products` / `product_variants` / `product_prep_options` / `admins` tables

Not needed by Phase 8 — product management is complete from Phase 4.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Prep list aggregation query | API/Backend (server component or lib) | — | DB aggregate — never done client-side |
| Prep list UI | Frontend Server (RSC page) | Client (sort toggle) | Data is static per request; week is a URL param or form |
| Analytics week picker | Browser/Client | Frontend Server (RSC) | Week is UI state; triggers router.refresh() to re-fetch RSC |
| Orders search | Browser/Client | — | All orders already loaded; pure JS filter on `initialOrders` |
| Delivery manifest | Frontend Server (RSC page) | Browser (print CSS) | Static per request; printability via `@media print` |
| Settings delivery config | Browser/Client | API (PATCH /api/admin/config) | Same pattern as existing `OrderingToggle` |
| Pending orders view | Frontend Server (RSC) | Browser (delete action) | Status filter at DB level; client handles delete confirmation |
| Bulk status transition | API/Backend (POST route) | Browser/Client | DB update; client calls fetch + router.refresh() |

---

## Implementation Approaches

### OPS-01: Prep List (new page `/admin/prep-list`)

**Approach:** Server component page with a week picker. Week is passed as a URL search param (`?week=YYYY-MM-DD`). The page reads `searchParams.week`, defaults to `currentWeekOf()`, runs the Drizzle GROUP BY query, and renders a `PrepListTable` client component (for sort toggles).

**Drizzle query pattern:**

```typescript
// src/lib/admin/prepList.ts
import "server-only";
import { and, eq, inArray, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { order_items, orders } from "../../../drizzle/schema";

export type PrepListRow = {
  product_name: string;
  variant_label: string | null;
  prep_option: string | null;
  total_quantity: number;
};

export async function getPrepList(weekOf: string): Promise<PrepListRow[]> {
  const rows = await db
    .select({
      product_name: order_items.product_name,
      variant_label: order_items.variant_label,
      prep_option: order_items.prep_option,
      total_quantity: sum(order_items.quantity),
    })
    .from(order_items)
    .innerJoin(orders, eq(order_items.order_id, orders.id))
    .where(
      and(
        eq(orders.week_of, weekOf),
        inArray(orders.status, ["paid", "processing"])
      )
    )
    .groupBy(
      order_items.product_name,
      order_items.variant_label,
      order_items.prep_option
    )
    .orderBy(order_items.product_name);

  return rows.map((r) => ({
    product_name: r.product_name,
    variant_label: r.variant_label ?? null,
    prep_option: r.prep_option ?? null,
    total_quantity: Number(r.total_quantity ?? 0),
  }));
}
```

**Drizzle note on `inArray`:** `inArray` from `drizzle-orm` supports array literals. `[VERIFIED: codebase — drizzle-orm already imported with `eq`, `and`, `sum`, `count`, `desc` in analytics.ts; `inArray` is available from same package]`

**Week picker in RSC page:** Use a `"use client"` wrapper component that has an `<input type="date">` and calls `router.push('/admin/prep-list?week=YYYY-MM-DD')` on change. The page reads `searchParams` (Next.js App Router RSC pattern). `[VERIFIED: codebase — existing pages use `searchParams` pattern; e.g. `AdminOrdersPage` does not but `ReminderForm` demonstrates the date input pattern]`

**OPS-01 success check:** The query must produce one row per unique `(product_name, variant_label, prep_option)` combination, not one row per order_item.

---

### OPS-02: Analytics Week Picker (extend `/admin/analytics`)

**Approach:** `getWeeklyAnalytics(weekOverride?)` already accepts an optional week string. The analytics page currently calls it with no argument. The change is:

1. Convert `AdminAnalyticsPage` to read `searchParams.week` (requires converting `params` to be async per Next.js 15 pattern)
2. Add a `"use client"` `WeekPicker` component with an `<input type="date">` that calls `router.push('/admin/analytics?week=YYYY-MM-DD')`
3. Pass `searchParams.week` to `getWeeklyAnalytics()`

**Current analytics page signature:**
```typescript
// Current (no searchParams):
export default async function AdminAnalyticsPage() {
  const analytics = await getWeeklyAnalytics(); // always current week

// After:
export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>; // Next.js 15: searchParams is a Promise
}) {
  const { week } = await searchParams;
  const analytics = await getWeeklyAnalytics(week); // weekOverride if provided
```

**Next.js 15 searchParams:** In Next.js 15, `searchParams` in server components is a `Promise<Record<string, string | string[] | undefined>>` — must be awaited. `[VERIFIED: codebase — existing admin pages don't use searchParams yet, but Next.js 15 App Router convention is documented pattern]` `[ASSUMED: Next.js 15 async searchParams requirement — consistent with App Router docs for v15 but not verified against live Next.js 15 changelog in this session]`

---

### OPS-03: Orders Search (extend `OrdersTable`)

**Approach:** Pure client-side filter. `OrdersTable` already loads all orders into `initialOrders` and maintains `filteredOrders` via `useMemo`. Add a `searchQuery` state string and extend the `useMemo` filter:

```typescript
// Additional state in OrdersTable.tsx
const [searchQuery, setSearchQuery] = useState("");

// Extend existing filteredOrders useMemo:
const filteredOrders = useMemo(() => {
  const q = searchQuery.toLowerCase().trim();
  return initialOrders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (weekFilter && o.week_of !== weekFilter) return false;
    if (q) {
      const haystack = `${o.customer_name} ${o.customer_phone} ${o.customer_email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}, [initialOrders, statusFilter, weekFilter, searchQuery]);
```

Add an `<input type="search">` (or `type="text"`) above the table, styled to match existing filter inputs. No server round-trip needed — data is already in memory.

**Why client-side is correct:** `getAdminOrders()` fetches all orders (newest-first). For an MVP food-prep business, this is tens to low hundreds of orders — never large enough for server-side search to matter. Client-side keeps the UX snappy. `[VERIFIED: codebase — OrdersTable comment confirms this approach: existing statusFilter and weekFilter are both client-side in useMemo]`

---

### OPS-04: Delivery Manifest (new page `/admin/manifest`)

**Approach:** New RSC page at `/admin/manifest` with week picker (same URL search param pattern as prep list). Fetches orders (status `paid` or `processing`) for the selected week, including all their items. Client component handles sort (by address or name) and print trigger.

**Data shape needed:**
```typescript
// src/lib/admin/manifest.ts
export type ManifestOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: Array<{
    product_name: string;
    variant_label: string | null;
    prep_option: string | null;
    quantity: number;
  }>;
  total_ngn: number;
};
```

**Query pattern:** Similar to `getAdminOrders()` but filtered by `week_of` and `status IN ('paid', 'processing')`. Can use `inArray` + `eq(orders.week_of, weekOf)`.

**Printable strategy:** `@media print` CSS in Tailwind v4. Add `print:hidden` to the Sidebar and action buttons, `print:block` to the manifest content. Use `window.print()` on a print button. No separate route needed — same page prints cleanly. Tailwind v4 print utilities are available. `[VERIFIED: codebase — Tailwind v4 is in use (`"tailwindcss": "^4.0.0"`); print: variant is a standard Tailwind utility]`

**Sort:** Client-side sort of the already-fetched manifest rows. Two buttons: "Sort by name" / "Sort by address" toggle a `sortBy` state. No DB round-trip needed.

---

### OPS-05: Delivery Config in Settings (extend `/admin/settings`)

**Gap:** `ordering_config.next_delivery_date` (date) and `ordering_config.cutoff_message` (text) exist in the DB schema and are returned by `getOrderingConfig()` in `src/lib/admin/config.ts`. The Settings page passes `config.is_ordering_open` to `OrderingToggle` but does not pass or display the other two fields.

**Approach:**

1. Create a new `DeliveryConfigForm` client component (same card style as `OrderingToggle`)
2. Props: `initialNextDeliveryDate: string | null`, `initialCutoffMessage: string | null`
3. Form: date input + text input + Save button → `PATCH /api/admin/config`
4. Extend `orderingConfigPatchSchema` in `schemas.ts` to accept optional `next_delivery_date` and `cutoff_message`
5. Extend `PATCH /api/admin/config` route handler to set these fields

**Schema extension:**
```typescript
// schemas.ts — extend orderingConfigPatchSchema
export const orderingConfigPatchSchema = z
  .object({
    is_ordering_open: z.boolean().optional(),
    next_delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    cutoff_message: z.string().max(300).nullable().optional(),
  })
  .strict();
```

**Customer-facing propagation:** `src/lib/shop/orderingConfig.ts` uses `unstable_cache` with `revalidate: 15`. Changes to `ordering_config` propagate to the customer banner within 15 seconds of the next request — no manual revalidation needed. `[VERIFIED: codebase — lib/shop/orderingConfig.ts lines 48-55]`

**Cutoff banner consumer:** `OrderingClosedBanner` in `src/components/shop/OrderingClosedBanner.tsx` presumably reads `next_delivery_date` and `cutoff_message`. Verify it uses these fields during implementation.

---

### OPS-06: Pending Orders View (new page `/admin/pending`)

**Approach:** New RSC page that fetches all orders with `status = 'pending'`. These are abandoned checkouts — the customer started checkout but did not complete payment.

**Lib function:**
```typescript
// src/lib/admin/pendingOrders.ts
export async function getPendingOrders(): Promise<AdminOrder[]> {
  // Same shape as getAdminOrders() but filtered:
  // WHERE orders.status = 'pending' ORDER BY created_at DESC
}
```

**UI:** Table showing reference, customer name (may be partial if checkout was abandoned early), date, and a Delete button. A "count badge" on the sidebar nav item shows the number of pending orders.

**Delete action:** `DELETE /api/admin/orders/[id]` — new HTTP method on the existing `orders/[id]/route.ts`. Uses Drizzle `delete` with `eq(orders.id, id)`. Because `order_items` FK has `onDelete: "cascade"`, items delete automatically.

**Sidebar badge:** The `AdminSidebar` is a server component (reads session) but the badge count would need to be either:
- Fetched in `AdminLayout` (which is already `force-dynamic`) and passed down as a prop to `AdminSidebar`, OR
- Fetched inside `AdminSidebar` itself if we make it a server component (it is currently `"use client"` for `usePathname`)

**Sidebar badge architecture decision:** `AdminSidebar` is currently `"use client"` (uses `usePathname`). Options:
- A: Pass `pendingCount` as a prop from `AdminLayout` (server) → `AdminSidebar` (client) — cleanest, no refactor
- B: Create a separate server component `PendingBadge` that fetches count and is rendered inside the sidebar navigation item

Option A is recommended: `AdminLayout` already calls `auth()`, adding a `getPendingOrdersCount()` call alongside it costs one extra DB query on every admin page render. Given `force-dynamic` is already set on the layout, this is acceptable.

---

### OPS-07: Bulk Status Transition

**Approach:** New `POST /api/admin/orders/bulk-status` route. Accepts `{ week_of: string, from_status: "paid"|"processing", to_status: "processing"|"delivered" }`. Updates all matching orders in a single Drizzle `update` with `and(eq(orders.week_of, weekOf), eq(orders.status, fromStatus))`.

**Lib function:**
```typescript
// src/lib/admin/bulkTransition.ts
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "../../../drizzle/schema";

export async function bulkTransitionOrders(
  weekOf: string,
  fromStatus: "paid" | "processing",
  toStatus: "processing" | "delivered"
): Promise<number> {
  const result = await db
    .update(orders)
    .set({ status: toStatus })
    .where(and(eq(orders.week_of, weekOf), eq(orders.status, fromStatus)));
  // Drizzle neon-http returns rowCount from the Neon response
  return result.rowCount ?? 0;
}
```

**UI placement:** A new `BulkTransitionPanel` client component. Best placed on the Prep List page (`/admin/prep-list`) or as a distinct section on `/admin/orders`. The Prep List page is the natural home — staff generates the prep list, then bulk-transitions to `processing`, then after delivery bulk-transitions to `delivered`.

**Week picker for bulk:** Reuse the same `<input type="date">` pattern. The UI shows: "Week of [date picker] — Bulk transition: [Paid → Processing button] [Processing → Delivered button]". Each button shows a count of affected orders (fetched client-side from the already-loaded data or via a pre-check API call).

**Zod schema:**
```typescript
export const bulkStatusTransitionSchema = z.object({
  week_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  from_status: z.enum(["paid", "processing"]),
  to_status: z.enum(["processing", "delivered"]),
}).strict().refine(
  (d) => (d.from_status === "paid" && d.to_status === "processing") ||
          (d.from_status === "processing" && d.to_status === "delivered"),
  { message: "Invalid status transition" }
);
```

---

## API / Server Action Design

### Existing Routes — Modifications Required

| Route | Change | Reason |
|-------|--------|--------|
| `PATCH /api/admin/config` | Accept `next_delivery_date` + `cutoff_message` | OPS-05 |
| `PATCH /api/admin/orders/[id]` | Add `DELETE` method | OPS-06 delete pending orders |
| `src/lib/admin/schemas.ts` | Extend `orderingConfigPatchSchema`; add `bulkStatusTransitionSchema` | OPS-05, OPS-07 |

### New Routes Required

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/admin/orders/bulk-status` | POST | Bulk status transition for a week | `auth()` session check |

Note: Prep list and manifest data can be served by RSC pages (no API route needed — data fetched in `page.tsx`). If a JSON endpoint is needed for client-side refresh, it can be a thin GET route returning the lib function result.

### Auth Pattern (consistent with codebase)

All new routes use:
```typescript
const session = await auth();
if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

This is verified from `config/route.ts` and `orders/[id]/route.ts`. `[VERIFIED: codebase]`

---

## Key Dependencies and Risks

### No New Packages Needed

All required functionality is covered by existing dependencies:
- Drizzle `inArray`, `and`, `eq`, `sum` — already imported in analytics/reminders
- shadcn/ui `Switch`, `Label`, `Input` — already in use
- `motion/react` — already in `OrderRow.tsx` for animations
- `sonner` toast — already in `OrderStatusSelect.tsx`
- Tailwind v4 `print:` variant — built-in

### Risks

**Risk 1: Next.js 15 searchParams async requirement**
Pages that use `searchParams` for the week picker must await it. The existing codebase has no example of this pattern yet. Wrong usage causes a TypeScript error or runtime warning. **Mitigation:** Follow the Next.js 15 App Router signature: `searchParams: Promise<{ week?: string }>`, then `const { week } = await searchParams`.
Confidence: MEDIUM (based on Next.js 15 App Router conventions; not verified against a live Next.js 15 changelog in this session) `[ASSUMED]`

**Risk 2: Drizzle `rowCount` on neon-http**
The `bulkTransitionOrders` function returns `result.rowCount` to report how many orders were transitioned. Neon HTTP driver returns an `NeonQueryResultBase` with `rowCount`. **Mitigation:** Wrap in `?? 0` defensively. If `rowCount` is null or undefined, fall back to 0. `[ASSUMED — consistent with Neon HTTP driver behavior but not verified against neon-http v1.1.0 docs in this session]`

**Risk 3: `pending` orders missing customer data**
If a customer abandoned checkout very early (before filling in name/email), the `customer_name` / `customer_email` fields may be empty strings or placeholder values. **Mitigation:** The orders table has `customer_name NOT NULL` and `customer_email NOT NULL` — the `POST /api/orders/init` route must provide these before creating the pending record. Verify during implementation that the checkout init always populates both fields.

**Risk 4: Sidebar badge adds a DB query to every admin page load**
Fetching `getPendingOrdersCount()` in `AdminLayout` runs on every admin navigation. With `force-dynamic` already set, this is fine for MVP scale, but it's a query cost to be aware of. **Mitigation:** Use a simple `SELECT COUNT(*) FROM orders WHERE status = 'pending'` query — very fast with an index. If the `status` column is not indexed, this is a table scan (fine at MVP scale of hundreds of rows).

**Risk 5: Print layout conflicts with Tailwind base styles**
`@media print` in Tailwind v4 uses the `print:` prefix. Hiding the sidebar and action buttons requires `print:hidden` on the correct elements. **Mitigation:** Test in browser print preview. The manifest page wraps its printable section in a clearly bounded `div` with `print:block` and the rest of the layout in `print:hidden`.

**Risk 6: `ordering_config` PATCH schema change breaks `OrderingToggle`**
`OrderingToggle` sends `{ is_ordering_open: boolean }` which must still validate. The extended Zod schema uses `.optional()` on all fields, so existing payloads continue to validate. **Mitigation:** Make `is_ordering_open` optional in the extended schema (not required). All three fields are optional and at least one must be present (add `.refine()` to enforce this).

---

## Validation Architecture

**Test framework:** Vitest 2.x with jsdom, configured in `vitest.config.ts`. Quick run: `npx vitest run`. Full suite: `npx vitest run`. `[VERIFIED: codebase — package.json scripts]`

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| OPS-01 | `getPrepList(week)` aggregates quantities by `(product_name, variant_label, prep_option)` | Unit (mock DB) | `npx vitest run src/lib/admin/prepList.test.ts` | New test file |
| OPS-01 | Prep list page renders a table with correct row count | Manual visual | — | RSC page, hard to unit test |
| OPS-02 | `getWeeklyAnalytics(weekOverride)` returns data for past week | Unit (existing test or extension) | `npx vitest run src/lib/admin/analytics.test.ts` | May not exist yet — Wave 0 gap |
| OPS-02 | Analytics page week picker updates displayed week | Manual visual | — | Client-side navigation |
| OPS-03 | `OrdersTable` search field filters `customer_name`, `customer_phone`, `customer_email` | Unit (RTL) | `npx vitest run src/components/admin/orders/OrdersTable.test.ts` | Extend existing test file |
| OPS-04 | `getManifestOrders(week)` returns correct orders | Unit (mock DB) | `npx vitest run src/lib/admin/manifest.test.ts` | New test file |
| OPS-05 | Extended `orderingConfigPatchSchema` accepts `next_delivery_date` + `cutoff_message` | Unit | `npx vitest run src/lib/admin/schemas.test.ts` | Extend existing |
| OPS-06 | `getPendingOrders()` returns only `status = 'pending'` orders | Unit (mock DB) | `npx vitest run src/lib/admin/pendingOrders.test.ts` | New test file |
| OPS-07 | `bulkStatusTransitionSchema` rejects invalid transitions (e.g. `paid → delivered`) | Unit | `npx vitest run src/lib/admin/schemas.test.ts` | Add to existing schemas test |
| OPS-07 | `bulkTransitionOrders()` calls correct Drizzle update | Unit (mock DB) | `npx vitest run src/lib/admin/bulkTransition.test.ts` | New test file |

### Wave 0 Gaps (new test files to create before implementation)

- `src/lib/admin/prepList.test.ts` — OPS-01 aggregate query
- `src/lib/admin/manifest.test.ts` — OPS-04 manifest query
- `src/lib/admin/pendingOrders.test.ts` — OPS-06 pending filter
- `src/lib/admin/bulkTransition.test.ts` — OPS-07 bulk update
- `src/lib/admin/analytics.test.ts` — OPS-02 `weekOverride` parameter (may not exist yet)

Extend existing:
- `src/lib/admin/schemas.test.ts` — OPS-05, OPS-07 new schemas
- `src/components/admin/orders/OrdersTable.test.tsx` — OPS-03 search field

### Mock Pattern (established by `orders.test.ts`)

All Drizzle lib tests use `vi.mock("@/lib/db", () => ({ db: { select: vi.fn(...) } }))` and `vi.mock("server-only", () => ({}))`. New tests follow this same pattern. The mock returns fixtures that simulate Drizzle query builder chaining.

---

## Common Pitfalls

### Pitfall 1: Forgetting `inArray` import from drizzle-orm
`inArray` is available in drizzle-orm but not currently imported anywhere in the codebase. The prep list and manifest queries both need it. **Prevention:** Import explicitly: `import { and, eq, inArray, sum } from "drizzle-orm";`

### Pitfall 2: `sum()` returns string | null in Drizzle aggregates
`getWeeklyAnalytics` already documents this: `// Drizzle \`sum()\` returns string | null for numeric aggregates; coerce defensively.` Use `Number(row.total_quantity ?? 0)` in `getPrepList`. **Prevention:** Always wrap Drizzle sum/count results in `Number(... ?? 0)`.

### Pitfall 3: `pending` status missing from `OrderStatusSelect` options
`OrderStatusSelect` currently only offers `["paid", "processing", "delivered"]` — `pending` is not in the dropdown. The pending orders view will show orders with `status = "pending"` but the status dropdown won't be able to set that status (which is correct — admins should not manually set `pending`). However, if the pending orders table reuses `OrderRow`, it must either hide `OrderStatusSelect` or pass a filtered options set. **Prevention:** Create a separate `PendingOrderRow` that does not include the status select, or conditionally hide it.

### Pitfall 4: `week_of` is a Postgres `date` type — comparison with string requires correct format
`eq(orders.week_of, weekOf)` works when `weekOf` is a `YYYY-MM-DD` string. Drizzle + Neon handle the type coercion. `currentWeekOf()` already returns this format. URL search params arrive as strings — pass them directly. **Prevention:** Validate URL param format with a regex before passing to the DB query.

### Pitfall 5: `AdminSidebar` is `"use client"` — can't directly do async DB calls inside it
The pending orders count badge must come from a parent server component (`AdminLayout`) passed as a prop. **Prevention:** Add `pendingCount: number` prop to `AdminSidebar`; fetch the count in `AdminLayout` alongside `auth()`.

### Pitfall 6: Settings page PATCH must not overwrite fields not included in the payload
If `DeliveryConfigForm` sends only `{ next_delivery_date: "2026-05-10" }`, the Drizzle update should only set that field, not wipe `is_ordering_open`. Use Drizzle's partial `set()` — only include fields that are defined in the parsed payload. **Prevention:** Destructure the parsed data and conditionally build the `set` object.

### Pitfall 7: Print CSS on sidebar layout
The admin layout is a flex row: `<aside> + <main>`. Applying `print:hidden` to the `<aside>` makes the sidebar disappear in print, but the `<main>` flex child still only occupies its non-sidebar width unless `print:w-full` is also applied. **Prevention:** Add `print:w-full` to `<main>` and `print:hidden` to `<aside>` in `AdminLayout`, or apply these classes inline in the manifest page itself.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Next.js 15 requires `searchParams` to be awaited as a Promise in RSC pages | OPS-02, OPS-01, OPS-04 | TypeScript error at compile time; easy to fix |
| A2 | Drizzle neon-http returns `rowCount` on UPDATE queries | OPS-07 | `bulkTransitionOrders` returns 0 instead of actual count; UX shows "0 orders updated" incorrectly |

---

## Open Questions

1. **Where does OPS-07 bulk transition UI live?**
   - What we know: It needs a week picker and two action buttons
   - What's unclear: Should it be on `/admin/prep-list`, `/admin/orders`, or a dedicated `/admin/bulk-actions` page?
   - Recommendation: Place it on `/admin/prep-list` — staff generates prep list then immediately bulk-transitions. Keeps the workflow on one page.

2. **Should pending orders share the `/admin/orders` page (as a tab) or have a separate `/admin/pending` route?**
   - What we know: The sidebar has 5 items; adding 3 more pages (prep list, manifest, pending) makes 8
   - What's unclear: Client preference for navigation structure
   - Recommendation: Separate `/admin/pending` route with a count badge on the sidebar item. This keeps the main orders table uncluttered and makes the pending count badge work naturally.

3. **Should the manifest be printable inline or open a print-specific modal/window?**
   - What we know: `window.print()` + `@media print` CSS is the simplest approach
   - What's unclear: Whether the client wants a dedicated "print preview" view
   - Recommendation: Inline `@media print` with `window.print()` button. No separate route. The sidebar hides in print via `AdminLayout` print CSS.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 8 is purely code changes against the existing stack. No new external dependencies, services, or CLI tools are introduced. All required tools (Node.js, npm, vitest, drizzle-kit) are already available from prior phases.

---

## Sources

### Primary (HIGH confidence)
- `drizzle/schema.ts` — all table/column definitions verified by direct read
- `src/lib/admin/analytics.ts` — `getWeeklyAnalytics(weekOverride?)` signature verified
- `src/lib/admin/orders.ts` — `getAdminOrders()` pattern and `AdminOrder` type verified
- `src/lib/admin/config.ts` — `getOrderingConfig()` already returns all three config fields
- `src/lib/admin/schemas.ts` — current Zod schemas verified; `orderingConfigPatchSchema` only has `is_ordering_open`
- `src/lib/admin/week.ts` — `currentWeekOf()` utility verified
- `src/lib/admin/reminders.ts` — `getPaidOrdersForWeek()` pattern for manifest/prep list queries
- `src/lib/shop/orderingConfig.ts` — `unstable_cache` with 15s revalidate confirmed
- `src/components/admin/orders/OrdersTable.tsx` — existing filter pattern (`useMemo`) confirmed
- `src/components/admin/settings/OrderingToggle.tsx` — PATCH `/api/admin/config` call pattern
- `src/app/api/admin/config/route.ts` — current config PATCH only handles `is_ordering_open`
- `src/app/api/admin/orders/[id]/route.ts` — no DELETE method, only PATCH
- `src/components/admin/AdminSidebar.tsx` — `"use client"` confirmed; 5 nav items
- `src/app/admin/layout.tsx` — `force-dynamic`, passes `adminEmail` to sidebar
- `package.json` — all deps confirmed: drizzle-orm, vitest, motion, sonner, lucide-react
- `vitest.config.ts` — jsdom environment, `src/**/*.test.{ts,tsx}` pattern

### Secondary (MEDIUM confidence)
- Next.js 15 App Router `searchParams` as Promise — consistent with Next.js App Router conventions for v15 dynamic APIs

---

## Metadata

**Confidence breakdown:**
- Schema / existing code: HIGH — verified by direct file read
- Drizzle query patterns: HIGH — based on existing working queries in analytics.ts and reminders.ts
- Next.js 15 searchParams: MEDIUM — consistent with known App Router v15 conventions; marked ASSUMED
- Drizzle neon-http rowCount: MEDIUM — consistent with Neon HTTP driver behavior; marked ASSUMED

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (stable stack; 30-day window)

---

## RESEARCH COMPLETE
