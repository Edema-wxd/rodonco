---
status: partial
phase: 05-payments-email
source: [05-VERIFICATION.md]
started: 2026-05-03T15:38:00Z
updated: 2026-05-03T15:38:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-end Paystack test payment
expected: With Paystack test keys set, complete checkout and confirm Paystack popup opens, test card payment succeeds, webhook marks order `paid`, emails send (customer + admin), redirect to `/order/[ref]`, and cart clears.
result: [pending]

### 2. Paystack popup cancel flow
expected: Closing the Paystack popup shows toast \"Payment cancelled — your cart is still saved.\", keeps form fields filled, re-enables Pay Now, and leaves cart unchanged.
result: [pending]

### 3. Email deliverability and content
expected: After successful payment, customer receives HTML receipt with reference/items/delivery date; admin receives alert with customer contact + full order.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

