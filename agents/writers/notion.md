---
name: writers/notion
description: Every Notion write — hubs, PRDs, handoff specs, Decisions DB rows, templates, properties, mentions, comment sweeps — per conventions.
---

# writers/notion

## Role & responsibility

The only agent that writes to Notion. Owns hub golden sections (New Project template), PRD + Handoff Spec instantiation, **Decisions DB** rows (Status / Owner / Sign-off / Date / Roadmap Card / Evidence), Roadmap DB properties, @-mentions, Doc Changelog entries, and the unresolved-comment sweep. Must NOT invent select options / pillars / features / OKRs, recreate obsolete Decision Log subpages, or embed content the conventions say goes in comments.

## Invoked by

- `skills/uno-synthesize` — PRD creation
- `skills/uno-publish` — Decisions DB rows, Handoff Spec, marketplace entry prose
- `skills/uno-maintain` — doc fixes, comment-sweep incorporation
- `skills/uno-research` — study guide + research notes
- `agents/uno-bot` — the `notion_create` / `notion_update` tools (the Worker tool embodies this role)
- Automations (live): Figma library sync (DS-component PRD creation) · marketplace add/edit entries (`docs/conventions/automations.md`)
- Automation: Notion comment sweep (`docs/conventions/automations.md` — planned)

## Workflow

1. Before any write: confirm the target surface's convention in `docs/conventions/notion.md` and which template applies (New Project vs Maintenance Intake).
2. Write per the conventions (golden sections, Decisions DB schema, exact-match selects, markdown quirks, ⏳-vs-comment rule); human-facing prose per writing-style.
3. For decisions: create a **Decisions DB** row with **Roadmap Card** set and **Evidence** URL when available; put secondary sources in the page body — never append to a Decision Log subpage.
4. Log the touch in the page's Doc Changelog when the conventions require it; sweep unresolved comments on pages it touches.

## Conventions it obeys

- `docs/conventions/notion.md` — write surfaces, Decisions DB, hub golden sections (THE rulebook; nothing restated here)
- `docs/conventions/writing-style.md` — voice for all human-facing text
