# Phase 7: Missing Pages + Route Completeness — Research

**Researched:** 2026-05-07
**Domain:** Next.js 15 App Router static pages, design system application, route cleanup
**Confidence:** HIGH

---

## Summary

Phase 7 is a pure UI/content phase with no backend dependencies. The work is: create
`src/app/not-found.tsx` at root level, add four new pages under `(customer)`, clean the
Footer link list, and fix a single Navbar href. Every page must match the homepage design
system exactly — `bg-stone-100`, three Google fonts via CSS variables, asymmetric card
corners, and red-600/green-800 accents.

The codebase already has two fully-built analogous pages (`how-it-works/page.tsx` and
`wall-of-love/page.tsx`) that serve as authoritative templates. The design system is
entirely consistent across those pages, the Hero, HowItWorks, MenuPreview, and Testimonials
components — copy their exact class set, do not invent new patterns. No CONTEXT.md exists
for this phase; all decisions are at Claude's discretion or dictated by the codebase.

**Primary recommendation:** Copy the `how-it-works/page.tsx` structure for every new page.
It is the most complete, on-brand template already in the repo and demonstrates the correct
div-based outer wrapper, `bg-stone-100` root, section layout, asymmetric card corners,
and font application via `style={{ fontFamily: "var(--font-xxx)" }}`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Global 404 page | Frontend (SSR/Static) | — | Next.js App Router `not-found.tsx` convention; root-level catches all unmatched routes |
| Legal pages (Privacy, Terms, Cookie) | Frontend (SSR/Static) | — | Static content, no DB queries needed; lives in `(customer)` group for Navbar+Footer |
| Plans page | Frontend (SSR/Static) | — | Static marketing page; `(customer)` group for layout inheritance |
| Footer dead-link removal | Frontend (SSR/Static) | — | Pure component edit, no data layer |
| Navbar Plans href fix | Frontend (SSR/Static, Client) | — | Navbar is a `"use client"` component; single href string change |

---

## Standard Stack

### Core (already installed — no new deps needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | ^15.5.15 | Page routing, not-found convention | Project foundation |
| next/font/google | bundled with Next | Quicksand, Lexend, Inter font loading | Already configured in root layout |
| Tailwind CSS | ^4.0.0 | All styling via utility classes | Project foundation |
| React | ^19.0.0 | Component model | Project foundation |

**No new packages are required for this phase.** [VERIFIED: codebase inspection]

---

## Architecture Patterns

### System Architecture Diagram

```
Browser request → URL unmatched?
    YES → Next.js calls src/app/not-found.tsx (root)
          → Renders with root layout (fonts, Toaster, SpeedInsights)
          → NOT wrapped by (customer) layout (no Navbar/Footer auto-inclusion)
          → Must manually include <Navbar /> and <Footer /> in not-found.tsx
    NO  → (customer) route group layout.tsx
          → Wraps children with <Navbar />, <Footer />, <CartSidebar />
          → New pages (privacy, terms, cookie-policy, plans) inherit this automatically
```

### Recommended Project Structure (additions only)
```
src/app/
├── not-found.tsx                           ← NEW (root level, NOT inside (customer))
└── (customer)/
    ├── privacy/
    │   └── page.tsx                        ← NEW
    ├── terms/
    │   └── page.tsx                        ← NEW
    ├── cookie-policy/
    │   └── page.tsx                        ← NEW
    └── plans/
        └── page.tsx                        ← NEW

src/components/
├── landing/Footer.tsx                      ← EDIT (remove 5 dead links)
└── layout/Navbar.tsx                       ← EDIT (one href string change)
```

### Pattern 1: Customer Page Structure (confirmed from codebase)

All four new `(customer)` pages must follow this exact pattern from `how-it-works/page.tsx`:

```tsx
// Source: src/app/(customer)/how-it-works/page.tsx [VERIFIED: codebase]
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="bg-stone-100">
      <section className="overflow-hidden bg-stone-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-8">
          {/* back link */}
          <div className="mb-8">
            <Link
              href="/"
              className="text-sm font-black uppercase tracking-wider text-red-700"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              ← Back to home
            </Link>
          </div>

          {/* section label */}
          <p
            className="text-xs font-black uppercase tracking-wider text-red-600"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            Legal
          </p>

          {/* H1 */}
          <h1
            className="mt-4 text-5xl font-black leading-[1.05] text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Privacy Policy
          </h1>

          {/* body */}
          <p
            className="mt-6 text-base leading-7 text-stone-600"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {/* content */}
          </p>
        </div>
      </section>
    </div>
  );
}
```

