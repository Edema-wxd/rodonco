# Phase 4: Admin Panel - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 4-admin-panel
**Areas discussed:** Nav structure, Login page UX, Orders table behaviour, Product CRUD flow

---

## Nav Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar | Persistent left sidebar with Orders, Products, Analytics, Settings | ✓ |
| Top tabs | Horizontal tab bar below the header | |
| Minimal — single page | Everything on one scrollable page | |

**User's choice:** Sidebar

| Option | Description | Selected |
|--------|-------------|----------|
| Orders + Products + Analytics | Three core sections; ordering toggle on Analytics | |
| Orders + Products + Analytics + Settings | Separate Settings page for ordering toggle and future config | ✓ |
| Dashboard + Orders + Products | Dedicated dashboard landing, analytics embedded | |

**User's choice:** Orders + Products + Analytics + Settings (ordering toggle goes on Settings)

---

## Login Page UX

| Option | Description | Selected |
|--------|-------------|----------|
| Centered card, minimal | White card on bg-gray-50, email + password + Sign In button | ✓ |
| Full-width branded | Split-screen or hero with brand feel | |
| Inline on /admin page | Form shows on /admin when unauthenticated, swaps to dashboard when authed | |

**User's choice:** Centered card, minimal

| Option | Description | Selected |
|--------|-------------|----------|
| /admin/orders | Go straight to orders after login | ✓ |
| /admin/analytics | Land on dashboard overview | |
| Same page (no redirect) | NextAuth redirects back to triggering page | |

**User's choice:** Redirect to /admin/orders after login

---

## Orders Table Behaviour

| Option | Description | Selected |
|--------|-------------|----------|
| Inline expandable row | Click to expand in-place, shows items + prep instructions + notes | ✓ |
| Side drawer | Right-side drawer with full order details | |
| Modal | Centered dialog with order details | |

**User's choice:** Inline expandable row

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown in the row | Select directly in Status column, fires PATCH immediately | ✓ |
| Dropdown inside expanded row | Status change only accessible after expanding | |
| Bulk select + apply | Checkboxes + bulk status button | |

**User's choice:** Dropdown in the row (inline status update)

---

## Product CRUD Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Right-side drawer | Drawer for create/edit; table stays visible behind it | ✓ |
| Separate /admin/products/[id] page | Full-page form per product | |
| Inline editing | Edit in-row with modal for variants/prep options | |

**User's choice:** Right-side drawer

| Option | Description | Selected |
|--------|-------------|----------|
| Inline lists with add/remove | Editable lists in drawer, saved atomically on submit | ✓ |
| Save variants separately | Separate Save buttons per section, immediate API calls | |
| Step-by-step wizard | Multi-step form: details → variants → prep options | |

**User's choice:** Inline lists with add/remove, saved atomically

---

## Claude's Discretion

- Shadcn/ui component selection
- Exact Tailwind styling within the neutral admin aesthetic
- Pagination approach for orders table
- Route Handler colocation (`app/api/admin/`)
- Analytics data fetching strategy (Server Component direct DB query)

## Deferred Ideas

- Delivery reminder email trigger (Phase 6 scope)
- WhatsApp notifications (v2)
- Bulk order status update (v2)
- Admin configurable cutoff time (v2)
