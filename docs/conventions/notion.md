# Notion Conventions

<!-- canonical per ADR-017 (docs/knowledge/decisions.md): this file IS the convention; the legacy Notion 📓 Doc-Management Playbook is superseded and loses on conflict. Distilled 2026-07-07 · Decisions DB + New Project hub aligned 2026-07-13 · read-radar catalog scopes 2026-07-13 · applied by writers/notion. -->

## Access paths — reads vs writes (uno-bot Worker)

**One credential, REST for both** — the `ntn_` internal integration key (`NOTION_API_KEY`), workspace-scoped and non-expiring:

- **Reads** (grounding: `notion_search`, `roadmap_query`, source lookups) → the bot's REST read code. No gate needed — reads never mutate state.
- **Writes** (`notion_create`, `notion_update`, `notion_archive`) → the bot's **own gated tools**, intercepted by the proposal gate — nothing writes without the requester's ✅.

**Hosted Notion MCP — READS only (adopted 2026-07-09).** Reads may now come from the hosted Notion MCP (`mcp.notion.com`), attached to the Worker's Anthropic call **read-only** via an `mcp_toolset` allowlist (`agents/uno-bot/src/agent/mcp.ts`, beta `mcp-client-2025-11-20`) — the same rich Notion read surface the IDE uses. Auth is **OAuth 2.1** (`src/oauth/notion.ts`): `mcp.notion.com` is its own authorization server (PKCE + RFC-7591 dynamic client registration — verified via its `/.well-known/oauth-*` metadata and Notion's docs), so the classic `ntn_` token does **not** authenticate it. A human does the browser consent once at `/oauth/notion/start`; the access + refresh tokens live in KV and the Worker refreshes silently.

⚠️ **The MCP-write principle (cross-service, not just Notion).** Inline MCP tools execute server-side during the turn, so any tool exposed via MCP bypasses the ✅ proposal gate. Therefore a write goes **direct via MCP only if it wouldn't need the gate anyway** — i.e. reversible + low-blast-radius, like Slack messaging (the bot's native medium, already ungated for replies). **Consequential / outward / irreversible writes stay hard-gated bot tools, never MCP:** Notion artifacts (`notion_create`/`update`/`archive`) and email. Per current decisions: **Slack** = reads + messaging writes direct via MCP; **Notion** = reads via MCP, writes gated; **Supabase** = reads only (the MCP URL pins server-enforced `read_only=true`) — **the bot has NO blueprint write path at all**: a blueprint-change ask becomes a maintenance intake ticket (`notion_create` intake, ✅-gated) or an IDE handoff (`uno-maintain`, where migrations/diff/review live); **Figma** = *no MCP at all* — its hosted MCP is a closed catalog (only Figma-approved clients like Claude Code/Cursor/VS Code connect; a custom Worker 403s) and the local MCP needs a desktop app, so the bot grounds Figma from the Notion docs that reference it and routes real Figma work to the IDE. The `ntn_` REST key remains Notion's write path + the read fallback when the MCP token isn't set.

## Write surfaces

uno can update properties and append content on **any page or database it's shared on** (Roadmap cards, Decisions DB rows, per-person running-notes pages, any DB) via `notion_update` / `notion_archive` — always behind the requester's ✅. `notion_update` reads the target's live schema and writes each property by its real type (status, select, multi_select, date, people, relation, number, checkbox, url, text…), matching your property name case/space/underscore-insensitively — so there's no hardcoded surface fence and no need to guess a type. It still never invents a select/status option: a value that isn't an existing option is reported back, not created.

