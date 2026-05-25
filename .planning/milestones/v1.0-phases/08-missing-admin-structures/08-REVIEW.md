---
phase: 08-missing-admin-structures
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - src/app/admin/analytics/page.tsx
  - src/app/admin/layout.tsx
  - src/app/admin/manifest/page.tsx
  - src/app/admin/pending/page.tsx
  - src/app/admin/prep-list/page.tsx
  - src/app/admin/settings/page.tsx
  - src/app/api/admin/config/route.ts
  - src/app/api/admin/orders/[id]/route.ts
  - src/app/api/admin/orders/bulk-status/route.ts
  - src/components/admin/AdminSidebar.test.tsx
  - src/components/admin/AdminSidebar.tsx
  - src/components/admin/analytics/WeekPickerBar.tsx
  - src/components/admin/manifest/ManifestTable.tsx
  - src/components/admin/orders/OrdersTable.test.tsx
  - src/components/admin/orders/OrdersTable.tsx
  - src/components/admin/pending/PendingOrdersTable.tsx
  - src/components/admin/prep-list/BulkTransitionPanel.tsx
  - src/components/admin/prep-list/PrepListTable.tsx
  - src/components/admin/settings/DeliveryConfigForm.tsx
  - src/lib/admin/analytics.test.ts
  - src/lib/admin/bulkTransition.test.ts
  - src/lib/admin/bulkTransition.ts
  - src/lib/admin/manifest.test.ts
  - src/lib/admin/manifest.ts
  - src/lib/admin/pendingOrders.test.ts
  - src/lib/admin/pendingOrders.ts
  - src/lib/admin/prepList.test.ts
  - src/lib/admin/prepList.ts
  - src/lib/admin/schemas.test.ts
  - src/lib/admin/schemas.ts
findings:
  critical: 4
  warning: 6
  info: 3
  total: 13
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-05-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

This phase introduces the bulk-transition pipeline, delivery manifest, prep-list, pending-orders, analytics, delivery-config, and the supporting sidebar nav. The implementation is generally structured well and uses Zod validation at API boundaries. However there are four blockers: two unguarded database calls that will crash with a 500 instead of returning a structured error, a full `order_items` table scan in two server functions that will silently corrupt results if order IDs collide across weeks (and will scale catastrophically), and an unvalidated UUID path parameter that allows arbitrary strings to reach a Drizzle DELETE. Six warnings cover analytics data accuracy, a mis-scoped week filter, a stale import path inconsistency, missing `cancelled` status in the status-filter dropdown, index-as-key in a sortable list, and two incomplete test stubs. Three info items cover minor quality issues.

## Critical Issues

### CR-01: DB calls in PATCH and DELETE handlers are unguarded — any DB error produces an unhandled 500

**File:** `src/app/api/admin/orders/[id]/route.ts:32` and `:47`

**Issue:** After JSON parsing and Zod validation succeed, the actual `db.update(...)` (line 32) and `db.delete(...)` (line 47) calls are awaited with no `try/catch`. Any database error (connection failure, constraint violation, Neon timeout) will propagate as an unhandled exception and produce a raw Next.js 500 response with a stack trace in development — or a generic 500 with no body in production. The client `PendingOrdersTable` checks `res.ok` and shows `"Failed to delete order."` only when the server explicitly returns a non-2xx status code; a 500 with a body also satisfies `!res.ok`, so the UX fallback still fires — but the error is not logged or handled at the server level.

The same pattern exists in `src/app/api/admin/config/route.ts:37-42` for the config PATCH.

**Fix:**
```typescript
// src/app/api/admin/orders/[id]/route.ts — PATCH handler
  const { id } = await params;
  try {
    await db.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, id));
  } catch (err) {
    console.error("[orders/[id] PATCH] db error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });

// DELETE handler — same wrapping
  try {
    await db.delete(orders).where(eq(orders.id, id));
  } catch (err) {
    console.error("[orders/[id] DELETE] db error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
```

Apply the same pattern to `src/app/api/admin/config/route.ts` around the `db.update(...)` call.

---

### CR-02: `manifest.ts` and `pendingOrders.ts` fetch the entire `order_items` table and filter in JS — incorrect results when an order_id appears in multiple weeks

