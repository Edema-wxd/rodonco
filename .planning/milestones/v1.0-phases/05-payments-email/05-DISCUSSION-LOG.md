# Phase 5: Payments + Email - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 05-payments-email
**Areas discussed:** Checkout form layout, Payment cancellation flow, Email content & sender, Order confirmation page, Paystack reference generation

---

## Checkout Form Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Form + cart summary | Left: RHF form. Right: itemised cart summary with total. Standard e-commerce pattern. | ✓ |
| Form only | Single-column form; customer reviewed cart in sidebar already. Simpler layout. | |

**User's choice:** Form + cart summary (two-column)

### Loading state during order init

| Option | Description | Selected |
|--------|-------------|----------|
| Spinner + "Processing..." | Button disables and shows spinner while POST /api/orders/init runs. | ✓ |
| Static label | Button stays as "Pay Now" with no in-flight feedback. | |

**User's choice:** Loading spinner + "Processing..."

### Empty cart handling

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to /shop | Empty cart = nothing to pay. Redirect immediately. | ✓ |
| Show empty state | Render "Your cart is empty" on checkout page with link back to /shop. | |

**User's choice:** Redirect to /shop

---

## Payment Cancellation Flow

### On popup dismissal

| Option | Description | Selected |
|--------|-------------|----------|
| Stay on checkout, show toast | Stay on page, toast: "Payment cancelled — your cart is still saved." | ✓ |
| Stay on checkout, no message | Popup closes silently, form still filled. | |
| Redirect to /cart | Send customer back to cart to review before retrying. | |

**User's choice:** Stay on checkout, show toast

### Form preservation

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve form state | Fields stay filled after cancellation. | ✓ |
| Reset form on cancel | Clear all fields after popup closes. | |

**User's choice:** Preserve form state

### Retry — reuse or new order

| Option | Description | Selected |
|--------|-------------|----------|
| Create new order each retry | Fresh pending order per retry; orphans cleaned up later. | |
| Reuse pending order | Match on customer email + cart contents; reuse if found. | ✓ |

**User's choice:** Reuse pending order (match on customer email + identical cart contents)

---

## Email Content & Sender

### Sender identity

| Option | Description | Selected |
|--------|-------------|----------|
| "Rodo & Co" \<orders@rodoandco.com\> | Branded, domain-verified. Placeholder until client provides production domain. | ✓ |
| "Rodo & Co" \<noreply@rodoandco.com\> | Noreply variant — discourages replies. | |
| You decide | Claude picks sender at implementation time. | |

**User's choice:** "Rodo & Co" \<orders@rodoandco.com\>

### Customer confirmation email depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full receipt | Reference, name, itemised order, address, total, delivery date. | ✓ |
| Minimal receipt | Reference, total, delivery date only. | |
| You decide | Claude picks depth. | |

**User's choice:** Full receipt

### Admin alert email depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full order details | Reference, customer contact, itemised order with prep instructions, address, total. | ✓ |
| Summary only | Reference, customer name, total, link to dashboard. | |
| You decide | Claude decides content. | |

**User's choice:** Full order details

### Email template format

| Option | Description | Selected |
|--------|-------------|----------|
| React Email | @react-email/components — typed, testable, first-class Resend support. | ✓ |
| Plain HTML strings | Template literals. Simpler but harder to maintain. | |
| You decide | Claude picks the approach. | |

**User's choice:** React Email components

---

## Order Confirmation Page

### Cart clearing timing

| Option | Description | Selected |
|--------|-------------|----------|
| On redirect (onSuccess) | Clear cart immediately when Paystack calls onSuccess. | ✓ |
| On page load | Clear cart when /order/[ref] mounts and detects paid order. | |

**User's choice:** Clear on redirect (in Paystack onSuccess callback)

### Page actions

| Option | Description | Selected |
|--------|-------------|----------|
| Display only, link to /shop | Show order details + "Continue shopping". No print/share at MVP. | ✓ |
| Display + copy reference | Include "Copy reference" button. | |
| You decide | Claude picks minimal useful actions. | |

**User's choice:** Display only, link to /shop

---

## Paystack Reference Generation

| Option | Description | Selected |
|--------|-------------|----------|
| We generate it | Server generates RDC-{nanoid}, creates DB order, passes to Paystack init. Our reference is source of truth. | ✓ |
| Paystack generates it | Call Paystack init first, get their reference, then create DB order. | |

**User's choice:** We generate the reference (RDC-{nanoid} format)

---

## Claude's Discretion

- Exact Tailwind styling and responsive breakpoints for the two-column checkout layout
- React Email template visual design (within warm brand palette)
- Exact `nanoid` length / prefix format for the reference
- Whether to use `useTransition` or `useState` for the loading state
- `week_of` derivation from `ordering_config.next_delivery_date`

## Deferred Ideas

- Pending order garbage collection — Phase 6 or future maintenance
- Delivery reminder emails (NOTF-01) — Phase 6
- Vercel Cron cutoff automation (INFRA-01/02) — Phase 6
- WhatsApp notification channel (ADM-01, v2)
