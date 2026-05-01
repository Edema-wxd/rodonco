---
phase: 04-admin-panel
reviewed: 2026-05-01T16:17:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - src/auth.ts
  - src/middleware.ts
  - src/app/admin/layout.tsx
  - src/app/admin/page.tsx
  - src/app/admin/orders/page.tsx
  - src/app/admin/products/page.tsx
  - src/app/admin/settings/page.tsx
  - src/app/api/admin/config/route.ts
  - src/app/api/admin/products/route.ts
  - src/app/api/admin/products/[id]/route.ts
  - src/app/api/admin/orders/[id]/route.ts
  - src/lib/admin/schemas.ts
  - src/lib/admin/orders.ts
  - src/lib/admin/products.ts
  - src/lib/admin/config.ts
  - src/lib/admin/csv.ts
  - src/app/api/uploadthing/core.ts
  - src/components/admin/orders/OrdersTable.tsx
  - src/components/admin/products/ProductDrawer.tsx
  - src/components/admin/products/ProductImageUpload.tsx
findings:
  critical: 2
  warning: 4
  info: 5
  total: 11
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-05-01T16:17:00Z  
**Depth:** standard  
**Files Reviewed:** 20  
**Status:** issues_found

## Summary

Admin panel flow is generally well-structured: server components check `auth()` before rendering admin pages, API handlers validate JSON via Zod, and middleware verifies JWT integrity on `/admin/:path*`. Key gaps remain around **CSV export safety** (spreadsheet formula injection), **missing/unsafe secret handling for JWT verification**, and **non-transactional multi-step Drizzle writes** that can leave data partially updated.

## Critical Issues

### CR-01: CSV formula injection in admin export

**File:** `src/lib/admin/csv.ts:17-21,23-39`  
**Issue:** `csvEscape()` only escapes quotes and commas/newlines, but does **not** prevent spreadsheet formula injection. Any field beginning with `=`, `+`, `-`, or `@` can be interpreted as a formula when opened in Excel/Sheets (e.g., `=HYPERLINK(...)`). This is particularly relevant for customer-controlled fields like name/address/item names.

**Evidence:**

```17:39:src/lib/admin/csv.ts
function csvEscape(value: string, forceQuotes = false): string {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replaceAll('"', '""');
  return needsQuotes || forceQuotes ? `"${escaped}"` : escaped;
}
```

**Fix (example):** Neutralize leading formula characters by prefixing a single quote (or a tab) *before* quoting/escaping:

```ts
function sanitizeCsvCell(value: string): string {
  // Prevent Excel/Sheets formula injection
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvEscape(value: string, forceQuotes = false): string {
  const safe = sanitizeCsvCell(value);
  const needsQuotes = /[",\n\r]/.test(safe);
  const escaped = safe.replaceAll('"', '""');
  return needsQuotes || forceQuotes ? `"${escaped}"` : escaped;
}
```

Also add a regression test to `src/lib/admin/csv.test.ts` for a value like `=2+2` appearing as `"'=2+2"` in output.

### CR-02: JWT verification secret may be undefined, risking auth bypass/instability

**File:** `src/middleware.ts:12-16`  
**Issue:** `getToken({ secret: process.env.AUTH_SECRET })` is called even if `AUTH_SECRET` is unset. Depending on runtime/NextAuth config, this can lead to inconsistent verification behavior (errors → 500s) or unintended acceptance if a default is used elsewhere. This is an admin gate; it should fail closed and be explicit.

**Evidence:**

```10:16:src/middleware.ts
if (isAdminRoute && !isAdminLanding) {
  // Cryptographically verify the session JWT (prevents forged cookie-name bypass).
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }
}
```

**Fix:** Validate secret presence and fail closed (redirect) rather than proceeding with an undefined secret, and keep naming consistent with your NextAuth config (if you rely on `AUTH_SECRET`, enforce it at boot).

Example:

```ts
const secret = process.env.AUTH_SECRET;
if (!secret) {
  // Fail closed: do not allow access without a verification secret
  return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
}
const token = await getToken({ req, secret });
```

## Warnings

### WR-01: Multi-step product writes are non-transactional (partial updates possible)

**File:** `src/app/api/admin/products/route.ts:31-62`, `src/app/api/admin/products/[id]/route.ts:33-66`  
**Issue:** Product create/update executes multiple statements (product row + variants + prep options) without a transaction. If any statement fails mid-way (network blip, constraint violation, etc.), data can be left in an inconsistent state (e.g., product exists without variants, or variants deleted but reinserts fail).

**Evidence:**

```31:62:src/app/api/admin/products/route.ts
// neon-http transaction support is uncertain for interactive tx; use sequential statements.
const [created] = await db.insert(products)...
if (variants.length > 0) await db.insert(product_variants)...
if (prep_options.length > 0) await db.insert(product_prep_options)...
```

