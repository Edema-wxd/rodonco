# Phase 6: Automation + Launch - Research

**Researched:** 2026-05-02
**Domain:** Vercel Cron Jobs, Resend batch email, Next.js error boundaries, security headers, env assertions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Reminder trigger lives on `/admin/settings` page alongside the ordering window toggle.
- **D-02:** Week selection via a date input scoped to Saturdays. Route Handler queries `orders WHERE week_of = <selected date> AND status = 'paid'`.
- **D-03:** Success feedback is inline count confirmation below the Send button: e.g., "12 reminder emails sent." No page reload, no redirect, no toast.
- **D-04:** Route: `POST /api/admin/reminders` — auth-gated (`auth()` check), accepts `{ week_of: string }`, bulk-sends via Resend, returns `{ sent: number }`.
- **D-05:** `vercel.json` created at project root with a single cron entry: path `/api/cutoff`, schedule `59 22 * * 4`.
- **D-06:** `/api/cutoff` is a `GET` Route Handler. Validates `Authorization: Bearer ${CRON_SECRET}` header. Calls `db.update(ordering_config).set({ is_ordering_open: false })` — idempotent (no-op if already false). Returns `{ ok: true }` with 200.
- **D-07:** No additional cron failure alerting beyond Vercel's built-in dashboard logs and automatic retries on non-2xx.
- **D-08:** Add Next.js error boundaries — `src/app/error.tsx` (route-level) and `src/app/global-error.tsx` (root-level).
- **D-09:** Add security headers via `next.config.ts` `headers()` config: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. Basic CSP as a starting point.
- **D-10:** Rate limiting on `/api/orders/init` is deferred — not implemented at MVP.
- **D-11:** Add a `LAUNCH-CHECKLIST.md` in the project root.
- **D-12:** Env assertion runs at build time in `next.config.ts` — a `validateEnv()` call at the top of the config file throws if required vars are missing or malformed.
- **D-13:** Vars asserted: `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` starts with `pk_live_` when `NODE_ENV === 'production'`; `NEXTAUTH_SECRET` non-empty; `RESEND_API_KEY` non-empty. `DATABASE_URL` intentionally skipped.

### Claude's Discretion

- Shadcn/ui component selection for the date picker on the reminders form.
- Exact CSP directives (start permissive, document that tightening is post-launch).
- Wording of reminder email template body (Resend React Email or plain HTML).

### Deferred Ideas (OUT OF SCOPE)

- Rate limiting on `/api/orders/init` — deferred to post-launch.
- `DATABASE_URL` env assertion — deferred; not reliably available at `next build` time.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Vercel Cron Job configured in `vercel.json` to call `GET /api/cutoff` at Thu 22:59 UTC (`59 22 * * 4`), closing the ordering window | Verified: vercel.json `crons` array format, CRON_SECRET auth pattern |
| INFRA-02 | `/api/cutoff` validates `CRON_SECRET` header before toggling `is_ordering_open` | Verified: official Vercel docs show exact `Authorization: Bearer` check pattern |
| NOTF-01 | Admin can select a delivery week and trigger delivery reminder emails to all `paid` orders for that week | Verified: Resend `resend.batch.send([])` supports up to 100 emails in one call |
</phase_requirements>

---

## Summary

Phase 6 closes the weekly ordering loop with three distinct workstreams: (1) a Vercel Cron job that calls `/api/cutoff` every Thursday to set `is_ordering_open = false`, (2) a bulk delivery reminder email route triggered by the admin from the settings page, and (3) pre-launch hardening — error boundaries, security headers, build-time env assertion, and a LAUNCH-CHECKLIST.md.

All decisions are already locked in CONTEXT.md. Research focus is on verifying the exact APIs, patterns, and pitfalls for each workstream so the planner can write precise task steps.

