---
phase: 08-missing-admin-structures
verified: 2026-05-15T00:00:00Z
status: human_needed
score: 7/7 must-haves verified
overrides_applied: 0
gaps: []
human_verification:
  - test: "Navigate to /admin/prep-list and select a past delivery week"
    expected: "Aggregate prep list table renders with rows grouped by product_name + variant_label + prep_option showing quantities"
    why_human: "RSC page serving live DB data; cannot exercise the full Next.js RSC + Drizzle JOIN path without a running server"
  - test: "Navigate to /admin/analytics, click the week picker and select a past date"
    expected: "URL updates to ?week=YYYY-MM-DD; page re-renders with that week's revenue and order counts"
    why_human: "Client-side router.push navigation and Next.js searchParams re-render cannot be verified without a browser"
  - test: "Navigate to /admin/orders, type a partial customer name in the Search field"
    expected: "Table narrows in real time to matching rows"
    why_human: "React state-driven client filtering — correct in code but confirm no visual regressions in the rendered table"
  - test: "Navigate to /admin/manifest for a week with paid/processing orders; click Print Manifest"
    expected: "Browser print dialog opens; admin sidebar is absent from the print preview"
    why_human: "print:hidden CSS is verified in code but browser print layout requires visual confirmation"
  - test: "Navigate to /admin/settings and fill in next_delivery_date and cutoff_message, then Save"
    expected: "toast.success appears; the customer-facing cutoff banner on /shop reflects the updated values"
    why_human: "End-to-end save round-trip requires running server and DB; customer banner value update requires a visual check"
  - test: "Navigate to /admin — verify the Pending Orders nav item shows a red badge with the pending count"
    expected: "Badge count matches actual pending orders in the DB; badge is absent when count is 0"
    why_human: "Server-fetched live count with visual badge — needs a real admin session against a running server"
  - test: "Navigate to /admin/prep-list, select a week with paid orders, click Paid → Processing"
    expected: "Confirm dialog appears; on confirm, toast shows N orders updated; page refreshes with updated data"
    why_human: "Confirm dialog + fetch + router.refresh() sequence requires interactive browser session"
---

# Phase 8: Missing Admin Structures — Verification Report

**Phase Goal:** Complete missing admin structures — prep list, delivery manifest, pending orders management, and bulk status transitions so operations can run the weekly workflow end-to-end without direct DB access.
**Verified:** 2026-05-15T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Requirement ID Coverage Note

The plans declare `OPS-01` through `OPS-07` in their `requirements:` frontmatter fields. These IDs do not appear as named requirements in `.planning/REQUIREMENTS.md` (which uses the `FOUND-*`, `SHOP-*`, `ORD-*` etc. namespace). The ROADMAP.md Phase 8 entry references them as custom operational gap identifiers defined inline via seven Success Criteria. For this verification, the ROADMAP success criteria are treated as the authoritative must-haves — they define what must be TRUE, not merely what IDs were tagged.

