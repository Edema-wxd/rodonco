---
status: partial
phase: 03-interactive-shop
source: [03-VERIFICATION.md]
started: 2026-05-01T00:00:00Z
updated: 2026-05-01T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Drawer overlay UX end-to-end
expected: From `/shop`, clicking a product opens `/shop/[id]` as an overlay; backdrop/X/swipe-down closes; browser back closes to `/shop` while preserving scroll position
result: [pending]

### 2. Add-to-cart + cart sidebar behavior
expected: Add-to-cart closes drawer, cart badge updates, cart sidebar auto-opens only on first add, navbar cart button opens sidebar from any route thereafter
result: [pending]

### 3. Ordering closed enforcement
expected: When `ordering_config.is_ordering_open=false`: sticky banner shows on shop/drawer/cart; add-to-cart is disabled; cart quantity/remove controls are disabled; `/checkout` is blocked with ordering-closed message
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
