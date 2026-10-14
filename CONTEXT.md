---
embodiment: all
summary: Use these terms consistently across all design system work, prototypes, and documentation
---

# PLUS Terminology

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand) · distilled 2026-07-07 · applied by every agent naming a product, org, design-system, or harness term. -->

Use these terms consistently across all design system work, prototypes, and documentation. Do not substitute generic web terms.

## Product terms

| PLUS Term | Meaning | Do NOT use |
|-----------|---------|------------|
| **Session** | A scheduled tutoring slot (Zoom or Pencil) | "class", "meeting", "appointment" |
| **Reflection** | Post-session tutor self-report | "survey", "feedback form", "review" |
| **Escalation** | Tutor flags session for supervisor review | "report", "incident", "alert" |
| **Call-Off** | Tutor cancels a session | "cancel", "absence", "no-show" (no-show is a separate behavior) |
| **Fill-In** | Tutor covers an open session slot | "substitute", "replacement" |
| **Strike** | Compliance violation (3-strike threshold) | "warning point", "demerit" |
| **TIP** | Tutor Improvement Plan | "probation", "warning" |
| **PIP** | Performance Improvement Plan (escalated from TIP) | "final warning" |
| **Tutor Coach** | AI weekly compliance monitoring system | "monitor", "tracker" |
| **TACT** | Tutor motivation + growth feedback system | "dashboard", "report" |
| **Student Card** | UI component showing student info during session | "student profile", "student row" |
| **Student Insight** | AI-generated student engagement summary | "student report", "analytics" |

## Organizational terms

| Term | Meaning |
|------|---------|
| **Affiliation** | University: CMU, Pitt, or Duquesne |
| **Site** | School location where students are based |
| **Lead Tutor** | Senior tutor with mentoring + attendance duties |
| **SMART** | PLUS training system |
| **Breakout Room** | Zoom sub-room for one-on-one tutoring |

## Design-system terms

| Term | Meaning |
|------|---------|
| **Context Level** | Atomic hierarchy: Element → Card → Section → Page |
| **Spec** | Full page composition |
| **Prompt-spec** | The engineered prompt handed to an external generative tool (Stitch, Figma Make, v0): the deliverable of the low/mid-fi lane, not the artifact the tool returns. Distinct from **Spec** and from the **PRD** it is written from. Avoid bare "spec" |
| **Component docs page** | The tabbed page a human reads for one component. Distinct from **Page** (a Context Level), from **Spec**, and from a page story. Avoid bare "docs page" |
| **Token** | Design value: color, spacing, typography, elevation, radius |
| **Foundation** | Fundamental design primitive (color palette, type scale, grid) |

## Harness & workflow terms

