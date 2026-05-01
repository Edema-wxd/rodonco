---
status: partial
phase: 04-admin-panel
source: [04-VERIFICATION.md]
started: 2026-05-01T17:45:00Z
updated: 2026-05-01T17:45:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Admin UI smoke test (end-to-end)
expected: Log in at `/admin`, confirm redirect to `/admin/orders`, navigate to Products/Analytics/Settings from sidebar, and sign out. Sidebar chrome appears only when authenticated; all pages render without runtime errors; sign out returns to `/admin`.
result: [pending]

### 2. Product image upload happy path
expected: Open a product drawer, upload an image, save product, refresh page. Image preview updates immediately; saved product row shows thumbnail; DB `products.image_url` updated.
result: [pending]

### 3. Ordering toggle propagation to customer UI
expected: Toggle ordering CLOSED in admin settings, then load `/shop` drawer and `/checkout`. Customer-side components reflect CLOSED state immediately, without needing cache invalidation.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

