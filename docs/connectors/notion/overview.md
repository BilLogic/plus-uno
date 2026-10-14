---
embodiment: all
summary: Notion's connector overview, always loaded — the one credential and the MCP-write principle, the write surfaces, the Decisions DB, the read radar and the Roadmap card rules; page-writing.md beside it is how a body is written
---

# Notion Conventions

<!-- canonical per ADR-017 (docs/adr/): this folder IS the convention; the legacy Notion 📓 Doc-Management Playbook is superseded and loses on conflict. Distilled 2026-07-07 · Decisions DB + New Project hub aligned 2026-07-13 · read-radar catalog scopes 2026-07-13 · split 2026-10-14 into this overview and page-writing.md · applied by writers/notion. -->

<!-- ide-only -->
This folder is Notion's connector: this overview ships in uno-bot's prompt, and [`page-writing.md`](page-writing.md) — the body dialect, attribution, the project-hub golden sections, the comments protocol and the API's markdown quirks — is disclosed, read through `read_reference` by the name `docs/connectors/notion/page-writing`.
<!-- /ide-only -->

## Access paths — reads vs writes (uno-bot Worker)

**One credential, REST for both** — the `ntn_` internal integration key (`NOTION_API_KEY`), workspace-scoped and non-expiring:

- **Reads** (grounding: `notion_search`, `roadmap_query`, source lookups) → the bot's REST read code, ungated, since a read changes nothing.
- **Writes** (`notion_create`, `notion_update`, `notion_archive`) → the bot's **own gated tools**, intercepted by the proposal gate: each write waits for the requester's ✅.

**The Worker reaches Notion over REST alone.** A hosted-Notion-MCP read path was adopted 2026-07-09 and has since been removed — both model adapters log `mcp=off` and pass no `mcp_toolset`. In-IDE, the Notion MCP connectors (`notion-plus` · `notion-parsnip` · `notion-personal`) are the read surface; that is an IDE capability, not a bot one.

