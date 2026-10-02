---
embodiment: all
summary: PLUS Figma files follow How We Fig — five stage folders per team, `<Project> / Card <n> & <m> / <designers>` titles, six divider page sections; an agent suggests a rename or a move and a person makes it
---

# Figma Workspace Conventions

<!-- canonical per ADR-017 (docs/adr/) · supersedes the Notion 🎨 Figma Workspace Playbook · distilled 2026-07-07, rewritten 2026-10-01 to the team's How We Fig guide from #881's probe of the six teams and #891 · applied by writers/figma. -->

## Canvas vs comments

- **Canvas text + Dev Mode annotations = agent-readable context.** Anything the agent (or a future reader) needs to do the job goes on the canvas, never only in a comment.
- **Comment pins = human-only dialogue.** The agent does not read Figma comments by default.

## Annotation category labels

Every annotation carries one category label: `Interaction` · `Content` · `Layout` · `Token-Style` · `Behavior` · `Accessibility`. Handoff notes are annotations with the relevant category — written per `docs/conventions/writing.md`.

## Teams and stage folders

The workspace is six Figma teams: Universal, Training, Toolkit, Admin, Others and MISC. Each team has five stage folders. A file moves between them with its card, whose stage is read from `Design Status` together with `Dev Status`:

| Folder | The card is |
|---|---|
| Playground | `Need PRD / Under Playground` |
| WIP | `Ready for Design`, `WIP` or `Under Review` |
| Under-Dev | `Under Dev`. A file for Under-Dev work may also sit in Specs |
| Specs | `Shipped`, or `Dev Status: Deployed` whatever its Design Status says |
| Archive | `Archived` |

MISC holds workshop, onboarding and event files, and sits outside the scheme.

## File titles

A card's file is titled `<Project> / Card <n> & <m> / <designers>`, e.g. `AI Indicator / Card 733 & 1002 / <designers>`. `Card <n>` is the Roadmap card's number, the `<n>` of its RM-ID, and it is how a file joins its card in Notion. A file for several cards lists every one, joined by `&`.

- Work from before the Roadmap is titled `<Project> / Legacy / <term>`.
- Libraries, templates and reference kits keep plain names, e.g. `Design System (S23)`.
- A bare number (`… / 2204 & 2251 / …`) or the `Card #` placeholder is corrected to the full form.

## Page sections

Inside a file, pages sit under six divider pages, named exactly `- - - 🖼️ Cover - - -`, `- - - 📐 Specs - - -`, `- - - ⏳ WIP - - -`, `- - - 🕹️ Playground - - -`, `- - - 🔍 For Review - - -` and `- - - 🗂️ Archive - - -`.

- A page belongs to the section of the last divider above it, and a frame's stage is its page's section. Frames carry no stage prefix.
- A section with no work yet holds a placeholder page, `A page here`. Blank-named pages are spacers.

## Agent duties in the workspace

- Cite a frame by its node-id deep link, never the file root.
- Put new work on a page under the divider for its stage.
- A person renames or moves a file. An agent that finds a title or folder wrong writes out the exact new one, ready to paste, because no Figma API renames or moves a file.

The hygiene checklist covers every file outside MISC and `/ Marketing /`:

1. The title lists every card its pages or Cover frame reference.
2. The folder matches the card's stage, per § Teams and stage folders.
3. Every `Card <n>` is a card on the Roadmap. When one isn't, a likely card is suggested by name.
4. A file with no active card goes to Archive, unless it is a library, template or reference kit.

<!-- ide-only -->
<!-- Reference for humans and the in-IDE agent, kept OUT of the Worker's bundle.
     The operative sentences the bot needs are in agents/uno-bot/AGENT.md § My lane,
     which ships in the prompt; this is the long form nobody needs mid-reply. -->

## uno-bot's Figma reach — what it has, and where it stops

The conventions above are the workspace's. This section is the Worker's, and it exists because the harness said three things about it that were not true: that Figma was IDE-only (the *MCP* is; Figma is not), that a pasted frame arrives as a human's screenshot (the Worker renders it itself), and that every exact-value limit had the same cause. A capability written down wrong is worse than one not written down — a reader argues with the second and obeys the first.

