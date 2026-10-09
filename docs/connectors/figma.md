---
embodiment: all
summary: PLUS Figma files follow How We Fig — five stage folders per team, `<Project> / Card <n> & <m> / <designers>` titles, six divider page sections; an agent suggests a rename or a move and a person makes it
---

# Figma Workspace Conventions

<!-- canonical per ADR-017 (docs/adr/) · supersedes the Notion 🎨 Figma Workspace Playbook · distilled 2026-07-07, rewritten 2026-10-01 to the team's How We Fig guide from #881's probe of the six teams and #891 · applied by writers/figma · annotation categories consolidated 2026-10-09. -->

## Canvas vs comments

- **Canvas text + Dev Mode annotations = agent-readable context.** Anything the agent (or a future reader) needs to do the job goes on the canvas, never only in a comment.
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

**Auth:** `FIGMA_ACCESS_TOKEN`, a REST personal token, plus `FIGMA_FILE_KEY` for the DS library. **No MCP anywhere.** Every call goes through one client, `src/figma/` (#892). Every personal token on Bill's account shares one Figma budget per rate-limit tier, so the client paces each tier at half that budget and backs off on a 429; `check:fetch` fails any other file that calls Figma. The reach below uses its endpoint families for images, nodes, comments, components, versions, folders and webhooks.

| Can | Where | Limits |
|---|---|---|
| **See a frame as an image** — the Worker renders it, no human screenshot needed | `slack/vision.ts` via `/v1/images` | the **first** frame link with a `node-id` in the message, **one per message**, scale 1, ≤3.5MB; visible on that user turn and its immediate follow-up |
| See human-pasted images | `slack/vision.ts` | ≤3 files, png/jpeg/gif/webp, ≤3.5MB each |
| Read a frame's **name**, **node type**, **text layers**, and the **comment threads pinned to it** or to a layer inside it, each with its author, date, resolved state and replies (#899) | `source_read` → `integrations/figma.ts` | ≤200 text layers, and it reports when it truncated; the threads with the newest activity, up to 20 and 8,000 chars of comment text, with the count; a page's own comments aren't read; a comments read that fails, or would wait over 3 s, keeps the frame and says the comments are unread. The sweep's reads of a frame skip the comments |
| Render the frame into the ✅ proposal card | `slack/proposal-render.ts` | — |
| Notice a DS-library publish (component adds, removes, renames, visual changes) and turn it into one intake and one card in #plus-universal | `figma-poll.ts` (end-of-day run) → `figma-library/` (morning run) | `FIGMA_FILE_KEY` only; one poll a weekday; subrequest-budgeted |
| Hand a frame to a GitHub Action that does the real Figma-to-code work | `prototype_scaffold` / `component_implement` | the runner has depth the Worker doesn't; output is a code PR |
| Hear a comment on a subscribed team's file as it happens | `POST /figma/events` → `figma-notify/` | FILE_COMMENT on Universal until #896; ids and times kept, the words left in Figma |
| Carry decisions in comments under Specs or For Review to #plus-design: one thread per file, a card per decision | `sweep-figma-comments` (end of day) → `sweep-figma-post` (morning) → `figma-comments/` | comments created or resolved after the switch-on only; MISC left out; one model call per file; a thread is carded once; @uno asks and uno-bot's replies are left to the row below |
| Answer @uno in a Figma comment: a reply on the root comment, leading with `🐐 le goat (uno-bot) · AI-generated`, 1–3 plain lines and the source the answer cites, or "I couldn't find this" pointing at #plus-design. A change request becomes a card in a #plus-design thread whose lead asks the file's design owner to review it, linked from the reply | `POST /figma/events` → `figma-ask/`, the same turn Slack runs, reading Slack at public visibility only | the `@` is required: @uno, @unobot, @uno-bot, @uno bot, @goat, @le goat, @le-goat, @legoat, @the goat, any case, typed or picked from Figma's list; a comment leading with the label is uno-bot's own and gets no answer; one reply and at most one card per comment; a commenter the Team Members Figma user id does not map gets public facts and no card; a budget stop or a 429 waits for a fresh budget, five tries at most |

**A library publish, from Figma to a merged PR.** The end-of-day run's `figma-library-poll` job diffs the DS file against its KV snapshot; one poll that finds a change is one change set, kept in KV until morning. The morning run's `figma-library-post` job turns each into:

- **one drafted `harness-intake` issue** — every changed component with its Figma link, the code directory `design-system/figma/component-registry.json` maps it to, and the proposed change. A component the registry does not map is listed as "no code mapping" and nothing is drafted for it. The intake is the spec; no Notion PRD is filed.
- **one message in #plus-universal** (`PLUS_UNIVERSAL_CHANNEL_ID`), on the shared decision card: a parent line naming the publisher's Figma handle, the publish and how many changed components have code; one card for the publish with Review, Open library and View version; and the table of every changed component under it. Any member of the channel, read at posting time, may decide it in the Review pop-up, for 72 hours. Approve files the intake and sends `repository_dispatch` `implement-figma-changes` to `figma-implement.yml` with every mapped component as one list and the publish's `figma_version_id`, by which the Action finds the intake and reads it as its spec; Reject files nothing. A card nobody decides in its 72 hours is closed the next morning: the tracker files its intake, the card reads "Closed, no decision", and its thread is told the intake was filed.

A change with no published version is not a publish: it posts "Library edited, not published" in one plain message, naming what changed, with no card and no intake. The change is kept and the next publish's card carries it, because to the poll an autosave and a publish left without a description look the same.

The morning run's `figma-library-track` job then follows each card: when the Action's PR opens it is linked in the intake and in the card's thread, and when it merges the intake is closed as incorporated and the thread names what now matches the library. It is a morning look, not a webhook, so each step lands the morning after it happens. Nothing about the library posts to #uno-bot any more, and there is no "implement <component>" reply path.

**The repo's copy of the component snapshot.** The Worker's baseline lives in KV. `scripts/figma-component-snapshot.json` is a separate copy in the repo, the one `check:figma-snapshots` reads. Every new version the end-of-day poll finds starts `figma-snapshot-refresh.yml` that night, labelled or not, since a publish left without a label or description looks like an autosave. A labelled publish is started again each night until the snapshot on `main` or the refresh branch records it, and three nights with nothing landed file one `automation-blocked` issue. That snapshot records labelled versions only, so the dispatch GitHub accepts settles an unlabelled one. A change opens a draft PR that lists the changed component sets. Close and reopen that PR to start its checks. `gh workflow run figma-snapshot-refresh.yml` from `main` runs it by hand (registry: `docs/engineering/operations.md`).

**Weekly, when nobody published.** Friday's end-of-day `ds-precedence-check` (the run at Saturday 00:00 ET) compares the component index and registry props with the library; DS precedence says the library side takes each fix. The next morning post sends one #plus-universal report on the shared decision card: a line saying how many components disagree, then one card per component (Review · Code · Figma), ten at most, the rest the next morning. Approve adds that component to the week's one `harness-intake`: the week's first Approve files it, each later one comments on it, one at a time through ThreadState, which remembers the week's intake (closed or not). Needs changes puts the person's note on that intake as a dispute. Reject leaves the difference as deliberate. A clean week posts nothing. Every one of these messages follows the copy in `docs/connectors/slack.md` § Figma messages.

**Notifications (#895).** Figma tells uno-bot when a subscribed team's file gets a comment or changes, at `POST /figma/events`. Figma sends a passcode, not a signature: the route compares it with `FIGMA_WEBHOOK_PASSCODE`, whose one twin is the GitHub secret the setup uses. A delivery without it gets 401, and nothing is answered 400, because Figma switches off a webhook that gets a 400 for a wrong passcode. A delivery carries no event id, so the route derives one from what a retry repeats (the comment's id, or the file and the event's time), and the `figma/events` runner claims it and queues one job in a single step; a redelivery is answered 200 and does nothing. KV keeps which files got comments each ET day (8 days) and each file's last change (30 days), as ids and times only: the comment's words, the file's name and the commenter's handle stay in Figma. A change's job runs the drift re-check (#897) for that file, which withdraws a live question the file has caught up with about 30 minutes after the edit; for a file no live question names, it costs one KV read. A comment that asks uno-bot something gets its answer from its job (#903); any other comment's job only logs, and comment decisions (#900) read each day's notes at midnight instead.

The subscriptions come from `figma-subscriptions.yml` (`list`, `create`, `status`). It reads the six teams from `FIGMA_TEAM_IDS` in `wrangler.toml`, creates only what is missing and stops at the first failure, and its `create` runs only after the `uno-bot-production` environment's required reviewer approves. Its defaults are the 12 #896 asks for, FILE_COMMENT and FILE_UPDATE on all six teams. #895's first step made FILE_COMMENT on Universal alone; one approved `create` makes the other 11, and a re-run makes none.

**The nightly backstop (#896).** A notification can fail to arrive: Figma gives up on a delivery after its retries, a subscription can be paused, and team subscriptions skip files in invite-only folders. So the 00:00 ET run lists every team's folders and their files, and a file whose `last_modified` is newer than its change note is queued as the job its notification would have queued, and its note moves forward. Each sweep covers the changes from the last sweep's end to half an hour before the run, since FILE_UPDATE comes about 30 minutes after editing stops. A full sweep is 36 Tier 2 listings for six teams of five folders. Three end-of-day jobs take it in turns: each stops with a listing's worth of its 38 subrequests left and keeps the rest in `figma-notify:backstop`, so the next job, or the next night, finishes the same sweep, and a job after a finished sweep lists nothing. A comment leaves `last_modified` as it was; the comment read (#900) lists each day's commented and changed notes itself, so a resolution that came with an edit is seen, and one that came with neither is not. The team call returns top-level folders only (`src/figma-notify/backstop.ts`).

**Comment decisions (#900).** A decision settled in a comment reaches the PRD, the card or the design-system pipeline through #plus-design. The end-of-day `sweep-figma-comments` job switched on once: only comments created or resolved after that moment are read — on an older open thread, its new replies without its root. Each night it reads the files whose notes name a comment or a change since the night before, leaves MISC's out, and keeps the threads pinned under `- - - 📐 Specs - - -` or `- - - 🔍 For Review - - -`. A file joins its cards by `Card <n>` in its title; its PRD is the card's PRD subpage alone. One `chill`-tier call per file sorts each thread: behaviour or scope → a PRD line added or a block rewritten (with no PRD, a reply saying so), status, owner or timing → that card field and no other, design-system → a `harness-intake`, a visual detail or an open question → nothing (eval cases: `docs/evals/fixtures/figma-decision-cases.json`). The morning's `sweep-figma-post` opens one #plus-design thread per file in #886 § 3.5's words, asking the card's design owner — the first Contributor the team's roles name a designer — else the file's creator, and posts its decisions as numbered cards on the shared decision card, ten a morning, with the whole text each writes in Review; Review's Needs changes drafts it again (`docs/connectors/slack-sweep.md` § Figma comment decisions). Kept in HARNESS_KV with expiries: the queue, the carded threads and each thread's record; the watermark sits in the sweep's cursor table (`figma:comments`). A thread is carded once, and a resolution with no new comment and no edit is not seen.

**Out of reach because we drop it, rather than because Figma withholds it.** `/v1/files/:key/nodes` returns `fills`, `boundVariables` and `absoluteBoundingBox`; `fetchFigmaNode` keeps name, type and text. So the colour, measurement and presence of a binding are **unread, not absent**, and saying "this frame uses no token" would be a claim about our reader wearing the costume of a claim about the design.

**The one that is not ours to fix: a token's NAME.** `boundVariables` gives a `VariableID`, and resolving an id to `--color-primary` needs `GET /v1/files/:key/variables/local`. Probed 2026-08-31 with a freshly minted token: `403 — This endpoint requires the file_variables:read scope`. That scope is not offered on this account at all — the token-creation screen lists Users, Files, Design systems, Development, Folders and Webhooks, and no Variables section exists to grant. Figma gates the Variables REST API behind Enterprise, so the ID is reachable and the name it points at is not. Reading published components and styles does not substitute: variables and styles are different objects, and the style endpoints say nothing about a variable binding. So parsing `boundVariables` would buy opaque ids and no answer, which is why the token half of #Q12 stays unbuilt while the fills-and-geometry half remains a three-line change whenever someone wants it. The route for a human stays the same either way: name the component and the bot reads the value out of `design-system/src/tokens/` with `github_read`.

**Not built yet.** No write into a file's canvas or its Dev Mode links: the client holds the Dev Mode link calls the "uno-bot in Figma" spec (#891) needs, and no job calls them yet; that write will land behind the ✅ gate. The one thing uno-bot writes into Figma today is its labelled reply to @uno. The folder calls are the backstop's, and the webhook calls the setup's, above.

**Out of reach, genuinely — the API has no route to it here.** No file browsing: a link without a `node-id` yields nothing. More than one frame per message. An image expires after the immediately following user turn; only its re-fetchable pointer enters history, not the image bytes.

**Not Storybook either.** It is client-rendered and the Worker has no browser — `source_read` fetches and strips tags, so a docs page comes back as the shell and a font declaration. `index.json` is real but 753KB against an 8,000-char cap. **A DS fact is checked against GitHub**; Storybook is a link the bot hands a human, not a source it reads.

**What this means in a reply.** Every one of these limits is stated with its cause and the next route — *what I couldn't do, the hard reason, what you can do instead*. "I can't name the token from that frame: the node exposes a binding ID, but this account cannot resolve it through Figma's Enterprise-only Variables API. Paste the component name and I'll read the known value out of `design-system/src/tokens/`." A limit named that way teaches someone how to ask next time; a bare "I can't" teaches them the bot is unreliable.
<!-- /ide-only -->
