---
embodiment: all
summary: What this blueprint is, how to retrieve from it, what absence and status mean, how paths relate to a scenario's main route, and the vocabulary — the hand-written core, always loaded; the schema is blueprint-schema.md beside it
vendored_from: BilLogic/plus-uno-blueprint docs/agents/blueprint.md
vendored_revision: e51ce8038e11
---

<!-- VENDORED from BilLogic/plus-uno-blueprint docs/agents/blueprint.md by agents/uno-bot/scripts/sync-blueprint-contract.mjs. Edit it there: this copy is overwritten by the sync, and `npm run check:contract` fails on drift. Its closing schema section is not upstream's: this repo's sync writes it (SCHEMA_POINTER) in place of the schema, which it vendors as blueprint-schema.md. -->

# The blueprint, for agents

This document is the blueprint's own account of itself, for any agent that
reads it: the Slack bot, an IDE session in this repository or in the kit's,
the canvas agent through `get_reference("blueprint")`. One source, four
readers. The first part is written by hand and says what the catalog cannot.
The two parts after it are rendered — from the entity definitions the board
shows a reader, and from the table and column comments in the database — and
`npm run check:agent-account` fails when either source changes and this file
does not.

## What it is

A service blueprint is a grid of one service, end to end. Phases run left to
right in time. Each phase holds scenarios: situations the service has to
handle. A scenario is drawn as one or more paths, and each path is a grid of
steps (columns, in that path's order) by lanes (rows: the customer, the staff
they see, the staff they do not, the tools each uses). A cell is what happens
at one lane in one step on one path. Everything else hangs off cells:
resources a cell points at, touchpoint placements, evidence, dependencies
between cells, and slices that cite cells.

## How to read it

Orient at phase and scenario level first, then open one scenario's grid. Read
a cell's `content` as the sentence of record — the thing that happens — and
its `summary` as the longer account. The spec fields (`function`, `form`,
`value_props`, `owner`, `perceived_owner`) say what the moment must do, how it
must feel, who gains, who owns it and who the customer believes owns it. A
step's `summary` is the one sentence that makes the whole column legible; a
lane's `owner_team`, `kpis` and `tools` say who staffs the row and what they
are measured on.

## Retrieval

`search_blueprint` is the one door. With `q` it ranks by meaning, prose and
structural name fused together. With filters (`filter_phase`,
`filter_scenario`, `filter_path_kind`, `filter_lane_role`) it narrows every
retriever to a scope. With filters and no `q` it returns the complete matching
set in structural order — the honest way to say "every exception path" or
"all of Discovery". `granularity` picks the level: phase, scenario, path,
step, lane or cell. Every row carries `matched_by` and `total_matched`, so
answer with the count behind the top-k: "113 cells mention Zoom; here are 15."
Direct selects, embed hints and service-key routes are in
[`blueprint-direct-access.md`](blueprint-direct-access.md).

## What absence means

- A cell with no evidence rows is an assumption. Say so when you cite it.
- A cell with no dependency rows has none recorded — report "none recorded",
  which is different from "independent".
- Every cell and path carries a `status`, defaulting to `live`: this is a
  current-state blueprint, and it documents what is in use. Future state is
  read off `status`, and only there — path names carry no convention.
- A placement with a `name` and no `touchpoint_id` is a real tool the
  registry lacks. Treat it as a touchpoint; the registry is the part that is
  behind.
- A cell with no resources points at nothing yet. Report the gap rather than
  guessing at a tool.
- A `null` placement `role` means nobody has judged it — neither core nor
  peripheral.

## What a status licenses you to say

`status` is one vocabulary on cells and paths, the `entity_status` domain:
`proposed`, `planned`, `built`, `live`, `at_risk`, `deprecated`.

- `proposed` — designed and discussed, with no build card behind it. Say "may
  never happen".
- `planned` — committed and carded, no code yet. Say "committed, not started".
- `built` — code exists, in build or QA, nobody uses it. Say "built, not
  deployed".
- `live` — in use today. This is what the service does. The default.
- `at_risk` — live and failing in a way somebody has measured. Say both
  halves.
- `deprecated` — on the way out. Say so, and point at what replaces it if a
  dependency says.

When the question is about today, answer from `live` and `at_risk`. When it is
about the roadmap, answer from `proposed`, `planned` and `built`.

## Paths and the main route

A path's `kind` is `happy`, `variant` or `exception`. The happy path IS the
scenario's main route. A variant is equally normal, chosen by a condition. An
exception is a rule or a failure diverting the route. Nothing connects across
paths: each path owns its lanes and cells, and shares the scenario's steps
through `path_steps` in its own order. A scenario's `layout` is `stacked` or
`merged` — how the board is drawn, a display setting and not a kind.
Dependencies between cells are `leads_to` (this cell makes the other happen,
drawn as an arrow) or `enables` (the other must already be in place).

## The vocabulary

Rendered from `ENTITY_KIND_DEFINITIONS` in `src/lib/panelTerms.ts` — the six
kinds the board defines for a reader who has never seen one.

<!-- generated:vocabulary from src/lib/panelTerms.ts — edit the source, then npm run agent-account -->

**Service** — The whole service this blueprint maps, end to end. Everything else on the board is part of it.

**Phase** — A chapter of the service, in time order. Each phase holds the scenarios that can happen during it.

**Scenario** — A specific situation inside a phase, mapped on its own board.

**Path** — One route through a scenario: the main way, plus variants and exceptions. Paths are alternatives, not stages — nothing carries across them.

**Step** — One moment in time, read down every lane at once. Steps run left to right.

**Lane** — A row of the board, for one kind of participant — the customer, frontstage staff, backstage work, the tools. A row reads across every step.

<!-- /generated:vocabulary -->

## The schema, as the catalog describes it

Every table and column in the catalog's own comments, and the tables only a service key reads, is `docs/connectors/supabase/blueprint-schema` — `read_reference` it in Slack, open the `.md` in an IDE. Read it when an answer turns on what a column means: a field a row carries that the sections above leave unexplained, or a table the question names.
