---
embodiment: all
summary: Use these terms consistently across all design system work, prototypes, and documentation
---

# PLUS Terminology

<!-- canonical per ADR-017 (docs/adr/) · Tier 1 in uno-bot's prompt (its constitution section), read on demand in the IDE · distilled 2026-07-07 · applied by every agent naming a product, org, design-system, or harness term. -->

Use these terms consistently across all design system work, prototypes, and documentation. Do not substitute generic web terms.

## Language

### Product

**Session**:
A scheduled tutoring slot (Zoom or Pencil).
_Avoid_: "class", "meeting", "appointment"

**Reflection**:
A post-session tutor self-report.
_Avoid_: "survey", "feedback form", "review"

**Escalation**:
A tutor flagging a session for supervisor review.
_Avoid_: "report", "incident", "alert"

**Call-Off**:
A tutor canceling a session.
_Avoid_: "cancel", "absence", "no-show" (no-show is a separate behavior)

**Fill-In**:
A tutor covering an open session slot.
_Avoid_: "substitute", "replacement"

**Strike**:
A compliance violation (3-strike threshold).
_Avoid_: "warning point", "demerit"

**TIP**:
Tutor Improvement Plan.
_Avoid_: "probation", "warning"

**PIP**:
Performance Improvement Plan (escalated from TIP).
_Avoid_: "final warning"

**Tutor Coach**:
The AI weekly compliance monitoring system.
_Avoid_: "monitor", "tracker"

**TACT**:
The tutor motivation + growth feedback system.
_Avoid_: "dashboard", "report"

**Student Card**:
The UI component showing student info during a session.
_Avoid_: "student profile", "student row"

**Student Insight**:
An AI-generated student engagement summary.
_Avoid_: "student report", "analytics"

### Organization

**Affiliation**:
A university: CMU, Pitt, or Duquesne.

**Site**:
The school location where students are based.

**Lead Tutor**:
A senior tutor with mentoring + attendance duties.

**SMART**:
The PLUS training system.

**Breakout Room**:
A Zoom sub-room for one-on-one tutoring.

### Design system: structure

**Pattern**:
A reusable layout of components with named slots, which the patterns overview in Storybook lists. A component is one control in a **Category**; a pattern arranges components.
_Avoid_: "layout component"

**Template**:
The page every screen starts from, and the container the app is dropped into: the browser window with the **Frame** inside it, its content already filled (blank, dashboard or reading; default or focused). The browser belongs to the Template.
_Avoid_: "page template" for the Frame alone, "browser frame" as a pattern

**Frame**:
The pattern for the app's outer shell: the **Sidebar** and **Panel** that stay put while the **Page** inside changes. The **Template** adds the browser around it. "App shell" is an informal alias for talk; code and docs say Frame.
_Avoid_: "surface container", bare "shell"

**Sidebar**:
The full-height area at the left of the **Frame**, holding navigation. It is **docked** from 1024 and collapsed below, where a hover **peek**s it.
_Avoid_: "left nav", "side nav"

**Panel**:
The full-height area at the right of the **Frame**, holding AI chat first. It is app-level, 320 to 640 wide (400 by default), and **docked** beside the **Page** or opens as an **overlay** on a **Blanket** when there is no room. The Panel parts (`PanelContainer` and its header, body and footer) fill it.
_Avoid_: "right sidebar", "side panel", "inspector", "Card" for the area

**Docked / overlay**:
The two states of the **Sidebar** and the **Panel**. Docked sits beside the **Page** and moves it; overlay opens over the **Page**, and an overlay **Panel** has a **Blanket**.
_Avoid_: "inline", "pinned", "floating" as a state

**Peek**:
A collapsed **Sidebar**, or a closed **Panel** whose `panelPeek` option is on, shown over the **Page** while a pointer rests on its toggle or edge. It has no **Blanket**, does not move the **Page**, and closes on an outside click or Escape.
_Avoid_: "flyout" as our word, "hover menu"

**Splitter**:
The draggable edge of the docked **Panel**, a vertical separator that resizes it from 320 to 640 and leaves the **Sidebar** as it is. It resists past its limit and springs back; the arrow keys move it by 16, with Shift by 64.
_Avoid_: "resize handle", "drag bar"

