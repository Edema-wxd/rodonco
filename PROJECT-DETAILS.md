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
- Paystack payment flow + order confirmation
- Ordering cutoff logic (open Sun–Thu, close after Thursday cutoff)

### Admin Experience
- Secure admin login and route protection
- Orders management (view, filter, status updates, CSV export)
- Product management (CRUD, variants, prep options, image upload)
- Analytics summary (orders, revenue, top products, status mix)
- Operational controls (ordering toggle, reminders, weekly ops tools)

### Platform & Operations
- Automated cutoff via Vercel Cron
- Transactional email notifications through Resend
- Deployment on Vercel with environment validation and security headers
- Seed scripts for admin account and products

## Current Status Snapshot

Based on planning documents in `.planning/`:
- Major phases for foundation, static UI, payments/email, automation, and route completeness are in place.
- Current focus is operational completion of missing admin workflows (Phase 8 planning complete, execution pending).
- The project is in a late-stage MVP hardening/completion phase, not an early prototype phase.

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

Primary tables:
- `products`
- `product_variants`
- `product_prep_options`
- `orders`
- `order_items`
- `ordering_config` (single-row operational control)
- `admins`

This schema supports configurable product options, transactional order capture, and centralized weekly ordering state.

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

## Deployment Notes

- Hosting: Vercel
- Scheduled cutoff: `vercel.json` cron calls `/api/cutoff` at `59 22 * * 4` (Thursday 22:59 UTC; 23:59 WAT)
- Security posture includes secret-only server values, webhook verification, and production env checks.
- Go-live runbook exists in `LAUNCH-CHECKLIST.md`.

## Known Baseline Validation State

At the time of this documentation update:
- `npm test` runs but has pre-existing failures in `src/app/api/orders/init/route.test.ts`
- `npm run build` fails in local environment when production Paystack key validation is not satisfied

These issues were observed before documentation-only changes and are not introduced by this update.
