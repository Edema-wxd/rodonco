---
status: partial
phase: 08-missing-admin-structures
source: [08-VERIFICATION.md]
started: 2026-05-15T12:00:00.000Z
updated: 2026-05-15T12:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Prep list renders aggregate data
expected: Navigate to /admin/prep-list, select a week that has paid/processing orders; grouped table renders with product_name + variant_label + prep_option columns and summed quantities
result: [pending]

### 2. Analytics week picker updates page
expected: Select a past date on /admin/analytics; URL ?week= param updates and metrics cards change to reflect that week's data
result: [pending]

### 3. Orders search real-time filter
expected: On /admin/orders, type a customer name fragment in the search box; table narrows to matching rows without page reload
result: [pending]

### 4. Manifest print layout
expected: On /admin/manifest, click "Print Manifest"; browser print preview shows only order cards — sidebar and nav are absent
result: [pending]

### 5. Settings delivery config save
expected: On /admin/settings, save next_delivery_date and cutoff_message; the customer banner on /shop reflects the new values
result: [pending]

### 6. Pending orders sidebar badge
expected: With pending orders in the DB, AdminSidebar shows a numeric badge on "Pending Orders" nav item; badge is absent (not 0) when there are none
result: [pending]

### 7. Bulk transition confirm + toast
expected: On /admin/prep-list, click "Paid → Processing"; a confirm dialog appears; on confirm a success toast fires and the prep list refreshes
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
