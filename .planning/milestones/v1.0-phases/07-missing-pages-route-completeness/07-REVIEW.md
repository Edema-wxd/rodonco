---
phase: 07-missing-pages-route-completeness
reviewed: 2026-05-07T08:10:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/app/(customer)/cookie-policy/page.tsx
  - src/app/(customer)/plans/page.tsx
  - src/app/(customer)/privacy/page.tsx
  - src/app/(customer)/terms/page.tsx
  - src/app/not-found.tsx
  - src/components/landing/Footer.test.tsx
  - src/components/landing/Footer.tsx
  - src/components/layout/Navbar.tsx
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-05-07T08:10:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase delivers five new pages (plans, cookie-policy, privacy, terms, not-found), the Footer component, Footer tests, and the Navbar. The route graph is internally consistent — all links in the Footer and Navbar point to routes that exist. No broken links or missing pages were found. The Footer test suite passes cleanly.

Four warnings are present: a hardcoded copyright year, the cart badge overflowing its fixed-width container for two-digit item counts, inaccessible social icon placeholders, and navigation links silently disappearing on mobile with no fallback. Five informational items cover PLACEHOLDER comments that need client sign-off before launch, a double blank line, missing SEO description metadata, the not-found page lacking a metadata title, and the customer layout's safe-open default for DB failures being a business-logic concern.

---

## Warnings

### WR-01: Cart badge clips on two-digit item counts

**File:** `src/components/layout/Navbar.tsx:61`
**Issue:** The cart-item badge has a fixed size of `h-[1.125rem] w-[1.125rem]` (18 px). The value rendered is `itemCount` — the raw length of the `items` array. At 10+ line-items the two-digit number overflows the circle, clipping the right digit. The store counts distinct line-items (not unit quantities), so a customer with 10 different products reaches this immediately.
**Fix:** Switch to a min-width approach and cap the visible count:
```tsx
<span className="absolute -right-1 -top-1 flex min-w-[1.125rem] h-[1.125rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
  {itemCount > 9 ? "9+" : itemCount}
</span>
```

---

### WR-02: Nav links invisible on mobile — no hamburger menu

**File:** `src/components/layout/Navbar.tsx:37`
**Issue:** The nav link group has `className="hidden items-center gap-8 md:flex"`. Below the `md` breakpoint (768 px) all four navigation links — Menu, Plans, How it Works, Wall of Love — are completely hidden with no mobile menu, drawer, or hamburger button to replace them. Users on phones cannot navigate to `/plans`, `/how-it-works`, or `/wall-of-love` from the Navbar at all.
**Fix:** Add a hamburger trigger and mobile drawer/sheet (e.g. a Radix Dialog or a `<details>` element) that shows the same `navLinks` array on small screens. At minimum, expose the links via an accessible off-canvas menu triggered by a visible icon.

---

### WR-03: Hardcoded copyright year will become stale

**File:** `src/components/landing/Footer.tsx:45`
**Issue:** The copyright notice reads `© 2024 rodo&co.` with a literal year. The year is already stale (current year is 2026) and will grow further out of date without a code change.
**Fix:** Use `new Date().getFullYear()` or, for a static site, a build-time constant:
```tsx
<p ...>
  &copy; {new Date().getFullYear()} rodo&amp;co. The Culinary Pulse of Nigeria.
</p>
```
If the page is statically rendered and the year must not change between deploys, set a constant from an environment variable or build config.

---

### WR-04: Social icon placeholders are invisible to assistive technology

**File:** `src/components/landing/Footer.tsx:49-51`
**Issue:** Three social icon slots are rendered as empty `<div>` elements with no `aria-label`, `role`, or visible text. Screen readers skip them entirely, and keyboard users cannot find them. If these are ever replaced with real links, the accessibility gap becomes a functional blocker.
**Fix:** Replace the placeholder divs with semantically correct, labelled anchors now (even pointing to `#` until real URLs are available), or add `aria-hidden="true"` if they are intentionally decorative and will never be interactive:
```tsx
{/* Decorative placeholders — replace with real social links */}
{[0, 1, 2].map((i) => (
  <div key={i} className="h-5 w-5 rounded bg-zinc-400" aria-hidden="true" />
))}
```

