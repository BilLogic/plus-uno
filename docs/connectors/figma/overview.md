---
embodiment: all
summary: Figma's connector overview, always loaded — what uno-bot can reach over REST, canvas vs comments, the six annotation labels, How We Fig's stage folders, file titles and page sections, and an agent's duties; the bot's long-form access doc is uno-bot-access.md beside it
---

# Figma Workspace Conventions

<!-- canonical per ADR-017 (docs/adr/) · supersedes the Notion 🎨 Figma Workspace Playbook · distilled 2026-07-07, rewritten 2026-10-01 to the team's How We Fig guide from #881's probe of the six teams and #891 · applied by writers/figma · annotation categories consolidated 2026-10-09 · became the folder's overview 2026-10-14, with the REST reach table. -->

## What uno-bot can reach in Figma

uno-bot reaches Figma over REST alone, through one client (`src/figma/`); the Figma MCP needs a browser login, so it is the IDE's. Figma's published REST API has no operation that creates a file, frame, shape, text or wireframe, so a canvas change is a person's or the IDE's.

| Capability | Reach |
|---|---|
| Render a frame | read: the first frame link with a `node-id` in a message, at its current version, one per message |
| Frame text | read: name, node type, text layers and the comment threads pinned to the frame, through `source_read` |
| Annotations, fills and version diffs | the REST API serves them; the frame reader keeps name, type and text, so they are **unread**, not absent |
| Comments | read, post, reply and delete; the one ungated write is the @uno reply (the figma-comments scheduled action) |
| Reactions | send `":goat:"`, the shortcode — Figma answers the emoji character with a 400 — and read a 🐐 back as `:goat:` |
| Webhooks, library components, folders, versions | read, by the scheduled actions |
| Dev Mode links | written from a Review card, on Approve (`src/figma-links/`) |
| Variables (token names) | Enterprise only: a binding's id is readable, the name it points at is not; a token value comes from `design-system/src/tokens/` through `github_read` |
| Canvas writes, file renames and moves, Figma Make | out of the API's reach: the bot writes out the exact change for a person, or files the build through `file-a-ticket` |

Each limit in a reply carries its cause and the next route: what could not be done, the hard reason, what the person can do instead.

## Canvas vs comments

- **Canvas text + Dev Mode annotations = agent-readable context.** Anything the agent (or a future reader) needs to do the job goes on the canvas; a comment points at it.
- **Comment pins = human dialogue.** uno-bot reads them with a pasted frame (#899) and for decisions (#900), and replies in one only when a comment asks it with @uno (#903).

## Annotation category labels

Every annotation carries exactly one category label. There are six:

| Label | Colour | What it holds |
|---|---|---|
| `Development` | green | API, field names, implementation and component-construction constraints |
| `Interaction` | blue | click, hover, focus, tap; when a thing shows, hides, enables or disables |
| `Content` | orange | copy, labels, empty states, string templates |
| `Logic / data` | violet | conditions, what is counted, what is derived, where a number comes from, what is recorded |
| `Tooltip` | teal | hover and help text |
| `Accessibility` | pink | focus order, keyboard, labels, contrast |

The first four are Figma's presets, kept at their preset colours; `Logic / data` and `Tooltip` are the file's own. Handoff notes are annotations with the relevant category — written per `docs/conventions/writing.md`.

**`Logic / data` is not `Development`, and the test is the reader.** A product rule a non-engineer can review is `Logic / data`; an endpoint only a developer can review is `Development`. Ask *could a non-engineer tell me this is wrong?* — yes is `Logic / data`.

**Status lives in section names.** Build status, scope and on-hold go there: Figma allows one category per annotation, so a status label would take the type's slot.

<!-- ide-only -->
**Component construction and usage go in the component's `description`.** Dev Mode already shows name, variant props and token bindings; usage guidance in the description travels with the component instead of one frame.

**Analytics and responsive have no label.** What is recorded sits in `Logic / data`; responsive behaviour sits in its own section, which annotations point at. Add an `Analytics` label only once specs carry event names and payloads.

### Why the list drifts

Annotation categories are per-file; a library does not carry them. Pasting a layer into another file recreates its category there unless the label **and** the colour both match, so a near-duplicate spawns silently. Preferring the presets is the cheapest defence, since every file already has them at a fixed colour.

To retire a category, re-point every annotation off it first, then delete it; `getAnnotationCategoriesAsync` may serve the old list for a while afterwards.
<!-- /ide-only -->

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
