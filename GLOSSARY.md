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
The engineered prompt handed to an external generative tool (Stitch, Figma Make, v0): the deliverable of the low/mid-fi lane, not the artifact the tool returns. Distinct from **Spec** and from the **PRD** it is written from.
_Avoid_: bare "spec"

**Component docs page**:
The tabbed page a human reads for one component. Distinct from **Page** (a Context Level), from **Spec**, and from a page story.
_Avoid_: bare "docs page"

**Token**:
A design value: color, spacing, typography, elevation, radius.

**Foundation**:
A fundamental design primitive (color palette, type scale, grid).

**replica**:
The Figma frame mirroring a coded prototype, required in prototype share-outs.
_Avoid_: "screenshot"

### Estates

**uno-blueprint**:
The product source of truth for the current service (Supabase), retrieved live. Not the `uno-blueprint` devDependency, which is the sb template kit.
_Avoid_: "the database"

**uno-storybook**:
The design-system source of truth (stories + MDX → /storybook).
_Avoid_: "the docs site"

**Decisions DB**:
The centralized decision log under Design HQ: Status / Owner / Sign-off / Date / Roadmap Card / Evidence.
_Avoid_: "Decision Log" (obsolete per-project subpage)

**pillar**:
A product area (Universal · Admin · Toolkit · Training · Marketing …), mapping to a Slack channel.
_Avoid_: "category"

**RM-ID**:
A Roadmap card id (`RM-<n>`; `Card <n>` in Figma titles), the join key.

**drift**:
A source of truth a later decision overruled: a Notion page or a Figma file.
_Avoid_: "out of sync"

### uno-bot

**uno-bot**:
uno's Slack embodiment, a self-hosted Cloudflare Worker.
_Avoid_: "Slackbot"

**persona**:
uno-bot's own always-loaded document: voice, audience, gate and etiquette, beside what every embodiment obeys.
_Avoid_: "system prompt", "soul"

**Diagnostics**:
uno-bot's probes: the public blueprint health probe and the token-gated debug probes, sharing one report shape. Separate from the plain uptime check.
_Avoid_: "the debug routes"

**ThreadState**:
uno-bot's memory of one thread, behind one typed interface: its history, the pending proposal, the assistant context, the cancel flag, the events already handled and the run lease.
_Avoid_: "the DO", "thread-state client"