---

## Info

### IN-01: PLACEHOLDER content in legal pages is not client-reviewed copy

**Files:**
- `src/app/(customer)/cookie-policy/page.tsx:46,69,87,105,123`
- `src/app/(customer)/privacy/page.tsx:46,69,87,105,123`
- `src/app/(customer)/terms/page.tsx:46,69,87,105,123`
- `src/app/(customer)/plans/page.tsx:36,84,109,145`

**Issue:** Every legal and pricing page contains `/* PLACEHOLDER — client to supply */` or `/* PLACEHOLDER: … */` comments inside rendered JSX. The placeholder text makes factual claims about data handling, refund policy, payment processor (Paystack), delivery windows, and NDPR compliance. If the site ships before the client provides final copy, these statements may be legally binding or factually wrong.
**Fix:** Track client sign-off on all placeholder sections as a launch gate item. Until then, consider wrapping each placeholder section in a visible `[DRAFT]` banner in staging builds using an environment flag.

---

### IN-02: Missing `metadata.description` on all new pages

**Files:**
- `src/app/(customer)/cookie-policy/page.tsx:4-6`
- `src/app/(customer)/plans/page.tsx:4-6`
- `src/app/(customer)/privacy/page.tsx:4-6`
- `src/app/(customer)/terms/page.tsx:4-6`

**Issue:** Each page exports a `Metadata` object with only a `title`. No `description` is set. Search engines and link-preview tools (WhatsApp, Twitter cards) fall back to the first body text, which in three of four cases is placeholder copy.
**Fix:** Add a `description` field to each `Metadata` export:
```ts
export const metadata: Metadata = {
  title: "Privacy Policy | Rodo & Co",
  description: "How Rodo & Co collects, uses, and protects your personal information.",
};
```

---

### IN-03: `not-found.tsx` exports no metadata title

**File:** `src/app/not-found.tsx:1-52`
**Issue:** The 404 page renders "Nothing here yet." as its `<h1>` but does not export a `Metadata` object. The browser tab title will inherit whatever the root layout or parent segment provides, which is typically the site name without a page-specific qualifier. Next.js 13+ supports `metadata` exports on `not-found.tsx`.
**Fix:**
```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Rodo & Co",
};
```

---

### IN-04: Double blank line inside Navbar JSX (dead whitespace)

**File:** `src/components/layout/Navbar.tsx:66-67`
**Issue:** There are two consecutive blank lines between the closing `</button>` tag and the closing `</div>` of the Actions section, suggesting a component (likely a sign-in link or Order button) was removed without cleaning up the whitespace. This is a cosmetic leftover but signals an incomplete cleanup.
**Fix:** Remove one of the two blank lines.

---

### IN-05: Footer test image mock may produce `alt` prop duplication warnings

**File:** `src/components/landing/Footer.test.tsx:6-10`
**Issue:** The `next/image` mock spreads all props onto the `<img>` element and then re-declares `alt` as a separate attribute: `<img {...props} alt={String(props.alt ?? "")} />`. Because `alt` is already present in `props` (the original `Image` is called with `alt="rodo&co"`), this results in the attribute being set twice in the spread + override pattern. In practice React resolves this correctly (last value wins), but it can trigger React lint warnings about duplicate props in some toolchain configurations.
**Fix:** Either destructure `alt` out of props before spreading, or rely on the spread alone:
```tsx
vi.mock("next/image", () => ({
  default: ({ alt, ...rest }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...rest} alt={String(alt ?? "")} />
  ),
}));
```

---

_Reviewed: 2026-05-07T08:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
