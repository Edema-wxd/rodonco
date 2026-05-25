# Phase 6: Automation + Launch - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the loop on the weekly ordering workflow and harden the platform for go-live:
- **Vercel Cron** — `/api/cutoff` route called at `59 22 * * 4` (Thu 22:59 UTC = Thu 23:59 WAT); validates `Authorization: Bearer CRON_SECRET`; sets `ordering_config.is_ordering_open = false` idempotently; double-run is safe
- **Delivery reminder emails** — Admin selects a delivery week and bulk-sends Resend reminder emails to all `paid` orders for that week; feedback is inline count confirmation
- **Pre-launch hardening** — Error boundaries, security headers, env assertion at build time, smoke test README

Phase 5 handles the Paystack webhook + Resend confirmation/alert emails. This phase adds the scheduled automation and the operational trigger (reminders), then hardens for live traffic.

</domain>

<decisions>
## Implementation Decisions

### Delivery Reminder Trigger (NOTF-01)
- **D-01:** Reminder trigger lives on **`/admin/settings`** page — alongside the ordering window toggle. Keeps all week-of operations in one place.
- **D-02:** Week selection via a **date input** (HTML date picker or shadcn DatePicker) scoped to Saturdays. Route Handler queries `orders WHERE week_of = <selected date> AND status = 'paid'`.
- **D-03:** Success feedback is **inline count confirmation** below the Send button: e.g., "12 reminder emails sent." No page reload, no redirect, no toast.
- **D-04:** Route: `POST /api/admin/reminders` — auth-gated (`auth()` check), accepts `{ week_of: string }`, bulk-sends via Resend, returns `{ sent: number }`.

### Vercel Cron (INFRA-01, INFRA-02)
- **D-05:** `vercel.json` created at project root with a single cron entry: path `/api/cutoff`, schedule `59 22 * * 4`.
- **D-06:** `/api/cutoff` is a `GET` Route Handler. Validates `Authorization: Bearer ${CRON_SECRET}` header. Calls `db.update(ordering_config).set({ is_ordering_open: false })` — idempotent (no-op if already false). Returns `{ ok: true }` with 200.
- **D-07:** No additional cron failure alerting beyond Vercel's built-in dashboard logs and automatic retries on non-2xx. Admin monitors via Vercel dashboard.

### Pre-launch Hardening
- **D-08:** Add **Next.js error boundaries** — `src/app/error.tsx` (route-level) and `src/app/global-error.tsx` (root-level) to catch unhandled errors and show a branded error page.
- **D-09:** Add **security headers** via `next.config.ts` `headers()` config: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. Basic CSP as a starting point (can be tightened post-launch).
- **D-10:** **Rate limiting on `/api/orders/init`** is deferred — not implemented at MVP. Paystack's checkout flow limits abuse vectors. Revisit post-launch if spam occurs.
- **D-11:** Add a **smoke test checklist** — a `LAUNCH-CHECKLIST.md` in the project root documenting manual go-live steps: swap Paystack keys, register webhook URL in Paystack live dashboard, trigger manual cron run, verify order confirmation email.

### Env Assertion Strategy
- **D-12:** Env assertion runs at **build time in `next.config.ts`** — a `validateEnv()` call at the top of the config file throws if required vars are missing or malformed. Catches issues before deployment reaches production.
- **D-13:** Vars asserted:
  - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` — must start with `pk_live_` when `NODE_ENV === 'production'`
  - `NEXTAUTH_SECRET` — must be set (non-empty)
  - `RESEND_API_KEY` — must be set (non-empty)
  - `DATABASE_URL` is intentionally skipped in the build-time assertion (it's a server-only runtime var and not available in the Next.js build environment by default)

### Claude's Discretion
- Shadcn/ui component selection for the date picker on the reminders form
- Exact CSP directives (start permissive, document that tightening is post-launch)
- Wording of reminder email template body (Resend React Email or plain HTML)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/ROADMAP.md` §Phase 6 — Goal, Success Criteria (idempotency rule, CRON_SECRET header, pk_live_ assertion), Requirements (INFRA-01, INFRA-02, NOTF-01)
- `.planning/REQUIREMENTS.md` — INFRA-01, INFRA-02, NOTF-01 full requirement text

### Existing Infrastructure to Build On
- `drizzle/schema.ts` — `ordering_config` table (id=1 row, `is_ordering_open` bool, `updated_at`)
- `src/app/admin/settings/page.tsx` — existing Settings page; D-01 reminder trigger goes here
- `src/app/api/admin/config/route.ts` — existing ordering toggle PATCH handler; pattern to follow for `/api/admin/reminders`
- `src/auth.ts` — NextAuth v5 `auth()` function; all new admin Route Handlers use this for session guard
- `src/lib/admin/config.ts` — `getOrderingConfig()` helper; reference pattern for DB reads in admin lib

### Email (Phase 5 foundation)
- Phase 5 Resend setup (NOTF-02, NOTF-03) establishes the Resend client and email patterns — `/api/admin/reminders` follows the same Resend send pattern

### Vercel Deployment
- No existing `vercel.json` — must be created at project root with the cron entry

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/api/admin/config/route.ts` — auth guard pattern (`auth()` + `if (!session) return 401`) to reuse in `/api/admin/reminders` and `/api/cutoff`
- `src/lib/admin/config.ts` — Drizzle query helper pattern; mirror for a `getPaidOrdersForWeek(weekOf: string)` helper
- `src/app/admin/settings/page.tsx` — existing Server Component with `force-dynamic`; D-01 reminder section adds below the ordering toggle

### Established Patterns
- Drizzle `db.update()` with `.set()` for single-row config updates — follow same pattern for cutoff route
- All admin Route Handlers call `auth()` first and return 401 if no session — enforce for `/api/admin/reminders`
- `force-dynamic` on all admin pages — maintain for settings page after reminder section is added

### Integration Points
- `vercel.json` → `/api/cutoff` → `ordering_config.is_ordering_open = false` → customer-facing `getOrderingConfig()` reads it on each request (already `force-dynamic`)
- `/admin/settings` → `POST /api/admin/reminders` → Resend bulk send → returns count → inline feedback rendered in settings page client component

</code_context>

<specifics>
## Specific Ideas

- No specific UI references given — functional clarity is the priority for this operational phase.
- Smoke test checklist requested as `LAUNCH-CHECKLIST.md` at project root (not in `.planning/`).

</specifics>

<deferred>
## Deferred Ideas

- Rate limiting on `/api/orders/init` — deferred to post-launch (D-10). Paystack's flow limits the attack surface at MVP.
- DATABASE_URL env assertion — deferred; not reliably available at `next build` time without explicit `NEXT_PHASE` env gymnastics. Runtime error on first DB call is acceptable.

</deferred>

---

*Phase: 6-Automation + Launch*
*Context gathered: 2026-05-02*
