---
phase: 04-admin-panel
plan: 04-04
date: 2026-05-01
commits:
  - 0e11b15
  - d87a181
files_modified:
  - src/lib/admin/schemas.ts
  - src/lib/admin/products.ts
  - src/app/admin/products/page.tsx
  - src/app/api/admin/products/route.ts
  - src/app/api/admin/products/[id]/route.ts
  - src/components/admin/products/ProductsList.tsx
  - src/components/admin/products/ProductDrawer.tsx
  - src/components/admin/products/ProductImageUpload.tsx
---

# Phase 04 Plan 04-04: Admin products CRUD surface — Summary

Built the admin products management surface: server-side loader + `/admin/products` page, authenticated `/api/admin/products` CRUD route handlers validated by strict Zod schema, and a right-side drawer UI with Uploadthing image upload and RHF `useFieldArray` for variants and prep options.

## What shipped

- **Server loader**: `getAdminProducts()` in `src/lib/admin/products.ts` loads products + relations and sorts newest-first.
- **Admin page**: `src/app/admin/products/page.tsx` is `force-dynamic`, calls `auth()` and redirects to `/admin` when unauthenticated, then renders `ProductsList`.
- **Route Handlers**:
  - `POST /api/admin/products`: `auth()` → strict Zod `productPayloadSchema` → sequential inserts (product → variants → prep options) → `201 { id }`
  - `PATCH /api/admin/products/[id]`: `auth()` → strict Zod → sequential update + replace-all children (delete then insert) → `200 { ok: true }`
  - `DELETE /api/admin/products/[id]`: `auth()` → delete product row → relies on FK `ON DELETE CASCADE` for children → `200 { ok: true }`
- **Drawer UI**:
  - `ProductsList` renders the table with `+ New Product` and opens `ProductDrawer` for create/edit.
  - `ProductDrawer` provides a right-side 480px max-width drawer, RHF + Zod resolver, `useFieldArray` sections for variants and prep options, `is_active` toggle, and inline delete confirmation copy: “Are you sure? This cannot be undone.”
  - `ProductImageUpload` uses Uploadthing `UploadButton endpoint="productImage"` and writes `image_url` back into the form (`data-testid="upload-button"` present for tests).

## Validation

- `npm run test -- src/lib/admin` (admin helpers + schemas) — **PASS**
- `npm run test -- src/components/admin/products` (PROD-01..PROD-05) — **PASS**
- `npx tsc --noEmit` — **PASS**

## Deviations from plan

- **[Rule 3 - Blocking] Wave-0 artifacts missing in this worktree**: `src/lib/admin/schemas.ts` and the product drawer tests were not present; they were created as part of this plan execution so the phase verification commands existed and could run.
- **Vitest typing**: Removed a local Vitest shim and switched the repo TS config/tests to rely on `vitest/globals` so `tsc --noEmit` could run cleanly.