**File:** `src/lib/admin/manifest.ts:34` and `src/lib/admin/pendingOrders.ts:28`

**Issue:** Both functions load every row from `order_items` into memory with `db.select().from(order_items)` (no WHERE clause) and then filter by `orderIds.has(it.order_id)` in JavaScript. This is semantically wrong: `order_id` is a UUID FK into `orders.id`, which is also a UUID primary key — so a given item UUID maps to exactly one order UUID. There is no week-level ambiguity at the item level. The real problem is scale: in production this query will return every item ever ordered, and the in-process filter will silently succeed but consume unbounded memory. As the dataset grows this will cause OOM crashes with no error surfacing to the caller. The correct fix is to push the filter to the database with an `inArray` or an `innerJoin`, consistent with how `prepList.ts` correctly uses an `innerJoin`.

**Fix for `manifest.ts`:**
```typescript
// Replace the Promise.all pattern with a single joined query:
const rows = await db
  .select({
    id: orders.id,
    customer_name: orders.customer_name,
    customer_phone: orders.customer_phone,
    delivery_address: orders.delivery_address,
    allergy_notes: orders.allergy_notes,
    total_ngn: orders.total_ngn,
    item_id: order_items.id,
    product_name: order_items.product_name,
    variant_label: order_items.variant_label,
    prep_option: order_items.prep_option,
    quantity: order_items.quantity,
    unit_price_ngn: order_items.unit_price_ngn,
    subtotal_ngn: order_items.subtotal_ngn,
  })
  .from(orders)
  .leftJoin(order_items, eq(order_items.order_id, orders.id))
  .where(and(eq(orders.week_of, week), inArray(orders.status, ["paid", "processing"])))
  .orderBy(desc(orders.created_at));
// Then group in JS by orders.id
```

Apply the equivalent fix to `pendingOrders.ts:getPendingOrders()`.

---

### CR-03: Order ID path parameter is never validated — arbitrary strings reach the Drizzle DELETE

**File:** `src/app/api/admin/orders/[id]/route.ts:46-48`

**Issue:** The `DELETE` handler reads `id` directly from `params` and passes it to `db.delete(orders).where(eq(orders.id, id))`. There is no check that `id` is a valid UUID. An authenticated admin can send `DELETE /api/admin/orders/../../something` (path traversal is blocked by Next.js routing) but can also send a crafted value like `' OR 1=1--` or an empty string. With Drizzle/parameterised queries the SQL injection risk is low, but passing a non-UUID string to a UUID-typed column will cause a Postgres error that is unhandled (see CR-01) and leaks internal error messages in dev mode. The PATCH handler for the same route has the same gap.

**Fix:**
```typescript
import { z } from "zod";
const uuidSchema = z.string().uuid();

// In both PATCH and DELETE, before using `id`:
const { id } = await params;
if (!uuidSchema.safeParse(id).success) {
  return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
}
```

---

### CR-04: Analytics `totalOrders` and `totalRevenue` include `pending` and `cancelled` orders — metrics are inflated

**File:** `src/lib/admin/analytics.ts:22-23`

**Issue:** The two aggregate queries that produce `totalOrders` and `totalRevenue` filter only by `week_of` with no status filter:

```typescript
db.select({ c: count() }).from(orders).where(eq(orders.week_of, week)),
db.select({ s: sum(orders.total_ngn) }).from(orders).where(eq(orders.week_of, week)),
```

The DB schema documents five statuses: `pending`, `paid`, `processing`, `delivered`, `cancelled`. The pending-orders page explicitly shows `status = 'pending'` orders as "abandoned checkouts". Revenue from abandoned or cancelled orders is not real revenue. The manifest and prep-list already correctly filter to `['paid', 'processing']` via `inArray`. Analytics should do the same — or at minimum filter to exclude `pending` and `cancelled`. The `statusBreakdown` query is correct in including all statuses, but the aggregate totals are misleading.

**Fix:**
```typescript
// Add a status filter to the totalOrders and totalRevenue queries:
import { and, eq, inArray } from "drizzle-orm";

db.select({ c: count() })
  .from(orders)
  .where(and(eq(orders.week_of, week), inArray(orders.status, ["paid", "processing", "delivered"]))),

db.select({ s: sum(orders.total_ngn) })
  .from(orders)
  .where(and(eq(orders.week_of, week), inArray(orders.status, ["paid", "processing", "delivered"]))),
```

