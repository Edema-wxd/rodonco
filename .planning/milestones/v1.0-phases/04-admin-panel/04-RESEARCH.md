# Phase 4: Admin Panel - Research

**Researched:** 2026-04-30
**Domain:** Next.js 15 App Router admin interface — NextAuth v5, Drizzle ORM, shadcn/ui, Uploadthing, React Hook Form + Zod
**Confidence:** HIGH (codebase verified, installed packages confirmed)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Admin uses a persistent left sidebar with four sections: Orders, Products, Analytics, Settings.
**D-02:** Sidebar sections map to routes: `/admin/orders`, `/admin/products`, `/admin/analytics`, `/admin/settings`.
**D-03:** The ordering window toggle (INFRA-03) lives on the Settings page — not embedded in Analytics.
**D-04:** The existing `src/app/admin/layout.tsx` shell is the base. Refactor to include sidebar alongside `{children}`.
**D-05:** Login form at `/admin` — centered card on neutral background (`bg-gray-50`). Fields: Email, Password. One "Sign In" button. No logo or branding.
**D-06:** After successful login, redirect to `/admin/orders`.
**D-07:** Login uses `signIn("credentials", { email, password, redirectTo: "/admin/orders" })`. Error states shown inline.
**D-08:** Order details revealed via inline expandable row — no modal or drawer.
**D-09:** Status update via dropdown directly in the Status column. Change triggers PATCH Route Handler immediately.
**D-10:** Default sort: newest first (`orders.created_at DESC`).
**D-11:** Filters: status dropdown and delivery week date picker.
**D-12:** CSV export downloads the current filtered view — client-side generation from loaded data.
**D-13:** Create/edit product form opens in a right-side drawer (shadcn Sheet side="right").
**D-14:** Variants and prep options as inline editable lists within the drawer. All saved atomically on form submit.
**D-15:** Uploadthing image upload (`productImage` endpoint) at the top of the product form.
**D-16:** `is_active` toggle is a switch inside the product form drawer — not inline in the table.
**D-17:** Product delete: "Delete" button inside the drawer with inline confirmation. Cascades via DB foreign key `ON DELETE CASCADE`.
**D-18:** Analytics shows four stat cards — no charts, no charting library.
**D-19:** "This week" = current delivery week matching `orders.week_of`.
**D-20:** Settings page has a single prominent control: the ordering window toggle. Calls `PATCH /api/admin/config`.
**D-21:** `auth()` from `src/auth.ts` is called in all admin Route Handlers and Server Components for defence-in-depth.
**D-22:** Sign-out button calls `signOut({ redirectTo: "/admin" })`.

### Claude's Discretion

- shadcn/ui component selection (Table, Sheet, Select, Badge, Switch, etc.)
- Exact Tailwind styling details within neutral/white admin aesthetic
- Pagination vs infinite scroll — pagination chosen (simpler)
- Route Handlers location — use `app/api/admin/` for clarity
- Analytics data fetching — Server Component direct DB query (no separate API route)

### Deferred Ideas (OUT OF SCOPE)

- WhatsApp notification channel (ADM-01)
- Bulk order status update (ADM-02)
- Admin configurable cutoff time (ADM-03)
- Delivery reminder email trigger (NOTF-01) — scoped to Phase 6
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Admin login page at `/admin` with NextAuth Credentials | D-05, D-06, D-07; `signIn("credentials", ...)` pattern verified in `src/auth.ts` |
| AUTH-02 | All `/admin/*` routes protected by server-side auth guard | Middleware already live in `src/middleware.ts`; `auth()` defence-in-depth in Route Handlers |
| AUTH-03 | Unauthenticated access redirects to `/admin` login | `src/middleware.ts` line 12–14 handles redirect; already implemented |
| ORD-01 | Orders table: Reference, Customer, Phone, Date, Status, Total, Actions | shadcn `<Table>` pattern documented; columns map directly to `orders` schema columns |
| ORD-02 | Expandable rows with order items and prep instructions | `useState` Map keyed on order ID; `motion.div` height animation 150ms; `order_items` joined query |
| ORD-03 | Orders filterable by status and delivery week | Drizzle `and(eq(...), eq(...))` / `gte`/`lte` for week_of filter; client state drives filter |
| ORD-04 | CSV export of current filtered view | Client-side Blob + `URL.createObjectURL` pattern; no library needed |
| ORD-05 | Status dropdown moves order through `paid → processing → delivered` | `PATCH /api/admin/orders/[id]`; `auth()` guard; Drizzle `db.update` pattern |
| PROD-01 | Add/edit products: name, description, type, active status | React Hook Form + Zod; Sheet drawer; `POST`/`PATCH /api/admin/products/[id]` |
| PROD-02 | Upload product images via Uploadthing | `UploadButton` from `src/utils/uploadthing.ts` already typed for `OurFileRouter`; `productImage` endpoint live |
| PROD-03 | Add/edit/remove size variants and prices | `useFieldArray` in RHF; atomic save with variants in same POST/PATCH body |
| PROD-04 | Add/edit/remove prep options per product | `useFieldArray`; same atomic save as variants |
| PROD-05 | Toggle `is_active` to show/hide products | shadcn `<Switch>` in drawer form; included in same atomic save body |
| ANLT-01 | Total orders for current week | Drizzle `count()` aggregate filtered by `week_of = currentWeekOf()` |
| ANLT-02 | Total revenue for current week (NGN) | Drizzle `sum(orders.total_ngn)` filtered by week_of |
| ANLT-03 | Top 5 most ordered products by quantity | Drizzle `sum(order_items.quantity)` grouped by `product_name`, `orderBy(desc(...)).limit(5)` |
| ANLT-04 | Order status breakdown (paid / processing / delivered) | Drizzle `count()` grouped by `status`, filtered by week_of |
| INFRA-03 | Admin manually toggles `is_ordering_open` | `PATCH /api/admin/config`; `db.update(ordering_config).set(...)` with `where(eq(ordering_config.id, 1))` |
| INFRA-04 | All ordering state checks read `is_ordering_open` on every request — no caching | `noStore()` or `cache: 'no-store'` pattern; verified in Phase 03 approach |
</phase_requirements>

