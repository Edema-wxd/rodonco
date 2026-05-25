---
phase: 5
slug: payments-email
status: approved
shadcn_initialized: true
preset: base-nova
created: 2026-05-02
---

# Phase 5 — UI Design Contract

> Visual and interaction contract for the checkout form, payment flow, and order confirmation page. Generated from existing design system (globals.css, components.json) and CONTEXT.md decisions.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui (base-nova style) |
| Preset | base-nova |
| Component library | Radix UI (via shadcn) |
| Icon library | Lucide (`lucide-react`) |
| Font — body | DM Sans (`--font-sans`) |
| Font — headings | DM Serif Display (`--font-heading`) |

---

## Color

Tokens from `globals.css` — do not introduce new hex values. Use CSS custom properties only.

| Role | Token | Value (light) | Usage |
|------|-------|---------------|-------|
| Dominant (60%) | `--background` | `oklch(0.967 0.014 82)` — warm ivory | Page background, form surface |
| Surface | `--card` | `oklch(0.993 0.006 80)` | Cart summary sidebar card, confirmation card |
| Secondary (30%) | `--secondary` | `oklch(0.91 0.022 78)` — warm sand | Input backgrounds, section dividers |
| Primary action | `--primary` | `oklch(0.40 0.115 152)` — forest green | Pay Now button, confirm CTA, focus ring |
| Accent (10%) | `--accent` | `oklch(0.62 0.135 35)` — terracotta | Order reference badge, price highlights, section label accents |
| Muted text | `--muted-foreground` | `oklch(0.52 0.018 72)` | Helper text, field descriptions, subtotals |
| Destructive | `--destructive` | `oklch(0.577 0.245 27.325)` | Form validation errors, error state page |
| Border | `--border` | `oklch(0.875 0.022 76)` | Form field borders, card borders |

Accent reserved for: order reference badge, item price/subtotal labels, next delivery date callout, terracotta section headings. Never use accent for interactive buttons.

---

## Spacing Scale

All values are multiples of 4px. Use Tailwind spacing utilities (`p-4` = 16px, `gap-6` = 24px, etc.).

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px (`gap-1`, `p-1`) | Icon–label gaps, checkbox–text gaps |
| sm | 8px (`gap-2`, `p-2`) | Compact form field internals |
| md | 16px (`gap-4`, `p-4`) | Default element spacing, form row gap |
| lg | 24px (`gap-6`, `p-6`) | Card padding, section padding |
| xl | 32px (`gap-8`, `p-8`) | Desktop column gap (form ↔ cart summary) |
| 2xl | 48px (`gap-12`, `py-12`) | Page vertical padding (desktop) |
| 3xl | 64px | Not used in this phase |

Exceptions: none

---

## Typography

4 sizes max, 2 weights max.

| Role | Size | Weight | Line Height | Font | Usage |
|------|------|--------|-------------|------|-------|
| Caption | 12px (`text-xs`) | 400 | 1.4 | DM Sans | Price breakdowns, muted helper text |
| Label | 14px (`text-sm`) | 400 | 1.4 | DM Sans | Form field labels, helper text, item names in cart |
| Body / Section | 16px (`text-base`) | 400 normal / 600 semibold | 1.5 | DM Sans | Body copy, input text; `font-semibold` for section headings ("Your Order", cart heading), total amount label |
| Heading | 24px (`text-2xl`) | 400 | 1.2 | DM Serif Display | Page heading ("Checkout", "Order Confirmed"), order total amount |

Weights used: `400` (body, labels, captions, display headings) and `600` (section headings, total labels). No 500, no 700.

---

## Layout Contracts

### Checkout Page (`/checkout`)

**Desktop (≥ `lg`, 1024px):** Two-column grid — left column is the RHF form (≈ 60% width), right column is the cart order summary (≈ 40% width, sticky top). Gap: `xl` (32px).

**Mobile (< `lg`):** Single column, form first, cart summary below (collapsed/scrollable).

```
Desktop:
┌──────────────────────────┬─────────────────┐
│  Checkout Form           │  Order Summary  │
│  - Name                  │  - Item list    │
│  - Phone                 │  - Subtotals    │
│  - Email                 │  - Total NGN    │
│  - Delivery address      │                 │
│  - Allergy notes         │                 │
│  - Terms checkbox        │                 │
│  [Pay Now]               │                 │
└──────────────────────────┴─────────────────┘
```

**Form field order (left column):**
1. Full Name — `Input` component
2. Phone (Nigerian) — `Input` with placeholder `+234 XXX XXX XXXX`
3. Email address — `Input` type email
4. Delivery address — `Textarea` (2–3 rows)
5. Allergy / dietary notes — `Textarea` optional, placeholder "Any allergies or prep notes?"
6. Terms checkbox — `Checkbox` + label linking to terms; required

**"Pay Now" button:**
- `Button` with `variant="default"` (forest green primary)
- Full width in mobile, full width of form column on desktop
- Loading state: `disabled` + Lucide `Loader2` spinner (`animate-spin`) + "Processing..." text
- Normal state: "Pay Now →" (arrow suffix for directional clarity)

**Empty cart guard:** If cart is empty on load, redirect to `/shop` immediately (no flash of checkout UI).

**Closed ordering state:** If `is_ordering_open = false`, render only the `OrderingClosedBanner` component — no form rendered, no cart summary.

### Cart Order Summary Sidebar (right column / below on mobile)

