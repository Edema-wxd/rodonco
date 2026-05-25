# Phase 8: Missing Admin Structures — Pattern Map

**Mapped:** 2026-05-07
**Files analyzed:** 18 (new + modified)
**Analogs found:** 18 / 18

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/admin/prepList.ts` | service/lib | CRUD (aggregate query) | `src/lib/admin/analytics.ts` | exact |
| `src/lib/admin/manifest.ts` | service/lib | CRUD (filtered fetch) | `src/lib/admin/reminders.ts` + `src/lib/admin/orders.ts` | role-match |
| `src/lib/admin/pendingOrders.ts` | service/lib | CRUD (filtered fetch) | `src/lib/admin/reminders.ts` | exact |
| `src/lib/admin/bulkTransition.ts` | service/lib | CRUD (bulk update) | `src/app/api/admin/orders/[id]/route.ts` (Drizzle update) | role-match |
| `src/lib/admin/schemas.ts` (extend) | utility | transform | `src/lib/admin/schemas.ts` | self |
| `src/app/api/admin/config/route.ts` (extend) | API route | request-response | `src/app/api/admin/config/route.ts` | self |
| `src/app/api/admin/orders/[id]/route.ts` (extend) | API route | request-response | `src/app/api/admin/orders/[id]/route.ts` | self |
| `src/app/api/admin/orders/bulk-status/route.ts` | API route | request-response | `src/app/api/admin/reminders/route.ts` | exact |
| `src/app/admin/prep-list/page.tsx` | page (RSC) | request-response | `src/app/admin/analytics/page.tsx` | exact |
| `src/app/admin/manifest/page.tsx` | page (RSC) | request-response | `src/app/admin/orders/page.tsx` | exact |
| `src/app/admin/pending/page.tsx` | page (RSC) | request-response | `src/app/admin/orders/page.tsx` | exact |
| `src/app/admin/analytics/page.tsx` (extend) | page (RSC) | request-response | `src/app/admin/analytics/page.tsx` | self |
| `src/app/admin/layout.tsx` (extend) | layout | request-response | `src/app/admin/layout.tsx` | self |
| `src/components/admin/AdminSidebar.tsx` (extend) | component (client) | request-response | `src/components/admin/AdminSidebar.tsx` | self |
| `src/components/admin/orders/OrdersTable.tsx` (extend) | component (client) | event-driven | `src/components/admin/orders/OrdersTable.tsx` | self |
| `src/components/admin/settings/DeliveryConfigForm.tsx` | component (client) | request-response | `src/components/admin/settings/OrderingToggle.tsx` | exact |
| `src/components/admin/settings/OrderingToggle.tsx` (extend) | component (client) | request-response | `src/components/admin/settings/OrderingToggle.tsx` | self |
| `src/components/admin/settings/ReminderForm.tsx` (reference) | component (client) | request-response | `src/components/admin/settings/ReminderForm.tsx` | self |

---

## Pattern Assignments

### `src/lib/admin/prepList.ts` (service/lib, CRUD aggregate)

**Analog:** `src/lib/admin/analytics.ts`

**Imports pattern** (lines 1-7):
```typescript
import "server-only";

import { db } from "@/lib/db";
import { count, desc, eq, sum } from "drizzle-orm";

import { order_items, orders } from "../../../drizzle/schema";
import { currentWeekOf } from "./week";
```

**Core aggregate pattern** (lines 17-55 from analytics.ts):
```typescript
// Pattern: single Promise.all of Drizzle selects, innerJoin, groupBy, orderBy
export async function getWeeklyAnalytics(weekOverride?: string): Promise<WeeklyAnalytics> {
  const week = weekOverride ?? currentWeekOf();

  const [topProductsResult] = await Promise.all([
    db
      .select({
        name: order_items.product_name,
        qty: sum(order_items.quantity),
      })
      .from(order_items)
      .innerJoin(orders, eq(order_items.order_id, orders.id))
      .where(eq(orders.week_of, week))
      .groupBy(order_items.product_name)
      .orderBy(desc(sum(order_items.quantity)))
      .limit(5),
  ]);

  return {
    // Drizzle `sum()` returns string | null — coerce defensively:
    topProducts: topProductsResult.map((row) => ({
      name: row.name,
      qty: Number(row.qty ?? 0),
    })),
  };
}
```

**Key difference for prepList.ts:** Use `inArray(orders.status, ["paid", "processing"])` instead of a single `eq`. Add `variant_label` and `prep_option` to the `groupBy`. The `inArray` import comes from `drizzle-orm` (not currently imported anywhere — add it explicitly).

---

### `src/lib/admin/manifest.ts` (service/lib, CRUD filtered fetch)

**Analog:** `src/lib/admin/orders.ts` (full fetch) + `src/lib/admin/reminders.ts` (week+status filter)

**Imports + type pattern** (lines 1-28 from orders.ts):
```typescript
import { db } from "@/lib/db";
import { order_items, orders } from "../../../drizzle/schema";
import { desc } from "drizzle-orm";