**Still OUT of scope from Slack** (no Notion-API path, or too structural for a one-shot gated write) — creating a **database**, creating or editing a **view** (the API can't make views at all), creating select options / pillars / OKRs, and any **blueprint** write. Those become a maintenance intake ticket (✅-gated `notion_create`) or an `uno-maintain` IDE handoff — offer that, don't attempt it inline.

The surfaces below are the **common ones with house conventions** — follow the convention when writing them; the table is guidance, not a permission fence. Safety is the ✅ gate + exact-match selects — not a hardcoded DB allowlist.

| Surface | Who writes | Notes |
|---|---|---|
| Roadmap DB (`2fc01241-1bb5-4770-af51-d5a050bddb75`, data source `7fba5c35-da73-4c40-ac42-1c13db7794de`) | human creates; uno updates status/properties/links | the single task board; design + dev kanbans are views |
| Decisions DB (`6279ea4a-cd84-4d51-90e1-e6b6af53bb19`, data source `b71eb1af-550a-482a-b6b5-103c1d2e0a1e`) | uno logs at publish / thread close; human owns | under Design HQ; dual relation → Roadmap card **Decisions**; see § Decisions DB |
| PRD pages | uno drafts; human owns | PRD template, Stage: exploring / converging / committed |
| Project hub → Research page | uno writes (IDE-only) | deep research findings/study guides land on the hub's Research subpage — not a separate DB, and not a bot surface |
| Spec pages / Handoff Specs | uno drafts from template | "Figma shows what it looks like; this page holds how it behaves and what done means" |
| notion-marketplace DB (`397b7cca-4982-8002-826c-c45e2baa8e4f`, data source `397b7cca-4982-80d8-9967-000b69521ce9`) | uno publishes entries | ✅ live under Design HQ; schema + publish procedure in `skills/uno-publish/references/notion-marketplace-db.md` |
| Eval Runs DB | uno writes at flow exits | ⚠️ DB setup pending — interim: `docs/evals/runs/*.jsonl` |

⚠️ **Obsolete:** per-project **Decision Log** subpages under Pages. Do not create or append to them. Existing Decision Logs stay under an Obsolete toggle for provenance only.

## Decisions DB

Canonical decision log for the design org. One row per durable decision; lineage via **Roadmap Card** (pillar / card ID live on the Roadmap card — not duplicated on the decision).

| Property | Type | Rules |
|---|---|---|
| **Name** | title | One-line decision statement |
| **Status** | select | `Proposed` · `Accepted` · `Rejected` · `Superseded` — exact-match only |
| **Owner** | people | Decision driver |
| **Sign-off** | people | Approvers (optional until Accepted) |
| **Date** | date | When decided / proposed |
| **Roadmap Card** | relation → Roadmap | **Required** for project decisions; dual → card's **Decisions** |
| **Evidence** | url | **Primary** backtrack link — Slack thread, Figma comment, Zoom recording/transcript/summary, Loom. Extra sources go in the page body |

**Body shape** (narrative on the decision page):

- **Decision:** one sentence
- **Why:** rationale + rejected alternatives
- **Source / Evidence:** cite what **Evidence** URL points at; add secondary links here
- **Affects:** screens / components / R-IDs when known

**Bot:** `notion_create` surface `decision` (✅-gated) — requires `title` + `properties.roadmap_card` (page URL/id); set `Status` (default `Proposed`), `Evidence` via `source_url` or `properties.evidence`, and body sections. **IDE:** `writers/notion` creates/updates the same schema via Notion MCP.

**Hub embeds:** linked Decisions views filter **Roadmap Card contains This page** (set once in Notion UI — API can't set self-page filters). Running notes: team template filters Status = Proposed; 1:1 filters Active (Proposed + Accepted) ± Owner.

## Read radar — other workspace DBs (READ-only grounding)

Useful context for grounding via `notion_search` catalog scopes (or Notion MCP in-IDE). uno reads these as a matter of course and doesn't write them unless a human explicitly asks (✅-gated). Each row lists the **DATABASE id** (what the Worker queries) — not the data-source id.

| DB | Database ID | `notion_search` scope | Use when grounding |
|---|---|---|---|
| Team Member Database | `134b7cca-4982-801d-a91d-d678e79d6e27` | `team` | roster / experts |
| Third Party Applications | `207b7cca-4982-801b-a80f-e7e1c69c3d3c` | `apps` | who grants access to a tool |
| Decisions DB | `6279ea4a-cd84-4d51-90e1-e6b6af53bb19` | `decisions` | durable decisions (also a write surface) |
| Tutor Help Center Content | `24dadbad-35c8-47fa-8b3d-48a28184bdd5` | `help_tutors` | tutor-facing help articles (skips Tasks Tracker rows on this parent) |
| Teacher Help Center Articles | `379b7cca-4982-800b-ae0f-ed31e7c0ec78` | `help_teachers` | teacher-facing help articles (structured Topic/Feature schema) |
| Help Center Articles Dev Page | `364b7cca-4982-804a-9975-f803d6155fc6` | `help_articles_dev` | teacher HC draft/library sibling under Teacher Training → Help Center Articles |
| Prototype Marketplace | `397b7cca-4982-8002-826c-c45e2baa8e4f` | `marketplace` | prototype catalog search (publish is in-IDE) |
| Design Running Notes | `3ee43141-b0ce-4517-badc-cb52a7b97bdb` | `running_notes` | per-person / team design notes |
| News | `18ab7cca-4982-80b7-9168-db5c5ab201e9` | `news` | product announcements, what shipped |
| Success Stories | `55c702c6-18dd-4b5c-8cea-eac797c02257` | `success_stories` | customer proof, outcomes |
| Research Papers | `85af6f14-7e96-4ed7-aa92-687579a14b4f` | `research_papers` | prior research to cite before re-running |
| Banners | `36eb7cca-4982-81f4-ad99-e53e62d9506a` | `banners` | live in-product banner copy/state |

**Not tracked** (deliberate — noise or wrong owner for bot grounding): Tasks Tracker on HC Content, Content HQ editorial / meeting / social DBs, demo pages. Use `scope: "any"` only as a last resort when the surface is unknown.

**Findability rule:** access ≠ search. Workspace `/v1/search` is weak inside known DBs — prefer the catalog scope (direct `databases/{id}/query`). Empty results usually mean the DB isn't shared with the uno-bot Notion integration (Connections), not that the row doesn't exist.

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

Live template: **New Project** (Roadmap 🧩 Templates). Maintenance Intake is the thinner sibling for Universal/Maintenance cards.

**TLDR** (2–4 sentences — what it is · for whom · where it stands · what direction changed; orientation only — no people, no links) → **People** (role-labelled @-mentions, one per line) → **Latest progress** (**Now** / **Next** / **Blocked** as bold-labelled lines, then a *Past progress* accordion of dated status-pulse bullets — nothing spills) → **Pages** (contiguous inline subpages: PRD · Handoff Spec · Rollout · Meeting Notes · Research · Archive — **no Decision Log**) → **Decisions** (linked Decisions DB view filtered to this card; tip: Roadmap Card → Contains → This page) → **Key references** (fit-page-width table: Type · Link · Notes) → **Doc Changelog** (*Show history* toggle).

- **TLDR is the top anchor** — the single thing a card-picker must read. No placeholder callout above it.
- **Latest progress = status pulse, not rationale.** What changed / where it stands — no *whys*. Durable whys and rejected alternatives live in **Decisions DB** (cited by R-ID at handoff). A bullet that explains *why* belongs there, not here.
- **Decisions** is the canonical decision log — not a Pages subpage. Do not recreate Decision Log under Pages; mark any leftover Decision Log under Obsolete.
- **Pages** pre-creates subpages (PRD · Handoff Spec · Rollout · Meeting Notes · Research · Archive), each seeded with its skeleton. **Meeting Notes** holds raw capture — recordings, Zoom links, AI summaries, scratch — distinct from PRD/Findings and Decisions. Mark a not-yet-relevant subpage "N/A until [stage]" rather than deleting it.
- **Doc Changelog** records the *document's* maintenance (restructures, pages added/moved/superseded) — never project progress, never formatting polish.
- **Toggles:** title them plainly ("Show history" / "Past progress") — Notion renders the arrow itself, so never prefix a ▸.
- Status lives in card **properties**, never a body callout or a header dot-spacer block.
- People = @-mentions, **one role per line**; only workspace members are mentionable.
- Structure with **dividers** between sections. A **callout** is reserved for a single **atomic** live alert inline in Latest progress — never a standing placeholder, never multi-line.
- Templates live in Notion 🧩 Templates; the live **New Project** template carries the real blocks. Reference them, never duplicate their bodies.

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
