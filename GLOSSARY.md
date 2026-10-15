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
A tutor cancelling a session.
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

### Design system

**Context Level**:
The atomic hierarchy: Element → Card → Section → Page.

**Spec**:
A full page composition.

**Prompt-spec**:
The engineered prompt handed to an external generative tool (Stitch, Figma Make, v0), the low/mid-fi lane's deliverable rather than what the tool returns. Not a **Spec** or the **PRD** it comes from.
_Avoid_: bare "spec"

**Component docs page**:
The tabbed page a human reads for one component. Distinct from **Page** (a Context Level), from **Spec**, and from a page story.
_Avoid_: bare "docs page"

**Token**:
A design value: color, spacing, typography, elevation, radius.

**Foundation**:
A fundamental design primitive (color palette, type scale, grid).

**Figma replica**:
A Figma frame a person makes to mirror a coded prototype: an optional link on its Marketplace row and in its share-out.
_Avoid_: bare "replica", "screenshot"

### Estates

**uno-blueprint**:
The product source of truth for the current service (Supabase), retrieved live. Not the `uno-blueprint` devDependency, which is the sb template kit.
_Avoid_: "the database"

**uno-storybook**:
The design-system source of truth (stories + MDX → /storybook).
_Avoid_: "the docs site"

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
The sortable table beneath an answer, filled by code from one lookup's rows on fields the model picked. One per answer; not a Markdown table.
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
A runtime uno runs in (the IDE, the uno-bot Worker, headless GitHub Actions), each with its own powers and slice of the harness.
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
