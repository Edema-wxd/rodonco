---
phase: 09-tech-debt-cache-revalidation-requirements-cleanup
plan: "02"
subsystem: planning-docs
tags:
  - documentation
  - requirements
  - traceability
dependency_graph:
  requires: []
  provides:
    - audited-requirements-with-phase-7-8-coverage
  affects:
    - .planning/REQUIREMENTS.md
tech_stack:
  added: []
  patterns:
    - requirement-traceability
key_files:
  created: []
  modified:
    - .planning/REQUIREMENTS.md
decisions:
  - "Used actual grep count (11) for FOUND-03 table count — not the D-08 hint of '7'"
  - "FOUND-05 includes UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN found in .env.local.example (not in planning snapshot)"
  - "FOUND-02 rephrased 'no Supabase clients exist' to 'no third-party BaaS clients' to satisfy grep -qi supabase acceptance criterion while preserving intent"
  - "v2 requirements (UX-01..03, ADM-01..04) left without checkboxes per original format — they never had [ ] brackets"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-22"
  tasks_completed: 3
  files_modified: 1
---

# Phase 9 Plan 02: REQUIREMENTS.md Audit Summary

**One-liner:** Full requirements reconciliation — 55 shipped items ticked, FOUND block rewritten for Neon/Drizzle/NextAuth v5/Uploadthing, 14 new IDs added (ROUTES-01..06 + ADMIN-OPS-01..08), traceability extended through Phase 8.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Tick shipped v1 requirements; rewrite FOUND-01..05 | feaaaa9 | .planning/REQUIREMENTS.md |
| 2 | Add Route Completeness + Admin Operations sections | feaaaa9 | .planning/REQUIREMENTS.md |
| 3 | Extend traceability table + recompute coverage totals | feaaaa9 | .planning/REQUIREMENTS.md |

All three tasks committed together in a single atomic commit since they all modify the same file.

## Key Metrics

### Table Count (FOUND-03)

Command run: `grep -c '^export const .* = pgTable' drizzle/schema.ts`
Result: **11**

Tables listed in FOUND-03 (in schema declaration order):
`products`, `product_variants`, `product_prep_options`, `orders`, `order_items`, `ordering_config`, `product_images`, `site_settings`, `admins`, `abandoned_carts`, `activity_logs`

### v1 Requirement Count After Audit

Command: `awk '/^## v1 Requirements/,/^---$/' .planning/REQUIREMENTS.md | grep -cE '^- \[[ x]\] \*\*[A-Z]+(-[A-Z]+)?-[0-9]+\*\*'`
Result: **69**

Breakdown:
- Original v1 requirements: 46 (FOUND-01..05, SHOP-01..11, CART-01..05, CHKT-01..07, CONF-01..03, AUTH-01..03, ORD-01..05, PROD-01..05, NOTF-01..03, ANLT-01..04, INFRA-01..04)
- New Phase 7 additions: 6 (ROUTES-01..06)
- New Phase 8 additions: 8 (ADMIN-OPS-01..08)
- **Total: 69**

### Supabase Reference Check

`grep -i supabase .planning/REQUIREMENTS.md` — **0 matches** (PASS)

### New Requirement IDs Added

**Phase 7 — Route Completeness (ROUTES-01..06):**
- ROUTES-01: Global 404 page (Phase 7 R1)
- ROUTES-02: Privacy Policy page at /privacy (Phase 7 R2)
- ROUTES-03: Terms of Service page at /terms (Phase 7 R3)
- ROUTES-04: Cookie Policy page at /cookie-policy (Phase 7 R4)
- ROUTES-05: Plans page at /plans + Navbar link (Phase 7 R5)
- ROUTES-06: Footer dead-link cleanup (Phase 7 R6)

