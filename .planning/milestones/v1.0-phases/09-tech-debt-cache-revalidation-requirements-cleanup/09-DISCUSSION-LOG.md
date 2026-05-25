# Phase 9: Tech debt: cache revalidation + requirements cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 09-tech-debt-cache-revalidation-requirements-cleanup
**Areas discussed:** Cache invalidation strategy, Requirements audit scope

---

## Cache invalidation strategy

### Q1: How should admin mutations invalidate the shop cache?

| Option | Description | Selected |
|--------|-------------|----------|
| revalidateTag | Surgical, tag-based. Requires tagging upstream fetches. | ✓ |
| revalidatePath | Blunt, path-level. Rebuilds whole path. Simpler but less precise. | |

**User's choice:** revalidateTag

---

### Q2: Which admin mutations should trigger cache revalidation?

| Option | Description | Selected |
|--------|-------------|----------|
| Config + Products only | PATCH /api/admin/config and product CRUD. Order status changes excluded. | ✓ |
| All admin mutations | Config, products, AND order status changes. | |
| Config only | Only ordering toggle / config patch triggers revalidation. | |

**User's choice:** Config + Products only

---

### Q3: What should happen to the 15s TTL on orderingConfig's unstable_cache?

| Option | Description | Selected |
|--------|-------------|----------|
| Replace TTL with tag-based bust | Remove revalidate: 15, add tags: ["ordering-config"]. Immediate invalidation on config change. | ✓ |
| Keep 15s TTL, also add tag | Dual mechanism — TTL as safety net + tag for immediate admin busting. | |

**User's choice:** Replace TTL with tag-based bust

---

### Q4: Should shop product pages also be tag-revalidated on product mutation?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — tag product fetches too | Add 'shop-products' tag, call revalidateTag on product create/edit/delete. | ✓ |
| No — keep ISR for products | Keep revalidate: 60 on product pages. | |

**User's choice:** Yes — tag product fetches too

---

## Requirements audit scope

### Q1: How thorough should the requirements audit be?

| Option | Description | Selected |
|--------|-------------|----------|
| Full audit — check, update, and add | Tick shipped items, update stale tech refs, add Phase 7–8 features. | ✓ |
| Tick-boxes only | Just mark shipped items as [x]. No rewrites. | |
| Check + update only | Mark done + fix tech refs, but don't add new requirements. | |

**User's choice:** Full audit

---

### Q2: How should outdated foundation requirements be handled?

| Option | Description | Selected |
|--------|-------------|----------|
| Update in-place with actual stack | Edit FOUND-01–05 to reflect Neon/Drizzle/Uploadthing/NextAuth. Mark as [x]. | ✓ |
| Mark done, add migration note | Keep originals with notes, add new FOUND-06–08 items for new stack. | |

**User's choice:** Update in-place with actual stack

---

### Q3: Should Phase 7–8 features be added as new requirements?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add as Admin Operations section | New ADMIN-OPS-XX IDs for prep list, manifest, bulk transitions, etc. | ✓ |
| No — leave Phase 7–8 features undocumented | Skip new items; phase summaries cover what was built. | |

**User's choice:** Yes — add new Admin Operations section

---

### Q4: Should the traceability table be updated to include Phase 7–8?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — update traceability table | Add Phase 7 and 8 rows, update total count. | ✓ |
| No — leave traceability as-is | Skip the table update. | |

**User's choice:** Yes — update traceability table

---

## Claude's Discretion

- Exact env var names in updated FOUND-05 (read `.env.local.example` directly)
- Exact ADMIN-OPS ID numbering and requirement text wording
- Whether to keep or remove `export const dynamic = "force-dynamic"` from shop pages post-tagging

## Deferred Ideas

None — discussion stayed within phase scope.
