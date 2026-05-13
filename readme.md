# Rodo & Co

Rodo & Co is a weekly food-prep ordering platform for the Nigerian market.

## End Goal

Deliver a production-ready web platform where:
- customers browse and configure fresh produce/cooking kits,
- checkout as guests and pay in NGN via Paystack,
- receive weekly Saturday deliveries,
- and admins manage products, orders, reminders, and operations from a secure dashboard.

Core value:

> Customers can browse, configure, and pay for weekly food prep orders in one smooth flow — with zero friction between browsing and checkout.

## Current Project Direction

The project is in late-stage MVP completion and operational hardening, with major customer, payment, automation, and route-completeness work already implemented, and remaining admin workflow gaps planned for completion.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS
- Neon Postgres + Drizzle ORM
- NextAuth v5 (admin auth)
- Paystack (payments)
- Resend (emails)
- UploadThing (image uploads)
- Zustand + React Hook Form + Zod

## Quick Start

1. Install dependencies:
   - `npm install`
2. Copy env template:
   - `.env.local.example` → `.env.local`
   - fill all required variables in `.env.local` with real values before running the app
3. Start development server:
   - `npm run dev`

Useful scripts:
- `npm test`
- `npm run build`
- `npm run seed:admin`
- `npm run seed:products`

## Documentation

For a full project review (scope, architecture, data model, setup, deployment, and status), see:

- [`PROJECT-DETAILS.md`](./PROJECT-DETAILS.md)
- [`LAUNCH-CHECKLIST.md`](./LAUNCH-CHECKLIST.md)
- [`.planning/PROJECT.md`](./.planning/PROJECT.md)
- [`.planning/ROADMAP.md`](./.planning/ROADMAP.md)
