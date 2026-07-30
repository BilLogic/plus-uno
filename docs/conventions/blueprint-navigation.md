# uno-blueprint — Navigation Guide

<!-- canonical per ADR-017; vendored 2026-07-29 from the Notion "UNO Blueprint Navigation Guide" (the guided-arm context block of the UNO Blueprint Grounding Evaluation). The Notion page is the mirror; this file is the source the harness loads. Two rules were ADAPTED on vendoring — see § Answering rules. Companion: supabase.md (access, contract, source routing). -->

The eval that produced this guide: guided blueprint arms scored 100% vs 36% docs-only, and the top failure tag across un-guided arms was `nav-failure` (32), then `shallow-coverage` (23). This file is the fix for both — load it whenever answering a journey question or drafting from journey context.

## 1 · What it is

A structured **service blueprint** for the PLUS journey: how tutors, lead tutors, classroom teachers, researchers, and support staff move through the end-to-end experience. A grid — **rows are actors (`layer`s), columns are journey `step`s, and each `cell` holds the evidence at that intersection.** Postgres on Supabase, read-only for every consumer except `writers/blueprint`.

Query the **database**, never the Netlify front end — that's the human viewer; the database is richer. Cite the live app URL to readers (`https://uno-blueprint.netlify.app/`) while grounding in the rows.

## 2 · The data model

| Table | Rows | What it is | Joins on |
|---|---|---|---|
| `service_lifecycles` | 1 | the whole journey ("PLUS Application") | — |
| `phases` | 5 | ordered phases: Application → Onboarding → Pre-session → In-session → Post-session | `service_lifecycle_id` |
| `service_scenarios` | 17 | scenarios within a phase (e.g. Goal Setting) | `phase_id` |
| `paths` | 23 | scenario variants: `happy` / `unhappy` / `exception` / `alternative` | `service_scenario_id` |
| `steps` | 140 | the columns, scoped to a scenario | `service_scenario_id` |
| `path_steps` | 148 | which steps appear on a path + `column_position` | `path_id`, `step_id` |
| `layers` | 186 | the rows (actors), scoped to a path, ordered by `row_position` | `path_id` |
| `cells` | 737 | **the evidence** at path × layer × step | `path_id`, `layer_id`, `step_id` |
| `cell_triggers` | 448 | dependencies: one cell triggers another | `source_cell_id` → `target_cell_id` |

