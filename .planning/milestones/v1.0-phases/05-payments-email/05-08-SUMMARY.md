---
phase: 05-payments-email
plan: 08
subsystem: checkout
tags: [security, payments, api]
requires: []
provides:
  - "Server-authoritative order pricing for POST /api/orders/init"
affects:
  - "/api/orders/init"
tech_stack:
  - "Next.js Route Handlers"
  - "Drizzle ORM"
key_files:
  - src/app/api/orders/init/route.ts
  - src/lib/checkout/cartToOrderDraft.ts
commits:
  - b56f4b4
  - 60b836b
---

# Phase 05 Plan 08: DB-authoritative pricing for order init — Summary

Closed the CR-02 pricing tampering gap by recomputing cart totals on the server from canonical DB prices (variants + prep option extras) and rejecting unpriceable items.

## What Changed

- **DB-authoritative pricing in `POST /api/orders/init`**
  - Fetches `product_variants` + `product_prep_options` for submitted `productId`s and computes authoritative `unitPriceNgn`, `subtotalNgn`, and `totalKobo`.
  - Rejects unknown `(productId, variantLabel)` (or missing default variant when `variantLabel` is `null`) with a `422`.
  - Ensures downstream order reuse + DB inserts operate on `pricedCart`, not client-submitted price fields.

- **Deprecated client-trusting helper**
  - `cartTotalKobo()` is now explicitly marked `@deprecated` to prevent accidental server-side use for authoritative totals.

## Acceptance Criteria Check

- `cartTotalKobo` is no longer imported/used from `src/app/api/orders/init/route.ts`: **PASS**
- `product_variants` / `product_prep_options` queried and used for totals: **PASS**
- `pricedCart` used downstream for reuse + item drafts: **PASS**
- `npx tsc --noEmit` during execution: **PASS**

## Deviations from Plan

None — plan executed as written.

## Threat Model Coverage

- **T-05-08-01 (Tampering)**: mitigated by overwriting client-submitted price fields with DB-derived prices before computing totals.
- **T-05-08-02 (Elevation of Privilege)**: mitigated by rejecting unpriceable items with `422` (no order created).

## Self-Check

- **FOUND:** `.planning/phases/05-payments-email/05-08-SUMMARY.md`
- **FOUND:** `b56f4b4` (Task 1)
- **FOUND:** `60b836b` (Task 2)

