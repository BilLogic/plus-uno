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
| `paths` | routes through a scenario — read `path_type` AND `name`, and `status` for future state (§4) | `service_scenario_id` |
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
- **Teacher** — the *classroom teacher* (a partner, not a PLUS tutor): observes, reminds, raises "ask for help" alerts, escalates. Named `Partner Action: Teacher` until 2026-08-20; the role now lives in `lane_role` and `stakeholders.kind`, not in the label.
- **Lead Tutor** — supervises the room: rosters, attendance, assigning unpaired students, teacher liaison.
- **Regular Tutor** — the front-line tutor running the per-student flow.
- **Front Stage Tech** — tools the user touches (Zoom/Pencil, PLUS App).
- **Front Stage Actions** — visible actions supporting the user.
- **Back Stage Actions** — behind-the-scenes work, typically **researchers / ops** ("Researcher sets student order"). **Never attribute a back-stage action to a tutor.**
- **Back Stage Tech** — systems working behind the scenes.
- **Support Actions** — Dev team, Design team.

## 4 · Path semantics

**Rewritten 2026-08-21.** Three things changed at once and every rule below is
new: `path_type` is a real three-value vocabulary, path names are unique and
say their CONDITION, and future state moved out of the name into a column.

### 4a · `path_type` — three values, and now worth reading

```
happy      the scenario's main route, everything works.  Exactly ONE per scenario.
variant    equally normal, chosen by a CONDITION rather than by failure.
exception  a rule or a failure DIVERTS the route.
```

It used to be five (`happy | unhappy | exception | alternative | named`, later
`custom`), of which three were not distinguishable in practice and one had
become the drawer for 11 of 39 paths — which is why the old rule here said to
ignore the column. **That rule is dead. Read `path_type`.** It now discriminates
cleanly, and `happy` is guaranteed unique per scenario, so "the main route for
X" is a single query with no name-matching.

### 4b · Names say the CONDITION, not the activity

The scenario names the activity; the path names which way through it. So a name
is only meaningful **beside its scenario**:

| Scenario | Paths |
|---|---|
| Call-off Request | `12+ hours ahead` · `Under 12 hours` · `Swap offered instead` |
| Goal Setting | `All conditions` · `No prior goals` · `New cycle, goals exist` · `Mid-cycle check` · `Missed last session, no goals` · `Missed last session, has goals` |
| Student Just Joined | `Full room, on time` · `Few or none by 10 min` |

- **Never quote a path name without its scenario.** `Standard` alone is
  meaningless — nine different scenarios have a path called that, one each,
  and it means "this scenario has one route and no branching condition".
- **`Happy Path` no longer exists.** Neither does `Alternate Path`, `Sad Path`,
  `Set Goals`, `Check Goals`, `Update Goals`, or any `Planned:` / `Prototype:`
  name. Anything recalling those names is recalling the board before
  2026-08-21. Query, do not recall.
- **Establish which path a question is about before answering.** Never merge a
  happy path and an exception into one answer.

### 4c · Future state — `paths.status`, not the name

The `Planned:` / `Prototype:` name-prefix convention is **gone**. Status is a
column on both `paths` and `cells`, sharing one `entity_status` domain:

| Status | Means | How to word it |
|---|---|---|
| `proposed` | Designed and discussed, no build card behind it. May never happen. | "this **might change**" |
| `planned` | Committed and carded, no code yet. | "this **is changing**" |
| `built` | Code exists, in build or QA. Not deployed, so nobody is using it. | "this **is changing**, and it is nearly here" |
| `live` | In use today. **The default, and most of the board.** | current state |
| `at_risk` | Live and failing in a way somebody has measured. | "this works and is **failing**" |
| `deprecated` | Live and being taken away. | "this works and is **going away**" |

Rules:

- **`status <> 'live'` is the whole test.** One predicate, on a column, for both
  paths and cells. No prefix matching, no reading `origin`, and no risk of a
  path that merely *mentions* "planned" mid-name being mistaken for future
  state — the failure the old name-based rule had to warn about.