Mental model: **cell = (path × layer × step)**. Read a scenario by picking a path, then reading its cells across layers (rows) and steps (columns). (`slices` / `slice_items` are saved 1-D cuts for the viewer; `findings` / `evidence` / `propositions` are audit and provenance surfaces — not journey facts. Don't answer journey questions from them.)

**Cell evidence lives in four fields:** `content` (primary grid text) · `description` (longer detail) · `picture` (image ref) · `links` (JSON array). A cell can carry real evidence with an empty `content` — at the 2026-07-18 snapshot 588 cells had content, 162 descriptions, 354 pictures, 224 links. **Check all four before calling a topic empty.** Never infer a fact from an image filename or a link label without opening the resource.

## 3 · Layer semantics — read before attributing any action

Mis-attribution is the most common error (`schema-misread`). In the built-out scenarios:

- **Visual** — screenshots / UI reference, *not an actor*.
- **Partner Action: Teacher** — the *classroom teacher* (partner, not a PLUS tutor): observes, reminds, raises "ask for help" alerts, escalates.
- **Lead Tutor** — supervises the room: rosters, attendance, assigning unpaired students, teacher liaison.
- **Regular Tutor** — the front-line tutor running the per-student flow.
- **Front Stage Tech** — tools the user touches (Zoom/Pencil, PLUS App).
- **Front Stage Actions** — visible actions supporting the user.
- **Back Stage Actions** — behind-the-scenes work, typically **researchers / ops** ("Researcher sets student order"). **Never attribute a back-stage action to a tutor.**
- **Back Stage Tech** — systems working behind the scenes.
- **Support Actions** — Dev team, Design team.

## 4 · Path semantics

`path_type` ∈ `happy` / `unhappy` / `exception` / `alternative`. A scenario usually has a Happy Path plus alternatives for variants and edge cases — e.g. Goal Setting encodes the **Set → Check → Update** goal cycle as three paths, plus two edge cases where the dashboard state mismatches the cycle. **Establish which path a question is about before answering**; never merge happy + edge into one answer.

## 5 · Retrieval

uno-bot has no SQL: it calls `blueprint_search` (semantic + keyword over these same rows), which returns `layer` / `step` / `scenario` per row — phrase the query in journey words (actor, scenario, step) rather than product-management words, and re-query per actor when a question spans layers. In-IDE, query Supabase directly with the recipes below.

<!-- ide-only -->
### Query recipes (Supabase MCP / SQL)

**Phase → scenario map**
```sql
select p.order_position, p.name as phase, ss.order_position, ss.name as scenario
from phases p join service_scenarios ss on ss.phase_id = p.id
order by p.order_position, ss.order_position;
```

**A path's steps in order**
```sql
select st.name, ps.column_position
from service_scenarios ss
join paths pa on pa.service_scenario_id = ss.id
join path_steps ps on ps.path_id = pa.id
join steps st on st.id = ps.step_id
where ss.name = 'Goal Setting' and pa.name = 'Happy Path'
order by ps.column_position;
```

**The full grid for one path, all evidence fields**
```sql
select l.name as layer, st.name as step, ps.column_position,
       c.content, c.description, c.picture, c.links
from cells c
join paths pa on c.path_id = pa.id
join layers l on c.layer_id = l.id
join steps st on c.step_id = st.id
join path_steps ps on ps.path_id = pa.id and ps.step_id = st.id
where pa.service_scenario_id = (select id from service_scenarios where name = 'Goal Setting')
  and pa.name = 'Happy Path'
  and (coalesce(c.content, '') <> '' or coalesce(c.description, '') <> ''
       or c.picture is not null or c.links <> '[]'::jsonb)
order by ps.column_position, l.row_position;
```

**Which actor performs an action (keyword)**
```sql
select ss.name as scenario, pa.name as path, l.name as layer, st.name as step,
       c.content, c.description, c.picture, c.links
from cells c
join paths pa on c.path_id = pa.id
join service_scenarios ss on pa.service_scenario_id = ss.id
join layers l on c.layer_id = l.id
join steps st on c.step_id = st.id
where concat_ws(' ', c.content, c.description) ilike '%student order%';
```

**Cross-cell dependencies**
```sql
select sc.content as source, tc.content as target
from cell_triggers ct
join cells sc on ct.source_cell_id = sc.id
join cells tc on ct.target_cell_id = tc.id
limit 50;
```
<!-- /ide-only -->

## 6 · Answering rules

1. **Cite location.** Every factual claim names its path: `phase › scenario › path › layer › step`. Say which evidence field it came from when it matters (a `picture`-only fact is weaker than a `content` one). Never expose row UUIDs to a reader.
2. **Cover the right layers.** A multi-actor question spans the relevant rows, not just the tutor. One-layer answers to multi-actor questions score as incomplete, not merely brief.
3. **Respect structure.** Right path variant, right layer. Don't merge happy + edge; don't move a back-stage action to a front-stage actor.
4. **Silent → say so, and name who to ask.** Search all four evidence fields first. Still absent → "this isn't in the blueprint," plus the person or role who should fill the gap when the blueprint supports that ownership (Research team for goal-setting activity design, ops for timing). Fabricating here is the worst failure mode (`overconfident-silence`).
5. **Confidence — follow your face's rule, NOT a trailing affix.** *(Adapted on vendoring, 2026-07-29: the Notion original ends every answer with a `High / Medium / Low` line. That affix is retired for uno-bot — one woven conversational clause instead, `agents/uno-bot/AGENT.md` — and IDE work states its basis inline. Copying the original would re-break what ADR-021's cadence fix repaired.)* Semantics are unchanged: sureness is earned only by rows read this turn; a confident fabrication is the worst outcome.
6. **Source precedence — ADR-021, not "blueprint always wins."** *(Adapted on vendoring: the Notion original says the blueprint always beats Notion. True for current-state claims, wrong on the time axis — a WIP card legitimately describes a change the blueprint hasn't taken yet.)* Full routing table: `docs/conventions/supabase.md` § Two sources, one time axis. Constant across every row: **surface the conflict, never blend.**

## 7 · Known-silent areas

No structured fields for verbatim scripts, durations, counts, targets, or dates — though such details do appear inside general cell evidence (a 12-hour call-off threshold, a "1–2 minutes" Help Request action, biweekly paycheck timing all exist as cell text). Use them only where they appear explicitly. Verbatim scripts, exact wording, step-by-step activity instructions, numeric targets, and calendar dates stay sparse — absent after checking all four fields → abstain and escalate per rule 4.

## 8 · Content depth (what's answerable today)

Goal Setting is the deepest scenario (6 paths · 60 steps · 276 non-empty cells · 9 layers). Then Warm-Up (85 cells, 3 paths) → Discovery (40) → Before Students Join (31) → Help Request (28) → Tech Setup (20). Thin: Reporting an Issue (8), Reporting Hours (6), Standard Scheduling (6). A question landing in a thin scenario is likelier a **content gap than a retrieval failure** — say the blueprint doesn't cover it yet and route a `uno-maintain` intake, rather than straining to synthesize an answer from adjacent scenarios.
