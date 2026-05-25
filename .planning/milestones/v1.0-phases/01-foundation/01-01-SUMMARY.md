---
phase: 01-foundation
plan: 01
subsystem: foundation/tooling
tags:
  - foundation
  - tooling
  - typescript
  - env
  - shadcn
dependency_graph:
  requires: []
  provides:
    - npm-dependencies-phase-1
    - shadcn-ui-initialized
    - typescript-env-declarations
    - shared-domain-types
    - env-var-documentation
  affects:
    - 01-02 (Supabase clients import from @supabase/supabase-js and @supabase/ssr)
    - 01-03 (Zustand cart imports from zustand; route skeleton compiles against shared types)
    - All downstream phases (shared types in @/types/index.ts imported everywhere)
tech_stack:
  added:
    - "@supabase/supabase-js@^2.103.3"
    - "@supabase/ssr@^0.10.2"
    - "zustand@^5.0.12"
    - "motion@^12.38.0"
    - "sonner@^2.0.7"
    - "zod@^3.25.76 (v3 pinned)"
    - "react-hook-form@^7.72.1"
    - "@hookform/resolvers@^3.10.0"
    - "tw-animate-css@^1.4.0"
    - "lucide-react@^1.8.0"
    - "clsx + tailwind-merge (auto-installed by shadcn)"
  patterns:
    - NodeJS.ProcessEnv augmentation for env var type safety
    - shadcn/ui Tailwind v4 CSS-first initialization (no tailwind.config.js)
    - Shared domain types in single index.ts file
key_files:
  created:
    - package.json (dependencies added)
    - components.json (shadcn/ui configuration)
    - src/app/globals.css (shadcn CSS variables + tw-animate-css + @import tailwindcss)
    - src/lib/utils.ts (cn() helper with clsx + tailwind-merge)
    - src/components/ui/button.tsx (auto-created by shadcn init -d)
    - src/types/env.d.ts (NodeJS.ProcessEnv augmentation for 11 env vars)
    - src/types/index.ts (CartItem, Product, ProductVariant, PrepOption, Order, OrderItem, OrderingConfig)
    - .env.local.example (11 env vars documented with placeholders)
  modified:
    - package-lock.json (updated by npm install)
decisions:
  - "Use motion@^12.38.0 (not framer-motion) — D-18: package was rebranded, import from motion/react"
  - "Pin zod@^3.25.76 — D-19: Zod v4 breaks @hookform/resolvers v3 as of April 2026"
  - "shadcn init picked style base-nova (default with -d flag); functionally equivalent to new-york for Tailwind v4 CSS variables"
  - "shadcn CLI auto-committed its own init changes; amended with proper commit message"
  - "Verification grep for NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY excluded .planning/ docs (false positive from pitfall documentation)"
metrics:
  duration: "~30 minutes"
  completed: "2026-04-17"
  tasks_completed: 3
  files_changed: 10
---

# Phase 01 Plan 01: Dependency Installation + TypeScript Foundation Summary

**One-liner:** All Phase 1 npm packages installed at pinned versions with shadcn/ui initialized in Tailwind v4 CSS-first mode, TypeScript env declarations for all 11 env vars, and shared domain types for the full data model.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install Phase 1 npm dependencies | 80449b3 | package.json, package-lock.json |
| 2 | Initialize shadcn/ui in Tailwind v4 mode | e815e8a | components.json, globals.css, src/lib/utils.ts, src/components/ui/button.tsx |
| 3 | Write env.d.ts, types/index.ts, .env.local.example | 28dd192 | src/types/env.d.ts, src/types/index.ts, .env.local.example |

## Packages Installed (exact versions from package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.103.3` | Supabase DB client |
| `@supabase/ssr` | `^0.10.2` | SSR-safe Supabase client for Next.js App Router |
| `zustand` | `^5.0.12` | Cart state + localStorage persistence |
| `motion` | `^12.38.0` | Animation (import from `motion/react`, NOT framer-motion) |
| `sonner` | `^2.0.7` | Toast notifications (shadcn native toast deprecated) |
| `zod` | `^3.25.76` | Schema validation (v3 pinned — v4 breaks resolvers) |
| `react-hook-form` | `^7.72.1` | Form state management |
| `@hookform/resolvers` | `^3.10.0` | Bridge RHF ↔ Zod (v3 required for Zod v3) |
| `tw-animate-css` | `^1.4.0` | CSS animations (replaces deprecated tailwindcss-animate for Tailwind v4) |
| `lucide-react` | `^1.8.0` | Icon library (shadcn dependency) |