**REQUIREMENTS.md orphaned IDs:** OPS-01 through OPS-07 are never defined in REQUIREMENTS.md. This is a documentation gap — the IDs exist only in ROADMAP.md. No feature work is missing because of this; the gap is administrative. Flagged as WARNING, not BLOCKER.

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Admin can select a delivery week and view a prep list: aggregate quantities per `product_name + variant_label + prep_option` across all `paid` and `processing` orders — from a single Drizzle JOIN query | VERIFIED | `src/lib/admin/prepList.ts` — single Drizzle `select` with `innerJoin`, `groupBy(product_name, variant_label, prep_option)`, `inArray(status, ['paid','processing'])`, `sum(quantity)` coerced to number. Page `src/app/admin/prep-list/page.tsx` reads `searchParams.week`, calls `getPrepList(weekOf)`, renders `PrepListTable`. |
| 2 | Analytics page has a week picker; `getWeeklyAnalytics()` `weekOverride` parameter is wired to the UI — past weeks accessible without a code change | VERIFIED | `src/app/admin/analytics/page.tsx` — accepts `searchParams: Promise<{ week?: string }>`, awaits `{ week }`, calls `getWeeklyAnalytics(week)`. `WeekPickerBar` component does `router.push('/admin/analytics?week=...')` on change. End-to-end wiring present. |
| 3 | Orders table has a search field that filters across `customer_name`, `customer_phone`, and `customer_email` in real time | VERIFIED | `src/components/admin/orders/OrdersTable.tsx` — `searchQuery` state, `useMemo` filter computing `q = searchQuery.toLowerCase().trim()` and testing haystack `${customer_name} ${customer_phone} ${customer_email}`. Input `id="customer-search"` type="search" wired to `onChange`. |
| 4 | Admin can view a per-week delivery manifest showing customer name, phone, address, and order items — printable, sortable by address or name — without exporting to spreadsheet | VERIFIED | `src/lib/admin/manifest.ts` — two-query `Promise.all` with `inArray(status, ['paid','processing'])`. `ManifestTable.tsx` — Sort by Name / Sort by Address buttons, `window.print()` button, `print:break-inside-avoid` on cards, `print:hidden` on controls. Sidebar `print:hidden` set in `AdminSidebar.tsx`. |
| 5 | Settings page exposes `next_delivery_date` and `cutoff_message` fields from `ordering_config` with a save action; changes reflected in customer-facing cutoff banner | VERIFIED | `DeliveryConfigForm.tsx` renders both fields, PATCHes `/api/admin/config`. Config route (`src/app/api/admin/config/route.ts`) uses conditional set object pattern — only writes present fields. `src/app/admin/settings/page.tsx` imports `DeliveryConfigForm` and passes `config.next_delivery_date` and `config.cutoff_message`. Schema `orderingConfigPatchSchema` accepts all three fields with at-least-one refine. |
| 6 | Admin can see `pending` (abandoned checkout) orders in a separate view with a count badge; orders can be manually deleted or ignored | VERIFIED | `/admin/pending/page.tsx` calls `getPendingOrders()` and renders `PendingOrdersTable`. `PendingOrdersTable.tsx` has Delete button per row with `window.confirm()` before `DELETE /api/admin/orders/{id}`. `orders/[id]/route.ts` exports auth-gated `DELETE` handler with `db.delete`. `AdminLayout` fetches `pendingCount = await getPendingOrdersCount()` post-auth and passes to `AdminSidebar`. Sidebar shows red badge when `pendingCount > 0`. |
| 7 | Admin can bulk-transition all `paid` → `processing` or all `processing` → `delivered` orders for a selected delivery week in a single action | VERIFIED | `src/lib/admin/bulkTransition.ts` — single Drizzle `UPDATE` with `and(eq(week_of), eq(status))`, returns `result.rowCount ?? 0`. `POST /api/admin/orders/bulk-status` — auth guard → JSON parse → `bulkStatusTransitionSchema.safeParse` (rejects paid→delivered) → `bulkTransitionOrders()` → `{ updated: N }`. `BulkTransitionPanel.tsx` on `/admin/prep-list` with two buttons, confirm dialog, toast feedback. |

