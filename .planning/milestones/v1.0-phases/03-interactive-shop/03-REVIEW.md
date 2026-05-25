---
phase: 03-interactive-shop
reviewed: 2026-05-01T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - src/app/(customer)/checkout/page.tsx
  - src/app/(customer)/layout.tsx
  - src/app/(customer)/shop/@drawer/[slug]/page.tsx
  - src/app/(customer)/shop/default.tsx
  - src/app/(customer)/shop/page.tsx
  - src/components/cart/CartSidebar.tsx
  - src/components/layout/Navbar.tsx
  - src/components/shop/OrderingClosedBanner.tsx
  - src/components/shop/ProductDrawer.tsx
  - src/components/shop/ShopGrid.tsx
  - src/lib/shop/orderingConfig.ts
  - src/lib/shop/productDetails.ts
  - src/lib/shop/products.ts
  - src/store/cart.test.ts
  - src/store/cart.ts
  - src/store/cartUi.ts
  - src/test/setup.ts
  - src/test/vitest-shim.d.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-01T00:00:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

This phase implements the interactive shop: product grid, product drawer with variant/prep-option selection, cart store with Zustand persist, cart sidebar, and ordering-closed gate. The overall architecture is sound — server/client boundaries are correctly drawn, the compound-key cart logic is correct, and the ordering gate is consistently threaded through all entry points.

One critical data integrity bug was found in `ProductDrawer`: the cart item is stored with a field named `unitPriceNgn` whose value is actually in kobo. This will cause downstream price calculations to be off by a factor of 100 once any code trusts the field name. Four warnings cover a silently-dropped prop, a missing error handler, a date timezone edge case, and a test that casts to `any` to test "wrong" behaviour. Three info items cover a naming inconsistency, a missing `revalidate` on the default slot, and a duplicate module declaration in the vitest shim.

---

## Critical Issues

### CR-01: `unitPriceNgn` cart field stores a kobo value

**File:** `src/components/shop/ProductDrawer.tsx:95`

**Issue:** `unitPriceKobo` is computed in kobo throughout the drawer (the variable name says so, `formatNgn` divides by 100 before formatting, and `subtotalKobo = unitPriceKobo * quantity`). But when the item is written to the cart store the field is named `unitPriceNgn`, and the value assigned to it is `unitPriceKobo` — a kobo value in a naira-labelled field.

```ts
addItem({
  ...
  unitPriceNgn: unitPriceKobo,   // BUG: kobo value in an NGN field
  subtotalNgn: subtotalKobo,     // same — kobo value in an NGN field
});
```

`CartSidebar` passes `item.subtotalNgn` directly to `formatNgn` which divides by 100, so the displayed subtotal is currently correct only because both the storage and the display path share the same kobo convention. However the field's *name* advertises naira, meaning any future code that reads `unitPriceNgn` and does NOT divide by 100 — such as a server-side order submission — will send amounts 100x too high or too low.

**Fix:** Rename the type fields from `unitPriceNgn` / `subtotalNgn` to `unitPriceKobo` / `subtotalKobo` throughout (`src/types`, `cart.ts`, `CartSidebar.tsx`, `ProductDrawer.tsx`), making the storage unit unambiguous. Alternatively, convert to naira before storing and update all display paths accordingly.

```ts
// Option A — store in kobo, fix the field names in CartItem type:
addItem({
  productId: product.id,
  productName: product.name,
  variantLabel,
  prepOption,
  quantity,
  unitPriceKobo,   // rename: was unitPriceNgn
  subtotalKobo,    // rename: was subtotalNgn
});

// CartSidebar formatNgn call stays the same because values are kobo.
```

---

## Warnings

### WR-01: `cutoffMessage` prop is accepted but never rendered

**File:** `src/components/shop/OrderingClosedBanner.tsx:18-38`

**Issue:** The component's prop type declares `cutoffMessage?: string | null` and all callers pass it, but the component body never uses it. The banner always shows only "Ordering is closed. Next delivery: {date}" regardless of what `cutoffMessage` contains. The prop was clearly intended to display an admin-authored message.

**Fix:** Render `cutoffMessage` when present, falling back to the hardcoded string:

```tsx
export function OrderingClosedBanner({
  isOpen,
  cutoffMessage,
  nextDeliveryDate,
}: OrderingClosedBannerProps) {
  if (isOpen) return null;

  const formattedNextDelivery = nextDeliveryDate ? formatNextDeliveryDate(nextDeliveryDate) : null;
  const message = cutoffMessage ?? "Ordering is closed";

  return (
    <div role="alert" className="sticky top-16 z-40 w-full border border-amber-200 bg-amber-50 text-amber-800">
      <div className="mx-auto max-w-7xl px-4 py-3 text-center text-sm font-medium">
        {message}
        {formattedNextDelivery ? `. Next delivery: ${formattedNextDelivery}` : null}
      </div>
    </div>
  );
}
```

### WR-02: `getProductDetailsById` has no error handling — DB failures surface as unhandled exceptions

