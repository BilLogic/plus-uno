# There are no migrations here. The DDL lives in the app repo.

The bot's semantic-retrieval schema — `semantic_search` (`corpus_chunks`,
`blueprint_chunks_src`, `match_corpus_chunks`) — used to be authored here as
`0001..0004` and hand-applied to the hosted project. Those files are deleted.
The definition now lives, once, in the repo that owns the database:

    uno-blueprint/supabase/migrations/
      20260809000000_semantic_search_vendored.sql   -- table, index, RLS, match fn
      20260817000000_semantic_search_blueprint_chunks_phase.sql
                                                    -- current blueprint_chunks_src

## Why it moved

`uno-blueprint` owns the Supabase project, and `supabase db reset` there
replays **only** that repo's `supabase/migrations/`. A copy living here was not
a second source of truth — it was a copy that a reset would silently overwrite.
The header of the old vendored file asked a human to re-vendor by hand whenever
this repo changed, and nothing enforced it, so the two drifted: the hosted view
carried the phase segment and the app's replay definition did not.

The bot is a **consumer** of that schema, not its author. It calls
`semantic_search.match_corpus_chunks` and reads the breadcrumb shape the view
emits; it does not define either.

## How to change the retrieval schema

1. Open a PR in `uno-blueprint` adding a new, properly-timestamped migration
   under `supabase/migrations/`. Never rewrite an already-applied one.
2. Apply it to the hosted project.
3. If the change alters the breadcrumb labels or the RPC surface, update the
   canonical contract at `uno-blueprint/src/lib/blueprintContract.ts`, then
   re-run this repo's `node scripts/sync-blueprint-contract.mjs` (with
   `BLUEPRINT_REPO` pointed at the app checkout) and commit the regenerated
   `agents/uno-bot/src/generated/blueprint-contract.ts` — `npm run
   check:contract` fails the build on drift.
4. If the chunk text or title changed, re-run the corpus backfill so the
   embedded rows match the new view.
