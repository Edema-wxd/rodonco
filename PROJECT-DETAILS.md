# Rodo & Co — Project Details

## Project End Goal

Rodo & Co is a production-ready weekly food-prep ordering platform for the Nigerian market.  
The target outcome is a complete web experience where customers can browse products, configure prep preferences, pay in NGN via Paystack, and receive Saturday deliveries, while admins manage products, orders, reminders, and operations from a secure dashboard.

Core value:

> Customers can browse, configure, and pay for weekly food prep orders in one smooth flow — with zero friction between browsing and checkout.

## Product Scope (Target MVP)

### Customer Experience
- Marketing landing page and shop
- Product configuration drawer (quantity, variants, prep options)
- Persistent cart with subtotal and checkout flow
- Guest checkout (no customer account required)
- Two-step checkout: save draft → server-side price verification → Paystack payment → order confirmation
- Ordering cutoff logic (open Sun–Thu, close after Thursday cutoff)

### Admin Experience
- Secure admin login and route protection
- Orders management (view, filter, status updates, CSV export)
- Product management (CRUD, variants, prep options, image upload)
- Analytics summary (orders, revenue, top products, status mix)
- Abandoned carts view (count badge + delete)
- Operational controls (ordering toggle, delivery fee, contact email, reminders, weekly ops tools)

### Platform & Operations
- Automated cutoff via Vercel Cron (Thursday 22:59 UTC)
- Automated abandoned-cart purge via Vercel Cron (`/api/purge-abandoned`)
- Rate limiting on order-init endpoint via Upstash Redis (fails open when Redis is absent)
- Transactional email notifications through Resend
- Deployment on Vercel with environment validation and security headers
- Seed scripts for admin account and products

## Current Status Snapshot

v1.0 MVP shipped 2026-05-25. All 10 phases complete, 44 plans executed, 69 requirements satisfied.  
Post-v1.0 additions: rate-limited `/api/orders/init`, server-side price authority, delivery fee in order total, two-step checkout flow (draft → init), abandoned cart cleanup cron, and a fully passing test suite (165 passing, 2 todo).

## Architecture

### Frontend
- Next.js App Router (`src/app`)
- React 19 + TypeScript
- Tailwind CSS + component-driven UI
- Zustand for cart state
- React Hook Form + Zod for validation

### Backend
- Next.js Route Handlers under `src/app/api`
- Neon Postgres accessed through Drizzle ORM (`drizzle/schema.ts`)
- NextAuth v5 credential-based admin authentication
- UploadThing for media uploads
- Paystack for payment initialization and webhook confirmation
- Resend for confirmation and admin notification emails

## Data Model (Drizzle)

Primary tables (11 total):
- `products`
- `product_variants`
- `product_prep_options`
- `product_images`
- `orders`
- `order_items`
- `ordering_config` (single-row: cutoff state, next delivery date, delivery fee, contact email)
- `site_settings` (admin-editable site-wide settings)
- `admins`
- `abandoned_carts` (draft orders cleaned up by purge cron)
- `activity_logs` (admin action audit trail)

This schema supports configurable product options, transactional order capture, centralized weekly ordering state, and admin audit logging.

## Repository Structure

- `src/app` — routes, pages, layouts, API handlers
- `src/components` — UI and feature components
- `src/lib` — business/domain helpers (payments, admin, checkout, etc.)
- `src/store` — client state stores
- `drizzle/` — database schema and migration config support
- `scripts/` — seed scripts and utilities
- `.planning/` — roadmap, requirements, phase plans, and project state docs

## Local Development

### Scripts
- `npm run dev` — start local Next.js dev server
- `npm test` — run Vitest suite
- `npm run build` — production build
- `npm run seed:admin` — seed admin credentials
- `npm run seed:products` — seed product data

### Environment Variables
Use `.env.local.example` as the source template. Required groups include:
- Neon DB (`DATABASE_URL`, `DIRECT_DATABASE_URL`)
- NextAuth (`AUTH_SECRET`)
- UploadThing (`UPLOADTHING_TOKEN`)
- Paystack (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`)
- Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`)
- Cron security (`CRON_SECRET`)
- App URL (`NEXT_PUBLIC_APP_URL`)
- Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) — optional; enables rate limiting on `/api/orders/init`; omitting causes the rate limiter to fail open (requests pass through)

## Deployment Notes

- Hosting: Vercel
- Scheduled cutoff: `vercel.json` cron calls `/api/cutoff` at `59 22 * * 4` (Thursday 22:59 UTC; 23:59 WAT)
- Security posture includes secret-only server values, webhook verification, and production env checks.
- Go-live runbook exists in `LAUNCH-CHECKLIST.md`.

## Known Baseline Validation State

As of v1.0 post-ship:
- `npm test` — 165 passing, 2 todo (no failures)
- `npm run build` — passes; requires production env vars (`PAYSTACK_SECRET_KEY`, etc.) to be present for `validateEnv` to succeed