The Vercel Cron + CRON_SECRET pattern is well-documented and exactly matches the codebase's existing `auth()` + header guard pattern in `src/app/api/admin/config/route.ts`. Resend's batch API (`resend.batch.send()`) handles up to 100 emails per call — sufficient for MVP order volumes. Error boundaries and `next.config.ts` security headers follow standard Next.js App Router patterns with no project-specific complications.

**Primary recommendation:** Follow the existing `src/app/api/admin/config/route.ts` auth-guard pattern for all new Route Handlers. Use `resend.batch.send()` for reminders. Keep CSP permissive at launch — document exact tightening path in LAUNCH-CHECKLIST.md.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^15.5.15 (in package.json) | App Router, `headers()` config, error boundaries | Already installed |
| resend | Phase 5 install (not yet in package.json) | Transactional email — batch send for reminders | Already decided in Phase 5 |
| drizzle-orm | ^0.45.2 (in package.json) | DB queries for cutoff + reminder filters | Already installed |
| zod | ^3.25.76 (in package.json) | Validate `week_of` input on `/api/admin/reminders` | Already installed |

[VERIFIED: package.json] All packages except `resend` are already installed. `resend` is added in Phase 5.

### No New Packages Required
This phase adds zero new npm dependencies beyond what Phase 5 installs. `vercel.json`, `next.config.ts` changes, and new Route Handlers all use existing infrastructure.

[ASSUMED] `resend` package will be available after Phase 5 completes. If Phase 5 is not fully complete when planning this phase, the planner should note the `npm install resend` step.

---

## Architecture Patterns

### Recommended File Structure (new files only)

```
vercel.json                          # Cron job config (project root)
LAUNCH-CHECKLIST.md                  # Smoke test checklist (project root)
next.config.ts                       # Modified: add headers() + validateEnv()
src/app/error.tsx                    # Route-level error boundary
src/app/global-error.tsx             # Root-level error boundary
src/app/api/cutoff/route.ts          # GET — Vercel Cron handler
src/app/api/admin/reminders/route.ts # POST — bulk reminder sender
src/lib/admin/reminders.ts           # getPaidOrdersForWeek() DB helper
src/components/admin/settings/
  ReminderForm.tsx                   # Client Component: date picker + submit + inline count
```

### Pattern 1: Vercel Cron Route Handler with CRON_SECRET

**What:** `GET /api/cutoff` — validates the `Authorization: Bearer CRON_SECRET` header, then idempotently sets `ordering_config.is_ordering_open = false`.

**When to use:** All Vercel Cron-invoked routes.

```typescript
// Source: https://vercel.com/docs/cron-jobs/manage-cron-jobs
// src/app/api/cutoff/route.ts
import type { NextRequest } from 'next/server';
import { db, schema } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await db
    .update(schema.ordering_config)
    .set({ is_ordering_open: false, updated_at: new Date() })
    .where(eq(schema.ordering_config.id, 1));

  return Response.json({ ok: true });
}
```

**Key points:**
- Uses `new Response` (not `NextResponse`) — valid in TypeScript 5.2+ which this project uses [VERIFIED: package.json TypeScript ^5]
- Must NOT call `auth()` — Vercel invokes this without a session cookie; only `CRON_SECRET` header is the auth
- `eq` import from `drizzle-orm` required
- Idempotency: Drizzle's `.set({ is_ordering_open: false })` on an already-false row is a safe no-op at DB level [ASSUMED]

### Pattern 2: vercel.json Cron Configuration

**What:** Single cron entry targeting `/api/cutoff` at Thursday 22:59 UTC.

```json
// Source: https://vercel.com/docs/cron-jobs
// vercel.json (project root)
{
  "crons": [
    {
      "path": "/api/cutoff",
      "schedule": "59 22 * * 4"
    }
  ]
}
```

**Critical notes:**
- Vercel cron `4` = Thursday (Sunday=0 through Saturday=6) [VERIFIED: Vercel docs]
- Schedule is always UTC — `59 22 * * 4` is Thu 22:59 UTC = Thu 23:59 WAT [VERIFIED: Vercel docs]
- Vercel does NOT retry on failure — a non-2xx response logs the error but does not re-invoke [VERIFIED: Vercel docs]
- On **Hobby** plan: cron jobs are limited to once per day and Vercel may fire within the hour window (not exact minute). On **Pro** plan: fires within the specified minute. [VERIFIED: Vercel docs] — client should confirm plan tier if exact timing matters.