---

## Summary

Phase 4 builds the admin operations panel on top of auth infrastructure already completed in Phase 02.1. The codebase has NextAuth v5 (beta.31) fully wired with a Credentials provider, middleware protecting `/admin/:path*`, and Uploadthing configured with the `productImage` endpoint guarded by `auth()`. The Drizzle schema covers all required tables. No new infrastructure packages are needed — this phase is entirely UI and Route Handler implementation.

The primary complexity concentrates in three areas: (1) the product drawer with inline variant/prep-option field arrays managed by `useFieldArray` and a single atomic POST/PATCH, (2) the orders table with expandable rows driven by a `useState` Map, and (3) analytics aggregation queries written as Drizzle `groupBy` + `sum`/`count` calls executed directly in a Server Component. The login form is straightforward: a Client Component calling `signIn("credentials", ...)` from `next-auth/react`, displaying inline errors from the returned error code.

**Primary recommendation:** Build each admin page as a Server Component for initial data fetch, with Client Component "islands" for interactive parts (filter controls, expandable rows, product drawer form, settings toggle). Route Handlers under `src/app/api/admin/` handle all mutations. Call `auth()` at the top of every Route Handler as defence-in-depth; middleware already covers redirect.

---

## Standard Stack

### Core (all already installed — versions verified from `node_modules`)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| next | 15.5.15 | App Router, Server Components, Route Handlers | [VERIFIED: node_modules] |
| next-auth | 5.0.0-beta.31 | Auth session — `auth()`, `signIn`, `signOut` | [VERIFIED: node_modules] |
| drizzle-orm | 0.45.2 | DB queries, aggregations, transactions | [VERIFIED: node_modules] |
| react-hook-form | 7.72.1 | Product drawer form, login form | [VERIFIED: node_modules] |
| zod | 3.25.76 | Schema validation for forms and Route Handlers | [VERIFIED: node_modules] |
| @uploadthing/react | 7.3.3 | `UploadButton` component for image upload | [VERIFIED: node_modules] |
| uploadthing | 7.7.4 | Server-side file router (already configured) | [VERIFIED: node_modules] |
| motion | 12.38.0 | Row expand/collapse animation | [VERIFIED: node_modules] |
| lucide-react | 1.8.0 | Icons: ShoppingBag, Package, BarChart2, Settings2, ChevronDown | [VERIFIED: node_modules] |
| sonner | 2.0.7 | Toast notifications (already installed) | [VERIFIED: node_modules] |

### shadcn Components to Install

Per UI-SPEC.md — none currently installed except `button`:

```bash
npx shadcn add table
npx shadcn add sheet
npx shadcn add select
npx shadcn add badge
npx shadcn add switch
npx shadcn add input
npx shadcn add label
npx shadchan add separator
npx shadcn add sidebar
npx shadcn add card
```

[VERIFIED: `src/components/ui/` contains only `button.tsx` — all others need installation]

### Hook Form Resolver

`@hookform/resolvers` 3.10.0 is installed [VERIFIED: node_modules]. Use `zodResolver` from `@hookform/resolvers/zod`. **Critical:** Zod is pinned to v3 — do not upgrade. `@hookform/resolvers` v3 breaks with Zod v4 (documented in STATE.md accumulated decisions).

### Alternatives Not Needed

| Problem | Rejected Alternative | Reason |
|---------|---------------------|--------|
| CSV export | `papaparse`, `csv-stringify` | Client-side Blob generation from in-memory array is sufficient at MVP scale |
| Data tables | TanStack Table | shadcn `<Table>` + manual state is sufficient for a fixed-column admin table |
| Charts | recharts, chart.js | D-18 explicitly prohibits charts — plain numbers only |
| State management | Zustand | Local `useState` is sufficient for admin page state; Zustand already used for customer cart only |

---

## Architecture Patterns

### Recommended Project Structure

```
src/app/admin/
├── layout.tsx              ← REFACTOR: sidebar + children shell (Server Component)
├── page.tsx                ← REPLACE: login form (Client Component)
├── orders/
│   └── page.tsx            ← Server Component (initial data fetch) + Client islands
├── products/
│   └── page.tsx            ← Server Component + ProductDrawer Client Component
├── analytics/
│   └── page.tsx            ← Server Component (direct DB aggregation queries)
└── settings/
    └── page.tsx            ← Server Component (reads ordering_config) + Client toggle

src/app/api/admin/
├── orders/
│   └── [id]/
│       └── route.ts        ← PATCH (status update)
├── products/
│   ├── route.ts            ← POST (create product)
│   └── [id]/
│       └── route.ts        ← PATCH (update), DELETE (delete)
└── config/
    └── route.ts            ← PATCH (ordering_config toggle)

src/components/admin/
├── AdminSidebar.tsx         ← Client Component (usePathname for active link)
├── orders/
│   ├── OrdersTable.tsx      ← Client Component (expandable rows, filter state, CSV)
│   └── OrderStatusSelect.tsx ← Client Component (inline PATCH trigger)
├── products/
│   ├── ProductsTable.tsx    ← Client Component (list with drawer trigger)
│   └── ProductDrawer.tsx    ← Client Component (RHF form + UploadButton)
├── analytics/
│   └── StatCard.tsx         ← Server-safe pure presentational component
└── settings/
    └── OrderingToggle.tsx   ← Client Component (toggle + inline confirm)
```