---

## Warnings

### WR-01: `orderStatusPatchSchema` accepts `"pending"` and `"cancelled"` as targets — status can be reset to abandoned

**File:** `src/lib/admin/schemas.ts:43-47`

**Issue:** `orderStatusPatchSchema` allows `status` values of `"paid"`, `"processing"`, and `"delivered"` — it correctly excludes `"pending"` and `"cancelled"`. However the DB schema column comment lists both `pending` and `cancelled` as valid states. The status filter dropdown in `OrdersTable.tsx` also omits `cancelled`. Neither the PATCH schema nor the UI dropdown handles `cancelled`, meaning an admin cannot cancel an order through the UI. This is a likely missing feature that could leave cancelled orders visible in the manifest and prep-list (if they ever reach `paid`/`processing` status before being cancelled). At minimum this should be a conscious exclusion with a schema comment.

**Fix:** Either add `"cancelled"` to the `orderStatusPatchSchema` enum and the `OrdersTable` filter dropdown, or add a schema comment explicitly documenting that cancellation is out of scope for this release.

---

### WR-02: `WeekPickerBar` and `ManifestTable` week inputs accept arbitrary date strings — no day-of-week validation enforces Sunday-only weeks

**File:** `src/components/admin/analytics/WeekPickerBar.tsx:24-26`, `src/components/admin/manifest/ManifestTable.tsx:44-46`, `src/components/admin/prep-list/PrepListTable.tsx:14-18`, `src/components/admin/prep-list/BulkTransitionPanel.tsx:74-76`

**Issue:** All four date pickers push a raw `e.target.value` (any valid calendar date) as the `week` query parameter. The `currentWeekOf()` utility always produces the Sunday of the current week. If an admin picks a Wednesday, the query passes that Wednesday string to `getManifestOrders("2026-05-13")` which does a literal string match against `orders.week_of`. Since `week_of` is stored as the Sunday of the order's week, a non-Sunday date will return zero results with no error — silently appearing as "no deliveries" when there are actually orders that week. In `BulkTransitionPanel` this is worse: a non-Sunday `week_of` sent to the bulk-transition API will update zero orders and report `"0 orders updated"` with no indication that the date was wrong.

**Fix:** Snap the selected date to the preceding Sunday on change, mirroring `currentWeekOf()`:
```typescript
onChange={(e) => {
  if (!e.target.value) return;
  const d = new Date(e.target.value + "T00:00:00Z");
  const day = d.getUTCDay();
  const sunday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  const weekStr = sunday.toISOString().slice(0, 10);
  router.push(`/admin/analytics?week=${weekStr}`);
}}
```

---

### WR-03: `PrepListTable` uses array index as React `key` on a sortable list — items jump on sort

**File:** `src/components/admin/prep-list/PrepListTable.tsx:94`

**Issue:**
```tsx
{sorted.map((row, i) => (
  <tr key={i} ...>
```
The key is the index in the `sorted` array. When the admin clicks a column header to re-sort, React uses keys to reconcile the DOM — index-based keys cause every row to appear as the same element in the same position, preventing React from correctly preserving focus and causing animated transitions (if any) to animate incorrectly. The correct key should be a stable identity for the row — a composite of `product_name + variant_label + prep_option`.

**Fix:**
```tsx
{sorted.map((row) => (
  <tr key={`${row.product_name}|${row.variant_label ?? ""}|${row.prep_option ?? ""}`} ...>
```

---

### WR-04: `orders/[id]/route.ts` uses a deep relative import path instead of the `@/` alias used everywhere else

**File:** `src/app/api/admin/orders/[id]/route.ts:7`

**Issue:**
```typescript
import { orders } from "../../../../../../drizzle/schema";
```
Every other file in the codebase uses path aliases (`@/lib/db`, `@/lib/admin/...`) or a three-level relative path (`../../../drizzle/schema`). This six-level relative import is fragile — any file move along the path chain silently breaks the import at compile time. The config route and bulk-status route both use `@/lib/db` (which re-exports schema) or correct relative paths. This is an inconsistency that will cause confusion.