**Page**:
The pattern for the main content area inside a **Frame**: it carries the page title and a body.
_Avoid_: "surface" as a name

**Section**:
The pattern for a span of the page grid that groups content, including **Card**s, under one heading with a `_Section header`. It can carry an optional `detail` region on its right that shows one record of its content: the body takes 7 of the **Page**'s 12 columns and the detail, a Section with a subtle fill, takes 5; the split holds from 960 and below that the detail replaces the list under a back link. A bare "Section" always means this pattern.
_Avoid_: "block" as a name, "region" as a name; "section" for a **Figma section** or a **Menu section**

**Card**:
The pattern for the container of one object, raised at rest with no border. Related cards group in a **Section**, one card level deep.
_Avoid_: "tile" (Tile is its own component), "panel" (Panel is the Frame's right area)

**Blanket**:
The pattern for the layer that dims what sits behind it: full screen for a **Modal** or **Drawer**, which it also holds and sizes; under an **overlay** **Panel** it covers the **Page** and **Sidebar**.
_Avoid_: "overlay" for the pattern (the word is a **Panel** and **Sidebar** state), "scrim"

**Modal**:
The component and pattern for content that takes over the screen until it is closed: a follow-up decision swaps the same Modal's content for its confirm view, or opens as a second Modal stacked over it, up to the overlay limit `MAX_STACKED_OVERLAYS`. `Modal` is the component; `PatternModal` draws its shell inline.
_Avoid_: "Modal dialog", "ModalDialog", "popup" for a blocking dialog

**Drawer**:
A PLUS pattern: a panel docked to one edge of the screen on a **Blanket**, for work that leaves the **Page** visible behind it.
_Avoid_: "side panel", "slide-over"

**Popover**:
The pattern for any layer that floats above the page with no **Blanket**: **Dropdown menu**, **Popup**, Flag and Tooltip. It names the pattern only.
_Avoid_: "popover" for the **Popup** component, "floating layer", "popover family"

**Part**:
A `_`-prefixed piece only its parent uses, such as `_Section header` or `_Modal header`: it lives inside its parent and stays out of the public exports.
_Avoid_: "sub-component" for a part, "element"

**Slot**:
A named drop zone in a pattern or component where your own content goes: empty and tinted in the source component, filled with realistic placeholder content in examples and the **Playground**.
_Avoid_: "children area", "placeholder" for the slot itself

### Design system: components

**Category**:
A component group name, identical in Figma pages, Storybook and code folders, such as Forms and inputs or Text and data display; the component index lists them.
_Avoid_: "Actions", "group" for a category

**Static table**:
A fixed grid people read, with nothing to act on: a link in a cell is fine, and rows rest or are highlighted. Which table type to use is `design-system/guidelines/composition/surfaces.md` § Choosing a table.
_Avoid_: "basic table", bare "table" for this type

**Dynamic table**:
Any table people act on: sorting, filtering, selection, paging, row expansion or row actions.
_Avoid_: "data table", "interactive table"

**Tree table**:
A table whose rows nest under parent rows.
_Avoid_: "table tree", "nested table"

**Popup**:
A floating layer anchored to its trigger, closed by clicking outside: one member of the **Popover** pattern.
_Avoid_: "popover", "inline dialog"

**Menu**:
The building blocks for a list of actions or links: a menu group, **Menu section**s and items, placed inline or inside a **Popup**.
_Avoid_: "dropdown" for a menu, "list group"

**Menu section**:
A titled or separated group of items inside a **Menu**.
_Avoid_: bare "section"

**Dropdown menu**:
A button trigger that opens a **Menu** of actions or options in a **Popup**.
_Avoid_: bare "dropdown"

**Select**:
A form field for picking a value from a list of options.
_Avoid_: "dropdown", "Dropdown menu" for a value picker

**Close / Dismiss**:
Close ends a blocking layer (**Modal**, **Drawer**); Dismiss removes a message (Flag, Banner, Section message).

**Flag**:
A short message that appears at the screen corner and leaves on its own or on Dismiss.
_Avoid_: "toast", "snackbar"

**Section message**:
A message that sits in the page flow inside a **Section** or form, colored by its meaning.
_Avoid_: "alert", "callout"

**Toggle**:
An on/off control that applies at once.
_Avoid_: "switch" as a name

**Status tag**:
A label that shows the state of one thing, with a color for its meaning.
_Avoid_: "pill" as a name, "lozenge"

**Count tag**:
A label that shows a number.
_Avoid_: "counter", "badge"

**Tag**:
A label a person can attach, filter by or remove: it names a category rather than a state.
_Avoid_: "chip"

**Tag group**:
A set of **Tag**s laid out together.
_Avoid_: "tag list"

**Date tag**:
A label that shows a date or due date, colored by how close it is.
_Avoid_: "date pill"

**SMART tag**:
A label for one of the **SMART** competencies, in its curriculum color.
_Avoid_: "skill tag"

**Suggestion**:
A label that offers something the AI proposes, which a person accepts or dismisses.
_Avoid_: "AI chip"

**Fieldset**:
A legend plus the fields it groups: one `fieldset` and `legend`, built on Base UI. The base `RadioGroup` and a Checkbox group compose on top of.
_Avoid_: "field group"

**Radio group**:
One question and its radio answers: a `Fieldset` holding `Radio`s, pick one.
_Avoid_: "multiple choice", "radio list"

**Choice grid**:
A PLUS-only pattern: the same question asked of several rows, as a table: one **Radio group** per row, built from `Radio`.
_Avoid_: "matrix question"

**Linear scale**:
A PLUS pattern on **Radio group**: an inline row of options with a label at either end, used for a reflection form's five-point scale.
_Avoid_: "scale", bare "slider" for this pattern

**appearance**:
The prop that picks how a component looks within its role, such as `default`, `subtle` or `primary`.
_Avoid_: `style`, `fill`, `variant` for this axis

**spacing**:
The prop that sets a component's density in words: `default`, `compact` or `spacious`.
_Avoid_: "density", "small/medium/large"

**size**:
The prop that scales the whole component in pixels bound to a token, such as `size=32`.
_Avoid_: "small", "medium", "large" as sizes

**is… prop**:
A boolean state prop such as `isDisabled`, `isSelected` or `isLoading`.
_Avoid_: bare `disabled`, `selected` or `loading` props

**Base UI**:
The one behavior layer every interactive component wraps (focus, keyboard, ARIA, open and close), decided in ADR-037; Bootstrap stays the CSS framework for non-interactive markup.
_Avoid_: "react-bootstrap" as a precedent

**FieldBox / FieldFrame**:
FieldBox is an input's box (leading and trailing slots, density, radius); FieldFrame carries its label, caption and error, and is the only piece choice controls share.
_Avoid_: "input wrapper", "form group"

**Overlay module**:
The shared layer code for everything that floats: the portal, the z-index scale and the stacking rules.
_Avoid_: "overlay" for the **Blanket**

**State mixin**:
The one shared source of hover, pressed, selected and focus styling, reading **Named state token**s.
_Avoid_: "state layer"

**Focus ring**:
The ring that shows keyboard focus, drawn in the focused border color rather than as a fill.
_Avoid_: "focus outline", "focus state color"

### Design system: tokens

**Token**:
A design value: color, spacing, typography, elevation, radius.

**Foundation**:
A fundamental design primitive (color palette, type scale, grid), and the Figma and Storybook pages that document one. A docs word: the token collections say semantics.

**Token tier**:
The four levels every spacing token sits on, one Figma collection each and the same in code: `spacing / primitives` → `spacing / semantics` → `spacing / patterns` → `spacing / components`, read as **Primitive** → **Semantic** → **Pattern token** → **Component token**. Color mirrors it with `color / primitives`, `color / semantics` and `color / opacity`; the fallback rule for picking a tier is in `design-system/src/styles/Tokens.mdx` § The four-tier ladder.
_Avoid_: "token layer", "level", "foundations" for a collection

**Primitive**:
A raw value on the PLUS ×16 ladder, where `space-100` is 16px.
_Avoid_: "base token", "core token"

**Semantic**:
A token named by its job, the safety net every value falls back to: Pad, Stack, Inline and Radius sit directly in `spacing / semantics`, named by steps (xs to lg, plus full) with no density words.
_Avoid_: "element token", "foundation token"

**Pattern token**:
A token one pattern owns, such as a Card's padding or a Modal's width, named for the pattern and keyed to `spacing` (default, compact, spacious) where the pattern has one.
_Avoid_: "role token", "container token"

**Component token**:
A token only one component needs, such as Button's radius, used when no shared token fits and keyed to `spacing` (default, compact, spacious) where the component has one.
_Avoid_: "local variable"

**Private variable**:
A `--_<name>-*` custom property inside one component's SCSS that wires its states or sums and only points at tokens. It is not a token.
_Avoid_: "component token" for it

**Named state token**:
A color token that names the state it paints, such as `--ds-background-brand-bold-hovered` or `--ds-background-selected`, so a hover, press or selection reads from its name.
_Avoid_: "state layer", "08/12/16"

**Elevation**:
The surface and shadow pair that lifts a layer: `--ds-surface-*` with its shadow. The only place the word "surface" belongs.
_Avoid_: "surface" for a layout box

### Design work

**PRD**:
The product requirements for one Roadmap card, written in Notion before any prototype.
_Avoid_: "spec", "ticket"

**Build spec**:
The GitHub issue that turns a PRD into buildable work (user stories, decisions, tests), labeled `ready-for-agent`.
_Avoid_: bare "spec", "PRD" for it

**Build ticket**:
A GitHub issue under a **Build spec**: one slice, one PR.
_Avoid_: "ticket" for a Roadmap card, "task"

**Flow spec**:
One task's page in **Figma Flows**: lanes per user type and annotated screens built from current components. The source of truth for how that flow looks.
_Avoid_: bare "spec", "wireframe"

**Ticket draft**:
Work-in-progress Figma screens for one **Build ticket**, folded into its **Flow spec** when the ticket lands.
_Avoid_: "spec" for a draft

**Product screen**:
A coded copy of one PLUS screen, built from design-system components. The Specs set is kept on the `archive/legacy-ds` branch until its rebuild.
_Avoid_: bare "spec", "page" for the coded screen

**Prompt-spec**:
The engineered prompt handed to an external generative tool (Stitch, Figma Make, v0), the low/mid-fi lane's deliverable rather than what the tool returns. Not a **Flow spec** or the **PRD** it comes from.
_Avoid_: bare "spec"

**Component docs page**:
The tabbed page a human reads for one component. Distinct from **Page** the pattern and from a **Flow spec**.
_Avoid_: bare "docs page"

**Docs parts**:
The shared building blocks every Figma docs page is made from, on Core's Docs parts page: every docs page uses instances of them.
_Avoid_: "doc components", "templates" for the parts

**Playground**:
The Figma section of ready-made instances pushed to their extremes (long text, empty, overflow) to stress the spec.
_Avoid_: "examples" for the Playground

**Figma section**:
A Figma section node; on a component page they are named Updated, Deprecated, Components, Docs and Playground.
_Avoid_: "zone", bare "section"

**Updated / Deprecated / Retired**:
Figma Core only: Updated holds the one current set; Deprecated keeps a replaced set with its instances still linked; Retired holds a component with no successor. Code and Storybook carry none of these.
_Avoid_: "legacy", "archive" for these

**Archive**:
The pre-revamp Storybook, reached from the single "Previous version" link: the only home of old code.
_Avoid_: "legacy docs"

**Figma replica**:
A Figma frame a person makes to mirror a coded prototype: an optional link on its Marketplace row and in its share-out.
_Avoid_: bare "replica", "screenshot"

### Estates

**uno-blueprint**:
The product source of truth for the current service (Supabase), retrieved live. Not the `uno-blueprint` devDependency, which is the sb template kit.
_Avoid_: "the database"

**uno-storybook**:
The design-system source of truth: documentation for the coded components and the **Product screen**s built from them (stories + MDX → /storybook). Not production code.
_Avoid_: "the docs site"

**Figma Core**:
The Figma component library; it follows **uno-storybook** on conflict.
_Avoid_: "the library file"

**Figma Flows**:
The Figma file of **Flow spec**s and **Ticket draft**s, the source of truth for product flows.
_Avoid_: "Spec file"

**Vibe app**:
The coded prototype of PLUS built from **Product screen**s, kept on the `archive/legacy-ds` branch; its URLs redirect to Storybook.
_Avoid_: "live app", "the app"

**Production app / QA app**:
The real PLUS product and its QA build, outside this repo.
_Avoid_: "the app" for either

**Decisions DB**:
The decision log under Design HQ, one row per decision.
_Avoid_: "Decision Log" (obsolete per-project subpage)

**pillar**:
A product area (Universal · Admin · Toolkit · Training · Marketing …), mapping to a Slack channel.
_Avoid_: "category"

**RM-ID**:
A Roadmap card id (`RM-<n>`; `Card <n>` in Figma titles), the join key.

**drift**:
A source of truth a later decision overruled: a Notion page or a Figma file.
_Avoid_: "out of sync"

**blueprint revision**:
The drafted row changes to one path of the **uno-blueprint** — cells added, changed or deprecated, each with its status — from one piece of shipped work or one idea, reviewed and approved whole.
_Avoid_: "blueprint update", "card" (a card is the Roadmap's)

### uno-bot

**uno-bot**:
uno's Slack embodiment, a self-hosted Cloudflare Worker.
_Avoid_: "Slackbot"

**persona**:
uno-bot's own always-loaded document: voice, audience, gate and etiquette, beside what every embodiment obeys.
_Avoid_: "system prompt", "soul"

**proposal card** / **Review pop-up**:
The ⚠️ card holding a side-effect tool call until someone approves it: short in the thread, decided in its Review pop-up (Approve · Needs changes · Reject).
_Avoid_: "confirmation dialog", "prompt", bare "card" where a Roadmap card could be meant

**superseded card**:
A proposal card retired by a later revision in its thread, or once a turn commits to writing one: it executes nothing and answers that it was replaced. Expired is different: the card's TTL ran out.
_Avoid_: "expired card"

**revision**:
Of a proposal card: a new proposal card for the same matter as a waiting one — an edit, a change asked for in Review, notes added — that supersedes it and carries everything it held. Two cards aimed at the same Notion page or GitHub issue are always one matter.
_Avoid_: "update card", "new version"

**separate proposal**:
A new proposal card for a different matter than any waiting in its thread; each is decided on its own, in any order.
_Avoid_: "second card", "batch" (a batch is one card running several operations)

**blueprint check**:
The opt-in comparison of an idea against today's **uno-blueprint**, offered after its proposal card posts or a build is handed to the IDE; its result can become a revision of that card or a **blueprint proposal**.
_Avoid_: "comparison" alone, "blueprint revision" (that is shipped work's)

**sweep**:
The end-of-day read of every source uno-bot watches, DMs with it included, for **drift** and each **commitment** (a task someone took on); the next weekday morning posts one message a place, each job's **decision cards** on it.
_Avoid_: "digest", "scan"

**relayed DM**:
A gated DM uno-bot sends someone on a requester's behalf, attributed.
_Avoid_: "proactive DM", "outreach"

**intake**:
A change request, routed by the `file-a-ticket` bot skill: implementation in a listed repo → that repo's GitHub issue; product or design, a live PLUS app bug included → a Roadmap card.
_Avoid_: "ticket"

**standing confirmers**:
Who may decide any card that names its confirmers, beside the people it names, except in someone's own DM (`STANDING_CONFIRMER_IDS`).

**decision card**:
The Slack shape a **scheduled action** reports on: a parent line, then one card per item with Review and Open, each item its own **proposal card**.

**lead**:
The design team's lead (Bill today): makes product-direction calls. Distinct from **Lead Tutor**.
_Avoid_: "GOAT", "admin"

**agent session**:
The Slack object a uno-bot conversation runs inside, moving through `active` · `processing` · `suspended` · `closed`; it replaces Slack's deprecated assistant threads.
_Avoid_: "assistant thread", "the panel thread", bare "session" (a **Session** is tutoring)

**working signal**:
What tells a person a turn is in flight: the **agent session** shown as processing until the turn settles, on every exit, not when the answer posts.
_Avoid_: "the thinking indicator", "the status line" (the status is told to Slack; the signal is seen)

**checklist**:
The Slack plan a person watches while a turn's lookups run: a **task card** per run of like lookups or routing choice, the answer beneath. A task card approves nothing: not a Roadmap card or a **proposal card**.
_Avoid_: "plan stream", "progress surface", "steps"

**result table**:
The sortable table beneath an answer, filled by code from one lookup's rows on fields the model picked. One per answer; a Slack answer table, not a Markdown table and not one of the design-system table types.
_Avoid_: "card table", "data table"

**source** / **Sources box**:
A **source** is a link a lookup of the same turn returned that an answer stands on; the **Sources box** lists them beneath it in Slack, a single `Source:` line in Figma.
_Avoid_: "citation", "reference", "Sources:" line in the answer text

**Capture** / **Reconcile** / **Follow through**:
The three families of unprompted work: was it written down, do the sources agree, did it get done. DM Capture is the opt-in switch that adds a person's own DMs; not uno-maintain's knowledge capture.

**DS precedence**:
The order Reconcile settles a design-system disagreement by (`AGENTS.md` § Conventions), and its weekly check of code against the Figma library.

**le goat**:
uno-bot's name in Slack and Figma (🐐), the one people @-mention.
_Avoid_: "GOAT" for the **lead**

### Measurement

**usage record**:
uno-bot's D1 database `uno-bot-usage`; each published number is a saved query in `agents/uno-bot/queries/usage/` (cited below as `usage/`).

**ask** / **turn**:
A turn is "every message the bot answered, follow-ups included"; an ask is "a turn whose own message opened a thread" (`usage/load-on-lead.sql:10-12`).

**escalated to the lead**:
"escalated_to_lead = 1" (`usage/load-on-lead.sql:4`): the lead answered in thread or by DM on its topic. Not an **Escalation**.

**settled**:
"escalated_to_lead known" after the end-of-day pass (`usage/self-serve-rate.sql:15`); the rest are `pending`.

**self-served**:
A settled ask with escalated_to_lead = 0 and a resolution of `reaction`, `task_completed` or `no_escalation` (`usage/self-serve-rate.sql:5-7`).
_Avoid_: "deflected"

**approved with edits**:
"✅ on a card whose staged row names the card it revised", or whose Review pop-up edits changed it (`usage/proposal-outcomes.sql:10-13`).

**test traffic**:
`test_traffic = 1` (`agents/uno-bot/src/usage/record.ts:96`): a sandbox or debug turn, or a greeting. Every query excludes it (`usage/self-serve-rate.sql:35`).

**measurement window**:
"2026-09-01 to 2027-01-01, the measurement window" (`usage/load-on-lead.sql:34`), closing at about 100 real asks: `docs/engineering/measurement-window.md`.

**housekeeping**:
For asks to uno-bot, pain_category 1–5 and 7 (`usage/load-on-lead.sql:27`); for the lead's inbox, a request whose **What it took** is "Could be looked up" or "Needs prep, then a person", not "Needs the lead's judgment" (`agents/uno-bot/measurement/housekeeping-sort/prompt.md`).

**Asks corpus**:
The Notion database of 2,413 asks to the lead that the housekeeping baseline was counted from (`agents/uno-bot/measurement/housekeeping-sort/lib.mjs:13,19`).
_Avoid_: bare "corpus"

### Harness

**uno**:
The design agent, in every embodiment.
_Avoid_: "the AI"

**embodiment**:
A runtime uno runs in (the IDE, the uno-bot Worker), each with its own powers and slice of the harness.
_Avoid_: "mode", "environment"

**uno skill**:
An IDE workflow under `skills/`: `SKILL.md` over its method, invoked by a person.
_Avoid_: bare "skill" where a **bot skill** could be meant

**bot skill**:
What uno-bot does for one kind of ask, under `agents/uno-bot/skills/`, named for the action (`draft-a-prd`): its description is always loaded, its body is read by name, and it ends in one **exit**.
_Avoid_: "Worker face", "bot face", "bot.md"

**exit**:
How a bot skill ends: **answer** (the reply is the deliverable), **file** (a ✅ card writes or sends), or **hand off**.

**hand off**:
The exit that passes the rest of the work on: a ready-to-paste IDE prompt naming the uno skill, or the **lead** for a call only they make. Not the **Handoff Spec** a dev handoff carries.
_Avoid_: "handoff" for the exit

**scheduled action**:
Work uno-bot does on its own clock whose posts people reply to; one doc per family under `agents/uno-bot/scheduled-actions/`, read by name.
_Avoid_: "scheduled job", "cron", "skill"

**connector overview**:
The always-loaded doc for one tool under `docs/connectors/`: what uno reaches in it and the rules for each reach. Anything else about the tool is **disclosed** beside it.

**share-out**:
A feedback-rail publish: Loom + preview + Decisions DB link (+ a **Figma replica** when one exists).
_Avoid_: "post", "update"

**direct fix / gated change**:
The two maintenance severities: a trivial fix committed straight to main, vs a PR + PRD through a Slack verdict.
_Avoid_: "Tier 1", "Tier 2"

**Tier 1 / Tier 2 / Tier 3**:
The loading tiers: always-loaded · on demand · retrieved live.
_Avoid_: "Tier" for a maintenance severity, or for a model's tier (say "model tier")

**disclosed**:
Reference pushed out of the always-loaded tier behind a pointer, loaded only when it fires. For uno-bot, a doc declares `disclosure: reference` and is read through `read_reference`.
_Avoid_: "hidden", "optional"

**Escape**:
One place where code outside the design system leaves it: a component the barrel does not export, a deep import, an unknown prop or enum value, a raw literal, an unknown token or a primitive read, a Font Awesome Pro icon. Whatever `check:ds-usage` reports, and only that (ADR-039).
_Avoid_: "violation", "lint error", "DS drift"

## Two vocabularies — the blueprint speaks service-blueprint, the Roadmap speaks project-management

Ratified in ADR-023; this section is its only statement.

Two estates describe the product in **different languages**, and the words are NOT interchangeable. Mixing them is a defect: never describe results from one estate in the other's vocabulary, and never search one estate for the other's concepts.

| | **uno-blueprint** (Supabase) | **Notion Roadmap** (Design HQ board) |
|---|---|---|
| What it holds | how the **service works**: who does what, when | what the **team is building**: work items + their status |
| Its words | **phase** · **service scenario** · **path** (read both `kind` and `name`) · **step** · **lane** = the actor row · **cell** = one activity at lane × step | **Roadmap** · **card** (id = **RM-ID**, `RM-<n>`) · **Design Status** · **Product Pillar** · **Product Tag** · **owner** · **PRD** |
| NOT its words | "roadmap", "card", "Design Status", "pillar", "owner", "WIP", "under review" — **the blueprint has no cards and no Design Status.** It does have `status` on `paths` and `cells` (proposed · planned · built · live · at_risk · deprecated), which says whether a row is `live` today or still coming — a different axis from a card's Design Status, and it answers a different question | "scenario", "lane", "cell", "path", "step", "phase", "actor" — **the Roadmap has no service steps or actor rows** |

**Topic words overlap; frame words don't.** "Goal Setting" is both a blueprint *scenario* and a Roadmap *card topic* — the topic never tells you which estate to read. The **frame words in the question** do:

- card / status / pillar / owner / RM-ID / "where are we on X" / "what's WIP or under review" → **Roadmap** (Notion), full stop.
- who-does-what / flow / scenario / actor / step / "what happens when" → **blueprint** (Supabase), full stop.

**Attribution rule:** when reporting findings, name the estate you actually read, in its own words — "on the Roadmap board" ONLY for Notion Roadmap cards; "in the service blueprint" ONLY for blueprint rows.

How frame words render in chat (as `code`) is a Slack and Notion writing convention: `docs/connectors/slack/overview.md` § Frame words render as code.
