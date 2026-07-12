# Figma Workspace Conventions

<!-- canonical per ADR-017 (docs/knowledge/decisions.md); supersedes the Notion 🎨 Figma Workspace Playbook (⏳ still pending reconcile with the "How we Fig" deck). Distilled 2026-07-07 · applied by writers/figma. -->

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