**File:** `src/lib/shop/productDetails.ts:20-66`

**Issue:** Unlike `getOrderingConfig` (which wraps its DB call in try/catch and returns a safe default), `getProductDetailsById` performs three sequential DB operations with no error handling. A transient DB error will throw an unhandled exception that bubbles up to the `DrawerPage` server component and produces a Next.js 500 error page with no recovery.

**Fix:** Wrap the function body in try/catch and return `null` on error (consistent with the existing `!productRow` path):

```ts
export async function getProductDetailsById(productId: string): Promise<ProductDetails | null> {
  try {
    const [productRow] = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, productId), eq(schema.products.is_active, true)))
      .limit(1);

    if (!productRow) return null;

    const [variantRows, prepRows] = await Promise.all([...]);

    return { product: {...}, variants: [...], prepOptions: [...] };
  } catch (err) {
    console.error("[getProductDetailsById] DB error for productId=%s", productId, err);
    return null;
  }
}
```

### WR-03: Date parsing in `formatNextDeliveryDate` can display the wrong day

**File:** `src/components/shop/OrderingClosedBanner.tsx:7-16`

**Issue:** When `nextDeliveryDate` is an ISO date string in the form `"YYYY-MM-DD"`, `new Date("2026-05-02")` parses as UTC midnight. When formatted with `Intl.DateTimeFormat` without an explicit `timeZone`, the browser uses the local timezone. Customers in UTC-1 through UTC-12 (including UTC-1 Lagos is not in this range, but staging/dev machines may be) will see the *previous* day displayed. For a delivery-date banner this would mislead customers.

**Fix:** Pass `timeZone: "UTC"` to the formatter so the displayed date matches the stored string regardless of the viewer's locale:

```ts
return new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
}).format(date);
```

### WR-04: Cart tests cast to `any` to call functions they acknowledge "should fail"

**File:** `src/store/cart.test.ts:94-95`, `140`, `170`

**Issue:** Three tests call `updateQuantity` and `removeItem` via `(useCartStore.getState() as any)` with a comment explicitly stating "The current store implementation ignores the extra argument, which should fail." This means the tests are written against a *future* API signature and are designed to catch the store *not* implementing it — but since the store now does implement the four-argument signature, the `as any` cast hides a TypeScript error that would have confirmed the signature is correct.

If the store signature regresses to three arguments, these tests will silently pass without the `prepOption` being applied because `any` suppresses all argument-count checking.

**Fix:** Remove the `as any` casts now that the store implements the correct four-argument signatures:

```ts
// Before (suppresses type checking):
(useCartStore.getState() as any).updateQuantity("p1", "v1", 4, "prepA");

// After (type-checked):
useCartStore.getState().updateQuantity("p1", "v1", 4, "prepA");
```

Also remove the now-stale comments about "the current store implementation ignores the extra argument."

---

## Info

### IN-01: `subtotalKobo` in `CartSidebar` accumulates from `subtotalNgn` — naming inconsistency

**File:** `src/components/cart/CartSidebar.tsx:36-39`

**Issue:** The local variable `subtotalKobo` is named as if it holds kobo, but it sums `i.subtotalNgn` — a field whose name says naira. As noted in CR-01, the values are actually in kobo despite the field name. This accumulation is functionally correct today but the naming inconsistency makes the code harder to reason about and will become incorrect if the CR-01 field rename is applied without updating this sum.

```ts
const subtotalKobo = useMemo(
  () => items.reduce((sum, i) => sum + i.subtotalNgn, 0),  // subtotalNgn vs subtotalKobo
  [items]
);
```

**Fix:** After resolving CR-01, align field names consistently. If keeping kobo throughout, rename the CartItem fields and update this reference: `items.reduce((sum, i) => sum + i.subtotalKobo, 0)`.

### IN-02: `shop/default.tsx` is missing the `revalidate` export present on `shop/page.tsx`

**File:** `src/app/(customer)/shop/default.tsx:1-5`

**Issue:** `shop/page.tsx` exports `export const revalidate = 60` to cap ISR freshness. The parallel-route default slot (`default.tsx`) renders the same `ShopGrid` component but without any `revalidate` directive, so Next.js uses its default caching strategy for that segment. In practice this means when the drawer is open, the default slot content behind it may be cached differently from the primary page slot.

**Fix:** Add the matching revalidate directive:

```ts
export const revalidate = 60;

export default function ShopDefault() {
  return <ShopGrid />;
}
```

### IN-03: Duplicate module declarations in vitest shim

**File:** `src/test/vitest-shim.d.ts:1-44`

**Issue:** The file contains two identical `declare module "vitest" { ... }` blocks (lines 1-18 and lines 23-39) and two identical `declare module "vitest/config" { ... }` blocks (lines 19-21 and lines 40-43). The duplication is harmless at runtime but creates confusion about which declaration is authoritative and wastes maintenance surface.

**Fix:** Remove the duplicate second half of the file, keeping only lines 1-22.

---

_Reviewed: 2026-05-01T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