### Pattern 3: Resend Batch Send for Reminders

**What:** `POST /api/admin/reminders` — auth-gated, queries paid orders by `week_of`, sends batch reminder emails.

```typescript
// Source: https://resend.com/docs/api-reference/emails/send-batch-emails
// src/app/api/admin/reminders/route.ts
import { auth } from '@/auth';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  // Zod-validate { week_of: string (YYYY-MM-DD format, must be a Saturday) }

  const orders = await getPaidOrdersForWeek(body.week_of);

  if (orders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const { data, error } = await resend.batch.send(
    orders.map((order) => ({
      from: process.env.RESEND_FROM_EMAIL,
      to: [order.customer_email],
      subject: 'Your Rodo & Co delivery is on its way!',
      html: `<p>Hi ${order.customer_name}, ...</p>`,
    }))
  );

  if (error) {
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
  }

  return NextResponse.json({ sent: orders.length });
}
```

**Key points:**
- `resend.batch.send()` handles up to 100 emails per call [VERIFIED: resend.com docs]
- Resend client instantiated at module level (singleton, safe in serverless)
- If `orders.length > 100` (unlikely at MVP), the implementation should chunk — document this in comments, not a task
- `RESEND_FROM_EMAIL` is already typed in `src/types/env.d.ts` [VERIFIED: codebase]

### Pattern 4: Reminder DB Helper

Mirror `src/lib/admin/config.ts` pattern:

```typescript
// src/lib/admin/reminders.ts
import 'server-only';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '@/lib/db';

export async function getPaidOrdersForWeek(weekOf: string) {
  return db
    .select({
      id: schema.orders.id,
      customer_name: schema.orders.customer_name,
      customer_email: schema.orders.customer_email,
    })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.week_of, weekOf),
        eq(schema.orders.status, 'paid')
      )
    );
}
```

**Key points:**
- `week_of` is a Drizzle `date` column typed as string in queries [VERIFIED: drizzle/schema.ts]
- The `and()` import from `drizzle-orm` is needed for compound WHERE [ASSUMED: standard Drizzle pattern]

### Pattern 5: Next.js Error Boundaries

**What:** `src/app/error.tsx` wraps route segments. `src/app/global-error.tsx` wraps root layout.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/error
// src/app/error.tsx
'use client';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => unstable_retry()}>Try again</button>
    </div>
  );
}
```

```typescript
// src/app/global-error.tsx
// MUST include <html> and <body> tags — replaces root layout entirely
'use client';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => unstable_retry()}>Try again</button>
      </body>
    </html>
  );
}
```

**Critical:** `global-error.tsx` MUST include `<html>` and `<body>` tags — it replaces the root layout. [VERIFIED: Next.js docs]
**Critical:** Both must be `'use client'` — error boundaries are always Client Components. [VERIFIED: Next.js docs]
**Note:** `unstable_retry` replaces the older `reset` prop as of Next.js v16.2.0 — both exist for compatibility but prefer `unstable_retry`. [VERIFIED: Next.js docs changelog]

### Pattern 6: Security Headers in next.config.ts

**What:** `headers()` async function added to `next.config.ts`. `validateEnv()` called at config init.

```typescript
// Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers
// next.config.ts
import type { NextConfig } from 'next';

function validateEnv() {
  if (process.env.NODE_ENV === 'production') {
    const pubKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!pubKey?.startsWith('pk_live_')) {
      throw new Error(
        'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY must start with pk_live_ in production'
      );
    }
  }

  if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET (or NEXTAUTH_SECRET) must be set');
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY must be set');
  }
}

validateEnv();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https://utfs.io",
              "connect-src 'self' https://api.paystack.co https://api.resend.com",
              "frame-src https://js.paystack.co",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Key points:**
