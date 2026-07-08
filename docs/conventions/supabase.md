# Supabase / uno-blueprint Conventions

<!--
status: canonical — this file IS the convention (ADR-017)
distilled: 2026-07-07 from the Notion 📐 System Overview + Flow 4 doc (now superseded for conventions)
applied by: agents/writers/blueprint
-->

## The contract

- **uno-blueprint (Supabase) is the product source of truth.** Ground every product-fact claim in a blueprint read (`blueprint_search` / PostgREST) with layer/actor attribution; cite what you found. Notion pages may mirror or link blueprint content but are never the source.
- **Query at task time, never cache.** `docs/context/product/` holds foundation only (identity, pillars, archetypes); live truth — features, requirements, screens — is retrieved fresh per task.
- **Paired writes, never one alone:** any requirement change updates the PRD (Notion) and the blueprint (Supabase) together — Flow 4's requirement/story path. A PRD edit without a blueprint write (or vice versa) is a defect; the auditor's drift sweep flags it.
- Write access: `writers/blueprint` only, via `skills/uno-synthesize` (new requirements) and `skills/uno-maintain` (changes). All other consumers are read-only.
- Supabase is also the candidate dummy backend for prototypes needing persistence — separate schema, never mixed with blueprint tables.