```33:66:src/app/api/admin/products/[id]/route.ts
await db.update(products)...
await db.delete(product_variants)...
if (variants.length > 0) await db.insert(product_variants)...
await db.delete(product_prep_options)...
if (prep_options.length > 0) await db.insert(product_prep_options)...
```

**Fix:** Prefer a transaction if supported by your driver (or switch to a driver that supports it for admin writes). If not feasible, implement compensating logic (e.g., on failure after creating product, delete the created product; on update, stage inserts before deletes and swap, etc.). At minimum, return 500 with a clear message and log correlation id so partial failures can be repaired.

### WR-02: Admin API handlers don’t validate `params.id` as UUID

**File:** `src/app/api/admin/products/[id]/route.ts:30-45,71-80`, `src/app/api/admin/orders/[id]/route.ts:30-32`  
**Issue:** Route params are used directly in `eq(..., id)` without validating shape. If a non-UUID is provided, behavior depends on Drizzle/driver casting (could be a no-op update, or error). This is user input and should be validated with Zod.

**Fix:** Validate `params.id` via `z.string().uuid()` and return 400 on invalid input.

### WR-03: Update/delete endpoints don’t handle “not found”

**File:** `src/app/api/admin/products/[id]/route.ts:34-82`, `src/app/api/admin/orders/[id]/route.ts:30-33`  
**Issue:** API always returns `{ ok: true }` even if no rows were updated/deleted. This is a correctness/UX issue (admin UI will report success even when nothing happened).

**Fix:** Use `.returning()` (or a `select` prior) to confirm existence and return 404 when appropriate.

### WR-04: `OrderStatusSelect` accepts arbitrary `initial` string

**File:** `src/components/admin/orders/OrderStatusSelect.tsx:9-16`  
**Issue:** `initial` is typed as `string`, but the UI assumes it is one of `paid|processing|delivered`. If backend returns another status (e.g., schema default includes `pending` per `drizzle/schema.ts:64`), the select will be in an inconsistent state (value not in options).

**Fix:** Type `initial` as the union (same as `STATUS_OPTIONS[number]`) or include additional statuses if they exist (`pending`, `cancelled`) and align with `orderStatusPatchSchema` + DB defaults.

## Info

### IN-01: DB schema import path is brittle in admin routes

**File:** `src/app/api/admin/products/route.ts:6`, `src/app/api/admin/products/[id]/route.ts:7`, `src/app/api/admin/orders/[id]/route.ts:7`  
**Issue:** Routes import tables via long relative paths into `drizzle/schema`. This is easy to break on refactors and differs from `src/lib/db/index.ts` exporting `schema`.

**Fix:** Prefer `import { schema } from "@/lib/db"` and reference `schema.products`, etc., or export named tables from a stable alias module.

### IN-02: `AdminLayout` relies on middleware nuance; ensure this doesn’t drift

**File:** `src/app/admin/layout.tsx:11-15`  
**Issue:** Comment notes middleware protects `/admin/:path*` but not `/admin`. This coupling is subtle; if matcher changes, layout behavior could unintentionally expose admin chrome to unauthenticated users (or vice versa).

**Fix:** Consider explicit redirect on `/admin/*` pages (already present in each page) and keep middleware matcher + layout comment in sync.

### IN-03: `DATABASE_URL!` non-null assertion can cause hard crash on misconfig

**File:** `src/lib/db/index.ts:5-7`  
**Issue:** `process.env.DATABASE_URL!` will crash at runtime if missing; for admin operations, that’s okay-ish but makes diagnosis harder.

**Fix:** Throw a friendlier error during module init (e.g., if missing, throw `Error("DATABASE_URL is required")`) so failures are obvious.

### IN-04: `ProductDrawer` price placeholder mismatches unit name

**File:** `src/components/admin/products/ProductDrawer.tsx:215-218`  
**Issue:** Placeholder says “Price (kobo)” but field name is `price_ngn`; could confuse admins and lead to \(×100\) pricing mistakes.

**Fix:** Either rename to `price_kobo` (and store smallest unit) or update placeholder/label to match actual unit.

### IN-05: Test gap — no coverage for API route handlers & middleware auth edge cases

**Files:** `src/middleware.ts`, `src/app/api/admin/**`, `src/auth.ts`  
**Issue:** There are good UI/unit tests (e.g. `OrdersTable.test.tsx`, `OrderingToggle.test.tsx`, `csv.test.ts`), but no tests that assert:
 - `/api/admin/*` returns 401 when unauthenticated
 - invalid JSON → 400
 - invalid `params.id` → 400
 - missing `AUTH_SECRET` fails closed in middleware

**Fix:** Add route-handler tests (using `next/server` request objects or a thin wrapper function) focusing on auth + validation behaviors.

---

_Reviewed: 2026-05-01T16:17:00Z_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: standard_

