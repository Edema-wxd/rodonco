# Phase 2: Static Shop UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 02-static-shop-ui
**Areas discussed:** Landing page direction, Product card design, Shop grid layout, Cutoff banner treatment

---

## Landing page direction

| Option | Description | Selected |
|--------|-------------|----------|
| Light / white background | Clean, food-forward look. Works well with placeholder and real photography | ✓ |
| Dark / deep green or black background | Richer, premium feel | |
| Full-bleed food photography | Dramatic but placeholder-heavy | |

**User's choice:** Light / white background

| Option | Description | Selected |
|--------|-------------|----------|
| Browse → Customise → Deliver | Straightforward 3-step flow, placeholder-friendly | ✓ |
| Order → Prep → Enjoy | Outcome-focused, shorter copy | |
| You decide the steps | User provides text | |

**User's choice:** Browse → Customise → Deliver

| Option | Description | Selected |
|--------|-------------|----------|
| Solid black | High contrast on white hero | |
| Solid brand colour | Bolder — placeholder until moodboard arrives | ✓ |
| Large outline button | Softer look | |

**User's choice:** Solid brand colour (placeholder `#16a34a` green until moodboard arrives)

---

## Product card design

| Option | Description | Selected |
|--------|-------------|----------|
| Square / 1:1 | Clean grid alignment | |
| 4:3 landscape | Good for styled food photography | ✓ |
| 3:4 portrait | Taller card, similar to Chowdeck | |

**User's choice:** 4:3 landscape

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle shadow + rounded corners | Lifted card feel, consistent with Hello Fresh | ✓ |
| Thin border, no shadow | Flatter, more minimal | |
| No border, no shadow | Very minimal | |

**User's choice:** Subtle shadow + rounded corners

| Option | Description | Selected |
|--------|-------------|----------|
| From ₦X,XXX | Shows starting price, sets expectations for variable pricing | ✓ |
| ₦X,XXX — no 'From' prefix | Cleaner but may confuse | |
| ₦X,XXX – ₦Y,YYY range | More transparent but complex | |

**User's choice:** From ₦X,XXX (lowest variant price ÷ 100)

| Option | Description | Selected |
|--------|-------------|----------|
| Solid black, full-width | High visibility, consistent with hero CTA | ✓ |
| Outline button, full-width | Softer | |
| Small pill button, bottom-right | Compact cards | |

**User's choice:** Solid black, full-width below card content

---

## Shop grid layout

| Option | Description | Selected |
|--------|-------------|----------|
| 3 columns desktop | Standard for food platforms | ✓ |
| 4 columns desktop | Denser | |
| 2 columns desktop | Spacious, magazine-style | |

**User's choice:** 3 columns on desktop

| Option | Description | Selected |
|--------|-------------|----------|
| Bold heading + subtle divider line | Clean typography-first | ✓ |
| Coloured badge / pill label | More visual hierarchy | |
| Large full-width section banner | Dramatic but heavier | |

**User's choice:** Bold heading + subtle divider line

| Option | Description | Selected |
|--------|-------------|----------|
| 2 columns on mobile | Standard for food apps | ✓ |
| 1 column on mobile | Full-width, more scrolling | |
| 2 col sm / 3 col md / 4 col lg | Maximum density | |

**User's choice:** 2 columns on mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Hide the section entirely | Clean, no noise | |
| Show section with 'No products available' message | Transparent | ✓ |
| You decide | Leave to Claude | |

**User's choice:** Show section with "No products available" message

---

## Cutoff banner treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Amber / warning | Informational, attention-grabbing, not alarming | ✓ |
| Red / alert | Urgent, may feel heavy-handed | |
| Neutral / light grey | Minimal, easy to miss | |

**User's choice:** Amber / warning

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky — stays visible while scrolling | Customer always aware ordering is closed | ✓ |
| Static — only visible at top | Less intrusive | |

**User's choice:** Sticky

| Option | Description | Selected |
|--------|-------------|----------|
| "Ordering is closed. Next delivery: Saturday, 3 May" | Human-readable date format | ✓ |
| "Orders open again Sunday — next delivery 3 May" | Reopening-focused | |
| You decide the copy | Leave to Claude | |

**User's choice:** "Ordering is closed. Next delivery: Saturday, 3 May"

---

## Claude's Discretion

- Exact hero headline and subheadline copy (placeholder; client to provide real copy)
- Specific Lucide icon choices for How It Works steps
- Precise spacing, padding, and typography scale
- Whether to extract ProductCard and CutoffBanner as separate component files vs inline
- How to handle `image_url: null` on Product (default placeholder image)

## Deferred Ideas

None — discussion stayed within phase scope.