**Auth:** `FIGMA_ACCESS_TOKEN`, a REST personal token, plus `FIGMA_FILE_KEY` for the DS library. **No MCP anywhere.** Every call goes through one client, `src/figma/` (#892). Every personal token on Bill's account shares one Figma budget per rate-limit tier, so the client paces each tier at half that budget and backs off on a 429; `check:fetch` fails any other file that calls Figma. The reach below uses four of its endpoints: images, nodes, components and versions.

| Can | Where | Limits |
|---|---|---|
| **See a frame as an image** — the Worker renders it, no human screenshot needed | `slack/vision.ts` via `/v1/images` | the **first** frame link with a `node-id` in the message, **one per message**, scale 1, ≤3.5MB; visible on that user turn and its immediate follow-up |
| See human-pasted images | `slack/vision.ts` | ≤3 files, png/jpeg/gif/webp, ≤3.5MB each |
| Read a frame's **name**, **node type**, **text layers** | `source_read` → `integrations/figma.ts` | ≤200 text layers, and it reports when it truncated |
| Render the frame into the ✅ proposal card | `slack/proposal-render.ts` | — |
| Notice a DS-library publish (component adds, removes, renames, visual changes) and turn it into one intake and one card in #plus-universal | `figma-poll.ts` (end-of-day run) → `figma-library/` (morning run) | `FIGMA_FILE_KEY` only; one poll a weekday; subrequest-budgeted |
| Hand a frame to a GitHub Action that does the real Figma-to-code work | `prototype_scaffold` / `component_implement` | the runner has depth the Worker doesn't; output is a code PR |

**A library publish, from Figma to a merged PR.** The end-of-day run's `figma-library-poll` job diffs the DS file against its KV snapshot; one poll that finds a change is one change set, kept in KV until morning. The morning run's `figma-library-post` job turns each into:

- **one drafted `harness-intake` issue** — every changed component with its Figma link, the code directory `design-system/figma/component-registry.json` maps it to, and the proposed change. A component the registry does not map is listed as "no code mapping" and nothing is drafted for it. The intake is the spec; no Notion PRD is filed.
- **one message in #plus-universal** (`PLUS_UNIVERSAL_CHANNEL_ID`): the change summary, the publisher's Figma handle, and a proposal card. Any member of the channel, read at posting time, may decide it, for 72 hours. ✅ files the intake and sends `repository_dispatch` `implement-figma-changes` to `figma-implement.yml` with every mapped component as one list and the publish's `figma_version_id`, by which the Action finds the intake and reads it as its spec; ⛔ files the intake only.

The morning run's `figma-library-track` job then follows each card: when the Action's PR opens it is linked in the intake and in the card's thread, and when it merges the intake is closed as incorporated. It is a morning look, not a webhook, so each step lands the morning after it happens. Nothing about the library posts to #uno-bot any more, and there is no "implement <component>" reply path.

**The repo's copy of the component snapshot.** The Worker's baseline lives in KV. `scripts/figma-component-snapshot.json` is a separate copy in the repo, the one `check:figma-snapshots` reads, and nothing refreshes it on a schedule. After a publish, run `gh workflow run figma-snapshot-refresh.yml` from `main`. It runs `npm run snapshot:figma-components` with the repo's `FIGMA_ACCESS_TOKEN` and opens a draft PR that lists the changed component sets. Close and reopen that PR to start its checks (registry: `docs/engineering/operations.md`).

**Weekly, when nobody published.** Friday's end-of-day `ds-precedence-check` (the run at Saturday 00:00 ET) compares the component index and registry props with the library; each disagreement names the side DS precedence says loses. Monday it opens one #plus-universal thread whose card files or comments on one `harness-intake`; `dispute N` revises the card without N. A clean week posts nothing.

**Out of reach because we drop it, rather than because Figma withholds it.** `/v1/files/:key/nodes` returns `fills`, `boundVariables` and `absoluteBoundingBox`; `fetchFigmaNode` keeps name, type and text. So the colour, measurement and presence of a binding are **unread, not absent**, and saying "this frame uses no token" would be a claim about our reader wearing the costume of a claim about the design.

**The one that is not ours to fix: a token's NAME.** `boundVariables` gives a `VariableID`, and resolving an id to `--color-primary` needs `GET /v1/files/:key/variables/local`. Probed 2026-08-31 with a freshly minted token: `403 — This endpoint requires the file_variables:read scope`. That scope is not offered on this account at all — the token-creation screen lists Users, Files, Design systems, Development, Folders and Webhooks, and no Variables section exists to grant. Figma gates the Variables REST API behind Enterprise, so the ID is reachable and the name it points at is not. Reading published components and styles does not substitute: variables and styles are different objects, and the style endpoints say nothing about a variable binding. So parsing `boundVariables` would buy opaque ids and no answer, which is why the token half of #Q12 stays unbuilt while the fills-and-geometry half remains a three-line change whenever someone wants it. The route for a human stays the same either way: name the component and the bot reads the value out of `design-system/src/tokens/` with `github_read`.

**Not built yet.** No write to Figma, and no comment reads. The client holds the comment, Dev Mode link, folder and webhook calls the "uno-bot in Figma" spec (#891) needs, but no job calls them yet; a write will land behind the ✅ gate.

**Out of reach, genuinely — the API has no route to it here.** No file browsing: a link without a `node-id` yields nothing. More than one frame per message. An image expires after the immediately following user turn; only its re-fetchable pointer enters history, not the image bytes.

**Not Storybook either.** It is client-rendered and the Worker has no browser — `source_read` fetches and strips tags, so a docs page comes back as the shell and a font declaration. `index.json` is real but 753KB against an 8,000-char cap. **A DS fact is checked against GitHub**; Storybook is a link the bot hands a human, not a source it reads.

**What this means in a reply.** Every one of these limits is stated with its cause and the next route — *what I couldn't do, the hard reason, what you can do instead*. "I can't name the token from that frame: the node exposes a binding ID, but this account cannot resolve it through Figma's Enterprise-only Variables API. Paste the component name and I'll read the known value out of `design-system/src/tokens/`." A limit named that way teaches someone how to ask next time; a bare "I can't" teaches them the bot is unreliable.
<!-- /ide-only -->