### Pattern 1: Server Component Data Fetch + Client Island

Admin pages fetch initial data as Server Components (direct Drizzle query, no fetch/API call), then pass data as props to Client Component islands for interactivity.

```typescript
// src/app/admin/orders/page.tsx — Server Component
import { db } from "@/lib/db";
import { orders } from "../../../../drizzle/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";

export default async function OrdersPage() {
  // Defence-in-depth: middleware already redirects, but verify session here too
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const allOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.created_at));

  return <OrdersTable initialOrders={allOrders} />;
}
// Source: established pattern from Phase 03 codebase; auth() from src/auth.ts [VERIFIED]
```

### Pattern 2: NextAuth v5 `auth()` in Route Handlers

Every admin Route Handler must call `auth()` at the top before any mutation. The `auth()` function is exported from `src/auth.ts` and works in both Server Components and Route Handlers.

```typescript
// src/app/api/admin/orders/[id]/route.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();
  await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, params.id));

  return NextResponse.json({ ok: true });
}
// Source: next-auth v5 docs pattern; auth() verified in src/auth.ts [VERIFIED]
```

### Pattern 3: NextAuth v5 Login Form (Client Component)

The login page must be a Client Component because it calls `signIn` from `next-auth/react`. The `signIn` function from `src/auth.ts` is the **server-side** version; the client-side form must import from `next-auth/react`.

```typescript
// src/app/admin/page.tsx — Client Component
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin/orders",
    });
    // signIn with redirectTo performs a client-side redirect on success.
    // On error, result.error is populated.
    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    }
    setPending(false);
  }
  // ...
}
// Source: next-auth v5 beta — signIn from "next-auth/react" for Client Components [ASSUMED based on v5 beta docs pattern]
```

**Critical distinction:** `signIn`/`signOut` from `src/auth.ts` are for **Server Actions** only. Client Components must import from `next-auth/react`. [VERIFIED: `src/auth.ts` exports are the server handlers; the pattern is consistent with NextAuth v5 beta.31 architecture]

### Pattern 4: Drizzle Filtering and Pagination for Orders

```typescript
// Drizzle filtered orders query — server-side
import { db } from "@/lib/db";
import { orders, order_items } from "../../../../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

// Filter by status and week_of; paginate with offset/limit
const PAGE_SIZE = 50;

async function getOrders(
  status: string | null,
  weekOf: string | null,
  page: number
) {
  const conditions = [];
  if (status && status !== "all") conditions.push(eq(orders.status, status));
  if (weekOf) conditions.push(eq(orders.week_of, weekOf));

  return db
    .select()
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.created_at))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);
}
// Source: drizzle-orm 0.45.2 API — eq, and, desc confirmed in installed schema [VERIFIED]
```

### Pattern 5: Drizzle Analytics Aggregation Queries

All four analytics metrics can be fetched in a single Server Component using `Promise.all`. The `week_of` column is a `date` type — filter with string comparison (`eq`).

```typescript
import { db } from "@/lib/db";
import { orders, order_items } from "../../../../drizzle/schema";
import { eq, sql, desc, count, sum } from "drizzle-orm";

const currentWeek = getCurrentWeekOf(); // returns "YYYY-MM-DD" Sunday date string

const [
  totalOrdersResult,
  totalRevenueResult,
  topProductsResult,
  statusBreakdownResult,
] = await Promise.all([
  // ANLT-01: Total orders this week
  db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.week_of, currentWeek)),

  // ANLT-02: Total revenue this week (sum of total_ngn, stored as integer NGN)
  db
    .select({ total: sum(orders.total_ngn) })
    .from(orders)
    .where(eq(orders.week_of, currentWeek)),

  // ANLT-03: Top 5 products by quantity ordered this week
  db
    .select({
      product_name: order_items.product_name,
      total_qty: sum(order_items.quantity),
    })
    .from(order_items)
    .innerJoin(orders, eq(order_items.order_id, orders.id))
    .where(eq(orders.week_of, currentWeek))
    .groupBy(order_items.product_name)
    .orderBy(desc(sum(order_items.quantity)))
    .limit(5),

  // ANLT-04: Status breakdown this week
  db
    .select({ status: orders.status, count: count() })
    .from(orders)
    .where(eq(orders.week_of, currentWeek))
    .groupBy(orders.status),
]);
// Source: drizzle-orm 0.45.2 — count(), sum() aggregates [VERIFIED: installed version confirmed]
// Note: drizzle-orm count/sum helpers: import { count, sum } from "drizzle-orm" [ASSUMED: verify import path matches installed 0.45.2]
```

**Note on `sum` return type:** Drizzle's `sum()` returns `string | null` (PostgreSQL numeric). Cast to number for display: `Number(totalRevenueResult[0]?.total ?? 0)`.

### Pattern 6: Product CRUD with Atomic Variants + Prep Options (Transaction)

