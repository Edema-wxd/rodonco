# Phase 7: Missing Pages + Route Completeness — Pattern Map

**Mapped:** 2026-05-07
**Files analyzed:** 7 (5 create, 2 edit)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/not-found.tsx` | page (root-level 404) | request-response | `src/app/(customer)/wall-of-love/page.tsx` | role-match (structure + back-link pattern) |
| `src/app/(customer)/privacy/page.tsx` | page (static legal) | request-response | `src/app/(customer)/how-it-works/page.tsx` | exact |
| `src/app/(customer)/terms/page.tsx` | page (static legal) | request-response | `src/app/(customer)/how-it-works/page.tsx` | exact |
| `src/app/(customer)/cookie-policy/page.tsx` | page (static legal) | request-response | `src/app/(customer)/how-it-works/page.tsx` | exact |
| `src/app/(customer)/plans/page.tsx` | page (marketing) | request-response | `src/app/(customer)/how-it-works/page.tsx` | exact |
| `src/components/landing/Footer.tsx` | component (layout) | request-response | self — edit existing | self |
| `src/components/layout/Navbar.tsx` | component (layout, client) | request-response | self — edit existing | self |

---

## Pattern Assignments

### `src/app/(customer)/privacy/page.tsx` (page, static legal)
### `src/app/(customer)/terms/page.tsx` (page, static legal)
### `src/app/(customer)/cookie-policy/page.tsx` (page, static legal)

All three legal pages are structurally identical. Use `how-it-works/page.tsx` as the template.

**Analog:** `src/app/(customer)/how-it-works/page.tsx`

**Imports pattern** (lines 1):
```tsx
import Link from "next/link";
```
No other imports needed. Navbar and Footer are injected automatically by `src/app/(customer)/layout.tsx` — do NOT import them here.

**Outer wrapper + root section** (lines 59–61):
```tsx
export default function PrivacyPage() {
  return (
    <div className="bg-stone-100">
      <section className="overflow-hidden bg-stone-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-8">
```
Root div is always `bg-stone-100`. Section repeats it (belt-and-suspenders so no flash of unstyled background if the outer div collapses). Max width `max-w-7xl`, horizontal padding `px-8`.

**Back link** (lines 63–70 of wall-of-love/page.tsx — confirmed pattern):
```tsx
<div className="mb-8">
  <Link
    href="/"
    className="text-sm font-black uppercase tracking-wider text-red-700"
    style={{ fontFamily: "var(--font-lexend)" }}
  >
    ← Back to home
  </Link>
</div>
```
Font: Lexend via inline style. Color: `text-red-700`. Weight: `font-black`. No Tailwind `font-*` class for the font family.

**Section label** (use ROADMAP spec — `text-xs text-red-600`, not the `text-sm text-red-700` seen in wall-of-love):
```tsx
<p
  className="text-xs font-black uppercase tracking-wider text-red-600"
  style={{ fontFamily: "var(--font-lexend)" }}
>
  Legal
</p>
```

**H1** (lines 71–75 of how-it-works/page.tsx, adapted per ROADMAP spec to use Quicksand):
```tsx
<h1
  className="mt-4 text-5xl font-black leading-[1.05] text-zinc-800"
  style={{ fontFamily: "var(--font-quicksand)" }}
>
  Privacy Policy
</h1>
```
Font: Quicksand via inline style (ROADMAP spec overrides existing pages which use Lexend for H1). Leading: `leading-[1.05]`.

**Body / intro paragraph**:
```tsx
<p
  className="mt-6 text-base leading-7 text-stone-600"
  style={{ fontFamily: "var(--font-inter)" }}
>
  {/* intro text */}
</p>
```
Font: Inter via inline style. Color: `text-stone-600`. Leading: `leading-7`.

**Content card** (lines 131–149 of how-it-works/page.tsx — for sectioned legal content):
```tsx
<div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-white/50">
  <h3
    className="text-2xl font-bold text-zinc-800"
    style={{ fontFamily: "var(--font-lexend)" }}
  >
    Section title
  </h3>
  <p
    className="mt-4 text-base leading-6 text-stone-600"
    style={{ fontFamily: "var(--font-inter)" }}
  >
    Body copy text.
  </p>
</div>
```
Use `outline-stone-200/60` (per ROADMAP spec) instead of `outline-white/50` for better card edge visibility on stone-100 background. Asymmetric corners: `rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px]`.

**Card grid layout** (lines 129 of how-it-works/page.tsx):
```tsx
<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
  {/* cards */}
</div>
```

**Section wrapper for each card group**:
```tsx
<section className="overflow-hidden bg-stone-100 pb-24 sm:pb-28">
  <div className="mx-auto max-w-7xl px-8">
    {/* section h2 + cards */}
  </div>
</section>
```

**Section H2** (lines 116–119 of how-it-works/page.tsx):
```tsx
<h2
  className="text-4xl font-black uppercase text-zinc-800"
  style={{ fontFamily: "var(--font-lexend)" }}
>
  Section heading
</h2>
```

**Bottom CTA link** (lines 213–219 of how-it-works/page.tsx):
```tsx
<div className="mt-14 flex justify-center">
  <Link
    href="/shop"
    className="border-b-2 border-red-700 pb-0.5 text-sm font-black uppercase tracking-wider text-red-700"
    style={{ fontFamily: "var(--font-lexend)" }}
  >
    Browse the menu
  </Link>
</div>
```
For legal pages adapt to `href="/"` + label "Back to home".

**Legal page content note:** Legal copy (actual text of Privacy Policy, Terms, Cookie Policy) is a client deliverable. Stub each section with a clearly marked placeholder heading + one-sentence placeholder. Do not generate fake legal text.

---

### `src/app/(customer)/plans/page.tsx` (page, marketing)

**Analog:** `src/app/(customer)/how-it-works/page.tsx`

**Imports pattern** (line 1):
```tsx
import Link from "next/link";
```
Navbar/Footer auto-inherited from `(customer)` layout — no manual import.

**Outer wrapper** (lines 59–61):
```tsx
<div className="bg-stone-100">
  <section className="overflow-hidden bg-stone-100 py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-8">
      <div className="mx-auto max-w-3xl text-center">
```
Same as how-it-works hero: centered text block inside `max-w-3xl`.

**Hero badge** (lines 65–69 of how-it-works/page.tsx):
```tsx
<p
  className="inline-flex items-center rounded-full bg-green-300 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-900"
  style={{ fontFamily: "var(--font-lexend)" }}
>
  Weekly ordering
</p>
```

**H1** (lines 70–75 of how-it-works/page.tsx — use Quicksand per spec):
```tsx
<h1
  className="mt-6 text-5xl font-black text-zinc-800 sm:text-6xl"
  style={{ fontFamily: "var(--font-quicksand)" }}
>
  Plans &amp; Pricing
</h1>
```

**CTA buttons** (lines 83–106 of how-it-works/page.tsx — exact class copy):
```tsx
<div className="mt-10 flex flex-wrap justify-center gap-4">
  {/* Primary — red pill */}
  <Link
    href="/shop"
    className="relative inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-opacity hover:opacity-90"
  >
    <span
      className="text-lg font-bold text-rose-50"
      style={{ fontFamily: "var(--font-lexend)" }}
    >
      Browse the menu
    </span>
  </Link>
  {/* Secondary — stone pill */}
  <Link
    href="/"
    className="inline-flex items-center justify-center rounded-full bg-stone-200 px-10 py-5 transition-colors hover:bg-stone-300"
  >
    <span
      className="text-lg font-bold text-zinc-800"
      style={{ fontFamily: "var(--font-lexend)" }}
    >
      Back to home
    </span>
  </Link>
</div>
```

**Plans content cards** — use the asymmetric card pattern, one card per plan tier (e.g., Weekly Essentials, Weekly Plus). Mark content as "placeholder — pending client copy."

---

### `src/app/not-found.tsx` (root-level 404 page)

**CRITICAL:** This file goes at `src/app/not-found.tsx`, NOT inside `(customer)`. It does NOT inherit the `(customer)` layout. Navbar and Footer MUST be imported manually.

**Analog:** `src/app/(customer)/wall-of-love/page.tsx` (back-link + centered content structure)

**Imports pattern:**
```tsx
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";
```
These are the exact named export forms confirmed from the source files (`export function Navbar()` line 17 of Navbar.tsx; `export function Footer()` line 31 of Footer.tsx).

**Full page structure:**
```tsx
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-stone-100 py-32 px-8">
        {/* section label */}
        <p
          className="text-xs font-black uppercase tracking-wider text-red-600"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          404 — Page not found
        </p>

        {/* H1 */}
        <h1
          className="mt-4 text-5xl font-black leading-[1.05] text-zinc-800"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Nothing here yet.
        </h1>

        {/* body */}
        <p
          className="mt-6 max-w-md text-center text-base leading-7 text-stone-600"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          This page doesn&apos;t exist. Let&apos;s get you back on track.
        </p>

        {/* CTA */}
        <div className="mt-10">
          <Link
            href="/"
            className="relative inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-opacity hover:opacity-90"
          >
            <span
              className="text-lg font-bold text-rose-50"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Back to home
            </span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
```

**No `"use client"` directive** — not-found.tsx is a server component. Navbar is a client component (`"use client"` on line 1 of Navbar.tsx) but renders fine inside a server component tree.

**No CartSidebar** — CartSidebar requires `orderingConfig` from the DB. A 404 hit must not trigger a DB query. Omit it entirely.

**No props** — `not-found.tsx` takes zero props in Next.js 15 App Router. Do not destructure `params` or `searchParams`.

---

### `src/components/landing/Footer.tsx` (component edit)

**Source (self):** `src/components/landing/Footer.tsx`

**Current state** (lines 4–29):
```tsx
const footerLinks = [
  {
    heading: "Our Mission",
    links: [
      { label: "Sustainability", href: "/sustainability" },
      { label: "Sourcing", href: "/sourcing" },
      { label: "Chef Partners", href: "/chef-partners" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Wall of Love", href: "/wall-of-love" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  },
] as const;
```

**Required edit — replace `footerLinks` with:**
```tsx
const footerLinks = [
  {
    heading: "Company",
    links: [
      { label: "Wall of Love", href: "/wall-of-love" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  },
] as const;
```
Removes: entire "Our Mission" column (3 dead links: /sustainability, /sourcing, /chef-partners) + "Careers" and "Press" from "Company" (2 dead links). Keeps: Wall of Love, all 3 Legal links.

**Required grid fix** — after removing one column the footer grid must change (line 35):
```tsx
{/* Before */}
<div className="grid grid-cols-2 gap-12 sm:grid-cols-4">

{/* After */}
<div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
```
Brand column retains `col-span-2 sm:col-span-1` (lines 37). No other layout changes needed.

**Nothing else changes** — Image, brand paragraph, copyright line, social icon placeholders, link rendering loop: all unchanged.

---

### `src/components/layout/Navbar.tsx` (component edit)

**Source (self):** `src/components/layout/Navbar.tsx`

**Current state** (lines 10–15):
```tsx
const navLinks = [
  { label: "Menu", href: "/shop" },
  { label: "Plans", href: "/shop" },   // ← BUG
  { label: "How it Works", href: "/how-it-works" },
  { label: "Wall of Love", href: "/wall-of-love" },
] as const;
```

**Required edit — change Plans href only:**
```tsx
const navLinks = [
  { label: "Menu", href: "/shop" },
  { label: "Plans", href: "/plans" },  // ← fixed
  { label: "How it Works", href: "/how-it-works" },
  { label: "Wall of Love", href: "/wall-of-love" },
] as const;
```
One string changed: `"/shop"` → `"/plans"` on the Plans entry. Nothing else in the file changes. The `as const` type updates automatically from the value literal.

---

## Shared Patterns

### Font Application
**Source:** `src/app/(customer)/how-it-works/page.tsx` (all font usages), `src/components/layout/Navbar.tsx` (line 43), `src/components/landing/Footer.tsx` (lines 47, 53, 69, 78)
**Apply to:** Every element that needs a specific font in any new file

The codebase convention is **inline style**, not Tailwind `font-*` utility classes:

| Font | CSS Variable | Usage |
|------|-------------|-------|
| Quicksand | `var(--font-quicksand)` | H1 headings (per ROADMAP spec) |
| Lexend | `var(--font-lexend)` | Labels, nav links, section labels, card titles, CTAs, back links |
| Inter | `var(--font-inter)` | Body copy, descriptions, footer copy |

```tsx
style={{ fontFamily: "var(--font-quicksand)" }}  // H1
style={{ fontFamily: "var(--font-lexend)" }}     // labels, headings, CTAs
style={{ fontFamily: "var(--font-inter)" }}      // body text
```

### Asymmetric Card Corners
**Source:** `src/app/(customer)/how-it-works/page.tsx` line 133
**Apply to:** Content cards on all new pages

```tsx
className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60"
```
Note: use `outline-stone-200/60` (per ROADMAP spec) for new pages — provides better card edge on stone-100 background. Existing pages use `outline-white/50` (don't replicate for new work).

### Back Link
**Source:** `src/app/(customer)/wall-of-love/page.tsx` lines 49–55
**Apply to:** All new pages (not-found.tsx uses a full CTA button instead)

```tsx
<div className="mb-8">
  <Link
    href="/"
    className="text-sm font-black uppercase tracking-wider text-red-700"
    style={{ fontFamily: "var(--font-lexend)" }}
  >
    ← Back to home
  </Link>
</div>
```

### Section Label
**Source:** ROADMAP spec (confirmed against `src/components/landing/Testimonials.tsx`)
**Apply to:** Opening label above H1 on all new pages

```tsx
<p
  className="text-xs font-black uppercase tracking-wider text-red-600"
  style={{ fontFamily: "var(--font-lexend)" }}
>
  Legal
</p>
```

### Primary CTA Button (red pill)
**Source:** `src/app/(customer)/how-it-works/page.tsx` lines 84–93
**Apply to:** Primary CTA on how-it-works-style pages, not-found.tsx

```tsx
<Link
  href="/shop"
  className="relative inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-opacity hover:opacity-90"
>
  <span
    className="text-lg font-bold text-rose-50"
    style={{ fontFamily: "var(--font-lexend)" }}
  >
    Button label
  </span>
</Link>
```

### Secondary CTA Button (stone pill)
**Source:** `src/app/(customer)/how-it-works/page.tsx` lines 95–105
**Apply to:** Secondary CTA alongside red pill

```tsx
<Link
  href="/"
  className="inline-flex items-center justify-center rounded-full bg-stone-200 px-10 py-5 transition-colors hover:bg-stone-300"
>
  <span
    className="text-lg font-bold text-zinc-800"
    style={{ fontFamily: "var(--font-lexend)" }}
  >
    Button label
  </span>
</Link>
```

### Underline CTA Link
**Source:** `src/app/(customer)/how-it-works/page.tsx` lines 213–219, `src/app/(customer)/wall-of-love/page.tsx` lines 152–158
**Apply to:** Bottom-of-section navigation links

```tsx
<Link
  href="/shop"
  className="border-b-2 border-red-700 pb-0.5 text-sm font-black uppercase tracking-wider text-red-700"
  style={{ fontFamily: "var(--font-lexend)" }}
>
  Browse the menu
</Link>
```

---

## No Analog Found

All files have close analogs. No entries.

---

## Key Anti-Patterns (from RESEARCH.md — extracted for planner reference)

| Anti-Pattern | Correct Approach |
|---|---|
| Place `not-found.tsx` inside `(customer)/` | Place at `src/app/not-found.tsx` (root level) |
| Omit Navbar/Footer from not-found.tsx | Manually import both — they are not auto-inherited |
| Include CartSidebar in not-found.tsx | Omit it — triggers DB query on every 404 |
| Use Tailwind `font-quicksand` class | Use `style={{ fontFamily: "var(--font-quicksand)" }}` |
| Add `"use client"` to new static pages | Not needed — all four new pages are server components |
| Keep `grid-cols-4` after removing "Our Mission" column | Change to `grid-cols-3` on the footer grid wrapper |
| Change more than the `href` string in Navbar navLinks | Change only the Plans `href` value; leave all else |

---

## Metadata

**Analog search scope:** `src/app/(customer)/`, `src/components/landing/`, `src/components/layout/`
**Files scanned:** 4 (how-it-works/page.tsx, wall-of-love/page.tsx, Footer.tsx, Navbar.tsx) + RESEARCH.md
**Pattern extraction date:** 2026-05-07