export type AdminOrderItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  prep_option: string | null;
  quantity: number;
  unit_price_ngn: number;
  subtotal_ngn: number;
};

export type AdminOrder = {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  allergy_notes: string | null;
  status: string;
  total_ngn: number;
  week_of: string;
  created_at: string;
  items: AdminOrderItem[];
};
```

**Core fetch + join pattern** (lines 30-66 from orders.ts):
```typescript
export async function getAdminOrders(): Promise<AdminOrder[]> {
  const [orderRows, itemRows] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.created_at)),
    db.select().from(order_items),
  ]);

  if (orderRows.length === 0) return [];

  const itemsByOrderId = new Map<string, AdminOrderItem[]>();
  for (const it of itemRows) {
    const list = itemsByOrderId.get(it.order_id) ?? [];
    list.push({ /* shape fields */ });
    itemsByOrderId.set(it.order_id, list);
  }

  return orderRows.map((o) => ({
    // ...fields...
    // Date coercion pattern:
    week_of: typeof o.week_of === "string" ? o.week_of : new Date(o.week_of).toISOString().slice(0, 10),
    created_at: o.created_at instanceof Date ? o.created_at.toISOString() : String(o.created_at),
    items: itemsByOrderId.get(o.id) ?? [],
  }));
}
```

**Filter pattern from reminders.ts** (lines 13-27):
```typescript
// Add week_of + inArray(status) WHERE clause to the orders fetch:
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

.where(
  and(
    eq(schema.orders.week_of, weekOf),
    eq(schema.orders.status, "paid")   // for manifest: inArray(orders.status, ["paid","processing"])
  )
)
```

---

### `src/lib/admin/pendingOrders.ts` (service/lib, CRUD filtered fetch)

**Analog:** `src/lib/admin/reminders.ts` (exact pattern — week+status filter query)

**Full pattern** (lines 1-27 from reminders.ts):
```typescript
import "server-only";

import { and, eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";

export async function getPaidOrdersForWeek(weekOf: string): Promise<PaidOrderForReminder[]> {
  return db
    .select({
      id: schema.orders.id,
      customer_name: schema.orders.customer_name,
      customer_email: schema.orders.customer_email,
    })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.week_of, weekOf),
        eq(schema.orders.status, "paid")
      )
    );
}
```

**Adaptation for pendingOrders.ts:** Drop the `weekOf` parameter. Filter only on `eq(orders.status, "pending")`. Reuse `AdminOrder` type from `orders.ts`. Return full order shape (including items) using the `getAdminOrders` map pattern — but filtered to `pending` only.

**Also needs a count-only variant** for the sidebar badge:
```typescript
// SELECT COUNT(*) FROM orders WHERE status = 'pending'
import { count, eq } from "drizzle-orm";

export async function getPendingOrdersCount(): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(orders)
    .where(eq(orders.status, "pending"));
  return Number(row?.c ?? 0);
}
```

---

### `src/lib/admin/bulkTransition.ts` (service/lib, CRUD bulk update)

**Analog:** Drizzle update pattern from `src/app/api/admin/orders/[id]/route.ts` line 31:
```typescript
await db.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, id));
```

**Adaptation for bulkTransition.ts:**
```typescript
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "../../../drizzle/schema";

// Use and() for compound WHERE; wrap rowCount defensively
const result = await db
  .update(orders)
  .set({ status: toStatus })
  .where(and(eq(orders.week_of, weekOf), eq(orders.status, fromStatus)));
return result.rowCount ?? 0;
```

---

### `src/lib/admin/schemas.ts` (extend — utility, transform)

**Self-analog** (lines 49-53 — current `orderingConfigPatchSchema`):
```typescript
export const orderingConfigPatchSchema = z
  .object({
    is_ordering_open: z.boolean(),
  })
  .strict();
