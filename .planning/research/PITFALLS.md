# Domain Pitfalls

**Domain:** Food prep ordering platform — Next.js 15 App Router + Supabase + Paystack + Vercel Cron
**Researched:** 2026-04-15
**Confidence:** HIGH for Paystack/webhook pitfalls (official docs + community); HIGH for Zustand hydration (verified across multiple sources); MEDIUM for parallel routes (known bugs, but Next.js is actively iterating)

---

## Critical Pitfalls

Mistakes that cause production bugs, data loss, double-charges, or rewrites.

---

### Pitfall 1: Paystack Webhook Body Consumed Before HMAC Verification

**What goes wrong:**
The route handler calls `request.json()` to parse the payload, then tries to compute the HMAC signature over the body. Because `request.body` is a one-time-read stream, calling `.json()` first exhausts it. The subsequent `.text()` call for signature verification returns an empty string. Every webhook fails HMAC validation; no orders are ever created.

**Why it happens:**
Developers reach for `request.json()` out of habit. In Next.js App Router route handlers, the body is a Web API `ReadableStream` — it has no `.rawBody` property and cannot be re-read.

**Consequences:** All Paystack webhooks silently fail HMAC verification. Orders are never persisted. Customers pay but receive no confirmation. Admin sees no orders.

**Prevention:**
Always read the raw body **first** with `await request.text()`, then parse JSON from that string, then verify:

```typescript
// /app/api/webhooks/paystack/route.ts
export async function POST(request: Request) {
  const rawBody = await request.text();           // read ONCE as text
  const signature = request.headers.get("x-paystack-signature");
  const hash = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");
  if (hash !== signature) return new Response("Unauthorized", { status: 401 });
  const event = JSON.parse(rawBody);              // parse from the text you already have
  // ... process event
}
```

**Warning signs:** Webhook logs show 401s or no response from your endpoint. Paystack Dashboard shows all deliveries failing.

**Phase:** Payment integration (Week 3). Must be verified before go-live.

---

### Pitfall 2: Duplicate Paystack Webhooks Create Double Orders

**What goes wrong:**
Paystack retries webhook delivery when your endpoint returns anything other than `200 OK` within 30 seconds, or if it times out. If your handler is slow (email send, DB write, etc.) and occasionally times out, Paystack retries — and if you haven't implemented idempotency, the order is inserted twice. Customer is not double-charged but admin sees duplicate orders; inventory/reporting is corrupted.

**Why it happens:**
Webhook handlers do synchronous work (DB insert + email send inline) that pushes past the 30-second window. Or the handler succeeds but crashes before returning `200`, so Paystack never records the delivery as confirmed.

**Consequences:** Duplicate order rows, incorrect revenue totals, admin confusion, potential double-shipment.

**Prevention:**
1. Return `200 OK` immediately upon HMAC verification, before any business logic.
2. Check idempotency: query `orders` table for an existing row with `paystack_reference = event.data.reference` before inserting. If it already exists, return `200` silently.
3. Use a `UNIQUE` constraint on `orders.paystack_reference` as a hard database-level guard — a duplicate insert will throw a unique violation, which you catch and treat as a no-op.

```typescript
// After HMAC verification, respond 200 immediately
// Then process asynchronously (or check idempotency before side effects)
const existing = await supabase
  .from("orders")
  .select("id")
  .eq("paystack_reference", reference)
  .single();
if (existing.data) return new Response("OK", { status: 200 }); // already processed
```

**Warning signs:** `orders` table has rows with identical `paystack_reference` values. Admin order count higher than payment count.

**Phase:** Payment integration (Week 3).

---

### Pitfall 3: Test vs Live Paystack Keys in Wrong Environments

**What goes wrong:**
Test public key (`pk_test_...`) used in production, or live secret key (`sk_live_...`) accidentally committed to git or leaked into client-side code. Paystack test and live environments are completely separate — test webhooks go to the test dashboard, live webhooks go to the live dashboard. Mixing them means no real payments are captured.

**Why it happens:**
Developer works with test keys through all of Week 1–2, forgets to swap to live keys at go-live. Or live secret key is placed in `NEXT_PUBLIC_` env var, exposing it to the browser bundle.

**Consequences:** Real customers' payments go undetected. Or live secret key is exposed, enabling fraudulent charges against the merchant's Paystack account.