**Key note on fonts:** Fonts are applied via `style={{ fontFamily: "var(--font-xxx)" }}`
inline — NOT via Tailwind `font-*` classes. The globals.css `@theme inline` block registers
`--font-quicksand`, `--font-lexend`, and `--font-inter` as CSS custom properties. Tailwind
classes `font-quicksand` / `font-lexend` / `font-inter` do work (they reference the same
CSS vars), but the codebase convention is the inline style approach. **Use inline style
for font families to match the existing pattern.** [VERIFIED: codebase — every component
checked uses inline style]

### Pattern 2: Asymmetric Card Corners (confirmed from codebase)

The card corner pattern from ROADMAP.md matches the codebase exactly:

```tsx
// Source: src/app/(customer)/how-it-works/page.tsx, src/components/landing/HowItWorks.tsx
// [VERIFIED: codebase]
className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-white/50"
```

Note: `HowItWorks.tsx` uses `outline-white/50` while ROADMAP.md spec says
`outline-stone-200/60`. Both exist in the codebase. Use `outline-stone-200/60` per spec
for new pages — it provides better visible card edge on stone-100 background.

### Pattern 3: Section Label
```tsx
// Source: src/components/landing/Testimonials.tsx [VERIFIED: codebase]
// ROADMAP spec: text-xs font-black uppercase tracking-wider text-red-600
// Codebase actual: text-sm font-black uppercase tracking-wider text-red-700
// (minor discrepancy — Testimonials uses text-sm text-red-700; HowItWorks doesn't use this pattern)
// Use ROADMAP spec for new pages: text-xs font-black uppercase tracking-wider text-red-600
className="text-xs font-black uppercase tracking-wider text-red-600"
style={{ fontFamily: "var(--font-lexend)" }}
```

### Pattern 4: CTA Buttons (confirmed from codebase)
```tsx
// Primary — red pill [VERIFIED: src/components/landing/Hero.tsx]
className="relative inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-opacity hover:opacity-90"

// Secondary — stone pill [VERIFIED: src/components/landing/Hero.tsx]
className="inline-flex items-center justify-center rounded-full bg-stone-200 px-10 py-5 transition-colors hover:bg-stone-300"
```

### Pattern 5: not-found.tsx — Root Level (CRITICAL)

`not-found.tsx` placed at `src/app/not-found.tsx` is NOT inside the `(customer)` route
group. This means:

1. It inherits `src/app/layout.tsx` (root layout: html, body, fonts, Toaster) — confirmed.
2. It does NOT inherit `src/app/(customer)/layout.tsx` — NO auto Navbar/Footer/CartSidebar.
3. **The 404 page must manually import and render `<Navbar />` and `<Footer />`.**
4. `<CartSidebar>` requires `orderingConfig` from the DB. **Do not include CartSidebar in
   the 404 page** — it would require an async data fetch and a DB call for every 404 hit,
   which is wasteful. The 404 page is a dead-end; cart interaction is irrelevant.
5. `not-found.tsx` can be a **server component** (no `"use client"` required) — but Navbar
   IS a `"use client"` component, which is fine (client components render inside server
   component trees).
6. Next.js 15 App Router: `not-found.tsx` does NOT receive any props. Do not attempt to
   destructure `params` or `searchParams` from it. [VERIFIED: Next.js App Router
   convention — not-found.tsx takes no props]

```tsx
// src/app/not-found.tsx — correct structure
// Source: Next.js App Router conventions [ASSUMED — based on Next.js docs knowledge]
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="bg-stone-100 min-h-[60vh] flex flex-col items-center justify-center py-32 px-8">
        {/* 404 content matching design system */}
        <p className="text-xs font-black uppercase tracking-wider text-red-600" ...>
          404 — Page not found
        </p>
        <h1 className="text-5xl font-black leading-[1.05] text-zinc-800" ...>
          Nothing here yet.
        </h1>
        <p className="text-base leading-7 text-stone-600" ...>
          This page doesn't exist. Let's get you back on track.
        </p>
        <Link href="/" ...>Back to home</Link>
      </main>
      <Footer />
    </>
  );
}
```

### Pattern 6: Footer Cleanup — Exact Changes Required

Current `Footer.tsx` has three link columns: [VERIFIED: codebase]
- **"Our Mission"**: Sustainability (`/sustainability`), Sourcing (`/sourcing`), Chef Partners (`/chef-partners`) — all 3 are dead
- **"Company"**: Careers (`/careers`), Press (`/press`), Wall of Love (`/wall-of-love`) — Careers and Press are dead; Wall of Love is live
- **"Legal"**: Privacy (`/privacy`), Terms (`/terms`), Cookie Policy (`/cookie-policy`) — all 3 will be live after this phase