**Score: 7/7 truths verified**

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/lib/admin/prepList.ts` | VERIFIED | Exports `getPrepList`, `PrepListRow`; `inArray`, `groupBy`, `sum` present; server-only |
| `src/app/admin/prep-list/page.tsx` | VERIFIED | Auth-gated RSC; reads `searchParams.week`; calls `getPrepList(weekOf)`; renders `PrepListTable` + `BulkTransitionPanel` |
| `src/components/admin/prep-list/PrepListTable.tsx` | VERIFIED | Client component with sortable table (product_name + total_quantity); empty state "No items for this week"; exports `PrepListWeekInput` and `PrepListTable` |
| `src/lib/admin/manifest.ts` | VERIFIED | Exports `getManifestOrders`, `ManifestOrder`; two-query `Promise.all`; `inArray`; server-only |
| `src/app/admin/manifest/page.tsx` | VERIFIED | Auth-gated RSC; reads `searchParams.week`; calls `getManifestOrders(weekOf)`; renders `ManifestTable` |
| `src/components/admin/manifest/ManifestTable.tsx` | VERIFIED | Sort by Name/Address; `window.print()`; `print:break-inside-avoid`; `print:hidden` on controls |
| `src/lib/admin/pendingOrders.ts` | VERIFIED | Exports `getPendingOrders`, `getPendingOrdersCount`; server-only; status='pending' filter |
| `src/app/admin/pending/page.tsx` | VERIFIED | Auth-gated RSC; calls `getPendingOrders()`; renders `PendingOrdersTable` |
| `src/components/admin/pending/PendingOrdersTable.tsx` | VERIFIED | Per-row Delete button; `window.confirm()`; `DELETE /api/admin/orders/{id}`; `router.refresh()` |
| `src/lib/admin/bulkTransition.ts` | VERIFIED | Exports `bulkTransitionOrders`; single Drizzle UPDATE; `result.rowCount ?? 0`; server-only |
| `src/app/api/admin/orders/bulk-status/route.ts` | VERIFIED | Auth guard → `bulkStatusTransitionSchema.safeParse` → `bulkTransitionOrders()` → `{ updated }` |
| `src/components/admin/prep-list/BulkTransitionPanel.tsx` | VERIFIED | Week picker; two transition buttons; POSTs `/api/admin/orders/bulk-status`; confirm dialog; toast |
| `src/app/admin/prep-list/page.tsx` | VERIFIED | Renders `BulkTransitionPanel currentWeek={weekOf}` below `PrepListTable` |
| `src/lib/admin/schemas.ts` | VERIFIED | `orderingConfigPatchSchema` extended with `next_delivery_date`, `cutoff_message`, at-least-one refine; `bulkStatusTransitionSchema` with paid→processing / processing→delivered refine; `BulkStatusTransition` type |
| `src/components/admin/settings/DeliveryConfigForm.tsx` | VERIFIED | `"use client"`; `id="next-delivery-date"` + `id="cutoff-message"` inputs; PATCH `/api/admin/config`; `toast.success`/`toast.error`; `router.refresh()` |
| `src/app/admin/settings/page.tsx` | VERIFIED | Imports and renders `DeliveryConfigForm` with `config.next_delivery_date` and `config.cutoff_message` |
| `src/app/api/admin/config/route.ts` | VERIFIED | Conditional `updateFields` pattern — only writes fields present in `parsed.data`; accepts `next_delivery_date` and `cutoff_message` |
| `src/components/admin/orders/OrdersTable.tsx` | VERIFIED | `searchQuery` state; `useMemo` haystack filter across customer_name + phone + email; `id="customer-search"` input |
| `src/app/admin/analytics/page.tsx` | VERIFIED | `searchParams: Promise<{ week?: string }>` prop; `const { week } = await searchParams`; `getWeeklyAnalytics(week)`; renders `WeekPickerBar` |
| `src/components/admin/analytics/WeekPickerBar.tsx` | VERIFIED | `"use client"`; date input; `router.push('/admin/analytics?week=...')` on change |
| `src/app/admin/layout.tsx` | VERIFIED | Imports `getPendingOrdersCount`; fetches post-auth; passes `pendingCount` to `AdminSidebar` |
| `src/components/admin/AdminSidebar.tsx` | VERIFIED | `buildNavItems(pendingCount)` with Prep List, Manifest, Pending Orders nav items; badge renders when `pendingCount > 0`; `print:hidden` on `<aside>` |
| `src/app/api/admin/orders/[id]/route.ts` | VERIFIED | `DELETE` handler auth-gated; `db.delete(orders).where(eq(orders.id, id))` |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `src/app/admin/prep-list/page.tsx` | `src/lib/admin/prepList.ts` | `getPrepList(weekOf)` | WIRED | Line 21: `const rows = await getPrepList(weekOf)` |
| `src/app/admin/manifest/page.tsx` | `src/lib/admin/manifest.ts` | `getManifestOrders(weekOf)` | WIRED | Line 20: `const orders = await getManifestOrders(weekOf)` |
| `src/lib/admin/prepList.ts` | drizzle `order_items + orders` | `innerJoin + inArray` | WIRED | Lines 27–35: `innerJoin(orders, ...)`, `inArray(orders.status, ['paid','processing'])`, `groupBy` |
| `src/components/admin/manifest/ManifestTable.tsx` | `window.print()` | Print button `onClick` | WIRED | Line 78: `onClick={() => window.print()}` |
| `src/components/admin/settings/DeliveryConfigForm.tsx` | `/api/admin/config` | `fetch PATCH` | WIRED | Lines 21–28: `fetch('/api/admin/config', { method: 'PATCH', body: JSON.stringify({...}) })` |
| `src/app/admin/analytics/page.tsx` | `src/lib/admin/analytics.ts` | `getWeeklyAnalytics(week)` | WIRED | Line 19: `const analytics = await getWeeklyAnalytics(week)` |
| `src/components/admin/orders/OrdersTable.tsx` | `initialOrders` prop | `useMemo` filter on `searchQuery` | WIRED | Lines 17–29: `filteredOrders = useMemo(...)` with `searchQuery` in dep array |
| `src/components/admin/pending/PendingOrdersTable.tsx` | `/api/admin/orders/[id]` | `fetch DELETE` | WIRED | Line 22: `fetch('/api/admin/orders/${id}', { method: 'DELETE' })` |
| `src/components/admin/prep-list/BulkTransitionPanel.tsx` | `/api/admin/orders/bulk-status` | `fetch POST` | WIRED | Line 25: `fetch('/api/admin/orders/bulk-status', { method: 'POST', ... })` |
| `src/app/api/admin/orders/bulk-status/route.ts` | `src/lib/admin/bulkTransition.ts` | `bulkTransitionOrders()` | WIRED | Line 29: `const updated = await bulkTransitionOrders(week_of, from_status, to_status)` |
| `src/app/api/admin/orders/[id]/route.ts` | drizzle `orders` table | `db.delete` | WIRED | Line 47: `await db.delete(orders).where(eq(orders.id, id))` |
| `src/app/admin/layout.tsx` | `src/lib/admin/pendingOrders.ts` | `getPendingOrdersCount()` | WIRED | Lines 5, 19: import + `const pendingCount = await getPendingOrdersCount()` |
| `src/components/admin/AdminSidebar.tsx` | `AdminLayout pendingCount` | `{ pendingCount }` prop | WIRED | Lines 33–36: prop signature; line 28: `badge: pendingCount` in nav item |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `PrepListTable.tsx` | `rows: PrepListRow[]` | `getPrepList()` → Drizzle `select + innerJoin + groupBy + inArray` | Yes — DB query with GROUP BY aggregate | FLOWING |
| `ManifestTable.tsx` | `orders: ManifestOrder[]` | `getManifestOrders()` → Drizzle two-query `Promise.all` | Yes — DB query filtered by week + status | FLOWING |
| `PendingOrdersTable.tsx` | `orders: AdminOrder[]` | `getPendingOrders()` → Drizzle `select WHERE status='pending'` | Yes — DB query | FLOWING |
| `OrdersTable.tsx` | `filteredOrders` (derived from `initialOrders` prop) | `initialOrders` populated by page-level `getAdminOrders()` (pre-existing); `searchQuery` is client state filter on loaded data | Yes — filter over real server data | FLOWING |
| `WeekPickerBar.tsx` | `currentWeek: string` | `analytics.week` from `getWeeklyAnalytics(week)` → DB | Yes — derived from real DB analytics | FLOWING |
| `DeliveryConfigForm.tsx` | `initialNextDeliveryDate`, `initialCutoffMessage` | `getOrderingConfig()` → Drizzle `ordering_config` row | Yes — DB row | FLOWING |
| `BulkTransitionPanel.tsx` | `currentWeek` prop | `weekOf` from `searchParams.week ?? currentWeekOf()` in prep-list page | Yes — URL-driven; mutates via `bulkTransitionOrders()` DB UPDATE | FLOWING |
| `AdminSidebar.tsx` | `pendingCount: number` | `getPendingOrdersCount()` → Drizzle `SELECT COUNT(*)` | Yes — DB count | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — requires a running Next.js server with live Neon DB connection. All lib functions are database-dependent; no standalone runnable module entry points exist.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| OPS-01 | 08-04 | Weekly prep/packing list — aggregate quantities per product/variant/prep | SATISFIED | `prepList.ts` + `/admin/prep-list` page + `PrepListTable` fully implemented |
| OPS-02 | 08-02 | Analytics week picker wired to `getWeeklyAnalytics(weekOverride)` | SATISFIED | `analytics/page.tsx` reads `searchParams.week`; `WeekPickerBar` wired |
| OPS-03 | 08-02 | Orders table customer search (name, phone, email) | SATISFIED | `OrdersTable.tsx` has `searchQuery` state and `useMemo` haystack filter |
| OPS-04 | 08-04 | Delivery manifest — printable, sortable, per-customer with items | SATISFIED | `manifest.ts` + `/admin/manifest` page + `ManifestTable` with print and sort |
| OPS-05 | 08-02 | Settings page exposes `next_delivery_date` + `cutoff_message` | SATISFIED | `DeliveryConfigForm` wired to extended schema + config route |
| OPS-06 | 08-03, 08-05 | Pending orders page with sidebar badge and delete capability | SATISFIED | `pendingOrders.ts` + `/admin/pending` + `PendingOrdersTable` + DELETE handler + sidebar badge |
| OPS-07 | 08-02, 08-05 | Bulk status transition (paid→processing or processing→delivered) | SATISFIED | `bulkTransition.ts` + `/api/admin/orders/bulk-status` + `BulkTransitionPanel` |

**OPS IDs not defined in REQUIREMENTS.md** — see coverage note above. These IDs are used only within the phase plans/ROADMAP. Not a functional gap; administrative documentation only.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/lib/admin/pendingOrders.ts` | Fetches ALL `order_items` then filters in JS (`db.select().from(order_items)` without WHERE) | Warning | For small data sets this is acceptable, but as order volume grows this becomes a full table scan. Consistent with the existing `getAdminOrders()` pattern — not a regression. |
| None | No `TODO/FIXME/PLACEHOLDER` comments found in any new files | — | — |
| None | No empty `return null / return {} / return []` stubs found (empty state messages are real UI, not stubs) | — | — |
| None | No hardcoded empty data props found at call sites | — | — |

