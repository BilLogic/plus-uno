# uno-blueprint — Navigation Guide

<!-- canonical per ADR-017 (docs/knowledge/decisions.md) · Tier 2 (on demand; bundled into the uno-bot prompt) · distilled 2026-07-29, refreshed 2026-08-17 (future-state paths §4a; hardcoded counts replaced with recipes) — vendored from the Notion "UNO Blueprint Navigation Guide" (the guided-arm context block of the UNO Blueprint Grounding Evaluation). The Notion page is the mirror; this file is the source the harness loads, and it DIFFERS from the mirror on two rules (see § Answering rules 5–6) plus §4a — the Notion page needs a superseded banner per staleness-sweep.md, above the divider since that copy is also the eval context block. Companion: supabase.md (access, contract, source routing). -->

The eval that produced this guide: guided blueprint arms scored 100% vs 36% docs-only, and the top failure tag across un-guided arms was `nav-failure` (32), then `shallow-coverage` (23). This file is the fix for both — load it whenever answering a journey question or drafting from journey context.

## 1 · What it is

A structured **service blueprint** for the PLUS journey: how tutors, lead tutors, classroom teachers, researchers, and support staff move through the end-to-end experience. A grid — **rows are actors (`layer`s), columns are journey `step`s, and each `cell` holds the evidence at that intersection.** Postgres on Supabase, read-only for every consumer except `writers/blueprint`.

Query the **database**, never the Netlify front end — that's the human viewer; the database is richer. Cite the live app URL to readers (`https://uno-blueprint.netlify.app/`) while grounding in the rows.

## 2 · The data model

**This file carries no row counts, by design.** Every number baked in here went stale within three weeks and taught the bot wrong scale (2026-07-18 snapshot → 2026-08-08 reality: phases 5 → 6, scenarios 17 → 23, paths 23 → 38, cells 737 → 954). The shape — which tables, which joins — is what's durable. Need a count, including "how big is this," "how many scenarios," or "is this scenario thin"? **Run the recipe** (§ Query recipes → *Live scale*), and quote only what you just counted.

| Table | What it is | Joins on |
|---|---|---|
| `service_lifecycles` | the whole journey ("PLUS Application") | — |
| `phases` | the ordered phases — read them, never assume the list (see below) | `service_lifecycle_id` |
| `service_scenarios` | scenarios within a phase (e.g. Goal Setting) | `phase_id` |
| `paths` | scenario variants — read `paths.name`, not `path_type` (§4) | `service_scenario_id` |
| `steps` | the columns, scoped to a scenario | `service_scenario_id` |
| `path_steps` | which steps appear on a path + `column_position` | `path_id`, `step_id` |
| `layers` | the rows (actors), scoped to a path, ordered by `row_position` | `path_id` |
| `cells` | **the evidence** at path × layer × step | `path_id`, `layer_id`, `step_id` |
| `cell_triggers` | dependencies: one cell triggers another | `source_cell_id` → `target_cell_id` |

**Phases are a query, not a memory.** The board grew a **Program Administration** phase and six scenarios (Supervisor Program Administration, Tutor Profile & Maintenance, Student Kickoff Interview, Session Prep & Resources, Post-Session Growth Loop, Student Session Experience) after the last time this file was rewritten, and it will grow again. Run the *Phase → scenario map* recipe before naming a phase. Two placements that read wrong from the name alone and have already caused a mis-citation: **Wrap-Up sits under `In-session`, not `Post-session`**, and `Post-session` holds Reporting an Issue, Reporting Hours, and the Post-Session Growth Loop. *(Order position of Program Administration not verified at time of writing — read `order_position`. — follow-up)*

