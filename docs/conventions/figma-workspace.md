# Figma Workspace Conventions

<!--
status: canonical — this file IS the convention (ADR-017; the Notion 🎨 Figma Workspace Playbook is superseded; ⏳ still pending reconcile with the "How we Fig" deck)
distilled: 2026-07-07 from https://app.notion.com/p/396b7cca49828171a4ffcd841c4d0d2f
rule: on conflict with any legacy Notion playbook page, this file wins — file a uno-maintain intake to banner the page as superseded.
applied by: agents/writers/figma
-->

## Canvas vs comments

- **Canvas text + Dev Mode annotations = agent-readable context.** Anything the agent (or a future reader) needs to do the job goes on the canvas, never only in a comment.
- **Comment pins = human-only dialogue.** The agent does not read Figma comments by default.

## Annotation category labels

Every annotation carries one category label: `Interaction` · `Content` · `Layout` · `Token-Style` · `Behavior` · `Accessibility`. Handoff notes are annotations with the relevant category — written per `writing-style.md`.

## Placement / lifecycle prefixes (frames & sections — about WHERE work lives, not what it says)

`[wip]` exploration in progress · `[spec]` the buildable spec (library components only, no detached instances) · `[replica]` mirror of a shipped/shared prototype for markup (required whenever a prototype is shared) · `[archive]` superseded, kept for history.

## File & page structure

- File naming: `<Pillar> · <Project> · RM-<cardID>` — **RM-ID is the Figma↔Notion join key.** Never fork `-v2` files; version inside the file.
- Pages, numbered: `0 Cover` · `1 Official` · `2 Playground` · `3 Archive`. Official holds only `[spec]`-grade work.
- Figma projects mirror Product Pillars. DS file: one page of local components per pillar.

## Agent duties in the workspace

Create/maintain `[replica]` frames on publish; keep `[spec]` frames library-pure; apply naming + prefixes on every frame it creates; deep-link to node-ids (never file roots) when citing. Monthly hygiene sweep (via `reviewers/auditor`): flag unlabeled frames in Official, `[wip]` >30 days, `[replica]` frames with dead prototype links, detached instances in `[spec]` frames.