```

**Extension pattern — make all fields optional, add new fields:**
```typescript
// Replace the current strict single-field schema:
export const orderingConfigPatchSchema = z
  .object({
    is_ordering_open: z.boolean().optional(),
    next_delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    cutoff_message: z.string().max(300).nullable().optional(),
  })
  .strict()
  .refine(
    (d) => Object.values(d).some((v) => v !== undefined),
    { message: "At least one field required" }
  );
```

**New `bulkStatusTransitionSchema` — copy week regex from reminders route, add enum + refine:**
```typescript
// reminderBodySchema in reminders/route.ts uses:
week_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "week_of must be YYYY-MM-DD")
```

---

### `src/app/api/admin/orders/bulk-status/route.ts` (API route, request-response)

**Analog:** `src/app/api/admin/reminders/route.ts` (POST handler — auth + parse + action + response)

**Full pattern** (lines 20-62 from reminders/route.ts):
```typescript
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reminderBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // ... action ...
  return NextResponse.json({ sent: orders.length });
}
```

**Imports pattern** (lines 1-6 from config/route.ts):
```typescript
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { orderingConfigPatchSchema } from "@/lib/admin/schemas";
import { db, schema } from "@/lib/db";
```

---

### `src/app/api/admin/config/route.ts` (extend — API route, request-response)

**Self-analog** (full file, 38 lines). Key section for multi-field conditional update — adapt the `set()` call:

```typescript
// Current (sets all fields):
await db
  .update(schema.ordering_config)
  .set({
    is_ordering_open: parsed.data.is_ordering_open,
    updated_at: new Date(),
  })
  .where(eq(schema.ordering_config.id, 1));

// Extended pattern (only set defined fields):
const updateFields: Record<string, unknown> = { updated_at: new Date() };
if (parsed.data.is_ordering_open !== undefined)
  updateFields.is_ordering_open = parsed.data.is_ordering_open;
if (parsed.data.next_delivery_date !== undefined)
  updateFields.next_delivery_date = parsed.data.next_delivery_date;
if (parsed.data.cutoff_message !== undefined)
  updateFields.cutoff_message = parsed.data.cutoff_message;

await db
  .update(schema.ordering_config)
  .set(updateFields)
  .where(eq(schema.ordering_config.id, 1));
```

---

### `src/app/api/admin/orders/[id]/route.ts` (extend — add DELETE method)

**Self-analog** (lines 9-34 — PATCH handler). Add a `DELETE` handler following the same structure:

```typescript
// Existing PATCH — copy auth + params pattern:
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ...
  const { id } = await params;
  await db.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, id));
  return NextResponse.json({ ok: true });
}