All new components return real JSX with data-driven output. Empty states ("No items for this week", "No deliveries for this week", "No pending orders") are intentional graceful degradation, not stubs — they display when DB queries return empty results.

---

### Human Verification Required

The following behaviors require an authenticated admin session against a running server. All pass automated code-level checks but cannot be confirmed programmatically.

#### 1. Prep List Page Renders Aggregate Data

**Test:** Log in as admin; navigate to `/admin/prep-list`; select a week that has paid or processing orders using the week picker
**Expected:** Table renders with rows grouped by product_name + variant_label + prep_option, showing aggregated quantities; empty-week shows "No items for this week"
**Why human:** RSC page with live Drizzle GROUP BY JOIN — cannot run Next.js RSC rendering without a server

#### 2. Analytics Week Picker Updates Page

**Test:** Navigate to `/admin/analytics`; use the date picker to select a past week
**Expected:** URL updates to `?week=YYYY-MM-DD`; revenue and order count change to reflect that week's data
**Why human:** Client-side `router.push` navigation and Next.js `searchParams` re-render require a browser

#### 3. Orders Search Field Real-Time Filter

**Test:** Navigate to `/admin/orders`; type a partial customer name fragment into the Search field
**Expected:** Table narrows to matching rows in real time without page reload; clearing the field shows all orders again
**Why human:** React state-driven useMemo filter — correct in code but confirming no visual regressions in the live UI