- **`live` is the default.** `cells.status` is `not null default 'live'`, so a
  cell with nothing said about it is current state, not unknown.
- **Never assert the blueprint has no future state for a scenario without
  querying it.** Absence in a search result is not absence on the board.
- Cell content on unbuilt rows may still open `PLANNED (…)` / `PROTOTYPE (…)`.
  That is legacy prose, not the marker. **The column is authoritative.**

## 5 · Retrieval

Phrase queries in journey words (actor, scenario, step), not product-management words, and re-query per actor when a question spans layers.
<!-- ide-only -->In-IDE there is no `search_blueprint` — query Supabase directly with the recipes below.<!-- /ide-only -->

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

**Future paths** — everything not live, on one predicate (§4c)
```sql
select p.name as phase, ss.name as scenario, pa.name as path,
       pa.path_type, pa.status, count(c.id) as cells
from paths pa
join service_scenarios ss on pa.service_scenario_id = ss.id
join phases p on ss.phase_id = p.id
left join cells c on c.path_id = pa.id
where pa.status <> 'live'
group by p.name, ss.name, pa.name, pa.path_type, pa.status
order by p.name, ss.name;
```

**Unbuilt CELLS on an otherwise live path** — a live route with a piece of it
still coming. Missed by any path-level query.
```sql
select ss.name as scenario, pa.name as path, l.name as lane,
       c.status, c.content
from cells c
join paths pa on c.path_id = pa.id
join service_scenarios ss on pa.service_scenario_id = ss.id
join layers l on c.layer_id = l.id
where c.status <> 'live'
order by ss.name, pa.name;
```

**A path's steps in order**
```sql
select st.name, ps.column_position
from service_scenarios ss
join paths pa on pa.service_scenario_id = ss.id
join path_steps ps on ps.path_id = pa.id
join steps st on st.id = ps.step_id
-- The main route, without needing to know its name: exactly one per scenario.
where ss.name = 'Goal Setting' and pa.path_type = 'happy'
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
  and pa.path_type = 'happy'
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

   **Read `matchedBy`, not `score`, to judge absence.** Retrieval runs three ways at once — `vector` (meaning), `keyword` (the cell's own prose), `structural` (its phase/scenario/path/step/layer name) — and each row reports which found it. Rows several retrievers agree on matched the blueprint's own words; a `vector`-only row is a semantic guess. **Every row `vector`-only = nothing in the blueprint mentions your terms**, which is the strongest absence signal the tool can give. Similarity cannot substitute: measured 2026-08-19 across a 26-case set, questions with NO answer scored 0.607–0.654 while genuine hits reached down to 0.565 — overlapping ranges, so no threshold separates them, and none ever will (`docs/plans/2026-08-19-001-feat-blueprint-hybrid-retrieval-plan.md`). One caveat: a pure paraphrase of a real cell can also come back `vector`-only, so treat it as evidence, not proof — say what you did and did not find.
5. **Confidence — one woven clause, never a trailing label**, and sureness earned only by rows read this turn. Shape and cadence: `agents/uno-bot/AGENT.md` § Grounding.
6. **Source precedence — ADR-021 claim-type routing, not "the blueprint wins."** Route per claim; full table in `docs/conventions/supabase.md` § Two sources, one time axis. Constant across every row: **surface the conflict, never blend.**

## 7 · Known-silent areas

No structured fields for verbatim scripts, durations, counts, targets, or dates — such details appear only inside general cell evidence, and only sometimes. Use them where they appear explicitly; absent after checking all four fields → abstain and escalate per rule 4.

## 8 · Content depth (what's answerable today)

Coverage is uneven, and judged from the rows you just read — never from a remembered ranking. **A thin result is more often a content gap than a retrieval failure** — and since 2026-08-19 that is a stronger claim than it used to be: all three retrievers now run on every search, so a short result is no longer the ladder having skipped a path. It used to be: structural-name queries scored 0/10 because the keyword pass never ran at all. a query returning two or three cells in a shallow scenario means the blueprint doesn't cover it yet — say so and route a `uno-maintain` intake, rather than synthesizing an answer out of adjacent scenarios.

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
