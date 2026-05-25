# Phase 5: Payments + Email — Research

**Phase:** `05-payments-email`  
**Date:** 2026-05-02

## Question

What must implementers understand to **plan and ship** checkout, Paystack inline pay, webhook confirmation, Resend/React Email notices, and the order confirmation page without rework?

## Canonical schema alignment (critical)

Live Drizzle schema (`drizzle/schema.ts`) exposes:

- **`orders.reference`** — `text`, **UNIQUE NOT NULL**. This column is the **single idempotency + human-visible order key**.
- Phase docs and roadmap text sometimes say `paystack_reference`; **implementers MUST treat `orders.reference` as the Paystack transaction reference** returned from `POST /transaction/initialize` and echoed in webhook `data.reference`.

No separate `paystack_reference` column exists today. Verification and plans must word idempotency as **UNIQUE on `reference`**, not a second column.

## Paystack inline + server init

**Flow:**

1. Client submits checkout payload → **`POST /api/orders/init`**.
2. Server creates **`pending`** row in `orders` + `order_items`, with **`reference`** = generated `RDC-{nanoid(...)}` (per `05-CONTEXT.md` D-07).
3. Server calls Paystack **`POST https://api.paystack.co/transaction/initialize`** with **`reference`** set to that same string, `amount` in **kobo**, `currency: "NGN"`, customer email/metadata.
4. Response includes **`authorization_url`** / **`access_code`** for inline popup (Paystack Inline JS consumes `access_code` + **`key: NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`**).
5. **`@paystack/inline-js`** opens popup client-side (`PaystackPop.setup` or equivalent API per package docs). Do **not** load inline script late from CDN in production unless UI-SPEC says otherwise — prefer bundled npm dependency.

**Pitfalls:**

- Amount must be integer **kobo**; never float NGN on the wire.
- `reference` must be unique before Paystack init to satisfy DB UNIQUE and Paystack uniqueness expectations.
- Reuse-or-create **pending order** semantics (CONTEXT D-05): match `(customer_email + cart fingerprint)`; avoid orphan rows on retries.

## Webhook verification (App Router)

**Route:** `POST /api/paystack/webhook` (matches `05-CONTEXT.md`; ensure Paystack dashboard URL matches deployed path.)

**Mandatory order:**

1. `const raw = await request.text()` — **never** `request.json()` first (stream is single-pass; JSON parse before HMAC breaks signature verification — CONTEXT D-16).
2. Read header `x-paystack-signature`.
3. Compute **HMAC-SHA512** of **raw body** with server secret (**Paystack uses the secret key** for webhook signing — align env: `PAYSTACK_SECRET_KEY`; if `PAYSTACK_WEBHOOK_SECRET` exists in `.env.local.example`, document which value Paystack expects or unify naming in implementation docs).
4. Constant-time compare (or verified helper) vs header.
5. Parse JSON **after** verification.
6. Process only **`event === "charge.success"`** (or documented subset); ignore others with `200`.

**Idempotency (CONTEXT D-17 + DB UNIQUE):**

- Extract Paystack **`data.reference`** (equals our **`orders.reference`**).
- Look up existing order: if **`status === "paid"`** → return `200` immediately.
- Else update order + items atomically/in one transaction pattern as feasible on `neon-http` (same caveat as Phase 4 — sequential ops acceptable if documented).

**Webhook response time:**

- Persist `paid`, then **`void sendEmails(...)` fire-and-forget** (CONTEXT D-15): catch+log Resend failures, **still return `200`** within Paystack SLA window (~5s target from roadmap).

**Middleware:**

- Current `src/middleware.ts` matcher is **`/admin/:path*` only** — webhook path is **not** blocked. Keep it that way; do not widen admin matcher to `/api/*`.

## Resend + React Email

- Use **`resend` SDK** server-side only (webhook + optional future cron).
- Templates as **React Email** components (`@react-email/components`) under e.g. `src/lib/email/templates/`.
- **From** address via env (project uses **`RESEND_FROM_EMAIL`** — align CONTEXT D-11 wording with `.env.local.example`).
- **ADMIN_NOTIFICATION_EMAIL** for admin alerts.
- Never block webhook on email success; structured logging (`console.error` or project logger).

## Confirmation page `/order/[ref]`

- `ref` dynamic segment = **`orders.reference`** string (same as Paystack reference).
- Server Component loads order + items via Drizzle; **`force-dynamic`** or `noStore` consistent with **`INFRA-04`** precedent for freshness when reading config (orders are less cache-sensitive but keep pattern simple).
- If not found OR `status !== "paid"` → explicit error UI (CONTEXT D-10 / CONF requirements).

## Testing strategy (automated surfaces)

| Surface | Automated approach |
|---------|---------------------|
| Zod checkout payloads | Vitest pure functions |
| Order total derivation from cart | Vitest (`CartItem` → kobo ints) |
| Webhook signature | Vitest vector w/ fixed body + secret |
| HMAC rejects bad signature | Vitest |

E2E payment + Paystack sandbox: **manual** or future Playwright (out of MVP plans unless wired).

---

## Validation Architecture

**Nyquist Dimension 8 (feedback sampling):**

- **Framework:** Vitest (existing `npm run test`).
- **Quick cadence:** `npm run test` after each task touching `src/lib/checkout/**`, `src/lib/paystack/**`, `src/lib/email/**`, or route handlers under `src/app/api/orders/**` and `src/app/api/paystack/**`.
- **Wave completeness:** Before `/gsd-execute-phase 5`, add **Wave 0** tests where PLAN tasks are UI-heavy: component tests with MSW/mock fetch for `/api/orders/init` minimal contract.
- **Manual-only:** Successful Paystack test charge in browser; Resend inbox delivery.

This section exists to unblock `05-VALIDATION.md` generation for plan checker / execution gates.

---

## References (external)

- [Paystack — Webhooks](https://paystack.com/docs/payments/webhooks/)
- [Paystack — Inline JS](https://paystack.com/docs/developer-tools/inlinejs/)
- [Resend — Next.js](https://resend.com/docs/send-with-nextjs)
- Internal: `.planning/research/PITFALLS.md` (Paystack body ordering), `.planning/research/STACK.md`

---

## RESEARCH COMPLETE