- `Card` component with `lg` padding
- Heading: "Your Order" — `text-lg font-semibold`
- Item list: each row is `flex justify-between` — product name + qty + variant on left, subtotal on right
- Prep option shown as `text-xs text-muted-foreground` below item name
- Divider (`border-t`) before total row
- Total row: `text-2xl font-semibold` — "Total: ₦X,XXX"
- Bottom note: `text-xs text-muted-foreground` — "Free delivery every Saturday"

### Payment Cancellation Toast

- Use shadcn `toast` / `sonner` (whichever is installed — check existing usage)
- Variant: default (not destructive)
- Message: "Payment cancelled — your cart is still saved."
- Form fields remain filled; no visual change to form

### Order Confirmation Page (`/order/[ref]`)

Single-column, centred, max-width `max-w-2xl mx-auto`:

```
┌────────────────────────────────────────┐
│  ✓  Order Confirmed                    │  ← DM Serif Display h1, terracotta ✓ icon
│  Ref: RDC-a3f8kq2p1x                  │  ← accent badge
├────────────────────────────────────────┤
│  Delivery to: [address]                │
│  Saturday, [next delivery date]        │
├────────────────────────────────────────┤
│  Your Order                            │
│  Item · qty · variant     ₦X,XXX      │
│  Item · qty               ₦X,XXX      │
│  ─────────────────────────────────     │
│  Total                    ₦XX,XXX     │
├────────────────────────────────────────┤
│  [Continue Shopping →]                 │  ← Button variant="outline"
└────────────────────────────────────────┘
```

**Error state** (ref not found or status ≠ paid):
- Heading: "Order not found" — `text-2xl font-heading`
- Body: "We couldn't find this order. It may still be processing — if you completed payment, please contact us."
- CTA: "Contact Support" (link) + "Back to Shop" (outline button)
- Do NOT render the full order card; error state replaces it entirely

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Page title — checkout | "Checkout" |
| Page title — confirmation | "Order Confirmed" |
| Pay Now CTA (normal) | "Pay Now →" |
| Pay Now CTA (loading) | "Processing..." |
| Pay Now CTA (ordering closed) | — (button not rendered) |
| Cancellation toast | "Payment cancelled — your cart is still saved." |
| Cart summary heading | "Your Order" |
| Cart delivery note | "Free delivery every Saturday" |
| Confirmation ref label | "Order Reference" |
| Confirmation delivery label | "Delivery Date" |
| Confirmation address label | "Delivering to" |
| Continue shopping CTA | "Continue Shopping →" |
| Error heading — not found | "Order not found" |
| Error heading — not paid | "Payment not confirmed" |
| Error body — not found | "We couldn't find this order. If you completed payment, please contact us." |
| Error body — not paid | "Your payment is still being processed. Check your email or contact us if this persists." |
| Error CTA | "Back to Shop" |
| Empty state — cart redirect | (no UI, instant redirect to /shop) |
| Terms checkbox label | "I agree to the terms and conditions" |
| Phone placeholder | "+234 XXX XXX XXXX" |
| Allergy notes placeholder | "Any allergies or special prep instructions?" |

---

## React Email Templates

React Email templates live in `src/lib/email/templates/`. They are **not web UI** — they use `@react-email/components` primitives, not Tailwind or shadcn. However, they must mirror the brand palette.

### Email Color Palette (inline styles — React Email)

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#f7f5f0` | Email body background (approximates warm ivory) |
| Surface | `#fefcf8` | Content card/section background |
| Primary text | `#2a2218` | Body text, headings |
| Forest green | `#2d6a42` | Section headings, total amount label |
| Terracotta | `#b85c38` | Order reference, price accents |
| Muted text | `#7a7060` | Helper text, item details |
| Border | `#ddd8cc` | Dividers, card borders |

### Customer Confirmation Email

Structure:
1. Header: Rodo & Co logo / brand name (terracotta), tagline
2. "Your order is confirmed!" heading (forest green)
3. Order reference block (terracotta badge / bold)
4. Itemised order table: product name, qty, variant, prep option, subtotal per item
5. Total row (bold, forest green)
6. Delivery address block
7. Next Saturday delivery date callout
8. Footer: contact email, unsubscribe note

### Admin New-Order Alert Email

Structure:
1. Subject: `[NEW ORDER] RDC-XXXXXXXXXX — ₦XX,XXX`
2. Customer block: name, phone, email
3. Itemised order with prep instructions (important for kitchen)
4. Delivery address
5. Total NGN
6. Order reference + timestamp
7. No footer/unsubscribe (internal email)

---

## Shadcn Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `Button` | shadcn official | Pay Now, Continue Shopping, error CTAs |
| `Input` | shadcn official | Name, phone, email fields |
| `Textarea` | shadcn official | Address, allergy notes |
| `Card`, `CardContent`, `CardHeader` | shadcn official | Cart summary sidebar, confirmation card |
| `Badge` | shadcn official | Order reference pill (accent variant) |
| `Checkbox` | shadcn official | Terms agreement |
| `Loader2` | Lucide (lucide-react) | Pay Now loading spinner |
| `CheckCircle` | Lucide | Order confirmed success icon |
| `AlertCircle` | Lucide | Error state icon |
| Toast / Sonner | shadcn official | Payment cancellation notification |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Button, Input, Textarea, Card, Badge, Checkbox, Toast | not required |
| @react-email/components | Html, Head, Body, Container, Section, Row, Column, Text, Link, Hr, Preview | not required — React Email is a separate renderer, not a shadcn registry |
| @paystack/inline-js | PaystackPop | not required — npm package, no UI registry |

No third-party shadcn registry blocks are used in this phase.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-02