**Prevention:**
- Name env vars explicitly: `PAYSTACK_SECRET_KEY` (server-only, never `NEXT_PUBLIC_`), `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (client-safe).
- Add a startup assertion in `instrumentation.ts` or app init: verify `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` starts with `pk_live_` in `NODE_ENV=production`.
- Add `.env.local` to `.gitignore` and use Vercel environment variable UI for production secrets.
- Paystack webhook URL in the Paystack dashboard must be the production URL — set this explicitly during Week 3 pre-launch checklist.

**Warning signs:** Payments succeed in test mode but no orders appear; Paystack Live dashboard shows zero transactions at launch.

**Phase:** Week 3 pre-launch checklist. Add explicit verification step.

---

### Pitfall 4: WAT ≠ UTC — Cutoff Fires at Wrong Time or Wrong Day

**What goes wrong:**
The ordering window closes "Thursday midnight WAT" for customers. WAT is UTC+1. Vercel Cron only accepts UTC expressions. The cron is set as `59 22 * * 4` (Thursday 22:59 UTC = Thursday 23:59 WAT — correct). But if the developer thinks in terms of "Thursday" and writes `59 23 * * 4` (Thursday 23:59 UTC = **Friday 00:59 WAT**), the cutoff fires on what customers experience as Friday — a full hour after the promised Thursday deadline, and orders placed in that window are accepted when they should not be.

The **opposite error** is equally dangerous: setting `59 22 * * 3` (Wednesday 22:59 UTC = Wednesday 23:59 WAT) closes the window a full day early.

**Why it happens:**
Cron expressions are authored in the developer's mental model of local time, but Vercel executes them in UTC with no timezone parameter.

**Consequences:** Customers can order past the deadline and expect Saturday delivery that cannot be fulfilled. Or the window closes early, losing valid orders and creating customer complaints.

**Prevention:**
- Document the UTC-to-WAT mapping explicitly in code comments on the cron expression:
  ```
  // Thursday 22:59 UTC = Thursday 23:59 WAT (UTC+1)
  // This closes the ordering window at end of Thursday in Nigeria
  "59 22 * * 4"
  ```
- The `/api/cutoff` route handler must **ignore the cron call and use `ordering_config` as ground truth**. The cron is just a trigger; the DB row (`is_open = false`) is the authoritative state. This means even if the cron fires slightly off, the manual override (`is_open`) still works.
- Never use `new Date()` or `Date.now()` in the cutoff logic to decide whether to close — only write to `ordering_config`. The cutoff route should simply set `is_open = false`.
- Test the full flow in staging with a manual cron trigger before production deployment.

**Warning signs:** `ordering_config.is_open` flips at an unexpected time. Customer complaints about being able to order on Friday.

**Phase:** Week 2 (ordering window logic). Timezone comment is mandatory, not optional.

---

### Pitfall 5: Cutoff State Race Condition — Client Reads Stale `is_open`

**What goes wrong:**
The shop page fetches `ordering_config` at server render time and embeds `is_open: true` in the initial HTML. The cron fires at 22:59 UTC and flips it to `false`. Users who loaded the page before the cutoff still see "Add to Cart" enabled. They add items and try to check out minutes after the cutoff — the checkout page server-checks `is_open` correctly and blocks them, but the UX is confusing: the shop said "open," checkout says "closed."

A worse version: the user loads the page, adds to cart, and submits. Between the cart addition and checkout API call, the cutoff fires. The checkout API must re-validate `is_open` server-side and reject the order — if it doesn't, an order is created that can't be fulfilled.

**Why it happens:**
Static or long-cached server renders embed cutoff state at build/render time. No real-time refresh.

**Consequences:** Confusing UX (cart active but checkout blocked); in worst case, orders accepted past deadline.

**Prevention:**
- Checkout API route (`/api/checkout`) must **always** re-read `ordering_config.is_open` from DB as the final gate before creating the order. Client-side state is presentational only.
- Set `ordering_config` fetch to `no-store` cache so it's fresh on every page load:
  ```typescript
  const config = await supabase.from("ordering_config").select("is_open").single();
  // route.ts: fetch(..., { cache: 'no-store' })
  ```
- Consider a short (60-second) client-side poll or revalidation of cutoff state on the shop page near the known cutoff time.

**Warning signs:** Orders in DB with `created_at` timestamp after `ordering_config.updated_at` (the cutoff flip time).

**Phase:** Week 2 (cutoff enforcement). The API gate is non-negotiable.

---

### Pitfall 6: Zustand + localStorage Persist Causes SSR Hydration Mismatch

**What goes wrong:**
Zustand's `persist` middleware writes cart state to `localStorage`. On the server, `localStorage` doesn't exist. Next.js renders the page with an empty cart. The browser hydrates and rehydrates from `localStorage` — now the server HTML (empty cart) mismatches the client DOM (cart has items). React throws a hydration error, the page breaks, or the cart silently resets.

**Why it happens:**
The `persist` middleware is added to the store and components access `useCartStore()` directly in server-rendered components or in the initial render pass without guarding for the hydration gap.

**Consequences:** Console errors in production, cart count in nav header flickers from 0 to N on every page load, potential full page error boundary triggering.

**Prevention:**

Option A — Hydration gate (simplest, recommended for this project):
```typescript
// In cart components, check hasHydrated before rendering cart-dependent UI
const [hasHydrated, setHasHydrated] = useState(false);
useEffect(() => setHasHydrated(true), []);
if (!hasHydrated) return <CartSkeleton />;
```

Option B — Built into the store using Zustand's `onRehydrateStorage`:
```typescript
// In the store definition
onRehydrateStorage: () => (state) => {
  state?.setHasHydrated(true);
},
```

- Never access `useCartStore` state in Server Components. Cart UI (header count, cart drawer) must be Client Components.
- The cart icon in the nav header is the highest-visibility location for this bug — guard it explicitly.

**Warning signs:** Cart count shows `0` briefly on every navigation before showing correct count. React hydration error in browser console mentioning cart-related components.

**Phase:** Week 1 (cart state setup). Establish the pattern before building any cart UI.

---

### Pitfall 7: Parallel Route `@drawer` Slot Missing `default.tsx` Breaks Hard Refresh

**What goes wrong:**
The product drawer is implemented as a parallel route (`@drawer`) with an intercepting route. Works perfectly during client-side navigation. User shares the product URL or hard-refreshes — the page 404s or renders a blank slot because Next.js cannot recover the `@drawer` slot state on a full page load without a `default.tsx` fallback file.

**Why it happens:**
On hard navigation (direct URL visit or refresh), Next.js has no "previous state" for the slot. It falls back to `default.tsx`. If that file doesn't exist, Next.js renders a 404 for the entire page.

**Consequences:** Any direct link to a product (e.g., sharing a product URL) 404s. The product can only be reached by navigating from the shop page.

**Prevention:**
- Create `app/@drawer/default.tsx` that returns `null` (renders nothing):
  ```typescript
  // app/@drawer/default.tsx
  export default function DrawerDefault() {
    return null;
  }
  ```
- Also create `app/@drawer/(..)products/[id]/page.tsx` as the intercepted route that renders the drawer.
- Create a non-intercepted `app/products/[id]/page.tsx` for direct URL access (can be a full-page product view as fallback).
- Note: intercepting routes do not work inside route groups — keep `@drawer` at the same directory level as the layout that consumes it.

**Warning signs:** Drawer works during navigation but refreshing a product URL returns 404. The `@drawer` directory does not have a `default.tsx` file.

**Phase:** Week 1 (product drawer scaffolding). Must be set up correctly from the start — retrofitting is painful.

---

### Pitfall 8: `SUPABASE_SERVICE_ROLE_KEY` Leaked to Browser Bundle

**What goes wrong:**
The service role key bypasses all RLS policies. If it is assigned to a `NEXT_PUBLIC_` env var, it is embedded in the client-side JavaScript bundle and visible to anyone who opens DevTools. A malicious user can use it to read, write, or delete all data in the database.

**Why it happens:**
Developer copies `.env` patterns carelessly, or uses a single Supabase client for both server and client code.

**Consequences:** Full database compromise. All customer order data, admin credentials, and product data exposed.

**Prevention:**
- `SUPABASE_SERVICE_ROLE_KEY` must only appear in server-side code (Route Handlers, Server Actions, middleware).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the only Supabase key that belongs in client code.
- Create two separate Supabase client factories: `lib/supabase/server.ts` (uses service role) and `lib/supabase/client.ts` (uses anon key). Import the wrong one in the wrong context and TypeScript or a linter should flag the env var mismatch.
- Add `SUPABASE_SERVICE_ROLE_KEY` to a CI secret scan check (e.g., `gitleaks`).

**Warning signs:** `process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` anywhere in the codebase. The service role key visible in browser Network tab or JS source.

**Phase:** Week 1 (infrastructure setup). Establish the two-client pattern before writing any data access code.

---

## Moderate Pitfalls

---

### Pitfall 9: RLS Not Enabled on Orders Table

**What goes wrong:**
The `orders` and `order_items` tables are created without Row Level Security enabled. Since all reads go through server-side Route Handlers using the service role key, this works fine in development. But the anon key (safe to use client-side) can also query Supabase directly — if a user discovers the Supabase URL and anon key (both visible in the browser), they can `SELECT * FROM orders` and read all customer data.

**Prevention:**
- Enable RLS on every table from creation.
- Customer-facing tables (`orders`, `order_items`) should have zero permissive policies for the `anon` role — only the service role (used in Route Handlers) should access them.
- Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` to audit RLS status.