#### 4. Manifest Print Layout Hides Sidebar

**Test:** Navigate to `/admin/manifest` for a week with paid/processing orders; click "Print Manifest"
**Expected:** Browser print dialog opens; sidebar is absent; order cards render per-page; header "Admin" label hidden
**Why human:** CSS `print:hidden` / `print:break-inside-avoid` can only be visually verified in a print preview

#### 5. Settings Delivery Config Save Round-Trip

**Test:** Navigate to `/admin/settings`; set a next delivery date and cutoff message; click Save Settings
**Expected:** Toast success appears; customer-facing cutoff banner on `/shop` now shows the updated values
**Why human:** Requires running server + live DB write + shop page re-render to confirm the end-to-end effect

#### 6. Pending Orders Count Badge in Sidebar

**Test:** Log in as admin with at least one pending order in the DB; navigate to any `/admin/*` route
**Expected:** "Pending Orders" nav item shows a red badge with the count; badge is absent when count is 0
**Why human:** Server-fetched live count with visual badge rendering — needs real admin session

#### 7. Bulk Transition Confirm and Toast

**Test:** On `/admin/prep-list`, select a week with paid orders; click "Paid → Processing"
**Expected:** `window.confirm` dialog appears with correct message; on confirm, toast shows "N orders updated (Paid → Processing)"; page refreshes and prep list reflects new statuses
**Why human:** `window.confirm` + fetch + `router.refresh()` interactive sequence requires a browser with DB state

---

### Gaps Summary

No code gaps found. All 7 ROADMAP success criteria are fully implemented with real data wiring (not stubs). The 7 human verification items are standard "does it work end-to-end with real data" checks that cannot be automated without a running server — they are not indicators of missing code.

**Administrative gap (WARNING, not BLOCKER):** OPS-01 through OPS-07 requirement IDs are not defined in `.planning/REQUIREMENTS.md`. They exist only in ROADMAP.md's `requirements:` field for Phase 8. The REQUIREMENTS.md traceability table does not include these IDs. No feature is missing; the REQUIREMENTS.md file predates Phase 8's insertion and was not updated to include the new operational gap IDs.

---

_Verified: 2026-05-15T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