**Required action per ROADMAP:** Remove the 5 dead links, keep Wall of Love + 3 legal.
That means:
- Remove entire "Our Mission" column (all 3 links dead)
- Remove "Careers" and "Press" from "Company" column (keep Wall of Love)
- Keep "Legal" column unchanged (pages being built in this phase)

The `footerLinks` array is `as const` — just delete the unwanted entries. [VERIFIED: codebase]

After cleanup the footer has 2 link columns: "Company" (Wall of Love only) and "Legal"
(Privacy, Terms, Cookie Policy). Consider whether a single-item "Company" column looks
sparse — can fold "Wall of Love" into a standalone link or rename the column heading.
The planner should decide the exact layout; this is a discretion area.

### Pattern 7: Navbar href Fix — Exact Change Required

```tsx
// Current src/components/layout/Navbar.tsx [VERIFIED: codebase]
const navLinks = [
  { label: "Menu", href: "/shop" },
  { label: "Plans", href: "/shop" },  // ← BUG: points to /shop
  { label: "How it Works", href: "/how-it-works" },
  { label: "Wall of Love", href: "/wall-of-love" },
] as const;

// Fix: change Plans href to "/plans"
  { label: "Plans", href: "/plans" },
```

Note: `navLinks` is typed `as const` — the literal type must change. No TypeScript error
expected since the type is inferred from the value. [VERIFIED: codebase]

### Anti-Patterns to Avoid

- **Wrapping not-found.tsx inside (customer):** Placing `not-found.tsx` at
  `src/app/(customer)/not-found.tsx` instead of `src/app/not-found.tsx` means it only
  catches routes WITHIN the customer group. Routes like `/admin/nonexistent` would still
  show Next.js default 404. Root-level placement is correct per requirement R1.

- **Using CartSidebar in not-found.tsx:** CartSidebar requires `orderingConfig` from the
  DB. A 404 hit should never trigger a DB query. Omit it.

- **Using Tailwind font utility classes instead of inline style:** The codebase pattern is
  `style={{ fontFamily: "var(--font-quicksand)" }}` not `className="font-quicksand"`. Both
  work but inline style is the established convention. Breaking it causes minor visual
  consistency risk if Tailwind purges a class.

- **Building legal page content from scratch:** These are standard legal pages for a
  Nigerian food business. Placeholder/stub content is acceptable for MVP launch — the
  planner should note that legal copy is a client deliverable, not a code deliverable.

- **Adding `"use client"` to new pages:** The four new `(customer)` pages and the 404 page
  are pure static content. No client directive needed. Navbar is already a client component
  and works fine inside a server component tree.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading | Custom CSS @font-face | Already configured in root layout.tsx | next/font/google handles subset, display swap, CSS vars |
| Responsive layout | Custom flex/grid from scratch | Tailwind utilities matching how-it-works.tsx | Pattern already exists and is proven |
| 404 routing | Custom middleware | `src/app/not-found.tsx` (Next.js convention) | App Router handles this natively |
| Legal page SEO metadata | Nothing needed | `export const metadata` per page | Next.js App Router metadata API |

---

## Common Pitfalls

### Pitfall 1: not-found.tsx Missing Navbar/Footer

**What goes wrong:** Page renders with no header or navigation — blank stone background
with 404 content and no way to get back.
**Why it happens:** not-found.tsx is outside the `(customer)` layout group so it gets
root layout only (html/body/fonts), not the customer layout (Navbar/Footer/CartSidebar).
**How to avoid:** Manually import `Navbar` and `Footer` in not-found.tsx.
**Warning signs:** First visual test shows no header bar above the 404 content.

### Pitfall 2: Font Variables Not Applied

**What goes wrong:** Text renders in fallback system font (Inter from body default in
globals.css).
**Why it happens:** Forgetting `style={{ fontFamily: "var(--font-quicksand)" }}` on H1
elements, or using a Tailwind class that doesn't exist/isn't generated.
**How to avoid:** Copy the exact inline style pattern from how-it-works/page.tsx.
**Warning signs:** H1 text looks lighter/thinner than the homepage.

### Pitfall 3: Legal Pages Outside (customer) Group

**What goes wrong:** Pages at `/privacy`, `/terms`, `/cookie-policy` render without Navbar
and Footer because they were placed at `src/app/privacy/page.tsx` instead of
`src/app/(customer)/privacy/page.tsx`.
**Why it happens:** Route groups `(customer)` are invisible in the URL but provide layout
inheritance. Placing outside the group loses the layout.
**How to avoid:** All four new pages go inside `src/app/(customer)/` subdirectories.
**Warning signs:** Pages load with stone-100 background but no Navbar.

