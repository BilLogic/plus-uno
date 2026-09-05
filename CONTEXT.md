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
| **uno-storybook** | design-system source of truth (stories + MDX → /storybook) | "the docs site" |
| **share-out** | a feedback-rail publish: Loom + preview + Decisions DB link (+ replica for prototypes) | "post", "update" |
| **Decisions DB** | centralized decision log under Design HQ — Status / Owner / Sign-off / Date / Roadmap Card / Evidence | "Decision Log" (obsolete per-project subpage) |
| **pillar** | product area (Universal · Admin · Toolkit · Training · Marketing …) — maps to a Slack channel | "category" |
| **replica** | the Figma frame mirroring a coded prototype — required in prototype share-outs | "screenshot" |
| **direct fix / gated change** | the two maintenance severities: a trivial fix applied straight to main with a digest line, vs a PR + PRD through a Slack verdict. Was "Tier 1 / Tier 2 (maintenance)"; the old spelling retires in batches (#429, in batches) | "Tier 1", "Tier 2" |
| **Tier 1 / Tier 2 / Tier 3** | the loading tiers: always-loaded · on demand · retrieved live (`AGENTS.md` § The loading contract). *Tier* means loading and nothing else | "Tier" for a maintenance severity |
| **RM-ID** | Roadmap card id (`RM-<n>`) — the Figma↔Notion join key | — |
| **embodiment** | a runtime uno runs in — the IDE, the uno-bot Worker, headless GitHub Actions — each with its own powers and its own slice of the harness; `embodiment:` frontmatter says which docs a runtime bundles | "mode", "environment" |
| **persona** | uno-bot's own always-loaded document (`agents/uno-bot/AGENT.md`): voice, audience, gate, etiquette — what the Worker is, beside what every embodiment obeys | "system prompt", "soul" |
| **pointer** | a line held in context that names material outside it and the branch that should reach it — a skill description, a row in § Progressive loading. Its wording, not its target, decides whether the agent gets there | "link", "reference" (a reference is what a pointer points AT) |
| **ladder** | where a piece of writing sits by how immediately the agent needs it: in-file step · in-file reference · **disclosed** reference behind a pointer | — |
| **disclosed** | reference pushed out of the always-loaded tier behind a pointer, loaded only when the pointer fires; the Worker's `read_reference` tool is its Tier 2 | "hidden", "optional" |
| **leading word** | a compact pretrained concept an agent thinks with (*tracer bullet*, *red*, *ratchet*): repeated as a token, kept out of sentence form; front-loaded in a pointer so it triggers | — |
| **sprawl** | a document too long even when every line is live — attention thins across it; the cure is the ladder, not a shorter sentence | "bloat" (bloat is dead weight; sprawl is live weight) |

## Two vocabularies — the blueprint speaks service-blueprint, the Roadmap speaks project-management

Ratified in ADR-023 (`docs/adr/023-two-vocabularies-ratified-blueprint-vs-roadmap.md`); this section is its only statement.

Two estates describe the product in **different languages**, and the words are NOT interchangeable. Mixing them is a defect: never describe results from one estate in the other's vocabulary, and never search one estate for the other's concepts.

| | **uno-blueprint** (Supabase) | **Notion Roadmap** (Design HQ board) |
|---|---|---|
| What it holds | how the **service works**: who does what, when | what the **team is building**: work items + their status |
| Its words | **phase** · **service scenario** · **path** (read both `kind` and `name` — `blueprint-navigation.md` §4) · **step** · **lane** = the actor row · **cell** = one activity at lane × step | **Roadmap** · **card** (id = **RM-ID**, `RM-<n>`) · **Design Status** · **Product Pillar** · **Product Tag** · **owner** · **PRD** |
| NOT its words | "roadmap", "card", "Design Status", "pillar", "owner", "WIP", "under review" — **the blueprint has no cards and no Design Status.** It does have `status` on `paths` and `cells` (proposed · planned · built · live · at_risk · deprecated), which says whether a row is `live` today or still coming (`AGENT.md` § Two sources) — a different axis from a card's Design Status, and it answers a different question | "scenario", "lane", "cell", "path", "step", "phase", "actor" — **the Roadmap has no service steps or actor rows** |

**Topic words overlap; frame words don't.** "Goal Setting" is both a blueprint *scenario* and a Roadmap *card topic* — the topic never tells you which estate to read. The **frame words in the question** do:

- card / status / pillar / owner / RM-ID / "where are we on X" / "what's WIP or under review" → **Roadmap** (Notion), full stop.
- who-does-what / flow / scenario / actor / step / "what happens when" → **blueprint** (Supabase), full stop.

**Attribution rule:** when reporting findings, name the estate you actually read, in its own words — "on the Roadmap board" ONLY for Notion Roadmap cards; "in the service blueprint" ONLY for blueprint rows.

How frame words render in chat (as `code`) is a Slack and Notion writing convention: `docs/connectors/slack.md` § Frame words render as code.