// New DELETE — same auth + params, but no body:
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(orders).where(eq(orders.id, id));
  return NextResponse.json({ ok: true });
}
```

---

### `src/app/admin/prep-list/page.tsx` (page RSC, request-response)

**Analog:** `src/app/admin/analytics/page.tsx` (exact — auth guard, lib call, render)

**Full page structure** (lines 1-68 from analytics/page.tsx):
```typescript
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StatCard } from "@/components/admin/analytics/StatCard";
import { getWeeklyAnalytics } from "@/lib/admin/analytics";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const analytics = await getWeeklyAnalytics();

  return (
    <div className="min-h-screen bg-stone-100 p-8">
      <div className="mb-8">
        <p className="text-sm font-black uppercase tracking-wider text-red-600"
           style={{ fontFamily: "var(--font-lexend)" }}>
          Admin
        </p>
        <h1 className="mt-2 text-5xl font-black leading-[1.05] text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}>
          Analytics
        </h1>
        <p className="mt-2 text-base text-stone-500"
           style={{ fontFamily: "var(--font-inter)" }}>
          Week of {analytics.week}
        </p>
      </div>
      {/* content grid */}
    </div>
  );
}
```

**searchParams pattern for week picker** (Next.js 15 async searchParams):
```typescript
// Adapt page signature to accept searchParams:
export default async function AdminPrepListPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const { week } = await searchParams;
  const weekOf = week ?? currentWeekOf();
  const rows = await getPrepList(weekOf);
  // ...
}
```

---

### `src/app/admin/manifest/page.tsx` (page RSC, request-response)

**Analog:** `src/app/admin/orders/page.tsx` (RSC that fetches and hands off to client component)

**Page structure** (lines 1-35 from orders/page.tsx):
```typescript
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { getAdminOrders } from "@/lib/admin/orders";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const initialOrders = await getAdminOrders();

  return (
    <div className="min-h-screen bg-stone-100 p-8">
      <div className="mb-8">
        <p className="text-sm font-black uppercase tracking-wider text-red-600"
           style={{ fontFamily: "var(--font-lexend)" }}>Admin</p>
        <h1 className="mt-2 text-5xl font-black leading-[1.05] text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}>
          Orders
        </h1>
      </div>
      <OrdersTable initialOrders={initialOrders} />
    </div>
  );
}
```

**Print layout note:** Add `print:hidden` to the heading/action area and wrap the printable manifest table in a `print:block` container. `AdminLayout` sidebar needs `print:hidden` and `<main>` needs `print:w-full` — apply these at the layout level.

---

### `src/app/admin/pending/page.tsx` (page RSC, request-response)

**Analog:** `src/app/admin/orders/page.tsx` (identical structure — auth, fetch, render table component)

Same pattern as manifest page above. The lib call is `getPendingOrders()` from `src/lib/admin/pendingOrders.ts`. The table component is a new `PendingOrdersTable` that renders Delete buttons and omits `OrderStatusSelect`.

---

### `src/app/admin/analytics/page.tsx` (extend — add searchParams + WeekPicker)

**Self-analog** (current file, 68 lines). Only two changes:

1. Add `searchParams` prop (Next.js 15 async pattern, shown in prep-list pattern above)
2. Pass `week` to `getWeeklyAnalytics(week)` instead of calling with no argument
3. Render a `WeekPicker` client component above the stat grid

The `WeekPicker` component copies the date input pattern from `ReminderForm.tsx`:
```typescript
// ReminderForm.tsx lines 69-77 — date input styling to copy:
<input
  id="reminder-week-of"
  type="date"
  value={weekOf}
  onChange={(e) => setWeekOf(e.target.value)}
  required
  className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
  style={{ fontFamily: "var(--font-inter)" }}
/>
```

But instead of `setWeekOf(e.target.value)`, it calls `router.push('/admin/analytics?week=' + e.target.value)`.

---

### `src/app/admin/layout.tsx` (extend — add pendingCount prop pass-through)

**Self-analog** (current file, 23 lines):
```typescript
import * as React from "react";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar adminEmail={session.user.email ?? null} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

**Extension:** Add `getPendingOrdersCount()` call alongside `auth()`, pass result as `pendingCount` prop to `AdminSidebar`. Add `print:hidden` to `<aside>` (inside `AdminSidebar`) and `print:w-full` to `<main>` for manifest print support.

---

### `src/components/admin/AdminSidebar.tsx` (extend — add nav items + pendingCount badge)

**Self-analog** (full file, 81 lines). Key sections:

**NAV_ITEMS constant** (lines 11-17):
```typescript
const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", Icon: Lucide.LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", Icon: Lucide.ShoppingBag },
  { href: "/admin/products", label: "Products", Icon: Lucide.Package },
  { href: "/admin/analytics", label: "Analytics", Icon: Lucide.BarChart2 },
  { href: "/admin/settings", label: "Settings", Icon: Lucide.Settings2 },
] as const;
```

**Nav link render** (lines 43-64) — for items with a badge, add a count span inside the link:
```typescript
// Existing link render pattern:
<Link
  key={href}
  href={href}
  className={cn(
    "flex min-h-10 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
    active ? "bg-red-600 text-white shadow-sm" : "text-stone-500 hover:bg-stone-50 hover:text-zinc-800",
  )}
>
  <Icon className="h-4 w-4 shrink-0" />
  {label}
  {/* Add for Pending item: */}
  {badge != null && badge > 0 ? (
    <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
      {badge}
    </span>
  ) : null}
</Link>
```

**Prop addition:** Change `AdminSidebar` signature from `{ adminEmail: string | null }` to `{ adminEmail: string | null; pendingCount: number }`.

---

### `src/components/admin/orders/OrdersTable.tsx` (extend — add search field)

**Self-analog** (full file, 163 lines). Key pattern to copy for search field:

**Existing filter input** (lines 82-98 — week-filter date input):
```typescript
<div className="flex flex-col gap-1.5">
  <label
    htmlFor="week-filter"
    className="text-xs font-black uppercase tracking-wider text-stone-400"
    style={{ fontFamily: "var(--font-lexend)" }}
  >
    Delivery week
  </label>
  <input
    id="week-filter"
    type="date"
    className="h-10 w-44 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
    style={{ fontFamily: "var(--font-inter)" }}
    value={weekFilter}
    onChange={(e) => setWeekFilter(e.target.value)}
  />
</div>
```

**Existing useMemo filter** (lines 16-22):
```typescript
const filteredOrders = useMemo(() => {
  return initialOrders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (weekFilter && o.week_of !== weekFilter) return false;
    return true;
  });
}, [initialOrders, statusFilter, weekFilter]);
```

**Extension:** Add `searchQuery` state + extend the `filter` + add a search `<input type="search">` with `type="search"` before the status select. Copy the input className exactly from the week-filter input.

---

### `src/components/admin/settings/DeliveryConfigForm.tsx` (new — client component, request-response)

**Analog:** `src/components/admin/settings/OrderingToggle.tsx` (exact — same card, same PATCH /api/admin/config call, same save/error pattern)

**Full pattern to copy** (lines 1-173 from OrderingToggle.tsx). Key sections:

**Component shell + imports** (lines 1-17):
```typescript
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function OrderingToggle({ initialIsOpen }: { initialIsOpen: boolean }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(initialIsOpen);
  const [submitting, setSubmitting] = React.useState(false);
```

**PATCH call pattern** (lines 26-54):
```typescript
async function patchConfig(nextValue: boolean) {
  setSubmitting(true);
  try {
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_ordering_open: nextValue }),
    });
    if (!res.ok) {
      toast.error("Failed to save settings.");
      return;
    }
    setSavedVisible(true);
    router.refresh();
  } catch {
    toast.error("Failed to save settings.");
  } finally {
    setSubmitting(false);
  }
}
```

**Card container class** (line 74):
```typescript
className="rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60"
```

**Section label + form inputs** (lines 76-81 + ReminderForm.tsx lines 62-77):
```typescript
// Section label pattern (from OrderingToggle):
<p className="text-xs font-black uppercase tracking-wider text-stone-400"
   style={{ fontFamily: "var(--font-lexend)" }}>
  Delivery Configuration
</p>

// Input pattern (from ReminderForm):
<input
  type="date"
  className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
  style={{ fontFamily: "var(--font-inter)" }}
/>
```

**Save button** (lines 149-157 from OrderingToggle):
```typescript
<button
  type="button"
  onClick={() => void patchConfig(isOpen)}
  disabled={saveDisabled}
  className="rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
  style={{ fontFamily: "var(--font-lexend)" }}
>
  Save Settings
</button>
```

**DeliveryConfigForm props:** `{ initialNextDeliveryDate: string | null; initialCutoffMessage: string | null }`. Sends `{ next_delivery_date, cutoff_message }` to `PATCH /api/admin/config`.

---

## Shared Patterns

### Authentication Guard (all API routes and RSC pages)

**Source:** `src/app/api/admin/config/route.ts` lines 8-12 / `src/app/admin/analytics/page.tsx` lines 9-11

**API routes:**
```typescript
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**RSC pages:**
```typescript
const session = await auth();
if (!session?.user) redirect("/admin");
```

**Apply to:** All new API routes (`bulk-status/route.ts`), all new pages (`prep-list/page.tsx`, `manifest/page.tsx`, `pending/page.tsx`), extended pages (`analytics/page.tsx`).

---

### JSON Parse + Zod Validate (all mutating API routes)

**Source:** `src/app/api/admin/config/route.ts` lines 14-27

```typescript
let body: unknown;
try {
  body = await req.json();
} catch {
  return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
}