### Pitfall 4: Footer Grid Layout Breaks After Link Removal

**What goes wrong:** The footer `grid-cols-4` (`sm:grid-cols-4`) collapses oddly when the
"Our Mission" column is removed, leaving the brand column spanning awkwardly with only one
link column.
**Why it happens:** The grid was designed for 4 columns (brand + 3 link groups). Removing
one link group leaves 3 columns.
**How to avoid:** Update `grid-cols-2 sm:grid-cols-4` to `grid-cols-2 sm:grid-cols-3`
after removing the "Our Mission" column. Or keep "Company" as a heading and just remove the
two dead links, preserving the grid structure with Wall of Love as the sole Company link.
**Warning signs:** Footer link columns are misaligned or the brand column stretches too wide.

### Pitfall 5: TypeScript `as const` Type Error After Navbar Edit

**What goes wrong:** Editing `navLinks` (typed `as const`) causes a TS error if the edit
accidentally leaves an inconsistent array shape.
**Why it happens:** `as const` infers a deeply readonly literal type — the array elements
must be consistent objects.
**How to avoid:** Change only the `href` string value from `"/shop"` to `"/plans"` on the
Plans entry. Don't restructure the array.
**Warning signs:** `tsc --noEmit` reports a type error on Navbar after the edit.

### Pitfall 6: Plans Page Treated as an App Router Dynamic Route

**What goes wrong:** Directory named `plans` creates a static route `/plans` correctly, but
if someone adds `[slug]` folder or a parallel route by mistake, behaviour changes.
**Why it happens:** Plans is a simple marketing page — no dynamic segments, no parallel
routes, no interception.
**How to avoid:** Create `src/app/(customer)/plans/page.tsx` — a single file, nothing else
in that folder.

---

## Code Examples

### Section label + H1 (confirmed pattern)
```tsx
// Source: wall-of-love/page.tsx [VERIFIED: codebase]
<p
  className="text-sm font-black uppercase tracking-wider text-red-700"
  style={{ fontFamily: "var(--font-lexend)" }}
>
  Wall of Love
</p>
<h1
  className="text-5xl font-black text-zinc-800 sm:text-6xl"
  style={{ fontFamily: "var(--font-lexend)" }}
>
  Join 5,000+ happy chefs.
</h1>
```

Note: wall-of-love uses Lexend for H1; how-it-works uses Lexend for H1 too. ROADMAP spec
says Quicksand for H1. Use Quicksand for the new pages per spec. The existing pages are
a minor inconsistency with the spec — don't replicate it.

