# Notion Conventions

<!--
status: canonical — this file IS the convention (ADR-017; the Notion 📓 Doc-Management Playbook is superseded)
distilled: 2026-07-07 from https://app.notion.com/p/396b7cca498281d1b1e7e47072166a4e
rule: on conflict with any legacy Notion playbook page, this file wins — file a uno-maintain intake to banner the page as superseded.
applied by: agents/writers/notion
-->

## Access paths — reads vs writes (uno-bot Worker)

**One credential, REST for both** — the `ntn_` internal integration key (`NOTION_API_KEY`), workspace-scoped and non-expiring:

- **Reads** (grounding: `find_experts`, source lookups) → the bot's REST read code. No gate needed — reads never mutate state.
- **Writes** (`create_prd`, `delete_prd`) → the bot's **own gated tools**, intercepted by the proposal gate — nothing writes without the requester's ✅.

**Why not the hosted Notion MCP connector for reads?** It was evaluated (Path B) and shelved: `mcp.notion.com` uses user-scoped OAuth built for interactive clients and needs token refresh the headless Worker can't do — a downgrade from the never-expiring REST key. Full reasoning + the revisit conditions live in `docs/plans/2026-07-08-002-uno-bot-sdk-mcp-connector.md`. The inert `agents/uno-bot/src/agent/mcp.ts` scaffolding stays off (connector builds only when `NOTION_MCP_URL` + `NOTION_MCP_TOKEN` are both set — they aren't). MCP connectors belong on *interactive* Claude (Bill's Claude Desktop / Claude Code), not the Worker.

## Write-surface allowlist

The agent writes ONLY to these named surfaces. Adding a surface is a uno-maintain change to this list, never an inline decision.

| Surface | Who writes | Notes |
|---|---|---|
| Roadmap DB (`2fc01241-1bb5-4770-af51-d5a050bddb75`, data source `7fba5c35-da73-4c40-ac42-1c13db7794de`) | human creates; uno updates status/properties/links | the single task board; design + dev kanbans are views |
| PRD pages | uno drafts; human owns | PRD template, Stage: exploring / converging / committed |
| Research & notes DB | uno writes; human reviews | findings, study guides |
| Decision logs (per project) | uno logs at publish; human appends | thread conclusions land here before threads resolve |
| Spec pages / Handoff Specs | uno drafts from template | "Figma shows what it looks like; this page holds how it behaves and what done means" |
| notion-marketplace DB (`397b7cca-4982-8002-826c-c45e2baa8e4f`, data source `397b7cca-4982-80d8-9967-000b69521ce9`) | uno publishes entries | ✅ live under Design HQ; schema + publish procedure in `skills/uno-publish/references/notion-marketplace-db.md` |
| Eval Runs DB | uno writes at flow exits | ⚠️ DB setup pending — interim: `docs/evals/runs/*.jsonl` |
| DS Component PRDs DB (`342b7cca-4982-80b1-b305-f9e0e581ef48`) | UNO Bot auto-creates | Figma-sync pipeline |

## Roadmap DB rules (every card write)

- `Contributor` — mandatory, never blank. Default: Bill + everyone mentioned in the source context.
- `Product Pillar` — always tag the most relevant existing pillar(s); the pillar maps to a Slack channel (`slack.md`).
- `Feature / Initiative` + `OKR` — link the most relevant **existing** entry. If nothing fits, leave blank + flag in the body.
- **Never create select options, pillars, features, or OKRs.** ⚠️ Notion silently auto-creates select options on any name mismatch — fetch the schema and exact-match option names before every write.
- `Current Team` routes the card to kanbans; PRD accepted → move to `Design Status: Ready for Design`.
- Urgency = existing `Priority: Critical` — no separate lane. Maintenance intake = card on this DB with `Product Pillar: Universal` + `Intake Status` property.

## Project-hub golden sections (in order)

**TLDR** (2–4 sentences — what it is · for whom · where it stands · what direction changed; the top anchor, a cold reader orients in 30s) → **People** (role-labelled @-mentions, one per line) → **Now / Next / Blocked** (one bold-labelled line each: current focus · following step · ⛔ what's stuck) → **Latest progress** (all dated status-pulse bullets inside one *Progress log* accordion — nothing spills onto the page) → **Key references** → **Doc Changelog** (inside a *Show history* toggle) → **Pages** (the final section: a contiguous run of pre-created inline subpages — PRD · Decision Log · Handoff Spec · Rollout · Meeting Notes & Context · Archive).

- **TLDR is the top anchor** — orientation only, no people, no links, and no separate "start here" line (the *People* section makes entry points obvious). No placeholder callout above it; the TLDR heading is the read-me. Keep it the single thing a card-picker must read.
- **The Decision Log is not a hub body section** — it's one of the pre-created inline subpages under **Pages**. The hub carries progress; the whys live in the linked Decision Log.
- **Latest progress = status pulse, not rationale — and all of it lives inside one *Progress log* accordion** (keeps the hub scannable; nothing spills onto the page). What changed / where it stands — no *whys*. Durable whys and rejected alternatives live in the Decision Log (cited by R-ID at handoff). A bullet that explains *why* belongs there, not here.
- **Pages is the final section, and the template pre-creates every subpage** (PRD · Decision Log · Handoff Spec · Rollout · Meeting Notes & Context · Archive), each seeded with its own skeleton, as one contiguous run at the very bottom (child-page blocks can't interleave with text, and appended child pages land last). **Meeting Notes & Context** holds raw capture — meeting recordings, Zoom links, AI summaries, running scratch — distinct from the synthesized PRD/Findings and the Decision Log. Mark a not-yet-relevant subpage "N/A until [stage]" rather than deleting it.
- **Doc Changelog** records the *document's* maintenance (restructures, pages added/moved/superseded) — never project progress, never formatting polish.
- **Toggles:** title them plainly ("Show history") — Notion renders the arrow itself, so never prefix a ▸ (a double-arrow is the tell it's wrong).
- Status lives in card **properties**, never a body callout or a header dot-spacer block. State owner/status/date once (in properties); the body adds only what properties can't — role labels, blockers, links.
- People = @-mentions, **one role per line** (never a `·`-spacer run); only workspace members are mentionable.
- Structure with **dividers** between sections. A **callout** is reserved for a single **atomic** live alert (e.g. an active blocker) placed inline in *Now / Next / Blocked* — never a standing placeholder, never multi-line (it fragments on write). Transient chatter → comments.
- Templates (9) live in Notion 🧩 Templates; the live **Project Hub — template seed** carries the real blocks. Reference them, never duplicate their bodies.

## Comments protocol

Suggestions *about* existing content (including the agent's own) go in **comments anchored to the block** — resolvable: accept → apply + resolve; reject → reply why + resolve. The agent sweeps unresolved threads on each flow run touching the page + at the monthly retro. Proposed *content* that must be readable in place = yellow highlight + `⏳ PENDING REVIEW:` text marker (yellow is invisible via API — the marker is the binding signal). **Binding information never lives only in a comment.**

## Enhanced-markdown quirks (API writes)

- **Page titles never carry an emoji** — set the page/DB **icon** field instead (the title text stays clean; the icon renders separately). Same for database titles. Emoji in section *headings* (body blocks) is fine — those have no icon field.
- **Link to internal pages/docs with a page reference (mention), never a raw hyperlink.** Notion's page-mention styling (icon + live title, updates on rename) reads far better than a bare URL and never goes stale. Reserve markdown hyperlinks for external URLs.
- Mentions: `<mention-user url="user://<user-id>"/>` — the `id=` attribute silently drops. Verify membership via the users API first.
- Embeds are manual-only via API — write a plain link + 📌 placeholder; a human converts to embed. Always pair any embed with a plain link (embeds are unreadable via API).
- Child-page blocks cannot interleave with text — group inline subpages in one contiguous run (the Pages section).
- Multi-line callout text writes back as stacked one-line fragments — keep callouts atomic.
- Databases for tracked items with a lifecycle; inline simple tables for static reference (fit-to-page-width is a manual toggle).
