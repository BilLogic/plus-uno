-- Migration 0003 — the embed source view carries the spec columns.
--
-- WHY: cells carry function/form/value_props/owner/perceived_owner and layers
-- carry owner_team/kpis (all public-read), but the embedded chunk text held
-- only content + description. "Who owns this touchpoint", "what KPI is this
-- lane on", "what value does this step deliver" therefore never matched a
-- chunk, and the bot answered "not in the blueprint" while the data sat in
-- the database. Folding the spec fields into the chunk makes them
-- retrievable; labels keep the text self-describing for the model.
--
-- Chunk text changes for most rows, so the next backfill run re-embeds the
-- affected rows (upsert on (source, source_key)) — expected, one-time cost.
-- Idempotent: create or replace, same security posture as 0001.

create or replace view semantic_search.blueprint_chunks_src as
select
  c.id::text as source_key,
  concat_ws(' · ',
    'Scenario: ' || sc.name,
    'Path: ' || p.name || ' (' || p.path_type || ')',
    'Step: ' || st.name,
    'Layer: ' || l.name
  ) as title,
  concat_ws(E'\n',
    concat_ws(' · ',
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
  join public.layers l            on l.id  = c.layer_id
  join public.steps st            on st.id = c.step_id
  join public.paths p             on p.id  = c.path_id
  join public.service_scenarios sc on sc.id = p.service_scenario_id
where nullif(trim(c.content), '') is not null
   or nullif(trim(c.description), '') is not null;
