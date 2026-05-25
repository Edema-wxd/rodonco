# Phase 2: Static Shop UI - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Server-render the landing page and shop product grid from real Supabase DB data. A visitor can read the landing page (hero + How It Works) and browse the shop (Fresh Produce and Cooking Kits grids with product cards and a cutoff banner). No cart interaction — "Add to Order" buttons are present but not wired yet (Phase 3). Navbar with cart icon already exists from Phase 1.

</domain>

<decisions>
## Implementation Decisions

### Landing page — Hero section
- **D-01:** White/light background hero — clean, food-forward look consistent with Hello Fresh / Home Chef reference
- **D-02:** CTA button uses solid brand colour as placeholder (e.g. `#16a34a` green) until real moodboard arrives from client; swap when assets land
- **D-03:** Hero includes: headline, subheadline, and a single CTA button linking to `/shop`

### Landing page — How It Works
- **D-04:** 3-step flow: **Browse → Customise → Deliver** — placeholder copy; update when brand copy arrives
- **D-05:** Steps are icon + label + short description; icons: Tailwind/Lucide placeholders (e.g. `Search`, `Settings`, `Truck`)
- **D-06:** Section is visually distinct from hero (light grey or white alternate background)

### Product card design
- **D-07:** Image aspect ratio: **4:3 landscape** (`aspect-[4/3]` with `object-cover`)
- **D-08:** Card style: **subtle shadow + rounded corners** — use `rounded-xl shadow-sm hover:shadow-md` pattern
- **D-09:** Price display: **"From ₦X,XXX"** — lowest `product_variants.price_ngn` for that product divided by 100; formatted with `toLocaleString('en-NG')` or manual comma separator
- **D-10:** "Add to Order" CTA: **solid black, full-width button** below card content — `Button` variant `default` (shadcn); in Phase 2 the button links to the product drawer route (`/shop/[slug]`) but drawer is a stub so it may be an `<a>` or `<Link>` for now
- **D-11:** Card content order: image → product name → price → button

### Shop page — Grid layout
- **D-12:** Desktop: **3 columns** (`grid-cols-3`), Tablet: 2 columns (`sm:grid-cols-2`), Mobile: **2 columns** (`grid-cols-2`)
- **D-13:** Section headers: **bold heading (`text-xl font-bold`) + subtle horizontal divider line** (`border-b`) below the heading, before the grid
- **D-14:** Two sections in order: Fresh Produce first, Cooking Kits second
- **D-15:** If a section has no active products: **show the section with "No products available" message** (do not hide silently)

### Cutoff banner
- **D-16:** Colour: **amber/warning** — use `bg-amber-50 border-amber-200 text-amber-800` or equivalent Tailwind
- **D-17:** Position: **sticky at top of page** (`sticky top-0 z-40`) so it remains visible as user scrolls the product grid
- **D-18:** Message format: `"Ordering is closed. Next delivery: Saturday, 3 May"` — format `ordering_config.next_delivery_date` (ISO string from DB) as `"Day, D Month"`
- **D-19:** Banner only renders when `ordering_config.is_ordering_open === false`; when open, component returns null

### Data fetching
- **D-20:** Use **server-only Drizzle/Neon reads** (e.g. `src/lib/shop/*` via `src/lib/db/index.ts`) in server components — no client-side fetching on these pages. *(Supabase note: this repo has migrated off Supabase; the previous Supabase-client decision is superseded.)*
- **D-21:** Starting price for a product = MIN of its `product_variants.price_ngn` values; fetch variants in same query or separate query per product
- **D-22:** Shop page uses `export const revalidate = 60` for the cutoff banner (SHOP-03 requirement)

### CART-04 (Navbar cart badge)
- **D-23:** Already implemented in Phase 1 — `src/components/layout/Navbar.tsx` renders cart icon with `useHasHydrated` guard. No changes needed in Phase 2.

### Claude's Discretion
- Exact hero headline and subheadline copy (placeholder; client to provide real copy)
- Specific icon choices for How It Works steps
- Precise spacing, padding, and typography scale beyond the decisions above
- Whether to extract ProductCard and CutoffBanner as separate components vs inline
- How to handle `image_url: null` on Product — default placeholder image approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Types and schema
- `src/types/index.ts` — `Product`, `ProductVariant`, `OrderingConfig` interfaces; price fields are kobo (integer); divide by 100 for ₦ display
- `drizzle/schema.ts` — authoritative table/column definitions for `products`, `product_variants`, `ordering_config`

### DB access
- `src/lib/db/index.ts` — server-only Drizzle client (Neon) + `schema` exports
- `src/lib/shop/*` — server-only shop reads (preferred surface for Phase 2 SSR)

### Existing components
- `src/components/layout/Navbar.tsx` — existing Navbar with cart icon + hydration guard; do NOT replace; only modify if needed
- `src/components/ui/button.tsx` — shadcn/ui Button; use `variant="default"` (solid black) for product card CTA

### Requirements
- `.planning/REQUIREMENTS.md` — acceptance criteria for SHOP-01, SHOP-02, SHOP-03, SHOP-04, CART-04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx` — shadcn/ui Button; `variant="default"` for solid black CTA
- `src/hooks/useHasHydrated.ts` — SSR hydration guard (used in Navbar; no need to use in Phase 2 server components)
- `src/lib/utils.ts` — `cn()` utility for conditional class names

### Established Patterns
- Server components fetch data via server-only Drizzle reads (`src/lib/shop/*`) — no `use client` on page files
- All prices stored as kobo integers → display divides by 100
- Root layout uses Geist font via `--font-sans` CSS variable
- `(customer)` route group wraps all customer-facing pages; `CustomerLayout` renders `<Navbar />` above `<main>`

### Integration Points
- `src/app/(customer)/page.tsx` — empty stub; replace with full landing page implementation
- `src/app/(customer)/shop/page.tsx` — empty stub; replace with DB-driven product grid
- Shop `@drawer` slot: `src/app/(customer)/shop/@drawer/default.tsx` returns null; `[slug]/page.tsx` is a stub — Phase 3 will implement; Phase 2 should link product card "Add to Order" to `/shop/{product-slug-or-id}` so the routing is in place
- `src/app/(customer)/shop/layout.tsx` — renders `{children}` and `{drawer}` slot; cutoff banner can go in this layout or in the shop page itself

</code_context>

<specifics>
## Specific Ideas

- Reference UIs: Hello Fresh, Home Chef for overall grid and card patterns; Chowdeck for product interaction style (Phase 3)
- The client moodboard has not arrived — use Rodo & Co green (`#16a34a`) as placeholder brand colour for CTAs; document this as placeholder in comments so it's easy to swap
- Sticky cutoff banner should sit below the sticky Navbar (Navbar is `sticky top-0 z-50`; banner should be `sticky top-16 z-40` to stack correctly)
- Product card "Add to Order" is a `<Link href="/shop/[id]">` in Phase 2 — opens the drawer route (stub). This keeps routing in place for Phase 3 without requiring the drawer to be functional yet

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-static-shop-ui*
*Context gathered: 2026-04-24*
