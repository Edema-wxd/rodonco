# Phase 3: Interactive Shop - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `03-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-29  
**Phase:** 03-interactive-shop  
**Areas discussed:** Product drawer UX, Configuration rules, Pricing & quantity, Cart sidebar behavior, Ordering window enforcement

---

## Product drawer UX

| Option | Description | Selected |
|--------|-------------|----------|
| A | Overlay drawer on `/shop`, URL `/shop/[slug]`, refresh keeps grid behind drawer | ✓ |
| B | Desktop overlay, mobile full-screen (still `/shop/[slug]`) | |
| C | Refresh `/shop/[slug]` shows dedicated product page | |

**Close controls selected:** backdrop tap ✓, X button ✓, swipe-down (mobile) ✓  
**Back button behavior:** close drawer → `/shop` (preserve scroll) ✓  
**After Add to cart:** close drawer ✓

---

## Configuration rules (variants / size / prep)

| Option | Description | Selected |
|--------|-------------|----------|
| A | Variant required if exists; prep optional | |
| B | Variant required and prep required (when both exist) | |
| C | Choose whatever exists; if none, quantity-only | ✓ |

**Mechanics by product type:** C — kits = size-only; produce = prep-only ✓  
**Defaults:** B — no preselect; explicit selection required ✓

---

## Live pricing & quantity UX

**Price display:**
| Option | Description | Selected |
|--------|-------------|----------|
| A | Unit price + qty stepper + subtotal | |
| B | Subtotal only | ✓ |
| C | Unit price only | |

**Quantity bounds:**
| Option | Description | Selected |
|--------|-------------|----------|
| A | Min 1, max 20 | |
| B | Min 1, max 50 | |
| C | Min 1, no max; soft warning after 20 | ✓ |

---

## Cart sidebar behavior

**When to open:**
| Option | Description | Selected |
|--------|-------------|----------|
| A | Only when clicking cart icon | |
| B | Auto-open after first add only; otherwise manual | ✓ |
| C | Auto-open after every add | |

**Grouping:**
| Option | Description | Selected |
|--------|-------------|----------|
| A | Merge identical items (product + variant/size + prep) | ✓ |
| B | Never merge (every add is new line item) | |

---

## Ordering window enforcement

**Closed behavior:**
| Option | Description | Selected |
|--------|-------------|----------|
| A | Disable add-to-cart + disable cart qty edits; block `/checkout` | ✓ |
| B | Allow add-to-cart; block checkout only | |
| C | Allow all; banner only | |

**Message placement:**
| Option | Description | Selected |
|--------|-------------|----------|
| 1 | Sticky banner on shop + drawer + cart | ✓ |
| 2 | Only on shop | |
| 3 | Only on checkout and cart | |

---

## Claude's Discretion
- Visual layout details, copy, and styling within the locked behaviors above.

