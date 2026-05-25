# Retrospective: Rodo & Co

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-25
**Phases:** 10 | **Plans:** 44 | **Timeline:** 44 days (2026-04-11 → 2026-05-25)
**Commits:** 291 | **Files:** 532 changed, +86k lines

### What Was Built

- End-to-end food prep ordering flow: product drawer → Zustand cart → Paystack payment → HMAC webhook → order confirmation
- Full admin panel covering weekly ops: orders, product CRUD, analytics week picker, prep list, delivery manifest, bulk status transitions, pending order cleanup, delivery config, activity log
- Vercel Cron cutoff automation + Resend email (customer confirmations, admin alerts, delivery reminders)
- 3-phase inserted work: Supabase→Neon migration (2.1), route completeness (7), admin ops gaps (8)
- Phase 9 closed two audit-flagged issues: tag-based cache revalidation replacing ISR, and REQUIREMENTS.md reconciled through all phases

### What Worked

- **Inserted phases worked well.** Treating urgent mid-build changes as numbered inserted phases (2.1, 7, 8) rather than scope creep kept planning coherent. The Supabase→Neon migration in particular went smoothly because it was scoped as its own phase with a clear goal and VERIFICATION.md.
- **Webhook body-ordering rule saved a production bug.** The decision to document `req.text()` before JSON parsing at the point of discovery (Phase 5) prevented a silent HMAC failure that would have been hard to reproduce.
- **Zod v3 pin.** Documenting this as an explicit decision (not just a package.json line) meant it didn't get silently upgraded.
- **Phase 9 as tech-debt-closer.** Dedicating a phase to close the audit's two primary items (cache staleness and stale traceability) before milestone archive was the right call — it's clean at close.

### What Was Inefficient

- **VALIDATION.md sign-off discipline.** 9 of 10 phases have `nyquist_compliant: false` not because tests are missing, but because the VALIDATION.md checkboxes were never updated after completion. This creates a false picture in audits and should be treated as a required step, not optional cleanup.
- **REQUIREMENTS.md drifted for 41 of 46 requirements.** The traceability table was last updated after Phase 2 and stayed stale until Phase 9 force-closed it. Traceability update should be part of the phase-complete checklist, not milestone cleanup.
- **D-01–D-17, R1–R6, OPS-01–07 never made it to REQUIREMENTS.md.** Requirements defined in ROADMAP.md phase details only were missed in traceability. Any requirement defined in ROADMAP.md should be mirrored to REQUIREMENTS.md at definition time.
- **types/index.ts coexistence.** Supabase-era types from Phase 1 were never cleaned up when migrating to Drizzle in Phase 2.1. Two type systems coexisting silently is subtle tech debt that grew over the build.

### Patterns Established

- **Parallel route @drawer for product selection.** Clean URL-addressable drawer without page reload; @drawer/default.tsx must be created in the same commit as the slot folder.
- **Integer kobo pricing.** Store prices as integer kobo everywhere; divide by 100 only at display. Never touched again after Phase 1.
- **`motion` not `framer-motion`.** Import from `"motion/react"` — the rebranded package. Documented once, referenced everywhere.
- **Webhook reads raw body first.** `req.text()` → verify HMAC → then parse JSON. Not the other way around.
- **Tag-based cache invalidation pattern.** `unstable_cache` with named tags in lib readers; `revalidateTag` at the mutation site in admin Route Handlers. Admin mutates → next customer request gets fresh data.

### Key Lessons

1. **Update traceability during the phase, not at milestone.** 41 stale checkboxes required a cleanup phase — this cost was avoidable.
2. **VALIDATION.md completion should be a phase-close gate.** It's a 2-minute update that provides audit confidence; skipping it accumulates into misleading audit scores.
3. **Inserted phases are normal at client-project pace.** Budget for them; 3 of 10 phases were inserted. The phase-numbering system (2.1, 7, 8) handled this gracefully.
4. **Document type-system decisions at migration time.** When Phase 2.1 replaced Supabase types with Drizzle, types/index.ts should have been scheduled for deletion at that moment, not left as implied future work.
5. **Phase 9 (tech debt closer) is worth the investment.** Arriving at milestone archive with clean docs and fixed cache is significantly better than carrying known issues into v1.1 with full context.

### Cost Observations

- Build: 44 days, 291 commits, 10 phases, 44 plans
- Primary model: Claude Sonnet 4.6 (planning and execution)
- Notable: Phase 5 required the most gap-closure iterations (05-06, 05-07, 05-08) — payment flows have the most edge cases

---

## Cross-Milestone Trends

*(Updated at each milestone close)*

| Metric | v1.0 |
|--------|------|
| Phases | 10 |
| Plans | 44 |
| Days | 44 |
| Commits | 291 |
| Requirements | 69 |
| Inserted phases | 3 |
| Gap-closure plans | 4 (05-06 through 05-08, and the Phase 9 pair) |
| Audit issues at close | 4 warnings, 0 blockers |
