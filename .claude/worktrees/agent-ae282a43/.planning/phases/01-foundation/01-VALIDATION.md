---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Phase 1 is pure infrastructure with no business logic to test |
| **Config file** | None — no test runner installed in this phase |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15–30 seconds (tsc) / ~60 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** Full build must pass + manual RLS and hydration checks
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| Install deps | 01 | 1 | FOUND-01 | — | No NEXT_PUBLIC_ on service role key | build | `npx tsc --noEmit` | ⬜ pending |
| shadcn/ui init | 01 | 1 | FOUND-01 | — | N/A | build | `npx tsc --noEmit` | ⬜ pending |
| types/index.ts | 01 | 1 | FOUND-01 | — | N/A | type-check | `npx tsc --noEmit` | ⬜ pending |
| types/env.d.ts | 01 | 1 | FOUND-01 | T-env-01 | All 11 vars typed; accessing undefined var = TS error | type-check | `npx tsc --noEmit` | ⬜ pending |
| .env.local.example | 01 | 1 | FOUND-05 | T-env-01 | .env.local in .gitignore | manual | `grep ".env.local" .gitignore` | ⬜ pending |
| Migration SQL | 01 | 2 | FOUND-03 | T-rls-01 | RLS enabled on all 6 tables | manual-sql | SQL check against pg_tables | ⬜ pending |
| supabase db push | 01 | 2 | FOUND-03 | T-rls-01 | [BLOCKING] Schema pushed to live DB | cli | `npx supabase@latest db diff --schema public` | ⬜ pending |
| seed.sql | 01 | 2 | FOUND-04 | — | ordering_config row 1 exists with is_ordering_open=true | manual-sql | `SELECT * FROM ordering_config WHERE id=1` | ⬜ pending |
| lib/supabase/admin.ts | 01 | 3 | FOUND-02 | T-env-01 | SERVICE_ROLE_KEY never NEXT_PUBLIC_ | type-check | `npx tsc --noEmit` | ⬜ pending |
| lib/supabase/server.ts | 01 | 3 | FOUND-02 | — | await cookies() used (Next.js 15) | type-check | `npx tsc --noEmit` | ⬜ pending |
| lib/supabase/client.ts | 01 | 3 | FOUND-02 | — | Anon key only, no service role | type-check | `npx tsc --noEmit` | ⬜ pending |
| Zustand cart store | 01 | 4 | FOUND-01 | — | SSR safe — no localStorage access on server | build | `npm run build` | ⬜ pending |
| useHasHydrated hook | 01 | 4 | FOUND-01 | — | Returns false on server, true after hydration | build | `npm run build` | ⬜ pending |
| Route skeleton | 01 | 5 | FOUND-01 | — | N/A | build | `npm run build` | ⬜ pending |
| @drawer/default.tsx | 01 | 5 | FOUND-01 | — | Returns null; prevents hard-refresh 404 | manual | Hard-refresh /shop/[slug] | ⬜ pending |
| Navbar shell | 01 | 5 | FOUND-01 | — | N/A | build | `npm run build` | ⬜ pending |
| Final build | 01 | 5 | FOUND-01–05 | — | Zero TS errors, zero build errors | build | `npm run build` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — Phase 1 does not install a test runner. TypeScript compilation (`npx tsc --noEmit`) is the primary automated feedback signal. No test stubs or fixtures needed.

*Existing infrastructure: TypeScript strict mode via tsconfig.json (already in scaffold).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 6 tables exist with RLS enabled | FOUND-03 | Requires live Supabase DB connection | Run SQL: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;` — expect 6 rows, all `rowsecurity = true` |
| ordering_config row seeded | FOUND-04 | Requires live DB | Run SQL: `SELECT id, is_ordering_open FROM ordering_config WHERE id = 1;` — expect 1 row with `is_ordering_open = true` |
| Anon cannot read orders table | FOUND-03 | Requires live DB + RLS policy | curl orders endpoint with anon key — expect empty array or 401 |
| @drawer hard-refresh does not 404 | FOUND-01 | Requires running dev server | Run `npm run dev`, navigate to `/shop/test-product` and hard-refresh (Cmd+Shift+R) — expect no 404 |
| Zustand hydration — no mismatch error | FOUND-01 | Requires browser devtools | Open browser console after page load — expect zero React hydration errors |
| SUPABASE_SERVICE_ROLE_KEY not in NEXT_PUBLIC_ | FOUND-02 | Human audit | Search `.env.local.example` for `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` — must NOT exist |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or manual instruction
- [ ] Sampling continuity: tsc runs after every task commit
- [ ] Wave 0: not applicable (no test runner in Phase 1)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter when all boxes checked

**Approval:** pending