⚠️ **The MCP-write principle (cross-service, not just Notion).** Inline MCP tools execute server-side during the turn, so any tool exposed via MCP bypasses the ✅ proposal gate. Therefore a write goes **direct via MCP only when it needs no gate anyway** — reversible and low-blast-radius, like Slack messaging (the bot's native medium, already ungated for replies). **Consequential, outward or irreversible writes stay hard-gated bot tools:** Notion artifacts (`notion_create`/`update`/`archive`) and email. The rule stands for any future MCP attachment, in either runtime: **Slack** = reads and messaging writes may go direct; **Notion** = reads may go direct, writes stay gated; **Supabase** = reads only (the MCP URL pins server-enforced `read_only=true`) — **the bot's blueprint path is read-only**: a blueprint-change ask becomes a maintenance intake ticket (`notion_create` intake, ✅-gated) or an IDE handoff (`uno-maintain`, where migrations, diff and review live); **Figma** = REST, with its own reach (`docs/connectors/figma/overview.md` § What uno-bot can reach in Figma). The `ntn_` REST key remains Notion's write path and the read fallback when the MCP token is unset.

## Write surfaces

uno can update properties, append content, and rewrite a named block **in place** on **any page or database it's shared on** (Roadmap cards, Decisions DB rows, per-person running-notes pages, any DB) via `notion_update` / `notion_archive` — always behind the requester's ✅. `notion_update` reads the target's live schema and writes each property by its real type (status, select, multi_select, date, people, relation, number, checkbox, url, text…), matching your property name case/space/underscore-insensitively — so the safety is the gate and the schema, not a surface fence, and the type is read rather than guessed. A select or status value is written only when it is an existing option; any other value is reported back as a question.

**Bodies can be corrected in place** (ADR-029, 2026-09-15). `notion_update` takes a `replace` operation: a block id and the `last_edited_time` that the page read reported for that block, plus the new content in the same Markdown shape as an `append`. The write re-reads the block first and **refuses, writing nothing, when the stamp has moved** — the replacement was composed against text that no longer exists, so the answer is "read it again". A replacement that renders to several blocks rewrites the first where it stands and places the rest directly after it. Everything outside the named blocks stays as it was, every block survives, and the ✅ gate stands in front of all of it — the proposal card names how many blocks a replace would rewrite.

Use `replace` when the ask is to *correct* what the page says and `append` when it is to *add* something the page doesn't say yet. A correction made with `replace` leaves the page holding one reading.

**IDE work, offered as a hand-off** (no Notion-API path, or too structural for a one-shot gated write): creating a **database**, creating or editing a **view** (the API can't make views at all), creating select options, pillars or OKRs, and any **blueprint** write. Each becomes a maintenance intake ticket (✅-gated `notion_create`) or an `uno-maintain` IDE handoff.

The surfaces below are the **common ones with house conventions** — follow the convention when writing them; the table is guidance, and safety is the ✅ gate plus exact-match selects.

| Surface | Who writes | Notes |
|---|---|---|
| Roadmap DB (`2fc01241-1bb5-4770-af51-d5a050bddb75`, data source `7fba5c35-da73-4c40-ac42-1c13db7794de`) | human creates; uno updates status/properties/links | the single task board; design + dev kanbans are views |
| Decisions DB (`6279ea4a-cd84-4d51-90e1-e6b6af53bb19`, data source `b71eb1af-550a-482a-b6b5-103c1d2e0a1e`) | uno logs at publish / thread close; human owns | under Design HQ; dual relation → Roadmap card **Decisions**; see § Decisions DB |
| PRD pages | uno drafts; human owns | PRD template, Stage: exploring / converging / committed |
| Project hub → Research page | uno writes (IDE-only) | deep research findings/study guides land on the hub's Research subpage — a subpage, not a separate DB, and IDE work |
| Spec pages / Handoff Specs | uno drafts from template | "Figma shows what it looks like; this page holds how it behaves and what done means" |
| notion-marketplace DB (`397b7cca-4982-8002-826c-c45e2baa8e4f`, data source `397b7cca-4982-80d8-9967-000b69521ce9`) | uno publishes and updates entries, one row per prototype (IDE, or the bot's `notion_create` surface `marketplace`) | ✅ live under Design HQ; schema + publish procedure in `skills/uno-publish/references/notion-marketplace-db.md` |

⚠️ **Obsolete:** per-project **Decision Log** subpages under Pages. A decision goes to the Decisions DB; existing Decision Logs stay under an Obsolete toggle for provenance only.

## Decisions DB

Canonical decision log for the design org. One row per durable decision; lineage via **Roadmap Card** (pillar and card ID live on the Roadmap card, once).

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

**Bot:** `notion_create` surface `decision` (✅-gated) — requires `title` + `properties.roadmap_card` (page URL/id); sets `status` (default `Proposed`), `evidence`, `owner` and `sign_off` (Notion user ids) and body sections. **IDE:** `writers/notion`, same schema via Notion MCP.

**Hub embeds:** linked Decisions views filter **Roadmap Card contains This page** (set once in Notion UI — the API can't set self-page filters). Running notes: team template filters Status = Proposed; 1:1 filters Active (Proposed + Accepted) ± Owner.

## Read radar — other workspace DBs (READ-only grounding)

Useful context for grounding via `notion_search` catalog scopes (or Notion MCP in-IDE). uno reads these as a matter of course and writes one only when a human explicitly asks (✅-gated). Each row lists the **DATABASE id** (what the Worker queries), the one to use over the data-source id.

⚠️ **`running_notes` is team-readable but personal.** 1:1 / running-notes rows get the same discretion as private Slack content (AGENT.md "Personal Notion notes"): summarize neutrally, and for highly sensitive personal specifics (visa/immigration, comp, health, performance/PIP, hardship) decline and point to the person or their manager.

| DB | Database ID | `notion_search` scope | Use when grounding |
|---|---|---|---|
| Team Member Database | `134b7cca-4982-801d-a91d-d678e79d6e27` | `team` | roster / experts |
| Third Party Applications | `207b7cca-4982-801b-a80f-e7e1c69c3d3c` | `apps` | who grants access to a tool |
| Decisions DB | `6279ea4a-cd84-4d51-90e1-e6b6af53bb19` | `decisions` | durable decisions (also a write surface) |
| Tutor Help Center Content | `24dadbad-35c8-47fa-8b3d-48a28184bdd5` | `help_tutors` | tutor-facing help articles (skips Tasks Tracker rows on this parent) |
| Teacher Help Center Articles | `379b7cca-4982-800b-ae0f-ed31e7c0ec78` | `help_teachers` | teacher-facing help articles |
| Prototype Marketplace | `397b7cca-4982-8002-826c-c45e2baa8e4f` | `marketplace` | prototype catalog search (also a write surface) |
| Design Running Notes | `3ee43141-b0ce-4517-badc-cb52a7b97bdb` | `running_notes` | per-person / team design notes |
| News | `18ab7cca-4982-80b7-9168-db5c5ab201e9` | `news` | product announcements, what shipped |
| Success Stories | `55c702c6-18dd-4b5c-8cea-eac797c02257` | `success_stories` | customer proof, outcomes |
| Research Papers | `85af6f14-7e96-4ed7-aa92-687579a14b4f` | `research_papers` | prior research to cite before re-running |
| Banners | `36eb7cca-4982-81f4-ad99-e53e62d9506a` | `banners` | live in-product banner copy/state |

**Team Member Database › Figma User ID** (rich_text) is optional, and each member fills in their own. It lets a Figma commenter be matched to a teammate. To find your id, open figma.com signed in and copy the number after `fuid=` in the address bar; pasting the whole URL works too.

**Untracked on purpose** (noise, or the wrong owner for bot grounding): Help Center Articles Dev Page, Tasks Tracker on HC Content, Content HQ editorial / meeting / social DBs, demo pages. `scope: "any"` is the last resort, for a surface that is unknown.

**Findability rule:** access ≠ search. Workspace `/v1/search` is weak inside known DBs — prefer the catalog scope (direct `databases/{id}/query`). Empty results usually mean the DB is unshared with the uno-bot Notion integration (Connections), rather than that the row is missing.

## Roadmap DB rules (every card write)

- `Contributor` — mandatory and filled. Default: Bill + everyone mentioned in the source context.
- `Product Pillar` — always tag the most relevant existing pillar(s); the pillar maps to a Slack channel (`docs/connectors/slack/overview.md` § Channels).
- `Feature / Initiative` + `OKR` — link the most relevant **existing** entry. If nothing fits, leave it blank and flag it in the body.
- **Select options, pillars, features and OKRs are exact-matched against what the schema already offers.** ⚠️ Notion silently auto-creates a select option on any name mismatch, so fetch the schema and match option names exactly before every write.
- `Current Team` routes the card to kanbans; PRD accepted → move to `Design Status: Ready for Design`.
- Urgency = existing `Priority: Critical`, the one urgency lane. Maintenance intake = card on this DB with `Product Pillar: Universal` + `Product Tag: Maintenance`, surfaced via a filtered view of this board. ⚠️ Both `Universal` and `Maintenance` must already exist as options on the schema (add `Maintenance` to the `Product Tag` multi-select in the Notion UI once); the bot exact-matches them.