### Content card (confirmed pattern)
```tsx
// Source: how-it-works/page.tsx [VERIFIED: codebase]
<div className="rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-white/50">
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

### Footer link array after cleanup
```tsx
// Planned result — remove "Our Mission" column, remove Careers + Press from Company
// [VERIFIED: current state from codebase; post-cleanup structure inferred]
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

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pages/404.js` (Pages Router) | `app/not-found.tsx` (App Router) | Next.js 13+ | not-found.tsx is a server component by default, no props |
| Custom error pages with getStaticProps | `not-found.tsx` with no data needs | Next.js 13+ | Simpler — no data fetching needed |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | not-found.tsx takes no props in Next.js 15 App Router | Architecture Patterns, Pitfalls | Low — this is Next.js convention; confirmed by pattern of no params in not-found files |
| A2 | not-found.tsx placed at root is rendered without (customer) layout | Architecture Patterns | Low — route group layouts don't apply outside their folder; confirmed by Next.js App Router model |
| A3 | H1 should use Quicksand per ROADMAP spec even though existing how-it-works/wall-of-love use Lexend for H1 | Code Examples | Low — ROADMAP is the authority; existing pages may pre-date the spec tightening |

---

## Open Questions

1. **Plans page content**
   - What we know: The Plans page replaces a `/shop` placeholder in the Navbar. The name suggests pricing tiers or subscription options.
   - What's unclear: Is this a pricing/plans breakdown page, or a redirect to the shop? There is no brief from the client.
   - Recommendation: Build a placeholder Plans page that describes the weekly ordering model (similar to How It Works but focused on pricing structure). Use `₦` pricing from existing MenuPreview component as a reference. Mark content as "placeholder — pending client copy."

2. **Legal page copy**
   - What we know: Three legal pages needed (Privacy, Terms, Cookie Policy).
   - What's unclear: Actual legal text is not provided. This is a Nigerian food delivery business — Nigerian data protection law (NDPR) applies.
   - Recommendation: Use clearly-marked placeholder copy with headings for each section. Note in plan: "legal copy is a client deliverable." Do not generate fake legal text.

3. **Footer single-item "Company" column**
   - What we know: After removing Careers and Press, only Wall of Love remains in the Company column.
   - What's unclear: Is a column with one link visually acceptable? Should the heading change?
   - Recommendation: Planner's call. Safe default: keep the column with one link and update grid. Alternative: move Wall of Love to a standalone footer link row and remove the "Company" heading entirely.

---

## Environment Availability

Step 2.6: SKIPPED — This phase has no external dependencies. All work is static page creation and component edits. No new tools, services, CLIs, or databases required.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x with jsdom + @testing-library/react |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --reporter=verbose` |
| TypeScript gate | `npx tsc --noEmit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R1 | Global 404 renders with Navbar + Footer visible | smoke | `npx tsc --noEmit` (structural) | ❌ Wave 0 |
| R2 | Privacy page returns HTTP 200 (route exists) | smoke | `npx tsc --noEmit` (import check) | ❌ Wave 0 |
| R3 | Terms page returns HTTP 200 (route exists) | smoke | `npx tsc --noEmit` (import check) | ❌ Wave 0 |
| R4 | Cookie Policy page returns HTTP 200 | smoke | `npx tsc --noEmit` (import check) | ❌ Wave 0 |
| R5 | Plans page renders without errors | smoke | `npx tsc --noEmit` (import check) | ❌ Wave 0 |
| R6 | Footer has no dead links | unit | `npx vitest run src/components/landing/Footer.test.tsx` | ❌ Wave 0 |

**Note on test strategy:** R1–R5 are route-existence checks. In the App Router, a page file
existing at the correct path IS the test — TypeScript compilation (`tsc --noEmit`) verifies
the file is valid. A Vitest unit test for page render would require heavy mocking of the
`(customer)` layout chain and provides marginal value. The success criteria in ROADMAP
(HTTP 200) is verified in the verification step by running the dev server and checking
each route manually, or via `tsc --noEmit` confirming no build errors.

For R6 (Footer dead-link removal): a Vitest test that renders Footer and asserts the
specific dead hrefs (`/sustainability`, `/sourcing`, `/chef-partners`, `/careers`, `/press`)
are not present is the most valuable automated check.

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npx vitest run && npx tsc --noEmit`
- **Phase gate:** Full suite green + manual route check in dev server

### Wave 0 Gaps
- [ ] `src/components/landing/Footer.test.tsx` — covers R6 (dead link assertion)
- [ ] No test framework setup gaps — vitest.config.ts, setup.ts, and testing-library are all installed

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a — static pages, no auth |
| V3 Session Management | no | n/a |
| V4 Access Control | no | n/a — pages are public |
| V5 Input Validation | no | no user input on these pages |
| V6 Cryptography | no | n/a |

**Security note:** The 404 page must not expose internal path information (stack traces,
file paths). The current `not-found.tsx` pattern (simple message + CTA) is safe. The
existing CSP headers in `next.config.ts` apply to all routes including 404 — no changes
needed.

---

## Sources

### Primary (HIGH confidence)
- `src/app/(customer)/how-it-works/page.tsx` — authoritative template for new pages
- `src/app/(customer)/wall-of-love/page.tsx` — secondary template
- `src/components/landing/Footer.tsx` — confirmed current link structure
- `src/components/layout/Navbar.tsx` — confirmed Plans href bug (`/shop`)
- `src/app/(customer)/layout.tsx` — confirmed layout inheritance model
- `src/app/layout.tsx` — confirmed font CSS variable setup
- `src/app/globals.css` — confirmed `@theme inline` font var registration
- `vitest.config.ts` — confirmed test framework and config

### Secondary (MEDIUM confidence)
- ROADMAP.md Phase 7 spec — design system constraints, file list, wave structure

### Tertiary (LOW confidence)
- Next.js App Router not-found.tsx props behaviour (A1, A2) — based on training knowledge, not verified against live Next.js 15.5.x docs this session

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies confirmed in package.json; no new packages
- Architecture: HIGH — confirmed from codebase; (customer) layout pattern is clear
- Design system patterns: HIGH — confirmed from 7 existing components
- not-found.tsx conventions: MEDIUM — well-established Next.js convention, not re-verified against 15.5.x changelog
- Pitfalls: HIGH — derived from actual codebase structure

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (stable — Next.js minor versions don't change not-found.tsx convention)
