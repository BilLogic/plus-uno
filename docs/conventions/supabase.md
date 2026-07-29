# Supabase / uno-blueprint Conventions

<!-- canonical per ADR-017 (docs/knowledge/decisions.md); supersedes the Notion 📐 System Overview + Flow 4 doc for conventions. Distilled 2026-07-07 · applied by writers/blueprint. -->

## The contract

- **uno-blueprint (Supabase) is the source of truth for the CURRENT service journey.** Ground every current-state product claim in a blueprint read (`blueprint_search` / PostgREST) with layer/actor attribution; cite what you found. Notion is a mixed estate — stale docs *and* legitimate future state — so authority is routed by claim type (§ Two sources, one time axis), not by a single "blueprint always wins" rule.
- **Query at task time, never cache.** `docs/context/product/` holds foundation only (identity, pillars, archetypes); live truth — features, requirements, screens — is retrieved fresh per task.
- **Paired writes, never one alone:** any requirement change updates the PRD (Notion) and the blueprint (Supabase) together — Flow 4's requirement/story path. A PRD edit without a blueprint write (or vice versa) is a defect; the shipped watchdog's blueprint-drift check (`docs/conventions/automations.md`) flags it, and any human spot of blueprint-vs-reality drift files a `uno-maintain` intake.

## Two sources, one time axis (ADR-021)

Grounded in the UNO Blueprint Grounding Evaluation (Notion, 2026-07: six-arm context ladder; guided blueprint arms hit 100% vs 36% docs-only; the sharpest failures were source-conflict blends). Every agent answering journey/product questions — in-IDE or uno-bot — follows this routing:

| Situation | Authority | Answer shape |
|---|---|---|
| "How does it work **today**?" | Blueprint | Cite `scenario → path → step` + `layer` actor. |
| Conflicting card is **WIP / under review** and the change is **decided** (Decisions DB / card) | Blueprint = today; card = incoming | "Today: X. This is changing — {card} moves it to Y." Both stated, attributed, never blended. |
| Conflicting card is **WIP / review** but **exploratory** (no decision) | Blueprint = today; card = maybe | "Today: X. {card} is exploring Y — might change, not decided." Calibrate the verb to decision status. |
| Conflicting card is **shipped** (`Dev Status: Deployed`) | **Blueprint still wins** — the paired write updates it at ship, so shipped-card docs may be the obsolete side | Answer from the blueprint. Evidence the blueprint itself is stale → say so and file/offer a `uno-maintain` intake; never silently prefer the doc. |
| "What's **planned / coming / changing**?" | Roadmap cards + PRDs | Cite card + Design/Dev Status; use the blueprint as the today-baseline to explain the delta. |
| Blueprint silent; a **current** doc covers it (Help Center, shipped PRD) | The doc | Cite + date it; note the blueprint doesn't cover this yet. |
| Only **aspirational** docs (roadmap PRD, future spec) | Neither, as fact | Report as planned per {doc}; current behavior stays blueprint's (or "not in the source"). |
| Neither source | Abstain | "Not in the source" + name who should fill the gap. |

Hard rules across all rows: **never merge two sources into one unattributed answer** — a conflict is surfaced, not blended; a fabricated blueprint citation is the worst outcome; blueprint feeds PRD drafting too (`skills/uno-synthesize` queries it for the current-state and downstream-effects sections before writing).
- Write access: `writers/blueprint` only, via `skills/uno-synthesize` (new requirements) and `skills/uno-maintain` (changes). All other consumers are read-only.
- Supabase is also the candidate dummy backend for prototypes needing persistence — separate schema, never mixed with blueprint tables.

## Access & keys

| Path | Credential | Where it lives | Status |
|---|---|---|---|
| Read (Worker `blueprint_search`) | `SUPABASE_ANON_KEY` (read-only anon) | Cloudflare secret (`wrangler secret put`); `SUPABASE_URL` is a non-secret var | ✅ live |
| Read (in-IDE grounding) | Supabase MCP connector | user's Claude Code MCP config | per designer |
| **Write (in-IDE, writers/blueprint)** | **Supabase MCP connector** (decision: Bill, 2026-07-08 — MCP over raw keys; the team sets it up properly). If the MCP is unavailable/unauthorized in a session, the agent **requests access** rather than improvising — never asks for or handles a raw key in chat | user's Claude Code MCP config; no key files in the repo, ever | MCP route |
| Write (Worker — only if an acceptance-in-thread write tool ships, plan §6 note) | scoped key as Cloudflare secret, requested from whoever administers Supabase | `wrangler secret put SUPABASE_WRITE_KEY` | not built |

If a session lacks the authorized MCP, the paired write's blueprint half is flagged `⏳ pending` in the PRD and filed as a uno-maintain intake; the synthesize rubric's schema-valid hard gate activates once the blueprint schema exists.
