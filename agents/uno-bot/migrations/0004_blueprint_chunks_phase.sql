-- Migration 0004 — the indexed title carries the PHASE (on top of 0003's spec columns).
--
-- WHY: the chunk title joined cells → layers → steps → paths → service_scenarios
-- and stopped there, so every title read "Scenario · Path · Step · Layer". The
-- phase — the outermost container, and the first segment the navigation guide
-- requires in a citation (`phase › scenario › path — layer × step`,
-- docs/conventions/blueprint-navigation.md § 6) — was never in the index and
-- never in a retrieved row. Two consequences, both observed: the model cannot
-- cite a phase it was never given, and a scenario that exists in two phases
-- (Wrap-Up sits under In-session) gets narrated under the wrong one, because
-- the only phase cue available is the reader's own guess.
--
-- `phases` is one more join off `service_scenarios.phase_id` — the row is
-- already being read, so this costs a join, not a table scan. The column is
-- `not null` (20250603120000_service_blueprint.sql), so the inner join drops
-- no cell that 0001/0003 indexed.
--
-- SUPERSEDES 0003, DOES NOT SIT BESIDE IT. 0001, 0003 and this file all
-- `create or replace` the SAME view, so whichever runs last IS the view — a
-- file that carried only the phase change would silently un-ship 0003's spec
-- columns. This one therefore carries BOTH: 0003's spec lines
-- (function / form / value_props / owner / perceived_owner / layers.owner_team
-- / layers.kpis) AND the phase segment. Applying 0001 → 0003 → 0004 in order
-- lands here; so does applying 0004 alone.
--
-- Title AND chunk text change for every row, so the next backfill run re-embeds
-- the whole blueprint source (upsert on (source, source_key)) — expected,
-- one-time cost. Old chunks keep the phase-less title until that run; the
-- Worker's parseChunkTitle handles both shapes, so retrieval never breaks
-- mid-re-embed.
--
-- Idempotent: create or replace, same objects, same security posture as 0001.
-- Read-only w.r.t. the blueprint — it only SELECTs from public.*.

create or replace view semantic_search.blueprint_chunks_src as
select
  c.id::text as source_key,
  concat_ws(' · ',
    'Phase: ' || ph.name,
    'Scenario: ' || sc.name,
    'Path: ' || p.name || ' (' || p.path_type || ')',
    'Step: ' || st.name,
    'Layer: ' || l.name
  ) as title,
  concat_ws(E'\n',
    concat_ws(' · ',
      'Phase: ' || ph.name,
      'Scenario: ' || sc.name,
      'Path: ' || p.name || ' (' || p.path_type || ')',
      'Step: ' || st.name,
      'Layer: ' || l.name
    ),
    nullif(trim(c.content), ''),
    nullif(trim(c.description), ''),
    'Function: ' || nullif(trim(c.function), ''),
    'Form: ' || nullif(trim(c.form), ''),
    'Value: ' || case when jsonb_typeof(c.value_props) = 'array'
      then nullif(array_to_string(array(select jsonb_array_elements_text(c.value_props)), ', '), '')
      else nullif(trim(both '"' from c.value_props::text), '') end,
    'Owner: ' || nullif(trim(c.owner), ''),
    'Perceived owner: ' || nullif(trim(c.perceived_owner), ''),
    'Lane owner team: ' || nullif(trim(l.owner_team), ''),
    'Lane KPIs: ' || case when jsonb_typeof(l.kpis) = 'array'
      then nullif(array_to_string(array(select jsonb_array_elements_text(l.kpis)), ', '), '')
      else nullif(trim(both '"' from l.kpis::text), '') end
  ) as chunk,
  c.updated_at
from public.cells c
  join public.layers l             on l.id  = c.layer_id
  join public.steps st             on st.id = c.step_id
  join public.paths p              on p.id  = c.path_id
  join public.service_scenarios sc on sc.id = p.service_scenario_id
  join public.phases ph            on ph.id = sc.phase_id
where nullif(trim(c.content), '') is not null
   or nullif(trim(c.description), '') is not null;

grant select on semantic_search.blueprint_chunks_src to service_role;
