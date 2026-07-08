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

## Access & keys

| Path | Credential | Where it lives | Status |
|---|---|---|---|
| Read (Worker `blueprint_search`) | `SUPABASE_ANON_KEY` (read-only anon) | Cloudflare secret (`wrangler secret put`); `SUPABASE_URL` is a non-secret var | ✅ live |
| Read (in-IDE grounding) | Supabase MCP connector | user's Claude Code MCP config | per designer |
| **Write (in-IDE, writers/blueprint)** | write-capable key — Bill to provide (2026-07-08). Prefer a key/role scoped to blueprint tables over raw `service_role` | local env only (`agents/uno-bot/.dev.vars` pattern / MCP config) — **never in the repo, never in a committed file** | ⏳ pending key |
| Write (Worker — only if an acceptance-in-thread write tool ships, plan §6 note) | same key as Cloudflare secret | `wrangler secret put SUPABASE_WRITE_KEY` | not built |

Until the write key lands, the paired write's blueprint half runs through the authorized Supabase MCP in-IDE (or is flagged as pending in the PRD); the synthesize rubric's schema-valid hard gate activates once the blueprint schema + key both exist.
