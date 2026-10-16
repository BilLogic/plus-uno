---
embodiment: all
disclosure: reference
summary: How a Notion page body is written, disclosed — the Markdown the Worker turns into blocks, attribution, the project-hub golden sections, the comments protocol and the API's markdown quirks
description: writing or correcting a Notion page body, a PRD, a decision page or a project hub — the Markdown that becomes blocks, the attribution line, the hub's golden sections, comments and the API's quirks; read before drafting a body for notion_create or notion_update.
---

# Writing a Notion page

<!-- canonical per ADR-017 (docs/adr/) · split 2026-10-14 out of the Notion connector doc, whose always-loaded half is overview.md beside this file; the hub sections, comments and quirks were IDE-only until then · applied by uno-bot and writers/notion. -->

## Writing a body — bot tools (`notion_create`, `notion_update`)

**Write standard Markdown**, the same dialect as everywhere else (`docs/connectors/slack/overview.md` § Message formatting). The Worker parses it into real Notion blocks — `agents/uno-bot/src/integrations/notion-blocks.ts`.

| Write | Becomes |
|---|---|
| `**bold**` · `_italic_` · `` `code` `` · `~~strike~~` | rich-text annotations |
| `[label](url)` | a real link (http/https/mailto; any other scheme degrades to `label (url)`) |
| `- item` / `* item` | `bulleted_list_item` (indent two spaces for one level of nesting) |
| `1. item` | `numbered_list_item` |
| `- [ ]` / `- [x]` | `to_do`, unchecked / checked |
| `> quote` | `quote` (consecutive `>` lines merge into one) |
| ```` ```ts ```` fenced | `code` with the language set (unknown tag → plain text) |
| `---` | `divider` |
| `#`, `##`, `###` | `heading_3` — one level below the section heading containing it |
| blank line | a new paragraph block |
| a `\|` table | **a real Notion table** — header row flagged, cells parsed for inline markup |

**Write the full document.** The Worker handles Notion's two size limits: a text run caps at ~1,900 characters, so a long paragraph splits across blocks, and a request takes 100 blocks, so a long PRD is created in batches.

**Tables land as real tables** (2026-08-22). The header row sets the column count and every data row is padded or truncated to match: Notion rejects the *entire request* when a row's cell count differs from `table_width`, and an unescaped `|` inside a cell is what makes a row ragged, so escape it as `\|`.

**Attribution.** A page the bot creates, and each run of blocks it appends, opens with the line "Written by le goat on behalf of {name}", {name} being the requester's Slack display name (on a Worker-staged card, whoever pressed ✅). The Worker adds it, so a body starts with its own first line. A `replace` or `insert` edits a human's text where it stands and a property change writes no body, so those carry no line.

**Headings inside a body are `heading_3` on purpose.** Section headings own `heading_2`, and `fetchNotionPRD` walks that outline downstream to find Acceptance Criteria and Implementation Notes. A `##` inside a section body is subordinate to its section and renders that way.

*(Until 2026-08-22 a body was split on blank lines into plain paragraphs with no parsing, so the `**Decision:** one sentence` shape landed on the page as literal asterisks and every bullet as a literal hyphen. The parser above is the fix.)*

## Project-hub golden sections (in order)

Live template: **New Project** (Roadmap 🧩 Templates). Maintenance Intake is the thinner sibling for Universal/Maintenance cards.

**TLDR** (2–4 sentences — what it is · for whom · where it stands · what direction changed; orientation only, so people and links sit in their own sections) → **People** (role-labeled @-mentions, one per line) → **Latest progress** (**Now** / **Next** / **Blocked** as bold-labeled lines, then a *Past progress* accordion of dated status-pulse bullets, so the section stays short) → **Pages** (contiguous inline subpages: PRD · Handoff Spec · Rollout · Meeting Notes · Research · Archive) → **Decisions** (linked Decisions DB view filtered to this card; tip: Roadmap Card → Contains → This page) → **Key references** (fit-page-width table: Type · Link · Notes) → **Doc Changelog** (*Show history* toggle).

- **TLDR is the top anchor** — the single thing a card-picker must read, first on the page.
- **Latest progress = status pulse.** What changed and where it stands. Durable whys and rejected alternatives live in **Decisions DB** (cited by R-ID at handoff), so a bullet that explains *why* moves there.
- **Decisions** is the canonical decision log, as the linked view. A leftover Decision Log subpage goes under Obsolete.
- **Pages** pre-creates subpages (PRD · Handoff Spec · Rollout · Meeting Notes · Research · Archive), each seeded with its skeleton. **Meeting Notes** holds raw capture — recordings, Zoom links, AI summaries, scratch — distinct from PRD/Findings and Decisions. A not-yet-relevant subpage stays, marked "N/A until [stage]".
- **Doc Changelog** records the *document's* maintenance (restructures, pages added, moved or superseded); project progress lives in Latest progress.
- **Toggles:** title them plainly ("Show history" / "Past progress"); Notion renders the arrow itself.
- Status lives in card **properties**.
- People = @-mentions, **one role per line**; only workspace members are mentionable.
- Structure with **dividers** between sections. A **callout** holds one **atomic** live alert, inline in Latest progress, one line long.
- Templates live in Notion 🧩 Templates; the live **New Project** template carries the real blocks. Link to them by reference.

## Comments protocol

Suggestions *about* existing content (including the agent's own) go in **comments anchored to the block** — resolvable: accept → apply + resolve; reject → reply why + resolve. The agent sweeps unresolved threads on each flow run touching the page + at the monthly retro. Proposed *content* that must be readable in place = yellow highlight + `⏳ PENDING REVIEW:` text marker (yellow is invisible via API — the marker is the binding signal). **Binding information lives on the page**; a comment points at it.

## Enhanced-markdown quirks (API writes)

- **A page's emoji goes in its icon field**, and the title text stays plain; the same for database titles. Emoji in section *headings* (body blocks) is fine — those have no icon field.
- **Link to internal pages and docs with a page mention.** Its styling (icon + live title, updated on rename) reads better than a bare URL and stays current. Markdown hyperlinks are for external URLs.
- Mentions: `<mention-user url="user://<user-id>"/>` — the `id=` attribute silently drops. Verify membership via the users API first.
- Embeds are manual via the API: write a plain link + 📌 placeholder, and a human converts it to an embed. Pair every embed with a plain link, since the API reads embeds as blank.
- Child-page blocks sit apart from text — group inline subpages in one contiguous run (the Pages section).
- Multi-line callout text writes back as stacked one-line fragments — keep callouts atomic.
- Databases for tracked items with a lifecycle; inline simple tables for static reference (fit-to-page-width is a manual toggle).