const parsed = orderingConfigPatchSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid payload", issues: parsed.error.flatten() },
    { status: 400 },
  );
}
```

**Apply to:** `bulk-status/route.ts` and any new API routes that accept a body.

---

### Dynamic Route `params` Awaiting (all [id] route handlers)

**Source:** `src/app/api/admin/orders/[id]/route.ts` line 9 + 30

```typescript
// Next.js 15: params is a Promise
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // ...
  const { id } = await params;
}
```

**Apply to:** The new `DELETE` handler added to `orders/[id]/route.ts`.

---

### Admin Page Header Typography

**Source:** `src/app/admin/analytics/page.tsx` lines 16-36

```typescript
<div className="mb-8">
  <p className="text-sm font-black uppercase tracking-wider text-red-600"
     style={{ fontFamily: "var(--font-lexend)" }}>
    Admin
  </p>
  <h1 className="mt-2 text-5xl font-black leading-[1.05] text-zinc-800"
      style={{ fontFamily: "var(--font-quicksand)" }}>
    {/* Page title */}
  </h1>
  <p className="mt-2 text-base text-stone-500"
     style={{ fontFamily: "var(--font-inter)" }}>
    {/* Subtitle / week label */}
  </p>
</div>
```

**Apply to:** All three new pages (`prep-list`, `manifest`, `pending`).

---

### Card Container Style

**Source:** `src/components/admin/settings/OrderingToggle.tsx` line 74

```typescript
className="rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60"
```

**Apply to:** `DeliveryConfigForm` card wrapper. Also used by `OrdersTable` for the table wrapper (line 114: `rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60`).

---

### `export const dynamic = "force-dynamic"` on all admin pages

**Source:** Every existing admin page (`analytics/page.tsx` line 7, `orders/page.tsx` line 7, `settings/page.tsx` line 9)

**Apply to:** `prep-list/page.tsx`, `manifest/page.tsx`, `pending/page.tsx`.

---

### Drizzle `sum()` / `count()` coercion

**Source:** `src/lib/admin/analytics.ts` line 45 comment + lines 49-54

```typescript
// Drizzle `sum()` returns string | null for numeric aggregates; coerce defensively.
totalRevenue: Number(totalRevenueResult[0]?.s ?? 0),
topProducts: topProductsResult.map((row) => ({
  name: row.name,
  qty: Number(row.qty ?? 0),
})),
```

**Apply to:** `prepList.ts` (`total_quantity: Number(r.total_quantity ?? 0)`), `pendingOrders.ts` count query.

---

### Test Mock Pattern (all new lib unit tests)

**Source:** `src/lib/admin/reminders.test.ts` lines 1-28 (chain-mocking pattern)

```typescript
import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
  schema: { orders: { week_of: "week_of", status: "status", id: "id", /* ... */ } },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  and: vi.fn((...args: unknown[]) => args),
  // add inArray, sum, count, desc as needed per test file
}));
```

**Apply to:** `prepList.test.ts`, `manifest.test.ts`, `pendingOrders.test.ts`, `bulkTransition.test.ts`.

Note: For more complex query chains (`.innerJoin().where().groupBy().orderBy()`), model after `orders.test.ts` which uses table-switch logic in the `from()` mock rather than the flat chain mock.

---

### Client-side `fetch` + `router.refresh()` pattern

**Source:** `src/components/admin/settings/OrderingToggle.tsx` lines 26-54

```typescript
const router = useRouter(); // from "next/navigation"

async function patchConfig(nextValue: boolean) {
  setSubmitting(true);
  try {
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_ordering_open: nextValue }),
    });
    if (!res.ok) {
      toast.error("Failed to save settings.");
      return;
    }
    router.refresh(); // Re-fetch RSC without full page reload
  } catch {
    toast.error("Failed to save settings.");
  } finally {
    setSubmitting(false);
  }
}
```

**Apply to:** `DeliveryConfigForm.tsx` (PATCH config), `BulkTransitionPanel` (POST bulk-status), `PendingOrdersTable` (DELETE order).

---

### Toast error notification

**Source:** `src/components/admin/settings/OrderingToggle.tsx` lines 5, 37, 48

```typescript
import { toast } from "sonner";
// ...
toast.error("Failed to save settings.");
```

**Apply to:** All new client components that call mutations.

---

## No Analog Found

All Phase 8 files have strong analogs in the codebase. No files require pattern derivation from RESEARCH.md alone.

| File | Note |
|------|------|
| `src/components/admin/products/BulkTransitionPanel.tsx` or similar | If implemented as a standalone component — no direct analog, but composed entirely of patterns from `ReminderForm.tsx` (form/submit) + `OrderingToggle.tsx` (PATCH pattern) |

---

## Metadata

**Analog search scope:** `src/lib/admin/`, `src/app/admin/`, `src/app/api/admin/`, `src/components/admin/`
**Files scanned:** 22 source files read in full
**Pattern extraction date:** 2026-05-07