**Fix:**
```typescript
// Option A — via the @/lib/db barrel if orders is re-exported there:
import { db, schema } from "@/lib/db";
// then use schema.orders

// Option B — same three-level path used by sibling lib files:
import { orders } from "@/drizzle/schema"; // if tsconfig paths covers this
// or configure a @/drizzle alias in tsconfig.json
```

---

### WR-05: `getPendingOrdersCount()` is called unconditionally in the layout for every authenticated page load — no caching

**File:** `src/app/admin/layout.tsx:19`

**Issue:** The layout calls `getPendingOrdersCount()` on every server render of any `/admin/:path*` page. This is a database round-trip on every navigation. In Next.js 15 with `force-dynamic`, the layout rerenders on every request, meaning this count query fires even when viewing the Analytics page, Settings page, or Products page — none of which need the count except to display the badge. While this isn't a correctness bug in isolation, it becomes a problem when combined with CR-02 patterns: the function uses the same `db.select().from(orders).where(...)` pattern, and any latency spike will delay every admin page load.

More importantly, there is no error boundary around this call. If `getPendingOrdersCount()` throws (DB unreachable), the entire layout — and thus every admin page — will error out. There is no `try/catch` to fall back to `pendingCount = 0`.

**Fix:**
```typescript
// Defensive fallback in layout.tsx:
const pendingCount = await getPendingOrdersCount().catch(() => 0);
```

---

### WR-06: Two test stubs marked `it.todo` leave critical behaviors untested

**File:** `src/lib/admin/pendingOrders.test.ts:31`, `src/lib/admin/analytics.test.ts:54`

**Issue:**
- `pendingOrders.test.ts:31`: `it.todo("returns only status=pending orders")` — the primary behaviour of `getPendingOrders()` has no test. The function has a full-table `order_items` scan (CR-02) and a potentially incorrect filter; this missing test means the regression surface is blind.
- `analytics.test.ts:54`: `it.todo("defaults to currentWeekOf() when no weekOverride provided")` — the `currentWeekOf()` fallback path in `getWeeklyAnalytics` is not tested. The existing test only covers the override path.

These stubs should be implemented before shipping.

---

## Info

### IN-01: `orderingConfigPatchSchema` date regex accepts invalid calendar dates

**File:** `src/lib/admin/schemas.ts:53-55`

**Issue:** The regex `/^\d{4}-\d{2}-\d{2}$/` accepts syntactically plausible but semantically invalid dates such as `"2026-13-40"` (month 13, day 40). A user who accidentally submits such a value will have it stored in the database, which may cause downstream rendering issues when displayed to customers.

**Fix:** Use Zod's native date coercion or post-regex validate with `!isNaN(new Date(v).getTime())`:
```typescript
next_delivery_date: z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "next_delivery_date must be YYYY-MM-DD")
  .refine((v) => !isNaN(new Date(v).getTime()), "next_delivery_date must be a valid calendar date")
  .nullable()
  .optional(),
```

---

### IN-02: `AdminSidebar.test.tsx` does not test Prep List, Manifest, and Pending Orders active states

**File:** `src/components/admin/AdminSidebar.test.tsx:71-76`

**Issue:** The test verifies that the three new nav links exist and have correct `href` values, but does not cover the `aria-current="page"` active state for any of the three new routes. The existing `D-04` test only checks `/admin/products`. A regression in the `exact` / `startsWith` logic for `/admin/prep-list` or `/admin/manifest` would not be caught.

**Fix:** Add three additional test cases:
```typescript
it("marks Prep List as active on /admin/prep-list", () => {
  pathnameMock.mockReturnValue("/admin/prep-list");
  render(<AdminSidebar adminEmail="a@b.c" pendingCount={0} />);
  expect(screen.getByText("Prep List").closest("a")?.getAttribute("aria-current")).toBe("page");
});
```

---

### IN-03: `schemas.test.ts` line 10 contains a stale comment referencing a schema that now exists

**File:** `src/lib/admin/schemas.test.ts:10`

**Issue:** Line 10 reads:
```typescript
// NOTE: bulkStatusTransitionSchema is imported only in todo stubs below — it does not exist yet.
```
`bulkStatusTransitionSchema` is fully implemented in `schemas.ts` and is actively imported and tested in the same file. The comment is now misleading.

**Fix:** Remove the stale comment.

---

_Reviewed: 2026-05-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
