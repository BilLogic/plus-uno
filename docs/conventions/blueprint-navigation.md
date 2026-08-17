# uno-blueprint — Navigation Guide

<!-- canonical per ADR-017 (docs/knowledge/decisions.md) · Tier 2 (on demand; bundled into the uno-bot prompt) · distilled 2026-07-29 · applied by every agent answering a journey question or drafting from journey context. Companion: supabase.md (access, contract, source routing). -->

## 1 · What it is

A structured **service blueprint** for the PLUS journey: how tutors, lead tutors, classroom teachers, researchers, and support staff move through the end-to-end experience. A grid — **rows are actors (`layer`s), columns are journey `step`s, and each `cell` holds the evidence at that intersection.** Postgres on Supabase, read-only for every consumer except `writers/blueprint`.

Query the **database**, never the Netlify front end — that's the human viewer, and the database is richer. Cite the live app URL to readers (`https://uno-blueprint.netlify.app/`) while grounding in the rows.

## 2 · The data model

**This file carries no counts and no membership lists, by design** — the shape is durable, the contents change weekly. Any "how many," "which ones," or "is this thin" is a query; quote only what you counted this task.

| Table | What it is | Joins on |
|---|---|---|
| `service_lifecycles` | the whole journey ("PLUS Application") | — |
| `phases` | the ordered phases — read them, never assume the list | `service_lifecycle_id` |
| `service_scenarios` | scenarios within a phase (e.g. Goal Setting) | `phase_id` |
| `paths` | scenario variants — read `paths.name`, not `path_type` (§4) | `service_scenario_id` |
| `steps` | the columns, scoped to a scenario | `service_scenario_id` |
| `path_steps` | which steps appear on a path + `column_position` | `path_id`, `step_id` |
| `layers` | the rows (actors), scoped to a path, ordered by `row_position` | `path_id` |
| `cells` | **the evidence** at path × layer × step | `path_id`, `layer_id`, `step_id` |
| `cell_triggers` | dependencies: one cell triggers another | `source_cell_id` → `target_cell_id` |

Mental model: **cell = (path × layer × step)**. Read a scenario by picking a path, then reading its cells across layers (rows) and steps (columns). (`slices` / `slice_items` are saved 1-D cuts for the viewer; `findings` / `evidence` / `propositions` are audit and provenance surfaces — not journey facts. Don't answer journey questions from them.)

**Cell evidence lives in four fields:** `content` (primary grid text) · `description` (longer detail) · `picture` (image ref) · `links` (JSON array). A cell can carry real evidence with an empty `content`, and many do. **Check all four before calling a topic empty.** Never infer a fact from an image filename or a link label without opening the resource.

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

**Read `paths.name`, never `path_type`.** The declared enum and the values the board uses diverge, so the type column barely discriminates; names tell variants apart. `named` is the catch-all for "a variant with its own identity" — cycle steps, edge cases, and the future-state paths below. **Establish which path a question is about before answering**; never merge a happy path and an edge case into one answer.

### 4a · Future state — the `Future (roadmap)` convention

The board carries a labelled future layer, and its markers travel together: `paths.name` is exactly `Future (roadmap)`, `path_type` is `named`, `origin` is `app`, and every cell `description` opens `PLANNED (not shipped as of {month year}):`.

- **These are the only future-bearing rows.** Every other path is current state. A `Future (roadmap)` cell is a plan, never an answer to "how does it work today" — attribute it as planned, with the `PLANNED` prefix's own wording.
- **Never assert the blueprint has no future state for a scenario without querying that scenario for a `Future (roadmap)` path.** Absence in a search result is not absence on the board. Which scenarios carry one changes; read it, don't recall it.

## 5 · Retrieval

Phrase queries in journey words (actor, scenario, step), not product-management words, and re-query per actor when a question spans layers.
<!-- ide-only -->In-IDE there is no `blueprint_search` — query Supabase directly with the recipes below.<!-- /ide-only -->

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

1. **Cite location.** Every factual claim names where it sits: `phase › scenario › path — layer × step`. The `›` chain is containment; the pair after the dash is the cell's coordinate — actor row × journey column, actor first because mis-attribution is the most common failure (§3). Step names are full sentences on this board, so quote them. **The phase comes from a queried `phases` row — never from the asker's wording, and never inferred from a scenario name that sounds like a phase.** No phase in hand → name only the levels you actually retrieved. Say which evidence field a claim came from when it matters (a `picture`-only fact is weaker than a `content` one). Never expose row UUIDs to a reader.
2. **Cover the right layers.** A multi-actor question spans the relevant rows, not just the tutor. One-layer answers to multi-actor questions score as incomplete, not merely brief.
3. **Respect structure.** Right path variant, right layer. Don't merge happy + edge; don't move a back-stage action to a front-stage actor.
4. **Silent → say so, and name who to ask.** Search all four evidence fields first. Still absent → "this isn't in the blueprint," plus the person or role who should fill the gap when the blueprint supports that ownership. Fabricating here is the worst failure mode (`overconfident-silence`).
5. **Confidence — one woven clause, never a trailing label**, and sureness earned only by rows read this turn. Shape and cadence: `agents/uno-bot/AGENT.md` § Grounding.
6. **Source precedence — ADR-021 claim-type routing, not "the blueprint wins."** Route per claim; full table in `docs/conventions/supabase.md` § Two sources, one time axis. Constant across every row: **surface the conflict, never blend.**

## 7 · Known-silent areas

No structured fields for verbatim scripts, durations, counts, targets, or dates — such details appear only inside general cell evidence, and only sometimes. Use them where they appear explicitly; absent after checking all four fields → abstain and escalate per rule 4.

## 8 · Content depth (what's answerable today)

Coverage is uneven, and judged from the rows you just read — never from a remembered ranking. **A thin result is more often a content gap than a retrieval failure:** a query returning two or three cells in a shallow scenario means the blueprint doesn't cover it yet — say so and route a `uno-maintain` intake, rather than synthesizing an answer out of adjacent scenarios.

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
