---
embodiment: ide
summary: uno-blueprint on Supabase as the product source of truth (backfilled 2026-07-07 from git history)
status: active
verified: 2026-08-24 (#171)
---

# ADR-015: uno-blueprint on Supabase as the product source of truth (backfilled 2026-07-07 from git history)

**Original date:** ≤2026-07-01 (`d892346f` D8 grounding: read-only `blueprint_search` over "the uno-blueprint Supabase"; hardened 2026-07-02 `0864cb54` with a `search_blueprint()` RPC and layer/step/scenario cell attribution).

**Decision.** Product truth (actors, phases, steps, scenarios, requirements) lives in a Supabase-hosted blueprint, queried at task time — never cached into repo docs. All agent answers about product behavior cite blueprint cells; gaps are stated, not filled ("blueprint gap honesty", scenario R11). On any requirement change, PRD and blueprint update **together** — the paired-writes contract now codified in `docs/connectors/supabase/overview.md` and enforced by `agents/writers/blueprint.md`.

**Why.** Rationale not recorded; inferred: Notion docs drifted from reality and are slow to query programmatically; a structured store makes grounding citable (row-level) and machine-checkable, and gives prototypes a dummy-backend candidate.

**Consequences.** The Supabase schema is a hard dependency for uno-synthesize's blueprint write (rubric hard gate "schema-valid" activates when it lands). The Worker's blueprint access is read-only; writes happen in-IDE via writers/blueprint.