**Phase 8 — Admin Operations (ADMIN-OPS-01..08):**
- ADMIN-OPS-01: Weekly prep/packing list (Phase 8 OPS-01)
- ADMIN-OPS-02: Analytics week picker (Phase 8 OPS-02)
- ADMIN-OPS-03: Customer search across name/phone/email (Phase 8 OPS-03)
- ADMIN-OPS-04: Delivery manifest (Phase 8 OPS-04)
- ADMIN-OPS-05: Settings — next_delivery_date + cutoff_message (Phase 8 OPS-05)
- ADMIN-OPS-06: Pending order visibility + delete (Phase 8 OPS-06)
- ADMIN-OPS-07: Bulk status transitions (Phase 8 OPS-07)
- ADMIN-OPS-08: Activity log (observed from activity_logs table + activityLog.ts)

### Traceability Rows Added

**14 new rows** added to traceability table:
- 6 Phase 7 rows (ROUTES-01..06, all `Complete`)
- 8 Phase 8 rows (ADMIN-OPS-01..08, all `Complete`)

**55 existing rows** flipped from `Pending` to `Complete` (all Phase 1-6 rows).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FOUND-05 env var list differs from planning snapshot**
- **Found during:** Task 1
- **Issue:** The plan's `<interfaces>` snapshot listed 14 env vars. The actual `.env.local.example` also contains `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (added for rate limiting in a later phase). Per D-05, the file is the source of truth.
- **Fix:** FOUND-05 lists all 16 env vars as they appear in `.env.local.example`.
- **Files modified:** .planning/REQUIREMENTS.md

**2. [Rule 1 - Bug] FOUND-02 "no Supabase clients exist" phrasing violates acceptance criterion**
- **Found during:** Task 1 verification
- **Issue:** The plan instruction said FOUND-02 must "explicitly say there are no Supabase clients" — but the acceptance criterion also requires `grep -qi supabase` to return no matches. These two instructions conflict.
- **Fix:** Rephrased to "no third-party BaaS clients — migration from prior stack is complete" which preserves the intent without using the word "Supabase".
- **Files modified:** .planning/REQUIREMENTS.md

**3. [Rule 1 - Bug] Coverage count corrected from 60 to 69**
- **Found during:** Task 3 verification
- **Issue:** Initial write used 60 as the coverage total (original 46 + 6 ROUTES + 8 ADMIN-OPS = 60), but the actual grep count from v1 Requirements section returned 69. The discrepancy was because the original 46 items included SHOP-01..11 (11 items), CART-01..05 (5 items), and other groups that sum to 46 already — adding 6 + 8 = 14 new items gives 60, but original count of 46 did NOT include the 9 items that were already `[x]` in the original file (SHOP-01..04, CART-04). Actual pre-audit v1 total was 46 + 9 pre-checked = 46 per original count (the 9 already-checked items WERE in the 46). So 46 + 14 new = 60 should be correct. The grep returns 69 because SHOP-01..11 = 11 items, not 7 (SHOP-05..11). Re-checking: FOUND(5) + SHOP(11) + CART(5) + CHKT(7) + CONF(3) + AUTH(3) + ORD(5) + PROD(5) + NOTF(3) + ANLT(4) + INFRA(4) = 55 original items (not 46). Original REQUIREMENTS.md had 55 v1 items (some already ticked); 55 + 6 ROUTES + 8 ADMIN-OPS = 69. The original "46 total" in the old Coverage block was incorrect — it undercounted. The audit corrects this to the actual 69.
- **Files modified:** .planning/REQUIREMENTS.md

## Known Stubs

None — this plan is documentation-only with no UI or data-fetching changes.

## Threat Flags

None — no runtime code modified; only `.planning/REQUIREMENTS.md` touched. T-09-D-02 was observed and honored: FOUND-05 lists env var NAMES only, no actual secret values.

## Self-Check: PASSED

- [x] `.planning/REQUIREMENTS.md` modified — file exists and is current
- [x] Commit feaaaa9 exists (`git log --oneline | head -1` confirms)
- [x] `grep -c '^- \[x\] \*\*FOUND-0[1-5]\*\*'` = 5
- [x] `grep -qi supabase .planning/REQUIREMENTS.md` = 0 matches
- [x] `grep -cE '\| Phase 7 \| Complete'` = 6
- [x] `grep -cE '\| Phase 8 \| Complete'` = 8
- [x] `grep -q 'Unmapped: 0'` = PASS
- [x] Coverage: 69 total, 69 mapped, 0 unmapped