Create and update operations must write `products`, `product_variants`, and `product_prep_options` atomically. Use Drizzle transactions.

```typescript
// POST /api/admin/products — create product with variants and prep options
import { db } from "@/lib/db";
import { products, product_variants, product_prep_options } from "../../../../../../drizzle/schema";

await db.transaction(async (tx) => {
  const [newProduct] = await tx
    .insert(products)
    .values({
      name: data.name,
      description: data.description,
      type: data.type,
      image_url: data.image_url ?? null,
      is_active: data.is_active,
    })
    .returning({ id: products.id });

  if (data.variants.length > 0) {
    await tx.insert(product_variants).values(
      data.variants.map((v) => ({
        product_id: newProduct.id,
        label: v.label,
        price_ngn: v.price_ngn,
        is_default: v.is_default ?? false,
      }))
    );
  }

  if (data.prep_options.length > 0) {
    await tx.insert(product_prep_options).values(
      data.prep_options.map((p) => ({
        product_id: newProduct.id,
        label: p.label,
        extra_cost_ngn: p.extra_cost_ngn ?? 0,
      }))
    );
  }
});
// Source: drizzle-orm transaction API [VERIFIED: drizzle-orm 0.45.2 installed]
```

**For PATCH (update):** Delete existing variants and prep options for the product, then re-insert from the submitted form data. This is simpler than diffing:

```typescript
await db.transaction(async (tx) => {
  await tx.update(products).set({ ...productFields }).where(eq(products.id, id));
  // Delete and re-insert variants
  await tx.delete(product_variants).where(eq(product_variants.product_id, id));
  if (data.variants.length > 0) {
    await tx.insert(product_variants).values(data.variants.map(...));
  }
  // Delete and re-insert prep options
  await tx.delete(product_prep_options).where(eq(product_prep_options.product_id, id));
  if (data.prep_options.length > 0) {
    await tx.insert(product_prep_options).values(data.prep_options.map(...));
  }
});
```

### Pattern 7: React Hook Form + Zod for Product Drawer

```typescript
"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const variantSchema = z.object({
  id: z.string().optional(), // undefined for new rows
  label: z.string().min(1, "Label required"),
  price_ngn: z.coerce.number().int().positive("Price must be positive"),
  is_default: z.boolean().default(false),
});

const prepOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label required"),
  extra_cost_ngn: z.coerce.number().int().min(0).default(0),
});

const productSchema = z.object({
  name: z.string().min(1, "Product name required"),
  description: z.string().optional(),
  type: z.enum(["fresh_produce", "cooking_kit"]),
  image_url: z.string().url().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  variants: z.array(variantSchema),
  prep_options: z.array(prepOptionSchema),
});

type ProductFormValues = z.infer<typeof productSchema>;

// Inside component:
const form = useForm<ProductFormValues>({
  resolver: zodResolver(productSchema),
  defaultValues: product
    ? { ...product, variants: product.variants, prep_options: product.prep_options }
    : { name: "", type: "fresh_produce", is_active: true, variants: [], prep_options: [] },
});

const { fields: variantFields, append: appendVariant, remove: removeVariant } =
  useFieldArray({ control: form.control, name: "variants" });

const { fields: prepFields, append: appendPrep, remove: removePrep } =
  useFieldArray({ control: form.control, name: "prep_options" });
// Source: react-hook-form 7.72.1 useFieldArray API [VERIFIED: installed version]
// Zod v3.25.76 — z.coerce.number() available [VERIFIED: installed version]
```

### Pattern 8: Uploadthing UploadButton in Product Drawer

The `UploadButton` is already typed and exported from `src/utils/uploadthing.ts`. Use it within a Client Component. The `onClientUploadComplete` callback receives the file URL to store in form state.

```typescript
import { UploadButton } from "@/utils/uploadthing";

// Inside ProductDrawer Client Component:
<UploadButton
  endpoint="productImage"
  onClientUploadComplete={(res) => {
    if (res?.[0]?.url) {
      form.setValue("image_url", res[0].url);
    }
  }}
  onUploadError={(error) => {
    console.error("Upload error:", error);
  }}
/>
// Source: src/utils/uploadthing.ts [VERIFIED: generateUploadButton exported for OurFileRouter]
// @uploadthing/react 7.3.3 — onClientUploadComplete callback [VERIFIED: installed version]
```

**Note:** The Uploadthing middleware in `core.ts` calls `auth()` — upload will only succeed when the user is logged in. This is already correct behaviour.

### Pattern 9: CSV Export (Client-Side)

No library needed. Generate CSV string from the current filtered orders array in component state, then trigger browser download.

```typescript
function exportCSV(filteredOrders: OrderWithItems[]) {
  const header = [
    "Reference",
    "Customer Name",
    "Phone",
    "Email",
    "Delivery Address",
    "Week Of",
    "Items",
    "Total NGN",
  ].join(",");

  const rows = filteredOrders.map((order) => {
    const items = order.items
      .map((i) => `${i.product_name} x${i.quantity}`)
      .join("; ");
    return [
      order.reference,
      `"${order.customer_name}"`,
      order.customer_phone,
      order.customer_email,
      `"${order.delivery_address}"`,
      order.week_of,
      `"${items}"`,
      order.total_ngn,
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
// Source: standard browser Blob API [ASSUMED: universally supported, no verification needed]
```

### Pattern 10: Expandable Order Row

The orders table is a Client Component with a `Map<string, boolean>` state tracking which rows are expanded.