**ModelProvider**:
The seam between uno-bot's one agent loop and a model: one adapter per model, each answering a turn or a one-shot prompt on a named tier.
_Avoid_: "the provider loop", "provider lane", "Gemini lane", "Claude lane", "model lane", "both lanes" (there is one loop, adapters behind one seam — and **lane** is the blueprint's actor row)

**tool table**:
The one typed row per uno-bot tool: its **access**, which says whether a call runs at once, waits for approval on a proposal card, or settles a card already standing (a dispatch distinction, not read/write), plus what the rest of the bot reads off it: the words on its task or proposal card, whether an answer can cite it, and what review a run asks for.
_Avoid_: "the tool registry", "the tool list"

**Turn**:
One uno-bot turn: one request in (who, where, the text, the images, the pending proposal), one outcome out (what was posted, what is staged, what the conversation remembers). What a person sees while it runs goes through its **Delivery** port.
_Avoid_: "the handler", "the message pipeline"

**Gate**:
The one place a staged proposal is resolved: any of five approval signals in, one verdict out (won, stale or none), and only a won verdict runs the tool.
_Avoid_: "the confirmation gate", "the ✅ handler"

**proposal card**:
The ⚠️ card holding a side-effect tool call until someone approves it: what **Gate**'s signals resolve. Short in the thread, decided in its Review pop-up.
_Avoid_: "confirmation dialog", "prompt"

**superseded card**:
A proposal card retired by a revision staged later in the same thread, or the moment a turn commits to writing one: it executes nothing and answers that it was replaced. Expired is different: the card's TTL ran out.
_Avoid_: "expired card"

**sweep**:
The end-of-day read of every source uno-bot watches for **drift** and each **commitment**, a task someone took on; fixes post next morning as **proposal cards**.
_Avoid_: "digest", "scan"

**relayed DM**:
A gated DM uno-bot sends someone on a requester's behalf, attributed.
_Avoid_: "proactive DM", "outreach"

**intake**:
A change request: implementation in a listed plus-uno repo (blueprint, Storybook docs, harness, prototypes) → that repo's GitHub issue; product or design, including a live PLUS app bug → a Roadmap card, the frame's own when named, else a new one.
_Avoid_: "ticket"

**agent session**:
The Slack object a uno-bot conversation runs inside, moving through `active` · `processing` · `suspended` · `closed`; it replaces Slack's deprecated assistant threads.
_Avoid_: "assistant thread", "the panel thread"

**working signal**:
What tells a person a turn is in flight: the **agent session** shown as processing from the start of the work until the turn settles, on every exit. Posting the answer does not take it down.
_Avoid_: "the thinking indicator", "the status line" (the status is what Slack is told; the signal is what the person sees)

**checklist**:
The Slack plan a person watches while a turn's lookups run: a **task card** per run of like lookups or per routing choice, the answer posted beneath. A task card is neither a Roadmap card nor a **proposal card**: it approves nothing.
_Avoid_: "plan stream", "progress surface", "steps"

**result table**:
The sortable table beneath an answer, filled by code from one lookup's rows on fields the model picked. One per answer; not a Markdown table or the **tool table**.
_Avoid_: "card table", "data table"

**source** / **Sources box**:
A **source** is a link a lookup of the same turn returned, which an answer stands on; the **Sources box** lists them beneath the answer in Slack, and is a single `Source:` line in Figma.
_Avoid_: "citation", "reference", "Sources:" line in the answer text

### Harness

**uno**:
The design agent, in every embodiment.
_Avoid_: "the AI"

**embodiment**:
A runtime uno runs in (the IDE, the uno-bot Worker, headless GitHub Actions), each with its own powers and its own slice of the harness.
_Avoid_: "mode", "environment"

**share-out**:
A feedback-rail publish: Loom + preview + Decisions DB link (+ replica for prototypes).
_Avoid_: "post", "update"

**direct fix / gated change**:
The two maintenance severities: a trivial fix committed straight to main, vs a PR + PRD through a Slack verdict.
_Avoid_: "Tier 1", "Tier 2"

**Tier 1 / Tier 2 / Tier 3**:
The loading tiers: always-loaded · on demand · retrieved live. *Tier* means loading and nothing else.
_Avoid_: "Tier" for a maintenance severity

**check registry**:
The one list of the repo's checks: each row says what a check runs and where it runs, and every place that runs checks is held to agree with it.
_Avoid_: "the check list", "COMPOSED"

**pointer**:
A line held in context that names material outside it and when to reach it: a skill description, a progressive-loading row. Its wording, not its target, decides whether the agent gets there.
_Avoid_: "link", "reference" (a reference is what a pointer points AT)

**ladder** / **disclosed**:
Where writing sits by how immediately the agent needs it: in-file step · in-file reference · **disclosed** reference, pushed out of the always-loaded tier behind a pointer and loaded only when it fires.
_Avoid_: "hidden" or "optional" for disclosed

**leading word**:
A compact pretrained concept an agent thinks with (*tracer bullet*, *red*, *ratchet*): repeated as a token, kept out of sentence form; front-loaded in a pointer so it triggers.

**sprawl**:
A document too long even when every line is live: attention thins across it. The cure is the ladder, not a shorter sentence.
_Avoid_: "bloat" (bloat is dead weight; sprawl is live weight)

**corpus**:
The harness's one reader of repo files: what documents exist and what each one says. Checks ask it rather than the filesystem.
_Avoid_: "the walker", "the parser" (there is one of each)

**ratchet**:
A check's recorded baseline: a count may fall and a rise is a finding, an entry the run stops finding is a finding too, and a missing record fails loudly.
_Avoid_: "the whitelist", "the exceptions file", "the allow-list"

**judge**:
The Worker's pre-send check that grades a draft against the bot-answer rubric: `pass`, `fail`, `skip` or `error`. A skip fails open, so it carries its reason.
_Avoid_: "the rubric" (that is the document a judge grades against)

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

How frame words render in chat (as `code`) is a Slack and Notion writing convention: `docs/connectors/slack.md` § Frame words render as code.
