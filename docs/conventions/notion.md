# Notion Conventions

<!-- canonical per ADR-017 (docs/knowledge/decisions.md): this file IS the convention; the legacy Notion 📓 Doc-Management Playbook is superseded and loses on conflict. Distilled 2026-07-07 · applied by writers/notion. -->

## Access paths — reads vs writes (uno-bot Worker)

**One credential, REST for both** — the `ntn_` internal integration key (`NOTION_API_KEY`), workspace-scoped and non-expiring:

- **Reads** (grounding: `notion_search`, `roadmap_query`, source lookups) → the bot's REST read code. No gate needed — reads never mutate state.
- **Writes** (`notion_create`, `notion_update`, `notion_archive`) → the bot's **own gated tools**, intercepted by the proposal gate — nothing writes without the requester's ✅.

**Hosted Notion MCP — READS only (adopted 2026-07-09).** Reads may now come from the hosted Notion MCP (`mcp.notion.com`), attached to the Worker's Anthropic call **read-only** via an `mcp_toolset` allowlist (`agents/uno-bot/src/agent/mcp.ts`, beta `mcp-client-2025-11-20`) — the same rich Notion read surface the IDE uses. Auth is **OAuth 2.1** (`src/oauth/notion.ts`): `mcp.notion.com` is its own authorization server (PKCE + RFC-7591 dynamic client registration — verified via its `/.well-known/oauth-*` metadata and Notion's docs), so the classic `ntn_` token does **not** authenticate it. A human does the browser consent once at `/oauth/notion/start`; the access + refresh tokens live in KV and the Worker refreshes silently.

⚠️ **The MCP-write principle (cross-service, not just Notion).** Inline MCP tools execute server-side during the turn, so any tool exposed via MCP bypasses the ✅ proposal gate. Therefore a write goes **direct via MCP only if it wouldn't need the gate anyway** — i.e. reversible + low-blast-radius, like Slack messaging (the bot's native medium, already ungated for replies). **Consequential / outward / irreversible writes stay hard-gated bot tools, never MCP:** Notion artifacts (`notion_create`/`update`/`archive`) and email. Per current decisions: **Slack** = reads + messaging writes direct via MCP; **Notion** = reads via MCP, writes gated; **Supabase** = reads only (the MCP URL pins server-enforced `read_only=true`) — **the bot has NO blueprint write path at all**: a blueprint-change ask becomes a maintenance intake ticket (`notion_create` intake, ✅-gated) or an IDE handoff (`uno-maintain`, where migrations/diff/review live); **Figma** = *no MCP at all* — its hosted MCP is a closed catalog (only Figma-approved clients like Claude Code/Cursor/VS Code connect; a custom Worker 403s) and the local MCP needs a desktop app, so the bot grounds Figma from the Notion docs that reference it and routes real Figma work to the IDE. The `ntn_` REST key remains Notion's write path + the read fallback when the MCP token isn't set.

## Write-surface allowlist

The agent writes ONLY to these named surfaces. Adding a surface is a uno-maintain change to this list, never an inline decision.

| Surface | Who writes | Notes |
|---|---|---|
| Roadmap DB (`2fc01241-1bb5-4770-af51-d5a050bddb75`, data source `7fba5c35-da73-4c40-ac42-1c13db7794de`) | human creates; uno updates status/properties/links | the single task board; design + dev kanbans are views |
| PRD pages | uno drafts; human owns | PRD template, Stage: exploring / converging / committed |
| Project hub → Research page | uno writes (IDE-only) | deep research findings/study guides land on the hub's Research subpage — not a separate DB, and not a bot surface |
| Decision logs (per project) | uno logs at publish; human appends | thread conclusions land here before threads resolve |
| Spec pages / Handoff Specs | uno drafts from template | "Figma shows what it looks like; this page holds how it behaves and what done means" |
| notion-marketplace DB (`397b7cca-4982-8002-826c-c45e2baa8e4f`, data source `397b7cca-4982-80d8-9967-000b69521ce9`) | uno publishes entries | ✅ live under Design HQ; schema + publish procedure in `skills/uno-publish/references/notion-marketplace-db.md` |
| Eval Runs DB | uno writes at flow exits | ⚠️ DB setup pending — interim: `docs/evals/runs/*.jsonl` |

## Read radar — other workspace DBs (READ-only grounding, never written by uno)

Under the workspace's **Content Management Systems** page — useful context for grounding (via Notion MCP reads), but uno never writes to them:

| DB | ID | Use when grounding |
|---|---|---|
| Team Member Database | `134b7cca-4982-801d-a91d-d678e79d6e27` | roster / experts (the `notion_search` scope: "team" source) |
| News | `18ab7cca-4982-805d-b4ab-000b8277e344` (ds) | product announcements, what shipped |
| Success Stories | `4e0c4f73-6bfb-4d13-a0cf-6fa7be0020cb` (ds) | customer proof, outcomes |
| Research Papers | `84e77efd-02ef-4fa2-b181-f7381806f678` (ds) | prior research to cite before re-running it |
| Banners | `36eb7cca-4982-8167-a9f9-000b31c6ec98` (ds) | live in-product banner copy/state |

## Roadmap DB rules (every card write)

- `Contributor` — mandatory, never blank. Default: Bill + everyone mentioned in the source context.
- `Product Pillar` — always tag the most relevant existing pillar(s); the pillar maps to a Slack channel (`slack.md`).
- `Feature / Initiative` + `OKR` — link the most relevant **existing** entry. If nothing fits, leave blank + flag in the body.
- **Never create select options, pillars, features, or OKRs.** ⚠️ Notion silently auto-creates select options on any name mismatch — fetch the schema and exact-match option names before every write.
- `Current Team` routes the card to kanbans; PRD accepted → move to `Design Status: Ready for Design`.
- Urgency = existing `Priority: Critical` — no separate lane. Maintenance intake = card on this DB with `Product Pillar: Universal` + `Product Tag: Maintenance`, surfaced via a filtered view — **not** a separate DB. ⚠️ Both `Universal` and `Maintenance` must already exist as options on the schema (add `Maintenance` to the `Product Tag` multi-select in the Notion UI once); the bot exact-matches them and never auto-creates.

<!-- ide-only -->
<!-- Project-hub authoring + Notion-block/enhanced-markdown mechanics below are
     writers/notion (in-IDE) concerns — the bot writes only structured
     notion_create/update params, never raw hub blocks. Stripped from the bot's
     system prompt at assembly (src/agent/skills.ts stripIdeOnly); kept here as
     the single source for the IDE agent. -->
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
<!-- /ide-only -->
