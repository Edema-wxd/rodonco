# Rodo & Co — Go-Live Checklist

Complete every step in order before switching DNS to the production domain.

---

## 1. Paystack Live Keys

- [ ] Obtain live keys from Paystack Dashboard → Settings → API Keys & Webhooks
- [ ] Add `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...` to Vercel environment variables (Production)
- [ ] Add `PAYSTACK_SECRET_KEY=sk_live_...` to Vercel environment variables (Production)
- [ ] Run `vercel env pull` and confirm `.env.local` has the live keys locally for final smoke test

## 2. Paystack Webhook Registration

- [ ] Go to Paystack Dashboard → Settings → API Keys & Webhooks
- [ ] Set webhook URL to: `https://<your-production-domain>/api/paystack/webhook`
- [ ] Save and note the webhook secret (if provided separately from the secret key)
- [ ] Update `PAYSTACK_WEBHOOK_SECRET` in Vercel environment variables to match

## 3. Vercel Environment Variables (Complete List)

Verify all of the following are set in Vercel Production environment:

- [ ] `AUTH_SECRET` — NextAuth v5 session secret (generate: `openssl rand -base64 32`)
- [ ] `CRON_SECRET` — Secret for Vercel Cron to call /api/cutoff (generate: `openssl rand -base64 32`)
- [ ] `DATABASE_URL` — Neon pooled connection string
- [ ] `DIRECT_DATABASE_URL` — Neon direct connection string (for migrations)
- [ ] `RESEND_API_KEY` — From Resend Dashboard → API Keys
- [ ] `RESEND_FROM_EMAIL` — Verified sender email (e.g., orders@rodoandco.com)
- [ ] `ADMIN_NOTIFICATION_EMAIL` — Email that receives new order alerts
- [ ] `UPLOADTHING_TOKEN` — From UploadThing Dashboard
- [ ] `NEXT_PUBLIC_APP_URL` — Production URL (e.g., https://rodoandco.com)
- [ ] `UPSTASH_REDIS_REST_URL` — (Optional) Upstash Redis REST URL; enables rate limiting on `/api/orders/init`
- [ ] `UPSTASH_REDIS_REST_TOKEN` — (Optional) Upstash Redis REST token; required when above URL is set

## 4. Vercel Cron Verification

- [ ] Deploy to production with `vercel.json` in place
- [ ] Confirm cron job appears in Vercel Dashboard → Project → Cron Jobs (should show `/api/cutoff` at `59 22 * * 4`)
- [ ] Confirm purge cron appears in Vercel Dashboard → Project → Cron Jobs (should show `/api/purge-abandoned` on its configured schedule)
- [ ] **Note on plan tier:** If on Vercel Hobby plan, cron fires within the 22:xx UTC hour (not exactly 22:59). On Pro plan, fires within the specified minute. Verify ordering closes by 23:00 WAT on Thursday.
- [ ] Trigger a manual cron run from Vercel Dashboard to confirm `/api/cutoff` returns 200
- [ ] Trigger a manual cron run for `/api/purge-abandoned` and confirm it returns 200

## 5. Admin Seeding

- [ ] Run `npx tsx scripts/seed-admin.ts` against production DB (or run it in a Vercel one-off function)
- [ ] Confirm you can log in at `https://<domain>/admin` with the seeded credentials
- [ ] Change admin password after first login

## 6. Email Smoke Test

- [ ] Place a test order end-to-end: fill checkout form → complete Paystack payment → confirm order in DB
- [ ] Verify customer order confirmation email arrives
- [ ] Verify admin new-order alert email arrives
- [ ] From /admin/settings, select next Saturday, click "Send Reminders", verify 1 email arrives

## 7. Ordering Config

- [ ] Confirm `ordering_config` row 1 has `is_ordering_open = true` in production DB
- [ ] Set correct `next_delivery_date` for the first live Saturday delivery

## 8. Pre-Launch Security Check

- [ ] Open browser devtools on production site → Console tab → no CSP violation errors
- [ ] Open browser devtools → Network tab → inspect any response header for `X-Frame-Options: DENY`
- [ ] Verify `X-Content-Type-Options: nosniff` header is present on responses
- [ ] Run Paystack checkout on production — confirm popup loads without console errors

## 9. Post-Launch CSP Tightening (Future)

The CSP shipped at launch uses `'unsafe-inline'` and `'unsafe-eval'` in script-src because Next.js 15 App Router injects inline scripts. To tighten post-launch:
- Implement nonce-based CSP via Next.js middleware (see https://nextjs.org/docs/app/guides/content-security-policy)
- Remove `'unsafe-inline'` and `'unsafe-eval'` once nonce is in place

---

*Last updated: 2026-05-26 (post v1.0 ship — added Upstash Redis vars and purge-abandoned cron step)*