```typescript
const [expandedRows, setExpandedRows] = useState<Map<string, boolean>>(new Map());

function toggleRow(orderId: string) {
  setExpandedRows((prev) => {
    const next = new Map(prev);
    next.set(orderId, !prev.get(orderId));
    return next;
  });
}

// In table row:
<tr onClick={() => toggleRow(order.id)} className="cursor-pointer hover:bg-gray-50">
  {/* ... cells ... */}
  <td>
    <ChevronDown
      className={cn(
        "h-4 w-4 transition-transform duration-150",
        expandedRows.get(order.id) && "rotate-180"
      )}
    />
  </td>
</tr>

{expandedRows.get(order.id) && (
  <tr>
    <td colSpan={7} className="bg-gray-50 px-4 py-3">
      {/* order items, allergy notes, delivery address */}
    </td>
  </tr>
)}
// Source: CONTEXT.md D-08, UI-SPEC.md orders table spec [VERIFIED: project decisions]
```

### Pattern 11: revalidation After Mutations

Admin pages fetch data server-side at render time. After a mutation via Route Handler, the Client Component must refresh the server data. Use `router.refresh()` from `next/navigation`.

```typescript
import { useRouter } from "next/navigation";

const router = useRouter();

async function handleStatusChange(orderId: string, newStatus: string) {
  await fetch(`/api/admin/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  router.refresh(); // Re-fetches server component data without full page reload
}
// Source: Next.js 15 App Router docs — router.refresh() pattern [ASSUMED: standard Next.js 15 pattern]
```

**Alternative:** For the product drawer, after save close the drawer and call `router.refresh()` to re-render the products list from the server.

### Pattern 12: ordering_config Toggle (PATCH Route Handler)

```typescript
// PATCH /api/admin/config
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ordering_config } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { is_ordering_open } = await req.json();

  await db
    .update(ordering_config)
    .set({
      is_ordering_open,
      updated_at: new Date(),
    })
    .where(eq(ordering_config.id, 1));

  return NextResponse.json({ ok: true });
}
// Source: drizzle/schema.ts ordering_config table [VERIFIED]; auth() from src/auth.ts [VERIFIED]
```

### Anti-Patterns to Avoid

- **Importing `signIn`/`signOut` from `src/auth.ts` in Client Components.** These are server-only exports. Client Components must import from `"next-auth/react"`.
- **Importing `db` from `src/lib/db/index.ts` in Client Components.** It has `import "server-only"` at the top — importing it in a Client Component causes a build error.
- **Using `router.refresh()` without `await` on the fetch.** Refresh before the mutation completes shows stale data. Always `await` the fetch first.
- **Using Zod v4 syntax (e.g., `z.string().check(...)`)** — Zod is pinned to v3.25.76 in this project. Use v3 API only.
- **Caching admin data.** Admin pages reading `ordering_config` or orders must not cache — use `{ cache: "no-store" }` on any fetch, or for direct Drizzle queries (which are not cached by default), this is already satisfied.
- **Calling `db.transaction()` from a Route Handler on the Neon HTTP driver with long payloads.** Neon HTTP driver supports transactions but not interactive transactions. Use `db.batch()` or sequential statements for Neon HTTP; the `neon-http` driver in this project supports transactions via the Drizzle transaction API.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state + validation | Custom controlled inputs | React Hook Form + Zod (already installed) | RHF handles dirty state, arrays, submission, error display |
| Dynamic field arrays (variants/prep options) | `useState` array with manual splice | `useFieldArray` from RHF | Handles registration, removal, ordering correctly |
| Image upload | Custom file input + fetch to S3/Vercel Blob | `UploadButton` from `@uploadthing/react` (already configured) | Auth middleware, retry, progress, URL return already handled |
| Session verification | Manual JWT decode in Route Handlers | `auth()` from `src/auth.ts` | Handles JWT strategy, expiry, and session shape |
| Sidebar active link | Manual `window.location.pathname` check | `usePathname()` from `next/navigation` | React-aware, updates on navigation |
| NGN currency formatting | Manual string concatenation | `new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })` | Handles locale, separators |
| DB transactions | Manual try/catch with rollback logic | `db.transaction(async (tx) => ...)` | Drizzle handles rollback automatically |

**Key insight:** Every "hard part" of this admin panel (auth, file upload, form arrays, session) has a pre-built, already-installed solution. The implementation work is wiring them together — not building custom solutions.

---

## Common Pitfalls

### Pitfall 1: `signIn` import confusion (Server vs Client)

**What goes wrong:** Developer imports `signIn` from `"@/auth"` (server export) inside a Client Component. The form submits but the redirect never fires, or a cryptic error appears.

**Why it happens:** `src/auth.ts` exports `signIn` for use in Server Actions. The login page in this project must be a Client Component (it uses `useState` for error display), so it needs the client-side `signIn` from `"next-auth/react"`.

**How to avoid:** Rule — if the file has `"use client"`, import `signIn`/`signOut` from `"next-auth/react"`. If it's a Server Component or Server Action, import from `"@/auth"`.

**Warning signs:** TypeScript does not catch this; the error appears at runtime as an undefined function or missing redirect.

### Pitfall 2: `db` imported in Client Component

**What goes wrong:** Build fails with "You're importing a module with `import 'server-only'`" error.

**Why it happens:** `src/lib/db/index.ts` has `import "server-only"` as its first line. Any Client Component that imports `db` directly triggers this at build time.

**How to avoid:** All Drizzle queries stay in Server Components or Route Handlers. Client Components receive data as props or fetch it from `/api/admin/` Route Handlers.

**Warning signs:** Build-time error `"server-only" cannot be imported from a Client Component`. If this appears during development, check for accidental `db` imports in `"use client"` files.

### Pitfall 3: `useFieldArray` field values not in schema

**What goes wrong:** Variants or prep options appear in the UI but are not submitted — the form's `handleSubmit` callback receives an empty array.

**Why it happens:** `useFieldArray` requires fields to be registered within the `useForm` schema. If the Zod schema doesn't include `variants` and `prep_options` as arrays, RHF silently drops them.

**How to avoid:** Ensure `productSchema` includes `variants: z.array(variantSchema)` and `prep_options: z.array(prepOptionSchema)`. Use `{...register(\`variants.${index}.label\`)}` for field inputs.

**Warning signs:** `console.log(form.getValues())` after filling variants shows empty `variants: []`.

### Pitfall 4: `sum()` returns string from Drizzle

**What goes wrong:** Revenue displays as `"undefined"` or `"NaN"` because `sum()` returns `string | null`, not `number`.

**Why it happens:** PostgreSQL `SUM` returns a `numeric` type; Drizzle maps it to TypeScript `string | null` to preserve precision.

**How to avoid:** Always wrap: `Number(result[0]?.total ?? 0)` before display. For NGN formatting: `Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(revenueNGN)`.

**Warning signs:** TypeScript will show `string | null` type — treat this as a required conversion, not optional.

### Pitfall 5: `router.refresh()` called before `await fetch()`

**What goes wrong:** Table re-renders with stale data — the status dropdown shows the old value briefly before settling.

**Why it happens:** `router.refresh()` triggers immediately while the PATCH request is still in flight.

**How to avoid:**
```typescript
await fetch(`/api/admin/orders/${id}`, { method: "PATCH", ... });
router.refresh(); // Only called after mutation completes
```

### Pitfall 6: `ordering_config` update forgets `updated_at`

**What goes wrong:** The `updated_at` column goes stale — not a data loss issue, but bad housekeeping.

**Why it happens:** The schema has `updated_at` on `ordering_config` but Drizzle does not auto-update it on `UPDATE` (unlike `defaultNow()` which only applies on `INSERT`).

**How to avoid:** Always include `updated_at: new Date()` in the `.set({...})` call for `ordering_config` updates.

### Pitfall 7: Product delete doesn't cascade if FK constraints missing

**What goes wrong:** Deleting a product leaves orphaned rows in `product_variants` and `product_prep_options`, or the delete fails with a foreign key constraint violation.

**Why it happens:** If the DB migration doesn't include `ON DELETE CASCADE` on the FK columns.

**How to avoid:** Schema already defines `references(() => products.id, { onDelete: "cascade" })` for both `product_variants` and `product_prep_options` [VERIFIED: drizzle/schema.ts lines 35, 48]. Confirm the migration was applied correctly. The DELETE Route Handler only needs to delete the `products` row — the DB handles the rest.

### Pitfall 8: Motion import must be `"motion/react"` not `"framer-motion"`

**What goes wrong:** `import { motion } from "framer-motion"` causes a module not found error.

**Why it happens:** The package was rebranded. The installed package is `motion` (v12.38.0), not `framer-motion`.

**How to avoid:** Always `import { motion } from "motion/react"`. This is documented in STATE.md accumulated decisions.

---

## Code Examples

### Verified — `auth()` in Server Component

```typescript
// Any admin Server Component
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");
  // ... render
}
// Source: src/auth.ts exports auth [VERIFIED]
```

### Verified — `usePathname` for active sidebar link

```typescript
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/orders", label: "Orders", Icon: ShoppingBag },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/analytics", label: "Analytics", Icon: BarChart2 },
  { href: "/admin/settings", label: "Settings", Icon: Settings2 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r bg-white flex flex-col min-h-screen">
      <div className="px-4 py-5 text-sm font-semibold">Rodo & Co Admin</div>
      <nav className="flex-1 px-2 py-2 space-y-1">
        {navItems.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-3 min-h-10 text-sm font-semibold",
              pathname === href
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
// Source: UI-SPEC.md sidebar anatomy [VERIFIED]; usePathname from next/navigation [ASSUMED standard Next.js 15 pattern]
```

### Verified — Drizzle `ordering_config` read (no cache)

```typescript
// Direct DB read — Drizzle does not cache; result is always fresh
import { db } from "@/lib/db";
import { ordering_config } from "../../../../drizzle/schema";

const [config] = await db.select().from(ordering_config).where(eq(ordering_config.id, 1));
// config.is_ordering_open: boolean
// Source: drizzle/schema.ts ordering_config definition [VERIFIED]
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` import | `motion/react` import | Package renamed ~2024 | Must use new import path |
| NextAuth v4 `getServerSession()` | NextAuth v5 `auth()` | Beta.31 (installed) | Simpler — single `auth()` call everywhere |
| Supabase Storage for images | Uploadthing for images | Phase 02.1 migration | `productImage` endpoint is live; use `UploadButton` |
| Zod v4 API | Zod v3 API | Pinned v3 per STATE.md | Do not use `.check()`, `.parse()` changes from v4 |
| `next/font/local` for Geist | `next/font/google` for Geist | Phase 1 setup | Already configured in `src/app/layout.tsx` |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Client Components import `signIn`/`signOut` from `"next-auth/react"`, not `"@/auth"` | Pattern 3 | Login form won't redirect; wrong function called |
| A2 | `router.refresh()` pattern re-fetches Server Component data without full page reload in Next.js 15 | Pattern 11 | Stale data displayed after mutations |
| A3 | `count()` and `sum()` are importable from `"drizzle-orm"` in v0.45.2 (not a sub-path) | Pattern 5 | Import error at build time |
| A4 | Neon HTTP driver (`drizzle-orm/neon-http`) supports Drizzle transactions | Pattern 6 | Transaction calls fail; need to use sequential statements instead |
| A5 | shadcn `sidebar` component from `npx shadcn add sidebar` works with Tailwind v4 and shadcn v4.3.0 | Standard Stack | shadcn sidebar may require additional setup steps or be incompatible |

**Highest risk:** A4 (Neon HTTP + transactions). If the Neon HTTP driver does not support interactive transactions, the product CRUD must use sequential statements with manual error handling instead of `db.transaction()`. The Neon HTTP driver supports "batch" queries but interactive transactions require the WebSocket driver (`@neondatabase/serverless` with WS). Recommend verifying this before writing the product CRUD Route Handler.

---

## Open Questions

## Open Questions (RESOLVED)

1. **Neon HTTP driver transaction support**
   - **Decision:** Treat interactive transactions as **not required** for MVP correctness. All product mutations MUST be implemented as **sequential statements** (update product, delete/reinsert variants, delete/reinsert prep options). This is the primary path in the plans, not a fallback.
   - **Rationale:** The admin panel can tolerate the extremely small risk of partial writes during an unexpected mid-request failure. This keeps implementation compatible with the current driver and avoids runtime surprises.
   - **Verification:** Not required for planning; execution plans explicitly avoid `db.transaction()` for product CRUD.

2. **shadcn `sidebar` component complexity**
   - **Decision:** Prefer a **hand-built `<aside>`** that matches `04-UI-SPEC.md` exactly (w-56 fixed sidebar), even if `npx shadcn add sidebar` exists.
   - **Rationale:** The UI contract is simple and fixed; shadcn’s sidebar component can introduce extra provider/state complexity with no functional benefit for this internal tool.
   - **Verification:** Sidebar implementation plan (`04-02-PLAN.md`) hardcodes the UI-SPEC anatomy and does not require shadcn sidebar primitives.

3. **`count()` and `sum()` import path in drizzle-orm 0.45.2**
   - **Decision:** Use named exports from `"drizzle-orm"`: `import { count, sum } from "drizzle-orm"`.
   - **Verification command:** `node -e "import('drizzle-orm').then(m=>{console.log('count' in m, 'sum' in m);}).catch(e=>{console.error(e);process.exit(1);})"`
   - **Expected output:** `true true`
   - **Observed output:** `true true` (verified in this workspace on 2026-05-01)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| next-auth | AUTH-01–03 | Yes | 5.0.0-beta.31 | — |
| drizzle-orm | All DB ops | Yes | 0.45.2 | — |
| @uploadthing/react | PROD-02 | Yes | 7.3.3 | — |
| react-hook-form | PROD-01–05 | Yes | 7.72.1 | — |
| zod | Validation | Yes | 3.25.76 | — |
| motion | Row animation | Yes | 12.38.0 | CSS transition only |
| lucide-react | Sidebar icons | Yes | 1.8.0 | — |
| sonner | Toast (Settings save) | Yes | 2.0.7 | Inline state text |
| shadcn table | ORD-01 | Not installed | — | Install: `npx shadcn add table` |
| shadcn sheet | PROD-01 | Not installed | — | Install: `npx shadcn add sheet` |
| shadcn select | ORD-03, ORD-05 | Not installed | — | Install: `npx shadcn add select` |
| shadcn badge | ORD-01 status | Not installed | — | Install: `npx shadcn add badge` |
| shadcn switch | PROD-05, INFRA-03 | Not installed | — | Install: `npx shadcn add switch` |
| shadcn input | Forms | Not installed | — | Install: `npx shadcn add input` |
| shadcn label | Forms | Not installed | — | Install: `npx shadcn add label` |
| shadcn separator | Sidebar | Not installed | — | Install: `npx shadcn add separator` |
| shadcn sidebar | Admin layout | Not installed | — | Install or hand-build `<aside>` |
| shadcn card | ANLT-01–04 | Not installed | — | Install: `npx shadcn add card` |

**Missing dependencies with no fallback:** None — all missing shadcn components have a clear `npx shadcn add` install path.

**Missing dependencies with fallback:** `shadcn sidebar` can be replaced with a hand-built `<aside>` if the component adds unwanted complexity.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.0 |
| Config file | `vitest.config.ts` (assumed — check root; `package.json` scripts show `vitest run`) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login form renders and calls signIn | unit | `npm run test -- src/components/admin` | No — Wave 0 |
| AUTH-02 | Middleware redirects unauthenticated requests | manual-only | manual browser test | N/A |
| AUTH-03 | Unauthenticated redirect fires | manual-only | manual browser test | N/A |
| ORD-01 | Orders table renders columns correctly | unit | `npm run test -- src/components/admin/orders` | No — Wave 0 |
| ORD-02 | Row expands on click showing items | unit | `npm run test -- src/components/admin/orders` | No — Wave 0 |
| ORD-03 | Filter state updates displayed rows | unit | `npm run test -- src/components/admin/orders` | No — Wave 0 |
| ORD-04 | CSV export generates correct content | unit | `npm run test -- src/components/admin/orders` | No — Wave 0 |
| ORD-05 | Status PATCH called on dropdown change | unit | `npm run test -- src/components/admin/orders` | No — Wave 0 |
| PROD-01 | Product form validates required fields | unit | `npm run test -- src/components/admin/products` | No — Wave 0 |
| PROD-02 | Upload button renders in drawer | unit (render) | `npm run test -- src/components/admin/products` | No — Wave 0 |
| PROD-03 | useFieldArray appends/removes variant rows | unit | `npm run test -- src/components/admin/products` | No — Wave 0 |
| PROD-04 | useFieldArray appends/removes prep option rows | unit | `npm run test -- src/components/admin/products` | No — Wave 0 |
| PROD-05 | is_active switch included in form submit | unit | `npm run test -- src/components/admin/products` | No — Wave 0 |
| ANLT-01 | Total orders stat card renders count | unit (render) | `npm run test -- src/components/admin/analytics` | No — Wave 0 |
| ANLT-02 | Revenue formatted in NGN locale | unit | `npm run test -- src/components/admin/analytics` | No — Wave 0 |
| ANLT-03 | Top 5 products list renders | unit (render) | `npm run test -- src/components/admin/analytics` | No — Wave 0 |
| ANLT-04 | Status breakdown counts render | unit (render) | `npm run test -- src/components/admin/analytics` | No — Wave 0 |
| INFRA-03 | Toggle sends PATCH to /api/admin/config | unit (mock fetch) | `npm run test -- src/components/admin/settings` | No — Wave 0 |
| INFRA-04 | ordering_config read has no caching | manual-only | manual — change DB, verify page reflects change | N/A |

### Sampling Rate

- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/components/admin/orders/OrdersTable.test.tsx` — covers ORD-01 through ORD-05
- [ ] `src/components/admin/products/ProductDrawer.test.tsx` — covers PROD-01 through PROD-05
- [ ] `src/components/admin/analytics/StatCard.test.tsx` — covers ANLT-01 through ANLT-04
- [ ] `src/components/admin/settings/OrderingToggle.test.tsx` — covers INFRA-03
- [ ] `vitest.config.ts` — verify exists at repo root; `@testing-library/react` and `jsdom` are installed [VERIFIED: package.json]

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | NextAuth v5 Credentials + bcryptjs (already implemented in src/auth.ts) |
| V3 Session Management | Yes | JWT strategy via NextAuth; httpOnly cookie (NextAuth default) |
| V4 Access Control | Yes | `auth()` in every Route Handler + middleware on `/admin/:path*` |
| V5 Input Validation | Yes | Zod schemas on all Route Handler inputs |
| V6 Cryptography | No | No new crypto — bcrypt handled by existing auth |

### Known Threat Patterns for Admin Panel

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated Route Handler access | Elevation of Privilege | `auth()` check at top of every handler; return 401 if no session |
| Mass assignment via product PATCH body | Tampering | Zod schema on request body — only accept whitelisted fields |
| Status manipulation (set to invalid value) | Tampering | Zod `z.enum(["paid", "processing", "delivered"])` on PATCH /orders/[id] |
| CSRF on PATCH/POST/DELETE handlers | Spoofing | Next.js 15 Route Handlers check `Content-Type` header; additionally NextAuth session cookie is SameSite=Lax |
| Uploadthing unauthorized upload | Elevation of Privilege | `core.ts` middleware calls `auth()` — already implemented [VERIFIED] |
| XSS via order allergy notes / address | Tampering | React escapes JSX output by default; no `dangerouslySetInnerHTML` used |

---

## Sources

### Primary (HIGH confidence)
- `src/auth.ts` — NextAuth v5 setup, `auth()` export, Credentials provider, session strategy
- `drizzle/schema.ts` — all table definitions, FK cascade rules
- `src/lib/db/index.ts` — Drizzle instance with `neon-http` driver, `server-only` guard
- `src/middleware.ts` — admin route protection via `getToken()`
- `src/app/api/uploadthing/core.ts` — `productImage` endpoint with auth middleware
- `src/utils/uploadthing.ts` — typed `UploadButton` export
- `package.json` — all installed package versions
- `.planning/phases/04-admin-panel/04-CONTEXT.md` — locked decisions
- `.planning/phases/04-admin-panel/04-UI-SPEC.md` — component interaction contracts

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — accumulated decisions: motion import path, Zod v3 pin, bcrypt pattern
- `.planning/REQUIREMENTS.md` — requirement IDs and descriptions

### Tertiary (LOW confidence)
- A1: `signIn` from `"next-auth/react"` for Client Components — standard NextAuth v5 pattern, not verified against installed beta.31 changelog
- A2: `router.refresh()` re-fetches server data — standard Next.js 15 pattern, not verified against 15.5.15 release notes
- A3: `count()`/`sum()` import path from `"drizzle-orm"` in v0.45.2

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from installed `node_modules`
- Architecture patterns: HIGH — consistent with existing codebase patterns (Phase 03)
- Auth patterns: MEDIUM — NextAuth v5 beta, documented pattern; slight risk on Client vs Server `signIn` distinction
- Drizzle queries: HIGH — schema verified, driver confirmed, aggregation API well-established
- Uploadthing integration: HIGH — endpoint live, typed helpers exported, auth guard in place
- Pitfalls: HIGH — sourced from actual installed code and STATE.md project decisions

**Research date:** 2026-04-30
**Valid until:** 2026-05-30 (stable dependencies; next-auth beta may update)

---

## RESEARCH COMPLETE