**Phase:** Week 1 (DB schema). Enable RLS in the migration, not as an afterthought.

---

### Pitfall 10: Paystack Inline Popup Blocked or Broken on Low-End Android / Slow Networks

**What goes wrong:**
Paystack Inline JS loads a third-party script and opens a popup/iframe. On a 3G connection (common in Nigerian secondary cities), the popup script takes 5–10 seconds to load. Users tap "Pay" repeatedly, triggering multiple `PaystackPop.newTransaction()` calls. Multiple checkout frames stack. On low-end Android (<2GB RAM) browsers, the popup may not render at all or crash the tab.

**Prevention:**
- Disable the Pay button immediately on first tap and show a loading indicator while the Paystack script initialises.
- Use `@paystack/inline-js` npm package so the script is bundled, not loaded lazily from CDN at payment time.
- Implement a 15-second timeout: if Paystack `onLoad` hasn't fired, surface a fallback message ("Payment window didn't load — tap here to retry") rather than leaving the user staring at a spinner.
- For maximum resilience, offer a redirect-based Paystack checkout as a fallback (redirect to `checkout.paystack.com`) for users where the popup fails.

**Warning signs:** Customer support reports of "I paid but nothing happened." Paystack dashboard shows incomplete transactions (initialized but never completed).

**Phase:** Week 3 (payment integration). Test explicitly on a throttled 3G connection using Chrome DevTools.