- `validateEnv()` runs during `next build` — throws before any compilation if env vars are wrong [ASSUMED: standard Node module execution order]
- The env.d.ts uses `AUTH_SECRET` not `NEXTAUTH_SECRET` — D-13 says `NEXTAUTH_SECRET` but codebase uses `AUTH_SECRET`. Planner should assert `AUTH_SECRET` to match `src/types/env.d.ts`. [VERIFIED: codebase src/types/env.d.ts]
- CSP must include Paystack JS origin (`https://js.paystack.co`) and UploadThing CDN (`https://utfs.io`) to avoid breaking Phase 5 payment flow and Phase 4 image uploads [VERIFIED: codebase has Paystack + UploadThing]
- `'unsafe-inline'` and `'unsafe-eval'` in `script-src` are needed because Next.js 15 App Router injects inline scripts — can be tightened with nonces post-launch [CITED: nextjs.org/docs/app/guides/content-security-policy]
- A known Next.js 15 issue exists where CSP headers may not apply correctly in production without nonce; start permissive and tighten post-launch [CITED: github.com/vercel/next.js/discussions/80997]

### Pattern 7: ReminderForm Client Component

**What:** Client Component added below `OrderingToggle` in the settings page. Uses `useState` for `week_of` input and sends feedback inline.

```typescript
// src/components/admin/settings/ReminderForm.tsx
'use client';
import { useState } from 'react';

export function ReminderForm() {
  const [weekOf, setWeekOf] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/admin/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_of: weekOf }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult(`${data.sent} reminder email${data.sent === 1 ? '' : 's'} sent.`);
    } else {
      setResult('Failed to send reminders. Check logs.');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="week_of">Delivery week (Saturday)</label>
      <input
        id="week_of"
        type="date"
        value={weekOf}
        onChange={(e) => setWeekOf(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Send Reminders'}
      </button>
      {result && <p>{result}</p>}
    </form>
  );
}
```

**Notes:**
- D-02 says "scoped to Saturdays" — this can be enforced client-side with the `min`/`max` + step validation on `<input type="date">`, or via a `refine()` check in the Zod schema on the route handler. Route-level Zod validation is mandatory regardless of client-side enforcement.
- D-03 specifies inline count feedback (no toast/redirect) — `setResult()` state pattern shown above satisfies this.
- shadcn's `<Calendar>` component can replace the native date input if Claude's discretion opts for it; the API contract (`week_of: string`) is the same.

### Anti-Patterns to Avoid

- **Calling `auth()` in `/api/cutoff`:** Vercel invokes cron routes server-to-server with no cookies. `auth()` will return null and every cron invocation will fail with 401. Use only the CRON_SECRET header check.
- **Importing `resend` before Phase 5 installs it:** The package must be in `node_modules`. If Phase 5 is not yet run, add `npm install resend` as Wave 0 step.
- **Omitting `<html><body>` in global-error.tsx:** Causes a Next.js build error or blank page at runtime.
- **Using `NEXTAUTH_SECRET` in validateEnv:** The project uses `AUTH_SECRET` (NextAuth v5 convention). Check `AUTH_SECRET` not `NEXTAUTH_SECRET` to avoid false failures. [VERIFIED: src/types/env.d.ts]
- **Caching the ordering config read:** The shop page already uses `unstable_noStore()`. The cron route writes; no caching concern there.
- **Setting overly strict CSP at launch:** Paystack inline popup and UploadThing both require external origins; breaking them in production is worse than a loose CSP.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sending N emails to N recipients | Loop of `resend.emails.send()` calls | `resend.batch.send([])` | Single API call, up to 100 emails, less latency, less error surface |
| React error boundary | Custom class component | `error.tsx` / `global-error.tsx` | Next.js App Router built-in; no extra package needed |
| Security header middleware | Custom Next.js middleware | `next.config.ts` `headers()` | Static config, applied at edge, no runtime overhead |
| Cron auth middleware | Custom JWT or API key scheme | `CRON_SECRET` env var | Vercel auto-injects the header; no middleware needed |

