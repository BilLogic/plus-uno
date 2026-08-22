# Supabase / uno-blueprint Conventions

<!-- canonical per ADR-017 (docs/knowledge/decisions.md); supersedes the Notion 📐 System Overview + Flow 4 doc for conventions. Distilled 2026-07-07 · applied by writers/blueprint. -->

## The contract

- **uno-blueprint (Supabase) is the source of truth for the CURRENT service journey.** Ground every current-state product claim in a blueprint read (`search_blueprint` / PostgREST) with lane/actor attribution; cite what you found. Notion is a mixed estate — stale docs *and* legitimate future state — so authority is routed by claim type (§ Two sources, one time axis), not by a single "blueprint always wins" rule.
- **Query at task time, never cache.** `docs/context/product/` holds foundation only (identity, pillars, archetypes); live truth — features, requirements, screens — is retrieved fresh per task.
- **Paired writes, never one alone:** any requirement change updates the PRD (Notion) and the blueprint (Supabase) together — Flow 4's requirement/story path. A PRD edit without a blueprint write (or vice versa) is a defect. **Detection is human today** — no automation reads Supabase, so nothing verifies the pair. The weekly shipped watchdog files a *verify-blueprint* intake per shipped journey card (`skills/uno-maintain/references/method.md` §6) but cannot confirm drift itself; any human spot files a `uno-maintain` intake.
- Write access: `writers/blueprint` only, via `skills/uno-synthesize` (new requirements) and `skills/uno-maintain` (changes). All other consumers are read-only.
- Supabase is also the candidate dummy backend for prototypes needing persistence — separate schema, never mixed with blueprint tables.

**Navigating it:** schema, lane semantics, path semantics, query recipes, and the scored answering rules live in `docs/conventions/blueprint-navigation.md` — load it before any blueprint read; this file owns access and source routing only.

## Two sources, one time axis (ADR-021)

**Authority is routed per claim, not per source.** The blueprint owns how the service works *today*; cards and PRDs own what's *planned*. Every agent answering a journey or product question — in-IDE or uno-bot — routes by this table.

| Situation | Authority | Answer shape |
|---|---|---|
| "How does it work **today**?" | Blueprint | Cite `phase › scenario › path — lane × step`. The chain is containment; the pair after the dash is the cell's coordinate (actor row × journey column). |
| Conflicting card is **WIP / under review**, change **decided** (Decisions DB or card) | Blueprint = today; card = incoming | "Today: X. This is changing — {card} moves it to Y." Both attributed, never blended. |
| Conflicting card is **WIP / under review**, still **exploratory** | Blueprint = today; card = maybe | "Today: X. {card} is exploring Y — not decided." Match the verb to decision status. |
| Conflicting card is **shipped** (`Dev Status: Deployed`) | Blueprint (still) | Answer from the blueprint — the paired write updates it at ship, so a shipped doc that disagrees is the likely obsolete side. Evidence the blueprint itself is stale → say so and offer a `uno-maintain` intake. Never silently prefer the doc. |
| "What's **planned / coming / changing**?" | Roadmap cards + PRDs, **plus any `Future (roadmap)` path** | Cite card + Design/Dev Status. Check the scenario for a `Future (roadmap)` path and cite its cells too when one exists — they are the design-side plan of record. Use the current-state rows as the today-baseline to explain the delta. |
| Blueprint silent; a **current** doc covers it (Help Center, shipped PRD) | The doc | Cite it and date it. Note the blueprint doesn't cover this yet. |
| Only **aspirational** docs (roadmap PRD, future spec) | Neither, as fact | Report as planned per {doc}. Current behavior stays the blueprint's — or "not in the source". |
| Neither source | Abstain | "Not in the source" + name who should fill the gap. |

Two hard rules, every row: **never merge two sources into one unattributed answer** — surface the conflict instead of blending it — and **never fabricate a blueprint citation**, the worst outcome available here.

Drafting follows the same routing, not just answering: `skills/uno-synthesize` queries the blueprint for the current-state and downstream-effects sections before writing a PRD.

<!-- ide-only -->
## Access & keys

| Path | Credential | Where it lives | Status |
|---|---|---|---|
| Read (Worker `search_blueprint`) | `SUPABASE_ANON_KEY` (read-only anon) | Cloudflare secret (`wrangler secret put`); `SUPABASE_URL` is a non-secret var | ✅ live |
| Read (in-IDE grounding) | Supabase MCP connector | user's Claude Code MCP config | per designer |
| **Write (in-IDE, writers/blueprint)** | **Supabase MCP connector** (decision: Bill, 2026-07-08 — MCP over raw keys; the team sets it up properly). If the MCP is unavailable/unauthorized in a session, the agent **requests access** rather than improvising — never asks for or handles a raw key in chat | user's Claude Code MCP config; no key files in the repo, ever | MCP route |
| Write (Worker — only if an acceptance-in-thread write tool ships, plan §6 note) | scoped key as Cloudflare secret, requested from whoever administers Supabase | `wrangler secret put SUPABASE_WRITE_KEY` | not built |

If a session lacks the authorized MCP, the paired write's blueprint half is flagged `⏳ pending` in the PRD and filed as a uno-maintain intake; the synthesize rubric's schema-valid hard gate activates once the blueprint schema exists.
<!-- /ide-only -->