---

### Pitfall 11: Kobo/Naira Arithmetic Drift Across the Stack

**What goes wrong:**
Prices are stored as integers in kobo (1 NGN = 100 kobo). Somewhere in the stack, a price is divided by 100 to display as NGN, then multiplied back by 100 to send to Paystack. If a floating point division is involved (e.g., `1250 / 100 * 100 = 1249.9999...`), the amount sent to Paystack is wrong. Paystack will reject amounts that are not whole-number integers.

**Prevention:**
- Keep all arithmetic in kobo (integers) throughout the stack — add, subtract, and multiply in kobo.
- Only divide by 100 at the final display layer, using `toLocaleString` or `Intl.NumberFormat` with `maximumFractionDigits: 2`.
- Never store or pass `price / 100` to any API. The value passed to `PaystackPop.newTransaction({ amount })` must be the raw kobo integer.
- Add a Zod schema that validates `amount` is an integer: `z.number().int().positive()`.

**Warning signs:** Paystack returns `amount is invalid` errors. Displayed prices show recurring decimal values.

**Phase:** Week 1 (data model) and Week 2 (price calculation in cart/checkout).

---

### Pitfall 12: Resend Email Failing Silently on Webhook Path

**What goes wrong:**
The Paystack webhook handler calls Resend to send order confirmation email inline. If Resend is rate-limited, the API key is wrong, or the domain is not verified, the Resend call throws. If this error is not caught, it propagates up and the webhook handler returns `500` instead of `200`. Paystack retries — the order has already been created (idempotency guard catches the second insert), but the email is never sent because the error keeps occurring.

**Prevention:**
- Wrap the Resend call in a try/catch that logs the error but does **not** re-throw it. Email failure must never cause the webhook to return non-200.
- Verify Resend domain DNS records in staging before Week 3.
- Log Resend failures to a persistent error log (Supabase `email_log` table or Vercel log drain) so failures are visible without re-throwing.

**Warning signs:** Paystack keeps retrying a webhook. Orders are being created (idempotency hit) but customers report no confirmation email.

**Phase:** Week 3 (email + payment integration).

---

## Minor Pitfalls

---

### Pitfall 13: `ordering_config` Table Queried Without `LIMIT 1`

**What goes wrong:**
The `ordering_config` is designed as a single-row table. If a migration or admin action accidentally inserts a second row, queries return multiple rows, the `.single()` call in Supabase client throws, and the shop page crashes.

**Prevention:**
- Add a DB constraint ensuring only one row can exist (e.g., a `CHECK (id = 1)` or a partial unique index).
- Use `.maybeSingle()` instead of `.single()` defensively, and treat a missing row as "closed."

**Phase:** Week 1 (DB schema).

---

### Pitfall 14: Next.js Middleware Intercepts Webhook Route