Mental model: **cell = (path × layer × step)**. Read a scenario by picking a path, then reading its cells across layers (rows) and steps (columns). (`slices` / `slice_items` are saved 1-D cuts for the viewer; `findings` / `evidence` / `propositions` are audit and provenance surfaces — not journey facts. Don't answer journey questions from them.)

**Cell evidence lives in four fields:** `content` (primary grid text) · `description` (longer detail) · `picture` (image ref) · `links` (JSON array). A cell can carry real evidence with an empty `content`, and hundreds do — the *Live scale* recipe breaks the fill rate down per field. **Check all four before calling a topic empty.** Never infer a fact from an image filename or a link label without opening the resource.

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

**Don't trust the schema's enum — read the values.** `path_type` is declared `happy` / `unhappy` / `exception` / `alternative`, but the live board uses three: `happy`, `named`, and `alternative` — `named` isn't in the declared set at all, and `unhappy`/`exception` are unused. So **read `paths.name`, not `path_type`**, to tell variants apart; the type column is close to non-discriminating.

`named` is the catch-all for "a variant with its own identity," and it now covers two unrelated things:

- **Cycle and edge-case variants.** Goal Setting carries the **Set → Check → Update** goal cycle (`Set Goals`, `Check Goals`, `Update Goals`) alongside `Happy Path`, plus two edge cases (`Set Goals Edge Case`, `Update Goals Edge Case`) where the dashboard state mismatches the cycle. **Establish which path a question is about before answering**; never merge a happy path and an edge case into one answer.
- **Future-state paths** — the convention below.

### 4a · Future state — the `Future (roadmap)` convention

Since **2026-08-08** the board carries a labelled future layer. It is one convention, and the three markers travel together:

| Marker | Value |
|---|---|
| `paths.name` | exactly `Future (roadmap)` |
| `paths.path_type` | `named` |
| `paths.origin` | `app` |
| `cells.description` | opens `PLANNED (not shipped as of {month year}):` |

Rules that follow from it:

- **These are the only future-bearing rows.** Every other path is current state. A `Future (roadmap)` cell is a plan, never an answer to "how does it work today" — attribute it as planned, with the `PLANNED` prefix's own wording.
- **Never assert the blueprint has no future state for a scenario without querying that scenario for a `Future (roadmap)` path.** Absence in a search result is not absence on the board (live miss, 2026-08-17: the bot told a user no future state existed for the lead tutor's post-session reflection while the Wrap-Up `Future (roadmap)` path described exactly that redesign).
- **Count them at task time.** Several scenarios carry one; which ones changes. The *Future paths* recipe below lists them.
- Source routing is unchanged otherwise: Roadmap cards + PRDs stay primary for what's planned, and a `Future (roadmap)` path is the design-side plan of record next to them (`supabase.md` § Two sources, one time axis).

## 5 · Retrieval

uno-bot has no SQL: it calls `blueprint_search` (semantic + keyword over these same rows), which returns `layer` / `step` / `scenario` per row — phrase the query in journey words (actor, scenario, step) rather than product-management words, and re-query per actor when a question spans layers. In-IDE, query Supabase directly — the repo copy of this file carries the query recipes.

<!-- ide-only -->
### Query recipes (Supabase MCP / SQL)

**Phase → scenario map** — run this before naming a phase in any citation
```sql
select p.order_position, p.name as phase, ss.order_position, ss.name as scenario
from phases p join service_scenarios ss on ss.phase_id = p.id
order by p.order_position, ss.order_position;
```

**Live scale** — the replacement for every count this file used to hardcode
```sql
select 'phases' as t, count(*) from phases
union all select 'scenarios', count(*) from service_scenarios
union all select 'paths',     count(*) from paths
union all select 'steps',     count(*) from steps
union all select 'layers',    count(*) from layers
union all select 'cells',     count(*) from cells
union all select 'triggers',  count(*) from cell_triggers
union all select 'cells.content',     count(*) from cells where coalesce(content, '') <> ''
union all select 'cells.description', count(*) from cells where coalesce(description, '') <> ''
union all select 'cells.picture',     count(*) from cells where picture is not null
union all select 'cells.links',       count(*) from cells where links <> '[]'::jsonb;
```

**Future paths** — which scenarios have a planned redesign on the board (§4a)
```sql
select p.name as phase, ss.name as scenario, pa.path_type, pa.origin,
       count(c.id) filter (where c.description ilike 'PLANNED%') as planned_cells
from paths pa
join service_scenarios ss on pa.service_scenario_id = ss.id
join phases p on ss.phase_id = p.id
left join cells c on c.path_id = pa.id
where pa.name = 'Future (roadmap)'
group by p.name, ss.name, pa.path_type, pa.origin
order by p.name, ss.name;
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

1. **Cite location.** Every factual claim names where it sits: `phase › scenario › path — layer × step`. The `›` chain is containment — each level holds the next — and the pair after the dash is the cell's coordinate: actor row × journey column (`cell = layer × step`, per `terminology.md`). Actor first, because mis-attribution is the most common failure (§3). Step names are full sentences on this board, so quote them: `In-session › Goal Setting › Set Goals — Regular Tutor × "Explain to student what goal setting is"`. **The phase comes from a queried `phases` row — never from the asker's wording, and never inferred from a scenario name that sounds like a phase.** Wrap-Up reads like post-session and lives under `In-session`; guessing that one produced a wrong citation live (2026-08-17). No phase in hand → run the *Phase → scenario map* recipe, or name only the levels you actually retrieved. Say which evidence field a claim came from when it matters (a `picture`-only fact is weaker than a `content` one). Never expose row UUIDs to a reader.
2. **Cover the right layers.** A multi-actor question spans the relevant rows, not just the tutor. One-layer answers to multi-actor questions score as incomplete, not merely brief.
3. **Respect structure.** Right path variant, right layer. Don't merge happy + edge; don't move a back-stage action to a front-stage actor.
4. **Silent → say so, and name who to ask.** Search all four evidence fields first. Still absent → "this isn't in the blueprint," plus the person or role who should fill the gap when the blueprint supports that ownership (Research team for goal-setting activity design, ops for timing). Fabricating here is the worst failure mode (`overconfident-silence`).
5. **Confidence — one woven clause, never a trailing label.** Say what you read and how sure you are *inside* the prose. The trailing High/Medium/Low sign-off the Notion original prescribes is **retired**; a reply that closes with a labelled rating is wrong even when the rating is right (`agents/uno-bot/AGENT.md` for the bot, stated-basis-inline for IDE work). Sureness is earned only by rows read *this turn* — a re-read, a cached result, or a prior turn buys "I read this earlier," not "just now." A confident fabrication is the worst outcome.
6. **Source precedence — ADR-021 claim-type routing, not "the blueprint wins."** The Notion original's blanket rule is **retired**: it holds for current-state claims and is wrong on the time axis, where a WIP card, a PRD, or a `Future (roadmap)` path (§4a) legitimately describes a change the current-state rows haven't taken. Route per claim; full table in `docs/conventions/supabase.md` § Two sources, one time axis. Constant across every row: **surface the conflict, never blend.**
7. **Pushback → re-query with a different strategy.** A correction from the reader is a signal to read again with different terms — a different `scenario`, `phase`, or path — not to restate the previous answer at greater length. Never present a repeat of a prior answer as confirmation of it.

## 7 · Known-silent areas

No structured fields for verbatim scripts, durations, counts, targets, or dates — though such details do appear inside general cell evidence (a 12-hour call-off threshold, a "1–2 minutes" Help Request action, biweekly paycheck timing all exist as cell text). Use them only where they appear explicitly. Verbatim scripts, exact wording, step-by-step activity instructions, numeric targets, and calendar dates stay sparse — absent after checking all four fields → abstain and escalate per rule 4.

## 8 · Content depth (what's answerable today)

Coverage is **very uneven** — a handful of scenarios are multi-path and deep, most are single-path and thin. Which ones sit where changes on every write, so the ranking is a query (below), not a list kept here.

The rule this exists for: **a thin result is more often a content gap than a retrieval failure.** A query that returns two or three cells in a shallow scenario means the blueprint doesn't cover it yet — say so and route a `uno-maintain` intake, rather than synthesizing an answer out of adjacent scenarios.

**Judge depth from the rows you just read, not from a remembered ranking.** Row counts change on every blueprint write and this file only changes on deploy, so a leaderboard baked in here goes wrong quietly — the last one had a scenario's path count wrong and two scenarios in the opposite order, teaching the bot to call a well-covered scenario thin. In-IDE, count it with the query below.

<!-- ide-only -->
```sql
select ss.name as scenario, count(distinct pa.id) as paths,
       count(c.id) filter (where coalesce(c.content,'') <> '' or coalesce(c.description,'') <> ''
                              or c.picture is not null or c.links::text <> '[]') as cells_with_evidence
from service_scenarios ss
left join paths pa on pa.service_scenario_id = ss.id
left join cells c on c.path_id = pa.id
group by ss.name order by cells_with_evidence desc;
```
<!-- /ide-only -->
