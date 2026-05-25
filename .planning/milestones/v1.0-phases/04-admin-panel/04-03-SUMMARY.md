---
phase: 04-admin-panel
plan: 03
subsystem: admin-orders
status: complete
completed_at: "2026-05-01"
commits:
  - a483585
  - 446b77e
  - f1b4aa7
  - d0d17da
key_files:
  - src/lib/admin/orders.ts
  - src/app/admin/orders/page.tsx
  - src/app/api/admin/orders/[id]/route.ts
  - src/components/admin/orders/OrdersTable.tsx
  - src/components/admin/orders/OrderRow.tsx
  - src/components/admin/orders/OrderStatusSelect.tsx
  - src/components/admin/orders/OrdersTable.test.tsx
  - src/lib/admin/orders.test.ts
---

# Phase 04 Plan 03: Admin Orders (OrdersTable + status updates)

Built the `/admin/orders` surface end-to-end: server-side loader, orders page, guarded status PATCH handler, and client-side table with filtering, inline expansion, and CSV export. Added and then satisfied TDD tests to lock ORD-01..ORD-05 behavior.

## What Shipped

- **Server-only loader**: `getAdminOrders()` in `src/lib/admin/orders.ts` loads orders newest-first (`orders.created_at DESC`) and nests `order_items` into each order record.
- **Admin Orders page**: `src/app/admin/orders/page.tsx` is a Server Component that checks `auth()` (defence-in-depth) and renders `<OrdersTable initialOrders={...} />` with `export const dynamic = "force-dynamic"`.
- **Status PATCH Route Handler**: `PATCH /api/admin/orders/[id]` at `src/app/api/admin/orders/[id]/route.ts`:
  - Returns **401** when `auth()` has no session user.
  - Validates body via **`orderStatusPatchSchema.safeParse`** (strict + enum).
  - Updates only `orders.status` via Drizzle `.where(eq(orders.id, id))`.
- **Client components**:
  - `OrdersTable` provides **status + delivery-week filters**, **CSV export** from the currently filtered view (via `serializeOrdersCsv`), and manages per-row expansion state.
  - `OrderRow` renders the table row, chevron, and an inline expanded detail section (items + allergy notes + delivery address) using `motion/react` for the expanded area animation.
  - `OrderStatusSelect` performs `fetch(PATCH)` and calls `router.refresh()` after the request succeeds.

## Tests (TDD)

- **RED → GREEN**:
  - `src/lib/admin/orders.test.ts` verifies `getAdminOrders()` nests `order_items`.
  - `src/components/admin/orders/OrdersTable.test.tsx` verifies ORD-01..ORD-05 table behavior: headers, expansion, filtering, and PATCH wiring.

## Deviations from Plan

- **UI primitives**: Implemented filters and status update using native `<select>`/`<input>` controls styled with Tailwind instead of shadcn `<Select>` primitives. This keeps dependencies minimal while preserving required UX and test coverage.
- **Vitest + `server-only`**: To unit-test the server-only loader in a jsdom test environment, `server-only` is mocked in `src/lib/admin/orders.test.ts`.

## Verification Notes

- `npm run test -- src/lib/admin/orders.test.ts` passes.
- `npm run test -- src/components/admin/orders/OrdersTable.test.tsx` passes.
- `npx tsc --noEmit` passes.

## Self-Check: PASSED

- **Files exist**: loader, page, route handler, and 3 client components are present at the paths listed in frontmatter.
- **Commits exist**: the commit hashes listed in frontmatter exist in `git log`.