**What goes wrong:**
If a Next.js middleware is added later to protect admin routes or redirect unauthenticated users, it may inadvertently match `/api/webhooks/paystack`. Paystack's POST hits the middleware, gets redirected to a login page, returns HTML instead of 200, and Paystack marks the delivery as failed.

**Prevention:**
- Explicitly exclude `/api/webhooks/*` from middleware matcher:
  ```typescript
  // middleware.ts
  export const config = {
    matcher: ["/((?!api/webhooks).*)"],
  };
  ```

**Phase:** Week 2 (admin auth). Revisit matcher config whenever middleware is added.

---

### Pitfall 15: Framer Motion Causes Layout Shift on Initial Drawer Open

**What goes wrong:**
The product drawer uses Framer Motion for slide-in animation. On first open, if the drawer component is not pre-mounted, there is a flash of the non-animated position before the animation starts. On mobile (lower frame rates), this appears as a jarring jump.

**Prevention:**
- Use `AnimatePresence` with `initial={false}` on the wrapping component to suppress the initial animation on mount.
- Pre-mount the drawer shell (empty, off-screen) so only the content transition animates, not the drawer container itself.

**Phase:** Week 1 (UI structure).

---

## Phase-Specific Warnings

| Phase / Week | Likely Pitfall | Mitigation |
|---|---|---|
| Week 1 — DB schema | RLS not enabled (Pitfall 9) | Enable in migration SQL, not manually |
| Week 1 — DB schema | Single-row `ordering_config` not constrained (Pitfall 13) | Add DB-level constraint in migration |
| Week 1 — Infrastructure | Service role key leaked (Pitfall 8) | Two-client pattern from day one |
| Week 1 — Cart state | Zustand hydration mismatch (Pitfall 6) | `hasHydrated` guard before first cart render |
| Week 1 — Product drawer | `@drawer` slot missing `default.tsx` (Pitfall 7) | Create it alongside the slot folder |
| Week 2 — Cutoff logic | WAT vs UTC cron expression (Pitfall 4) | UTC comment in vercel.json, DB as source of truth |
| Week 2 — Cutoff logic | Stale cutoff state at checkout (Pitfall 5) | Server-side gate in checkout API, always |
| Week 2 — Pricing | Kobo float drift (Pitfall 11) | Integer-only arithmetic, Zod int validation |
| Week 2 — Admin auth | Middleware intercepts webhook (Pitfall 14) | Exclude `/api/webhooks/*` from matcher |
| Week 3 — Payments | Raw body consumed before HMAC (Pitfall 1) | `request.text()` first, always |
| Week 3 — Payments | Duplicate webhook creates double orders (Pitfall 2) | Idempotency check + DB unique constraint |
| Week 3 — Payments | Wrong Paystack keys in production (Pitfall 3) | Startup env assertion, pre-launch checklist |
| Week 3 — Payments | Popup fails on slow network (Pitfall 10) | Disable button, timeout fallback |
| Week 3 — Email | Resend failure cascades to webhook 500 (Pitfall 12) | Catch email errors, never rethrow |

---

## Sources

- Paystack Webhooks documentation: https://paystack.com/docs/payments/webhooks/
- "How to Handle Stripe and Paystack Webhooks in Next.js (The App Router Way)": https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi
- Paystack InlineJS documentation: https://paystack.com/docs/developer-tools/inlinejs/
- Next.js Parallel Routes (slot-missing-default): https://nextjs.org/docs/messages/slot-missing-default
- Next.js Intercepting Routes: https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes
- Next.js Parallel Routes: https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes
- Zustand localStorage hydration (pmndrs discussion): https://github.com/pmndrs/zustand/discussions/1382
- Fixing React hydration errors with Zustand persist: https://medium.com/@judemiracle/fixing-react-hydration-errors-when-using-zustand-persist-with-usesyncexternalstore-b6d7a40f2623
- Vercel Cron Jobs documentation: https://vercel.com/docs/cron-jobs
- Handling timezone issues in cron jobs: https://dev.to/cronmonitor/handling-timezone-issues-in-cron-jobs-2025-guide-52ii
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Webhook idempotency guide: https://hookdeck.com/webhooks/guides/implement-webhook-idempotency
- Next.js App Router raw body for webhooks: https://webhooks.cc/blog/nextjs-app-router-webhook-handler
- 10 Common Mistakes with Next.js + Supabase: https://www.iloveblogs.blog/post/nextjs-supabase-common-mistakes
- Nigeria Payments Report 2025 (Zone Network): https://zonenetwork.com/resources/nigeria-payments-report-2025
