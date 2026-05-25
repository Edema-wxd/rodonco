---
phase: 06-automation-launch
reviewed: 2026-05-04T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - LAUNCH-CHECKLIST.md
  - next.config.ts
  - src/app/admin/settings/page.tsx
  - src/app/api/admin/reminders/route.test.ts
  - src/app/api/admin/reminders/route.ts
  - src/app/error.tsx
  - src/app/global-error.tsx
  - src/components/admin/settings/ReminderForm.tsx
  - src/lib/admin/reminders.test.ts
  - src/lib/admin/reminders.ts
  - src/lib/validateEnv.test.ts
  - src/lib/validateEnv.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-05-04T00:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

This phase delivers the reminders API route, the `getPaidOrdersForWeek` DB helper, environment validation, security headers, and launch-readiness documentation. The overall quality is solid: auth gates are in place, Zod validates the request body, Drizzle parameterises all queries (no injection risk), and error handling is generally present.

Four warnings require attention before going live:

1. A timezone-dependent bug in the Saturday validation logic can incorrectly accept or reject valid dates on servers running outside UTC.
2. `RESEND_FROM_EMAIL` is never validated at build time; its absence causes all reminder emails to fail silently at runtime with no clear error surface.
3. Both error boundary components use the experimental `unstable_retry` prop, which will break when Next.js stabilises the API.
4. Customer name is rendered unescaped into the HTML email body, causing malformed markup for names containing HTML special characters.

---

## Warnings

### WR-01: Saturday check uses local timezone — off-by-one on non-UTC servers

**File:** `src/app/api/admin/reminders/route.ts:15`
**Issue:** `new Date("2025-01-11")` (a bare date-only ISO-8601 string) is parsed as **UTC midnight** per the spec. Calling `.getDay()` on it returns the day in the **server's local timezone**. On a server running UTC+1 or later, UTC midnight Saturday becomes Friday locally, so `d.getDay() === 6` returns `false` and a valid Saturday is rejected. On UTC-1 the inverse can occur. Vercel deployments default to UTC, but this is a latent correctness bug.

**Fix:** Parse the date components directly to avoid timezone dependency:
```typescript
.refine((val) => {
  const [year, month, day] = val.split("-").map(Number);
  const d = new Date(year, month - 1, day); // local-time constructor, no UTC shift
  return d.getDay() === 6;
}, "week_of must be a Saturday"),
```

---

### WR-02: `RESEND_FROM_EMAIL` not validated — silently becomes `"undefined"` if unset

**File:** `src/app/api/admin/reminders/route.ts:49` and `src/lib/validateEnv.ts`
**Issue:** `process.env.RESEND_FROM_EMAIL as string` will evaluate to the string `"undefined"` when the env var is absent. Resend will reject the request and the `error` branch on line 56 will fire, but the logged error message will mention Resend's rejection reason rather than the true cause (missing env var). This is hard to diagnose in production. `RESEND_FROM_EMAIL` is listed as a required production variable in `LAUNCH-CHECKLIST.md` but is not checked in `validateEnv.ts`.

**Fix — add to `validateEnv.ts`:**
```typescript
if (!process.env.RESEND_FROM_EMAIL) {
  throw new Error(
    "[validateEnv] RESEND_FROM_EMAIL must be set. Add it to .env.local (dev) or Vercel environment variables (production)."
  );
}
```

---

### WR-03: `unstable_retry` prop will break when Next.js stabilises the error boundary API

**File:** `src/app/error.tsx:5-8` and `src/app/global-error.tsx:5-8`
**Issue:** Both error boundary components accept the prop `unstable_retry` — a pre-stable name Next.js used before shipping the stable `reset` function. The Next.js App Router error boundary contract for the stable API uses `reset: () => void`. Keeping the `unstable_` name means these components will stop working silently once Next.js drops the alias, and type checking will flag the prop as unknown.

**Fix (`src/app/error.tsx`):**
```tsx
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // ...
  <button onClick={reset}>Try again</button>
```

Apply the same change to `src/app/global-error.tsx`.

---

### WR-04: Customer name injected into HTML email body without escaping

**File:** `src/app/api/admin/reminders/route.ts:52`
**Issue:** `order.customer_name` is interpolated directly into an HTML string. If a customer's name contains `<`, `>`, or `&` the generated HTML is malformed. For example, a name stored as `O'Brien & Sons` would produce broken markup, and a name like `<script>` would inject a tag into the email HTML. While this is unlikely to be exploitable (emails are sent only to the order's own customer), the HTML correctness issue affects deliverability and rendering.

**Fix:** Escape HTML special characters before insertion:
```typescript
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Then in the template:
html: `<p>Hi ${escapeHtml(order.customer_name)},</p>...`
```

---

## Info

### IN-01: Other launch-checklist env vars not validated at build time

**File:** `src/lib/validateEnv.ts`
**Issue:** `CRON_SECRET`, `ADMIN_NOTIFICATION_EMAIL`, and `NEXT_PUBLIC_APP_URL` are listed as required in `LAUNCH-CHECKLIST.md` but are absent from `validateEnv`. Their omission won't crash the build but will allow a misconfigured deploy to go live silently. Adding them makes misconfiguration visible at build time rather than at runtime.

**Fix:** Add presence checks for each variable following the existing pattern in `validateEnv.ts`.

---

### IN-02: ReminderForm provides no client-side Saturday validation hint

**File:** `src/components/admin/settings/ReminderForm.tsx:53-61`
**Issue:** The `<input type="date">` has no `min`, `max`, or day-of-week filtering. An admin who selects a non-Saturday date gets no immediate feedback — the error only surfaces after the POST returns 400. The server validation is correct, but a UI hint improves the admin experience.

**Fix:** On `onChange`, check `new Date(value).getDay() !== 6` and display an inline warning: "Please select a Saturday."

---

### IN-03: `route.test.ts` uses `as any` cast on `expect` to work around TS types

**File:** `src/app/api/admin/reminders/route.test.ts:6`
**Issue:** The cast `const expect = _expect as any` suppresses `arrayContaining` / `objectContaining` type errors. This is a test-only workaround, not a production risk, but it hides future type regressions in test assertions. The root cause is typically a missing `@types/vitest` version or a missing `vitest/globals` config.

**Fix:** Verify `vitest.config.ts` includes `globals: true` and `@types/vitest` is in `devDependencies`, then remove the cast.

---

_Reviewed: 2026-05-04T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
