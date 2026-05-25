---
status: partial
phase: 06-automation-launch
source: [06-VERIFICATION.md]
started: 2026-05-04T07:40:00.000Z
updated: 2026-05-04T07:40:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Live Paystack keys wired
expected: NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY starts with pk_live_ and PAYSTACK_SECRET_KEY starts with sk_live_ in Vercel Production environment variables

result: [pending]

### 2. Paystack webhook URL registered
expected: https://<production-domain>/api/paystack/webhook is registered in Paystack Dashboard → Settings → API Keys & Webhooks

result: [pending]

### 3. Vercel Cron job triggerable
expected: After deploying to production, /api/cutoff appears in Vercel Dashboard → Cron Jobs; triggering manually flips ordering_config.is_ordering_open to false in the database

result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
