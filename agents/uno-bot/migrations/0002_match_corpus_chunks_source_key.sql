-- Migration 0002 — match_corpus_chunks returns source_key + updated_at.
--
-- WHY: semantic retrieval is the PRIMARY blueprint path, and it was the only
-- one that could not be cited. The match function returned (source, title,
-- ref_url, chunk, similarity) — no row identity — so every semantic hit reached
-- the bot with an empty id: no cell to link to, no date to judge staleness by,
-- nothing to hand back as a shareable URL. `source_key` is already stored on
-- every row (the cell uuid, and the uniqueness key of the table); it was simply
-- never returned.
--
-- Adding a column to a `returns table` signature needs DROP + CREATE, not
-- `create or replace`. Both statements run in one transaction, and `grant
-- execute` is re-issued because DROP takes the grants with it.
--
-- ADDITIVE for callers: existing consumers select by name and ignore the two
-- new columns.

drop function if exists semantic_search.match_corpus_chunks(extensions.vector, int, text);

create function semantic_search.match_corpus_chunks(
  query_embedding extensions.vector(768),
  match_count int default 6,
  filter_source text default null
) returns table (
  source text,
  source_key text,
  title text,
  ref_url text,
  chunk text,
  updated_at timestamptz,
  similarity float
)
language sql stable security definer set search_path = extensions, semantic_search
as $$
  select c.source, c.source_key, c.title, c.ref_url, c.chunk, c.updated_at,
         1 - (c.embedding <=> query_embedding) as similarity
  from semantic_search.corpus_chunks c
  where filter_source is null or c.source = filter_source
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function semantic_search.match_corpus_chunks(extensions.vector, int, text)
  to anon, authenticated, service_role;