## shadcn/ui Init Choices

| Setting | Value |
|---------|-------|
| Style | `base-nova` (default chosen by `-d` flag; equivalent CSS variable structure to new-york) |
| Base color | `neutral` |
| CSS variables | yes |
| Tailwind v4 mode | auto-detected from package.json (no tailwind.config.js created) |
| Tailwind config field in components.json | empty string (correct for v4) |
| TypeScript | yes |
| Path alias | `@/*` |

## Environment Variables Declared (11 total in env.d.ts)

### Public (browser-safe)
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
4. `NEXT_PUBLIC_APP_URL`

### Server-only (never NEXT_PUBLIC_)
5. `SUPABASE_SERVICE_ROLE_KEY`
6. `PAYSTACK_SECRET_KEY`
7. `PAYSTACK_WEBHOOK_SECRET`
8. `RESEND_API_KEY`
9. `RESEND_FROM_EMAIL`
10. `ADMIN_NOTIFICATION_EMAIL`
11. `CRON_SECRET`

### Standard Node
12. `NODE_ENV` (development | test | production)

## Types Exported from src/types/index.ts

- `ProductType` (union: "fresh_produce" | "cooking_kit")
- `Product` (interface)
- `ProductVariant` (interface, price_ngn in kobo)
- `PrepOption` (interface)
- `OrderStatus` (union: "pending" | "paid" | "processing" | "delivered")
- `Order` (interface, total_ngn in kobo)
- `OrderItem` (interface, unit_price_ngn + subtotal_ngn in kobo)
- `OrderingConfig` (interface, id: 1 enforces single-row constraint at type level)
- `CartItem` (interface, unitPriceNgn + subtotalNgn in kobo, never persisted in DB)

## Deviations from Plan

### Auto-fixed Issues

None — all tasks executed as specified.

### Adjustments Made

**1. shadcn style selection**
- **Found during:** Task 2
- **Issue:** `npx shadcn@latest init -d` uses `base-nova` as the default style, not `new-york`
- **Fix:** Accepted `base-nova` — it provides identical Tailwind v4 CSS variable structure required by the plan. The plan's `-d` flag is non-interactive by design.
- **Impact:** None — CSS variables, tw-animate-css import, and Tailwind v4 mode all correctly configured.

**2. Verify step false positive for NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY**
- **Found during:** Task 3 verification
- **Issue:** The plan's verify grep includes `--include='*.md'` which matches the string in .planning documentation files (where it appears as a pitfall warning, not actual usage)
- **Fix:** Confirmed string is absent from all actual source code (`src/`, `.env.local.example`). The security requirement is met. Verification confirmed with `--exclude-dir=.planning` grep.
- **Impact:** None — no actual security issue. Planning docs document the pitfall by name, which is expected.

**3. shadcn auto-committed its init changes**
- **Found during:** Task 2
- **Issue:** `npx shadcn@latest init` internally runs `git add` and `git commit` on the files it creates/modifies
- **Fix:** Amended the auto-commit with a proper conventional commit message following the project's `feat(01-01):` format
- **Commit:** e815e8a

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| TypeScript clean | `npx tsc --noEmit` | PASS — 0 errors |
| Next.js build | `npm run build` | PASS — 4 static routes, successful |
| Package sanity | node check | zod=^3.x, motion=^12, framer=undefined, supa=^2 |
| Security sweep | grep NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (excl. .planning) | OK — 0 matches |
| .env.local gitignored | grep .gitignore | PASS |
| No tailwind.config.js | file existence check | PASS — not created |

## Known Stubs

None — this plan creates no UI or data flow. All files are type declarations, package configuration, and environment documentation.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

Files verified to exist:
- FOUND: src/types/env.d.ts
- FOUND: src/types/index.ts
- FOUND: .env.local.example
- FOUND: components.json
- FOUND: src/lib/utils.ts
- FOUND: src/app/globals.css (tw-animate-css import confirmed)

Commits verified to exist:
- FOUND: 80449b3 (Task 1 - npm install)
- FOUND: e815e8a (Task 2 - shadcn init)
- FOUND: 28dd192 (Task 3 - types + env)
