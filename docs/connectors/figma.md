---
embodiment: all
summary: Every annotation carries one category label: Interaction · Content · Layout · Token-Style · Behavior · Accessibility
---

# Figma Workspace Conventions

<!-- canonical per ADR-017 (docs/adr/); supersedes the Notion 🎨 Figma Workspace Playbook (⏳ still pending reconcile with the "How we Fig" deck). Distilled 2026-07-07 · applied by writers/figma. -->

## Canvas vs comments

- **Canvas text + Dev Mode annotations = agent-readable context.** Anything the agent (or a future reader) needs to do the job goes on the canvas, never only in a comment.
- **Comment pins = human-only dialogue.** The agent does not read Figma comments by default.

## Annotation category labels

Every annotation carries one category label: `Interaction` · `Content` · `Layout` · `Token-Style` · `Behavior` · `Accessibility`. Handoff notes are annotations with the relevant category — written per `docs/conventions/writing.md`.

## Placement / lifecycle prefixes (frames & sections — about WHERE work lives, not what it says)

`[wip]` exploration in progress · `[spec]` the buildable spec (library components only, no detached instances) · `[replica]` mirror of a shipped/shared prototype for markup (required whenever a prototype is shared) · `[archive]` superseded, kept for history.

## File & page structure

- File naming: `<Pillar> · <Project> · RM-<cardID>` — **RM-ID is the Figma↔Notion join key.** Never fork `-v2` files; version inside the file.
- Pages, numbered: `0 Cover` · `1 Official` · `2 Playground` · `3 Archive`. Official holds only `[spec]`-grade work.
- Figma projects mirror Product Pillars. DS file: one page of local components per pillar.

## Agent duties in the workspace

Create/maintain `[replica]` frames on publish; keep `[spec]` frames library-pure; apply naming + prefixes on every frame it creates; deep-link to node-ids (never file roots) when citing. Monthly hygiene sweep (via `reviewers/auditor`): flag unlabeled frames in Official, `[wip]` >30 days, `[replica]` frames with dead prototype links, detached instances in `[spec]` frames.

<!-- ide-only -->
<!-- Reference for humans and the in-IDE agent, kept OUT of the Worker's bundle.
     The operative sentences the bot needs are in agents/uno-bot/AGENT.md § My lane,
     which ships in the prompt; this is the long form nobody needs mid-reply, and the
     assembled bundle had 770 chars of headroom when it was written. -->

## uno-bot's Figma reach — what it has, and where it stops

The conventions above are the workspace's. This section is the Worker's, and it exists because the harness said three things about it that were not true: that Figma was IDE-only (the *MCP* is; Figma is not), that a pasted frame arrives as a human's screenshot (the Worker renders it itself), and that tokens and measurements are unreachable (the response carries them; our reader drops them). A capability written down wrong is worse than one not written down — a reader argues with the second and obeys the first.

**Auth:** `FIGMA_ACCESS_TOKEN`, a REST personal token, plus `FIGMA_FILE_KEY` for the DS library. **No MCP anywhere.** Three endpoints, all `/v1`.

| Can | Where | Limits |
|---|---|---|
| **See a frame as an image** — the Worker renders it, no human screenshot needed | `slack/vision.ts` via `/v1/images` | the **first** frame link with a `node-id` in the message, **one per message**, scale 1, ≤3.5MB, **that turn only** |
| See human-pasted images | `slack/vision.ts` | ≤3 files, png/jpeg/gif/webp, ≤3.5MB each |
| Read a frame's **name**, **node type**, **text layers** | `source_read` → `integrations/figma.ts` | ≤200 text layers, and it reports when it truncated |
| Render the frame into the ✅ proposal card | `slack/proposal-render.ts` | — |
| Notice DS-library component adds/removes/renames and version publishes, post the card, open a PRD | `figma-poll.ts`, cron | `FIGMA_FILE_KEY` only; subrequest-budgeted |
| Hand a frame to a GitHub Action that does the real Figma-to-code work | `prototype_scaffold` / `component_implement` | the runner has depth the Worker doesn't; output is a code PR |

**Out of reach because we drop it, rather than because Figma withholds it.** `/v1/files/:key/nodes` returns `fills`, `boundVariables` and `absoluteBoundingBox`; `fetchFigmaNode` keeps name, type and text. So a token, a colour or a measurement is **unread, not absent**, and saying "this frame uses no token" would be a claim about our reader wearing the costume of a claim about the design.

**Out of reach, genuinely — the API has no route to it here.** No write to Figma (there is not one POST in the codebase). No comment reads. No file browsing: a link without a `node-id` yields nothing. More than one frame per message. Any memory of an image past the turn it arrived in.

**Not Storybook either.** It is client-rendered and the Worker has no browser — `source_read` fetches and strips tags, so a docs page comes back as the shell and a font declaration. `index.json` is real but 753KB against an 8,000-char cap. **A DS fact is checked against GitHub**; Storybook is a link the bot hands a human, not a source it reads.

**What this means in a reply.** Every one of these limits is stated with its cause and the next route — *what I couldn't do, the hard reason, what you can do instead*. "I can't read the token off that frame; the Worker drops Figma's binding data. Paste the component name and I'll read the value out of `design-system/src/tokens/`." A limit named that way teaches someone how to ask next time; a bare "I can't" teaches them the bot is unreliable.
<!-- /ide-only -->
