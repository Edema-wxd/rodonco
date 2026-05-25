# Phase 6: Automation + Launch - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 6-automation-launch
**Areas discussed:** Reminder Trigger UX, Pre-launch Hardening Scope, Env Assertion Strategy, Cron Failure Alerting

---

## Reminder Trigger UX

| Option | Description | Selected |
|--------|-------------|----------|
| /admin/settings | Alongside ordering toggle — keeps week operations together | ✓ |
| /admin/orders | Where order data lives — week context already present | |

**Week selection:**

| Option | Description | Selected |
|--------|-------------|----------|
| Date input (week picker) | HTML date picker scoped to Saturdays | ✓ |
| Dropdown of past weeks | Populated from DB with weeks that have paid orders | |

**Success feedback:**

| Option | Description | Selected |
|--------|-------------|----------|
| Count confirmation inline | "12 reminder emails sent" below button | ✓ |
| Toast notification | Dismissible toast | |
| Redirect to orders list | Navigate to /admin/orders filtered to that week | |

**Notes:** Clean, no-redirect feedback. Admin stays on settings page after triggering.

---

## Pre-launch Hardening Scope

**Items selected (multi-select):** Error boundaries, Rate limiting on /api/orders/init, Security headers, Smoke test script

| Hardening item | Decision |
|----------------|----------|
| Error boundaries | ✓ Implement — error.tsx + global-error.tsx |
| Rate limiting | Selected but then deferred — Paystack limits abuse at MVP |
| Security headers | ✓ Implement via next.config.ts headers() |
| Smoke test script | ✓ LAUNCH-CHECKLIST.md at project root |

**Rate limiting follow-up:**

| Option | Description | Selected |
|--------|-------------|----------|
| Skip for now | Paystack checkout limits abuse; revisit post-launch | ✓ |
| Vercel edge middleware | Built-in, no deps | |
| Upstash Redis | Robust but adds service dependency | |

**Notes:** Rate limiting deferred to post-launch. All other hardening items in scope.

---

## Env Assertion Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| next.config.ts at build time | validateEnv() throws during next build | ✓ |
| Server startup (instrumentation.ts) | Runs at cold start, not build time | |
| First API request | Latest possible detection | |

**Vars to assert (multi-select):** NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY prefix, NEXTAUTH_SECRET, RESEND_API_KEY
(DATABASE_URL not selected — not reliably available at build time)

**Notes:** Build-time assertion catches issues before deployment. DATABASE_URL deferred — runtime failure on first DB call is acceptable.

---

## Cron Failure Alerting

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel dashboard only | Built-in logs + auto-retry on non-2xx | ✓ |
| Email alert on cron failure | /api/cutoff catches errors and sends Resend alert | |
| Health check endpoint | GET /api/health returns last cron run timestamp | |

**Notes:** MVP simplicity wins. Vercel retries automatically; admin monitors via dashboard.

---

## Claude's Discretion

- Shadcn/ui component for date picker on reminders form
- Exact CSP directives (permissive at launch, tighten post-launch)
- Reminder email body template (Resend React Email or plain HTML)

## Deferred Ideas

- Rate limiting on /api/orders/init — post-launch
- DATABASE_URL env assertion — runtime failure acceptable at MVP