| Term | Meaning | Do NOT use |
|---|---|---|
| **uno** | the design agent, in every embodiment | "the AI" |
| **uno-bot** | uno's Slack embodiment, a self-hosted Cloudflare Worker | "Slackbot" |
| **uno-blueprint** | the product source of truth for the current service (Supabase), retrieved live. Not the `uno-blueprint` devDependency, which is the sb template kit | "the database" |
| **Diagnostics** | uno-bot's probes: the public blueprint health probe and the token-gated debug probes, sharing one report shape. Separate from the plain uptime check | "the debug routes" |
| **uno-storybook** | design-system source of truth (stories + MDX → /storybook) | "the docs site" |
| **share-out** | a feedback-rail publish: Loom + preview + Decisions DB link (+ replica for prototypes) | "post", "update" |
| **Decisions DB** | centralized decision log under Design HQ — Status / Owner / Sign-off / Date / Roadmap Card / Evidence | "Decision Log" (obsolete per-project subpage) |
| **pillar** | product area (Universal · Admin · Toolkit · Training · Marketing …) — maps to a Slack channel | "category" |
| **replica** | the Figma frame mirroring a coded prototype — required in prototype share-outs | "screenshot" |
| **direct fix / gated change** | the two maintenance severities: a trivial fix committed straight to main, vs a PR + PRD through a Slack verdict. | "Tier 1", "Tier 2" |
| **Tier 1 / Tier 2 / Tier 3** | the loading tiers: always-loaded · on demand · retrieved live. *Tier* means loading and nothing else | "Tier" for a maintenance severity |
| **RM-ID** | Roadmap card id (`RM-<n>`; `Card <n>` in Figma titles) — the join key | — |
| **embodiment** | a runtime uno runs in (the IDE, the uno-bot Worker, headless GitHub Actions), each with its own powers and its own slice of the harness | "mode", "environment" |
| **check registry** | the one list of the repo's checks: each row says what a check runs and where it runs, and every place that runs checks is held to agree with it | "the check list", "COMPOSED" |
| **persona** | uno-bot's own always-loaded document: voice, audience, gate and etiquette, beside what every embodiment obeys | "system prompt", "soul" |
| **pointer** | a line held in context that names material outside it and when to reach it — a skill description, a progressive-loading row. Its wording, not its target, decides whether the agent gets there | "link", "reference" (a reference is what a pointer points AT) |
| **ladder** / **disclosed** | where writing sits by how immediately the agent needs it: in-file step · in-file reference · **disclosed** reference, pushed out of the always-loaded tier behind a pointer and loaded only when it fires | "hidden" or "optional" for disclosed |
| **leading word** | a compact pretrained concept an agent thinks with (*tracer bullet*, *red*, *ratchet*): repeated as a token, kept out of sentence form; front-loaded in a pointer so it triggers | — |
| **sprawl** | a document too long even when every line is live — attention thins across it; the cure is the ladder, not a shorter sentence | "bloat" (bloat is dead weight; sprawl is live weight) |
| **ThreadState** | uno-bot's memory of one thread, behind one typed interface: its history, the pending proposal, the assistant context, the cancel flag, the events already handled and the run lease | "the DO", "thread-state client" |
| **ModelProvider** | the seam between uno-bot's one agent loop and a model: one adapter per model, each answering a turn or a one-shot prompt on a named tier | "the provider loop", "provider lane", "Gemini lane", "Claude lane", "model lane", "both lanes" (there is one loop, adapters behind one seam — and **lane** is the blueprint's actor row) |
| **tool table** | the one typed row per uno-bot tool: its **access**, which says whether a call runs at once, waits for approval on a proposal card, or settles a card already standing (a dispatch distinction, not read/write), plus what the rest of the bot reads off it: the words on its task or proposal card, whether an answer can cite it, and what review a run asks for | "the tool registry", "the tool list" |
| **Turn** | one uno-bot turn: one request in (who, where, the text, the images, the pending proposal), one outcome out (what was posted, what is staged, what the conversation remembers). What a person sees while it runs goes through its **Delivery** port | "the handler", "the message pipeline" |
| **Gate** | the one place a staged proposal is resolved: any of five approval signals in, one verdict out (won, stale or none), and only a won verdict runs the tool | "the confirmation gate", "the ✅ handler" |
| **proposal card** | the ⚠️ card holding a side-effect tool call until someone approves it — what **Gate**'s signals resolve; short in the thread, decided in its Review pop-up | "confirmation dialog", "prompt" |
| **superseded card** | a proposal card retired by a revision staged later in the same thread, or the moment a turn commits to writing one: it executes nothing and answers that it was replaced. Expired is different: the card's TTL ran out | "expired card" |
| **sweep** | the end-of-day read of every source uno-bot watches for **drift** and each **commitment**, a task someone took on; fixes post next morning as **proposal cards** | "digest", "scan" |
| **drift** | a source of truth a later decision overruled — a Notion page or a Figma file | "out of sync" |
| **relayed DM** | a gated DM uno-bot sends someone on a requester's behalf, attributed | "proactive DM", "outreach" |
| **intake** | a change request: implementation in a listed plus-uno repo (blueprint, Storybook docs, harness, prototypes) → that repo's GitHub issue; product or design, including a live PLUS app bug → a Roadmap card, the frame's own when named, else a new one | "ticket" |
| **agent session** | the Slack object a uno-bot conversation runs inside, moving through `active` · `processing` · `suspended` · `closed`; it replaces Slack's deprecated assistant threads | "assistant thread", "the panel thread" |
| **working signal** | what tells a person a turn is in flight: the **agent session** shown as processing from the start of the work until the turn settles, on every exit. Posting the answer does not take it down | "the thinking indicator", "the status line" (the status is what Slack is told; the signal is what the person sees) |
| **checklist** | the Slack plan a person watches while a turn's lookups run: a **task card** per run of like lookups or per routing choice, the answer posted beneath. A task card is neither a Roadmap card nor a **proposal card**: it approves nothing | "plan stream", "progress surface", "steps" |
| **result table** | the sortable table beneath an answer, filled by code from one lookup's rows on fields the model picked. One per answer. Not a Markdown table or the **tool table** | "card table", "data table" |
| **source** / **Sources box** | a **source** is a link a lookup of the same turn returned, which an answer stands on; the **Sources box** lists them beneath the answer in Slack, and is a single `Source:` line in Figma | "citation", "reference", "Sources:" line in the answer text |
| **corpus** | the harness's one reader of repo files: what documents exist and what each one says. Checks ask it rather than the filesystem | "the walker", "the parser" (there is one of each) |
| **ratchet** | a check's recorded baseline: a count may fall and a rise is a finding, an entry the run stops finding is a finding too, and a missing record fails loudly | "the whitelist", "the exceptions file", "the allow-list" |
| **judge** | the Worker's pre-send check that grades a draft against the bot-answer rubric: `pass`, `fail`, `skip` or `error`. A skip fails open, so it carries its reason | "the rubric" (that is the document a judge grades against) |

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
