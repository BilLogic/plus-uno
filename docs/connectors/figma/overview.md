---
embodiment: all
summary: Figma's connector overview, always loaded — what uno-bot can reach over REST, canvas vs comments, How We Fig's stage folders, file titles and page sections, and an agent's duties; the six annotation labels are annotations.md beside it, and the bot's long-form access doc is uno-bot-access.md
---

# Figma Workspace Conventions

<!-- canonical per ADR-017 (docs/adr/) · supersedes the Notion 🎨 Figma Workspace Playbook · distilled 2026-07-07, rewritten 2026-10-01 to the team's How We Fig guide from #881's probe of the six teams and #891 · applied by writers/figma · annotation categories consolidated 2026-10-09 · became the folder's overview 2026-10-14, with the REST reach table. -->

## What uno-bot can reach in Figma

uno-bot reaches Figma over REST alone, through one client (`src/figma/`); the Figma MCP needs a browser login, so it is the IDE's. Figma's published REST API has no operation that creates a file, frame, shape, text or wireframe, so a canvas change is a person's or the IDE's.

| Capability | Reach |
|---|---|
| Render a frame | read: the first frame link with a `node-id` in a message, one per message, as the frame stands now — the render takes no version, so a past version is read as text through `source_read`'s `since` |
| Frame text | read: name, node type, text layers and the comment threads pinned to the frame, through `source_read` |
| Annotations | read, through `source_read`: each Dev Mode annotation with the layer it sits on, its text and the properties it pins |
| Fills | read, through `source_read`: the frame's distinct visible fills as rendered hex (gradients by stop, images as such); a variable-bound fill is marked, the variable's name is unread |
| Version diffs | read, through `source_read` with an optional `since` date: a plain-sentence diff against the newest version saved at or before it, positions not compared; `changes_unread` says why when the diff could not be read |
| Comments | read, post, reply and delete; the one ungated write is the @uno reply (the figma-comments scheduled action) |
| Reactions | send `":goat:"`, the shortcode — Figma answers the emoji character with a 400 — and read a 🐐 back as `:goat:` |
| Webhooks, library components, folders, versions | read, by the scheduled actions |
| Dev Mode links | written, live: `figma_dev_links` adds a component's Code and Storybook links on Approve of its Review card — one component, or a batch card (`src/figma-links/`) |
| Variables (token names) | Enterprise only: a binding's id is readable, the name it points at is not; a token value comes from `design-system/src/tokens/` through `github_read` |
| Canvas writes, file renames and moves, Figma Make | out of the API's reach: the bot writes out the exact change for a person, or files the build through `file-a-ticket` |

Each limit in a reply carries its cause and the next route: what could not be done, the hard reason, what the person can do instead.

## Canvas vs comments

- **Canvas text + Dev Mode annotations = agent-readable context.** Anything the agent (or a future reader) needs to do the job goes on the canvas; a comment points at it. Writing or classifying an annotation: the six category labels are [`annotations.md`](annotations.md).
- **Comment pins = human dialogue.** uno-bot reads them with a pasted frame (#899) and for decisions (#900), and replies in one only when a comment asks it with @uno (#903).

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

A card's file is titled `<Project> / Card <n> & <m> / <designers>`, e.g. `AI Indicator / Card 733 & 1002 / <designers>`. `Card <n>` is the Roadmap card's number, the `<n>` of its RM-ID, and it is how a file joins its card in Notion. A file for several cards lists every one, joined by `&`, so a card's number may follow `Card` or `&`, and it matches only as a whole number.

- Work from before the Roadmap is titled `<Project> / Legacy / <term>`.
- Libraries, templates and reference kits keep plain names, e.g. `Design System (S23)`.
- A bare number (`… / 2204 & 2251 / …`) or the `Card #` placeholder is corrected to the full form.

## Page sections

Inside a file, pages sit under six divider pages, named exactly `- - - 🖼️ Cover - - -`, `- - - 📐 Specs - - -`, `- - - ⏳ WIP - - -`, `- - - 🕹️ Playground - - -`, `- - - 🔍 For Review - - -` and `- - - 🗂️ Archive - - -`.

- A page belongs to the section of the last divider above it, and a frame's stage is its page's section. Frames carry no stage prefix.
- A section with no work yet holds a placeholder page, `A page here`. Blank-named pages are spacers.

## Agent duties in the workspace

- Cite a frame by its node-id deep link, rather than the file root.
- Put new work on a page under the divider for its stage.
- A person renames or moves a file. An agent that finds a title or folder wrong writes out the exact new one, ready to paste, because no Figma API renames or moves a file.

The hygiene checklist covers every file outside MISC and `/ Marketing /`:

1. The title lists every card its pages or Cover frame reference.
2. The folder matches the card's stage, per § Teams and stage folders.
3. Every `Card <n>` is a card on the Roadmap. When one isn't, a likely card is suggested by name.
4. A file with no active card goes to Archive, unless it is a library, template or reference kit.

<!-- ide-only -->
## uno-bot's Figma reach, long form

Each capability with its endpoint, limits and history, and a Figma ask's public scope: [`uno-bot-access.md`](uno-bot-access.md).
<!-- /ide-only -->
