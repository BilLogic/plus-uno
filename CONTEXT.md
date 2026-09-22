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
| **Spec** | Full page composition (e.g., `specs/Home/Pages/`) |
| **Prompt-spec** | The engineered prompt handed to an external generative tool (Stitch, Figma Make, v0) — the deliverable of the low/mid-fi lane; the artifact that tool returns is a different thing. Its shape is `skills/uno-prototype/references/method.md` §3. A different thing from **Spec** above and from a **PRD**, which is its input. Avoid bare "spec" for it |
| **Component docs page** | The tabbed page a human reads for one component — one `.mdx` under `design-system/src/components/`, 48 of them. Distinct from **Page** (a Context Level), from **Spec**, and from a *page story* (`specs/**/Pages/**`, the population #243 gave an `<h1>`). Avoid bare "docs page" |
| **Token** | Design value: color, spacing, typography, elevation, radius |
| **Foundation** | Fundamental design primitive (color palette, type scale, grid) |

## Harness & workflow terms

| Term | Meaning | Do NOT use |
|---|---|---|
| **uno** | the design agent, all embodiments (constitution: `AGENTS.md`) | "the AI" |
| **uno-bot** | uno's Slack embodiment — the Cloudflare Worker in `agents/uno-bot/` | "Slackbot" |
| **uno-blueprint** | product source of truth (Supabase); Tier 3 — `AGENTS.md` § The loading contract | "the database" |
| **Diagnostics** | uno-bot's probe module (`agents/uno-bot/src/diagnostics/`): the public `/health/blueprint` contract probe plus the `/debug/*` probes, behind one token gate and one report envelope (build, duration, subrequest accounting). `/health` is the separate uptime route in the Worker entry | "the debug routes" |
| **uno-storybook** | design-system source of truth (stories + MDX → /storybook) | "the docs site" |
| **share-out** | a feedback-rail publish: Loom + preview + Decisions DB link (+ replica for prototypes) | "post", "update" |
| **Decisions DB** | centralized decision log under Design HQ — Status / Owner / Sign-off / Date / Roadmap Card / Evidence | "Decision Log" (obsolete per-project subpage) |
| **pillar** | product area (Universal · Admin · Toolkit · Training · Marketing …) — maps to a Slack channel | "category" |
| **replica** | the Figma frame mirroring a coded prototype — required in prototype share-outs | "screenshot" |
| **direct fix / gated change** | the two maintenance severities: a trivial fix applied straight to main with a digest line, vs a PR + PRD through a Slack verdict. | "Tier 1", "Tier 2" |
| **Tier 1 / Tier 2 / Tier 3** | the loading tiers: always-loaded · on demand · retrieved live (`AGENTS.md` § The loading contract). *Tier* means loading and nothing else | "Tier" for a maintenance severity |
| **RM-ID** | Roadmap card id (`RM-<n>`) — the Figma↔Notion join key | — |
| **embodiment** | a runtime uno runs in — the IDE, the uno-bot Worker, headless GitHub Actions — each with its own powers and its own slice of the harness; `embodiment:` frontmatter says which docs a runtime bundles | "mode", "environment" |
| **check registry** | `scripts/checks.registry.mjs` — one row per check (name, command, package, trigger, baseline, guards prose), read by the harness runner and by the generator that writes the `check:*` block of package.json and the check steps of the two workflows. Its `trigger` column names the four places a check runs, each asserted in both directions (written or compared). The list has one home; a check listed in one place and forgotten in another fails `check:check-registry`, and so does a row with a trigger and no step or a step with no row | "the check list", "COMPOSED" |
| **persona** | uno-bot's own always-loaded document (`agents/uno-bot/AGENT.md`): voice, audience, gate, etiquette — what the Worker is, beside what every embodiment obeys | "system prompt", "soul" |
| **pointer** | a line held in context that names material outside it and the branch that should reach it — a skill description, a row in § Progressive loading. Its wording, not its target, decides whether the agent gets there | "link", "reference" (a reference is what a pointer points AT) |
| **ladder** | where a piece of writing sits by how immediately the agent needs it: in-file step · in-file reference · **disclosed** reference behind a pointer | — |
| **disclosed** | reference pushed out of the always-loaded tier behind a pointer, loaded only when the pointer fires; the Worker's `read_reference` tool is its Tier 2 | "hidden", "optional" |
| **leading word** | a compact pretrained concept an agent thinks with (*tracer bullet*, *red*, *ratchet*): repeated as a token, kept out of sentence form; front-loaded in a pointer so it triggers | — |
| **ThreadState** | uno-bot's per-thread memory behind one typed interface (`agents/uno-bot/src/thread-state/`): history, the pending proposal, assistant context, the cancel flag, event dedup and the run lease. One cancel flag, three doors into it: `/stop`, the Home-tab Stop button, and Slack's own stop control on the session (`agent_session_stopped`, #576) — each raises it, and the running loop reads it at a tool boundary. All three take their dependencies by name (`slack/stop-doors.ts`, #593). Two adapters — the Durable Object in production, in-memory in tests — held equal by one conformance suite. A caller hands in channel and thread; the Durable Object id and the routes stay inside the module | "the DO", "thread-state client" (deleted 2026-09) |
| **ModelProvider** | uno-bot's seam between its one agent loop (`agents/uno-bot/src/agent/loop.ts`) and a model. An adapter takes a neutral conversation, a tool roster and an opaque tier name and returns text, tool calls, usage and a stop kind; the wire format, the tier's model and dials, the cache and the backup model stay inside. Its second call is one-shot `generate` — a tier, a system prompt, a prompt, text out, no tools — for a caller wanting an answer, not a turn: the draft judge; its reply has three dispositions, "never asked, no credential" among them, adapter-side. Gemini is production's adapter, Claude-on-Vertex the opt-in second, the fake for its own tests. Above the seam its public surface is one function, `runAgent(input)` in `agent/run-agent.ts`, whose arguments are all required (#624), whose return carries the tool ledger, receipt and references, not a caller's scope (#625), and whose `selectProvider` is the one place `MODEL_PROVIDER` is read — ratcheted by `agents/uno-bot/scripts/provider-read.test.mjs` since #605 | "the provider loop", "provider lane", "Gemini lane", "Claude lane", "model lane", "both lanes" (there is one loop, adapters behind one seam — and **lane** is the blueprint's actor row) |
| **tool table** | what a uno-bot tool IS, as one typed row per tool (`agents/uno-bot/src/agent/tool-table.ts`): its **access** — `ungated` · `gated` · `control`, the DISPATCH distinction and not a read/write one — plus the columns its five readers answer from — retrieval, review-request, the gated row’s card words (#598). A row is joined to its schema from `tool-definitions.json`, the schema’s source, and to its body in `tool-bodies.ts`; `tools.ts` is the join. Paired the way **Diagnostics** pairs a route with its probe: a row with no body or a body with no row fails `tsc`. Running a tool IS the lookup (#597): `agent/run-agent.ts` runs the `ungated` rows inside the turn; `agent/resolve-proposal.ts` runs the `gated` row past the **Gate**; `control` is intercepted by the loop before either. No dispatch arm and no private roster left to forget | "the tool registry", "the tool list" |
| **Turn** | one uno-bot turn as a module (`agents/uno-bot/src/turn/`): one request in — who, where, the text, the images as bytes, the pending proposal — and one outcome out — what was posted, what is staged, what the conversation remembers, plus telemetry. Tier routing (once, here), the conversation the model reads (assembled once), the draft judges, the card and the history write are its implementation; what a person sees WHILE it runs — the 👀, the **working signal**, the narration, the card — goes through its **Delivery** port: a recording adapter every turn test runs on, and Slack's, which takes its client BY NAME (`slack/delivery-adapter.ts`, `Env` stopping at `slack/slack-delivery.ts`) — THE PATTERN every seam here keeps: dependencies by name, `Env` behind the envelope, the Node suite driving the module rather than matching its source (#594). TWO CALLERS, ONE WIRING: the Slack envelope adapter (`src/slack/turn-adapter.ts`, its pure half `src/slack/turn-request.ts`) and the eval adapter (`src/eval/turn-adapter.ts`) build the request through `src/turn/request.ts` and the dependencies through `src/turn/env-deps.ts`, and each holds only its own differences: store, Delivery, what a won verdict does, the ts its tool-side posts thread off, and (eval only) its reporters. One parity test drives both real builders (`tests/eval-adapter.test.ts`), as **ThreadState**'s two adapters are by its conformance suite | "the handler", "the message pipeline" |
| **Gate** | the one place a staged proposal is resolved (`agents/uno-bot/src/gate/`): four signals in — a reaction on the card, the card's ✅/⛔ button, the same emoji typed alone, the model's validated `proposal_resolve` — and one verdict out: won, stale or none, plus a structured note and the confirmed tool to run. The lookup (card ts, reply thread, then whole DM), what an emoji means, and the claim whose delete IS the lock are its implementation; each door posts the verdict through **Turn**'s Delivery and hands the tool to the executor, taking both by name (`gate/reaction-door.ts` first, #592) — Slack spells the note (#623), which keeps Gate clear of Slack | "the confirmation gate", "the ✅ handler" |
| **proposal card** | the ⚠️ card uno-bot posts to hold a side-effect tool call until a person approves it — the thing **Gate**'s four signals resolve; its message ts is the proposal's identity in **ThreadState** | "confirmation dialog", "prompt" |
| **relayed DM** | a gated DM uno-bot sends someone on a requester's behalf, attributed | "proactive DM", "outreach" |
| **intake** | a change request: code/harness → listed repo's issue; product/design → Roadmap card | "ticket" |
| **superseded card** | a proposal card retired by a revision staged later in the same reply thread, or retired the moment a turn commits to writing that revision: it executes nothing and answers that it was replaced — a different answer from expired, which is the hour-long TTL running out | "expired card" |
| **agent session** | the Slack object a uno-bot conversation runs inside on the agent surface, addressed by `channel_id` + `thread_ts` and moved between four lifecycle statuses — `active` · `processing` · `suspended` · `closed` — with `agents.sessions.setStatus`. Replaces the `assistant.threads.*` methods, which now run over a compatibility bridge and are dated for deprecation in February 2027. While it sits in `processing` Slack offers a stop control on the session, for a subscriber to `agent_session_stopped`; the press moves no status of its own, so the app transitions the session itself (#576) | "assistant thread", "the panel thread" |
| **working signal** | what tells a person a turn is in flight: the **agent session** moved to `processing` when the work starts and settled on every exit, raised and cleared as ONE pairing by `withWorkingSignal` (`agents/uno-bot/src/turn/delivery.ts`), whose `finally` is what makes the clear survive a new exit. Under agent sessions the settle is the only thing that takes it down — posting the answer no longer does — and each half logs a `[working]` line carrying the turn's external spend. Turn owns that pairing; the one other settler is the in-thread stop door (`slack/stop-doors.ts`), which Slack requires to transition the session when a person presses stop (#576) | "the thinking indicator", "the status line" (the status is what Slack is told; the signal is what the person sees) |
| **corpus** | the harness's one reader of repo files (`scripts/lib/corpus.mjs`): which documents exist under a path, what a file says, where a doc's frontmatter stops, its markdown links, its heading outline. A check asks it rather than the filesystem, and it takes a root so its test reads a fixture tree — the listing and the read taking the same root is what keeps a second one from appearing | "the walker", "the parser" (there is one of each) |
| **ratchet** | a check's recorded baseline, and the module that owns it (`scripts/lib/ratchet.mjs`): the READ — no check parses a record itself, and what it gates on that the module does not own comes back through `envelope()`; which direction fails; the stale-entry and placeholder-reason sweeps; and the `--update` write, a MERGE from the record on disk and in the ENCODING it emits, so a no-movement write moves no byte and a key the module does not own survives it, the reasons three records keep beside their set. Twelve records, twelve SHAPES, one row each in `ratchet-shapes.mjs`; the invariant is stated once and asserted against all twelve in `ratchet-conformance.mjs`, as **ThreadState**'s does. A recorded count may fall and a rise is a finding; an entry the run stops finding is one too, since a ratchet that only grows is a list; an absent or unreadable record fails loudly, because an empty baseline reads green | "the whitelist", "the exceptions file", "the allow-list" |
| **recording** | a case's captured model replies, tool results and subject — the local eval transport's input (`docs/evals/fixtures/recordings/`); `source` is `authored` or `captured`, written down rather than inferred, and it reaches the results file | "fixture" (a fixture is what a case ASSERTS; a recording is what answered it) |
| **transport** | how the eval runner reaches a turn: the deployed Worker's eval route, or **Turn** in-process from a **recording**. The summary names which one answered, because the two are different measurements | "the endpoint", "the eval route" (that is one transport's target) |
| **judge** | who grades an eval answer — a module beside the **transport** and the same shape (`agents/uno-bot/scripts/eval-judge.mjs`): `{ name, judgeCase(case, transcript) }`, owning the rubric, the credential, the call, the cut and the fail-open, and grading on the `grind` tier — model AND thinking level, ADR-028, rather than a pair of its own picking. Three verdicts: `pass`, `fail`, `skipped`. A skip fails OPEN, so it carries its reason and the summary counts what was judged — an unjudged run reads as unjudged rather than as a clean sweep | "the rubric" (that is the document a judge grades against) |
| **eval case** | one scored eval conversation as a module (`agents/uno-bot/scripts/eval-case.mjs`): its declared shape (`CASE_KEYS`/`TURN_KEYS` — a key outside them is refused, not ignored), its one loader, and the **census** of them, from which every count about the suite is read rather than typed. Results are `eval-results.mjs`: per suite one row shape, on a shared stamped summary and gate | "the fixture" (a fixture is the file of cases; a case is one of them) |
| **unreachable** | a case this run's **transport** has no way to reach — for the local one, a case with no **recording**. It skips by name, stays out of the denominator, and is named wherever the run reports — twice, deliberately: the **census** claims it before the walk, the summary records it after | "skipped" (a skip is a reachable case whose subject condition nothing satisfied) |
| **sprawl** | a document too long even when every line is live — attention thins across it; the cure is the ladder, not a shorter sentence | "bloat" (bloat is dead weight; sprawl is live weight) |

## Two vocabularies — the blueprint speaks service-blueprint, the Roadmap speaks project-management

Ratified in ADR-023 (`docs/adr/023-two-vocabularies-ratified-blueprint-vs-roadmap.md`); this section is its only statement.

Two estates describe the product in **different languages**, and the words are NOT interchangeable. Mixing them is a defect: never describe results from one estate in the other's vocabulary, and never search one estate for the other's concepts.

| | **uno-blueprint** (Supabase) | **Notion Roadmap** (Design HQ board) |
|---|---|---|
| What it holds | how the **service works**: who does what, when | what the **team is building**: work items + their status |
| Its words | **phase** · **service scenario** · **path** (read both `kind` and `name` — `docs/connectors/supabase/blueprint.md` § Paths and the main route) · **step** · **lane** = the actor row · **cell** = one activity at lane × step | **Roadmap** · **card** (id = **RM-ID**, `RM-<n>`) · **Design Status** · **Product Pillar** · **Product Tag** · **owner** · **PRD** |
| NOT its words | "roadmap", "card", "Design Status", "pillar", "owner", "WIP", "under review" — **the blueprint has no cards and no Design Status.** It does have `status` on `paths` and `cells` (proposed · planned · built · live · at_risk · deprecated), which says whether a row is `live` today or still coming (`AGENT.md` § Two sources) — a different axis from a card's Design Status, and it answers a different question | "scenario", "lane", "cell", "path", "step", "phase", "actor" — **the Roadmap has no service steps or actor rows** |

**Topic words overlap; frame words don't.** "Goal Setting" is both a blueprint *scenario* and a Roadmap *card topic* — the topic never tells you which estate to read. The **frame words in the question** do:

- card / status / pillar / owner / RM-ID / "where are we on X" / "what's WIP or under review" → **Roadmap** (Notion), full stop.
- who-does-what / flow / scenario / actor / step / "what happens when" → **blueprint** (Supabase), full stop.

**Attribution rule:** when reporting findings, name the estate you actually read, in its own words — "on the Roadmap board" ONLY for Notion Roadmap cards; "in the service blueprint" ONLY for blueprint rows.

How frame words render in chat (as `code`) is a Slack and Notion writing convention: `docs/connectors/slack.md` § Frame words render as code.