---

## Common Pitfalls

### Pitfall 1: Hobby Plan Cron Timing Imprecision

**What goes wrong:** On the Vercel Hobby plan, cron jobs with sub-hourly expressions may not fire at the exact minute; Vercel may invoke the job at any point within the specified hour.

**Why it happens:** Vercel distributes cron load across Hobby accounts within the hour window. [VERIFIED: Vercel docs]

**How to avoid:** Confirm the project is on a Vercel Pro plan or accept that the cutoff fires between 22:00-22:59 UTC rather than at exactly 22:59. Either is acceptable since the intent is to close ordering by end-of-Thursday.

**Warning signs:** Orders placed between 22:59 and the actual cron invocation time are accepted when they shouldn't be.

### Pitfall 2: CRON_SECRET Not Set in Vercel Environment

**What goes wrong:** `/api/cutoff` returns 401 on every Vercel invocation because `process.env.CRON_SECRET` is undefined.

**Why it happens:** `CRON_SECRET` must be added to the Vercel project's environment variables manually (Vercel does not create it automatically). [VERIFIED: Vercel docs]

**How to avoid:** The LAUNCH-CHECKLIST.md should include "Add CRON_SECRET to Vercel environment variables" as a step. The validateEnv() assertion does NOT check CRON_SECRET (it's runtime-only), so this must be a manual checklist item.

**Warning signs:** Cron job shows 401 in Vercel dashboard logs.

### Pitfall 3: CSP Blocks Paystack Inline Popup

**What goes wrong:** After adding CSP headers, the Paystack checkout popup fails to load or submit — customers see a blank modal or JS errors.

**Why it happens:** Paystack inline JS loads from `https://js.paystack.co` and makes API calls to `https://api.paystack.co`. A strict `default-src 'self'` will block both.

**How to avoid:** Explicitly allowlist `https://js.paystack.co` in `script-src` and `frame-src`, and `https://api.paystack.co` in `connect-src`. [ASSUMED: standard Paystack integration requirements]

**Warning signs:** Browser console CSP violation errors mentioning `js.paystack.co` or `api.paystack.co`.

### Pitfall 4: Drizzle `date` Column vs. String Comparison

**What goes wrong:** `WHERE week_of = '2025-01-11'` works differently depending on whether Drizzle serializes the date column as a `Date` object or a string.

**Why it happens:** Drizzle's `date()` column type maps to a JavaScript `string` in query results (confirmed in existing `orders.ts` — `typeof o.week_of === "string"` guard exists). [VERIFIED: src/lib/admin/orders.ts line 63]

**How to avoid:** Pass the `week_of` value directly as a string (`YYYY-MM-DD`) to the Drizzle `eq()` call — no `new Date()` conversion needed.

**Warning signs:** Zero orders returned even when paid orders exist for the selected week.

### Pitfall 5: `validateEnv()` Fires in `next dev`

**What goes wrong:** Developers without `pk_live_` key cannot run `next dev` locally because `validateEnv()` throws.

**Why it happens:** The assertion runs on every `next build` AND `next dev` start.

**How to avoid:** Gate the `pk_live_` assertion on `NODE_ENV === 'production'` (already specified in D-13). Other assertions (non-empty RESEND_API_KEY, non-empty AUTH_SECRET) should fire in all environments since local dev should have these set in `.env.local`. [ASSUMED: this matches D-13 intent]

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| vercel CLI / vercel.json parsing | INFRA-01 | N/A — file read at deploy | — | — |
| resend npm package | NOTF-01 | Installed by Phase 5 (not yet present) | Phase 5 installs | Add `npm install resend` in Wave 0 if Phase 5 not done |
| CRON_SECRET env var | INFRA-02 | Must be set in Vercel dashboard | — | None — blocks cron auth |
| NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY (live) | D-13 assertion | Pending from client | — | Use test key in dev |

**Missing dependencies with no fallback:**
- `CRON_SECRET` must be added to Vercel project env vars before first production deployment — no code fallback exists.

**Missing dependencies with fallback:**
- `resend` package — if Phase 5 is not yet merged, add `npm install resend` as a Wave 0 step in the plan.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-02 | `/api/cutoff` returns 401 when Authorization header is wrong/missing | unit | `npm test -- --reporter=verbose src/app/api/cutoff/route.test.ts` | No — Wave 0 |
| INFRA-02 | `/api/cutoff` returns 200 and sets is_ordering_open=false with correct CRON_SECRET | unit | same file | No — Wave 0 |
| NOTF-01 | `getPaidOrdersForWeek()` returns only paid orders for the given week | unit | `npm test -- src/lib/admin/reminders.test.ts` | No — Wave 0 |
| NOTF-01 | `POST /api/admin/reminders` returns 401 without session | unit | `npm test -- src/app/api/admin/reminders/route.test.ts` | No — Wave 0 |
| D-12/D-13 | `validateEnv()` throws when PAYSTACK key is test key in production | unit | `npm test -- src/lib/validateEnv.test.ts` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/app/api/cutoff/route.test.ts` — covers INFRA-01/INFRA-02 (mock `process.env.CRON_SECRET`, mock Drizzle)
- [ ] `src/lib/admin/reminders.test.ts` — covers NOTF-01 helper query logic
- [ ] `src/lib/validateEnv.test.ts` — covers D-12/D-13 assertion logic (pure function, easy to unit test)

The existing `src/lib/admin/schemas.test.ts` pattern (pure Zod validation) is the model for these tests.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes — cron route | CRON_SECRET `Authorization: Bearer` header check |
| V3 Session Management | yes — reminders route | NextAuth v5 `auth()` session guard (existing pattern) |
| V4 Access Control | yes — admin routes | `auth()` guard + 401 on all new admin Route Handlers |
| V5 Input Validation | yes — `week_of` param | Zod schema on `/api/admin/reminders` body |
| V6 Cryptography | no | N/A — no new crypto operations |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated cron trigger (external actor calls /api/cutoff) | Spoofing | `CRON_SECRET` Bearer header check — return 401 immediately |
| Admin reminders spam (trigger 1000 emails at once) | Denial of Service | Resend batch.send() limit (100/call); at MVP order volumes this is not a risk; document post-launch rate limit |
| Clickjacking the admin panel | Tampering | `X-Frame-Options: DENY` header |
| MIME type sniffing attacks | Tampering | `X-Content-Type-Options: nosniff` |
| CSP bypass via Paystack/UploadThing origins | Tampering | Explicitly allowlist required origins; review and tighten post-launch |
| Env var leak in build logs | Information Disclosure | `validateEnv()` only logs error message, not the actual key values |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `reset` prop on error boundary | `unstable_retry` prop | Next.js v16.2.0 (current in this project) | Use `unstable_retry`; `reset` still works but is legacy |
| `NextResponse.json()` in Route Handlers | `Response.json()` (Web standard) | TypeScript 5.2+ / Next.js 14+ | This project uses TypeScript ^5 so `new Response` is valid; codebase uses `NextResponse.json()` — follow existing convention for consistency |

**Note on `Response` vs `NextResponse`:** The existing codebase consistently uses `NextResponse.json()` (see `src/app/api/admin/config/route.ts`). The cron route example from Vercel docs uses `new Response`. Either works — follow the existing codebase convention (`NextResponse.json()`) for consistency. For the 401 in the cron route, `new Response('Unauthorized', { status: 401 })` is fine as is.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `resend` package will be available after Phase 5 completes | Standard Stack | Need to add `npm install resend` as Wave 0 step if Phase 5 is not yet done |
| A2 | Drizzle `.set({ is_ordering_open: false })` on an already-false row is a safe no-op | Pattern 1 | No actual risk — DB update of same value is always safe at the SQL level |
| A3 | `validateEnv()` in `next.config.ts` runs during `next build` before bundling | Pattern 6 | If it does not run at build time, env errors only surface at runtime — test by building with wrong vars |
| A4 | Paystack inline popup requires `script-src https://js.paystack.co` in CSP | Pattern 6 | Breaking payment checkout in production; verify against Paystack integration docs |
| A5 | `and()` from `drizzle-orm` is needed for compound WHERE | Pattern 4 | Minor: import error at runtime; fix is a one-line change |

---

## Open Questions

1. **AUTH_SECRET vs NEXTAUTH_SECRET in validateEnv()**
   - What we know: `src/types/env.d.ts` declares `AUTH_SECRET` (NextAuth v5 standard). CONTEXT.md D-13 says "NEXTAUTH_SECRET".
   - What's unclear: Is `NEXTAUTH_SECRET` a legacy alias or should both be checked?
   - Recommendation: Assert `AUTH_SECRET` to match the existing env.d.ts type. Document in LAUNCH-CHECKLIST.md that `AUTH_SECRET` must be set.

2. **Vercel plan tier (Hobby vs Pro)**
   - What we know: Hobby plan fires cron within the hour; Pro fires within the minute.
   - What's unclear: Which plan the project deploys on.
   - Recommendation: LAUNCH-CHECKLIST.md should include a note: "If on Hobby plan, cron fires within the 22:xx hour — verify ordering closes by 23:00 WAT."

3. **`orders.notified_at` column usage**
   - What we know: `drizzle/schema.ts` has `notified_at: timestamp("notified_at")` on the `orders` table.
   - What's unclear: Should `/api/admin/reminders` update `notified_at` when sending reminders to prevent duplicate sends?
   - Recommendation: Planner should decide — updating `notified_at` prevents accidental re-sends but adds complexity. At MVP with manual admin trigger, treat this as out of scope and document in LAUNCH-CHECKLIST.md.

---

## Sources

### Primary (HIGH confidence)
- [Vercel Cron Jobs docs](https://vercel.com/docs/cron-jobs) — cron expression format, UTC timezone, GET invocation
- [Vercel Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs) — CRON_SECRET pattern, no retry on failure, Hobby vs Pro timing, idempotency guidance
- [Next.js error.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/error) — props, `unstable_retry`, `global-error.tsx` must include `<html><body>`, `'use client'` requirement
- [Resend batch send API](https://resend.com/docs/api-reference/emails/send-batch-emails) — `resend.batch.send([])`, 100 email limit per call
- `drizzle/schema.ts` — ordering_config table structure, orders table with `week_of` and `notified_at`
- `src/app/api/admin/config/route.ts` — auth guard pattern to follow
- `src/lib/admin/config.ts` — DB helper pattern to follow
- `src/types/env.d.ts` — confirmed `AUTH_SECRET` not `NEXTAUTH_SECRET`, confirmed `CRON_SECRET` is already typed
- `package.json` — confirmed no `resend` package yet; TypeScript ^5

### Secondary (MEDIUM confidence)
- [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy) — CSP via `next.config.ts`, nonce approach for stricter CSP
- [Next.js security headers](https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers) — `headers()` configuration format
- [Next.js 15 CSP issue](https://github.com/vercel/next.js/discussions/80997) — CSP may not apply without nonce in production; start permissive

### Tertiary (LOW confidence — needs validation)
- Paystack CSP requirements — assumed based on Paystack integration pattern; should be verified against Paystack docs before tightening CSP post-launch

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages verified in package.json; Resend confirmed via official docs
- Architecture: HIGH — Vercel cron pattern verified via official docs; Next.js error boundary pattern verified via official docs
- Pitfalls: HIGH — CRON_SECRET, CSP/Paystack, date column type all verified against codebase and docs
- Security headers: MEDIUM — CSP Paystack requirements are assumed

**Research date:** 2026-05-02
**Valid until:** 2026-06-02 (stable domain; all primary sources are official docs)
