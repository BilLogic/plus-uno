---
summary: The Worker's own database migrations — the uno-bot-usage D1 schema under usage/ and how to apply it — and why the blueprint's retrieval schema is not here.
---

# Migrations

One schema lives here: the **usage record**, the `uno-bot-usage` D1 database
bound as `USAGE_DB` (`agents/uno-bot/src/usage/`, ADR-030). The bot's semantic-retrieval schema
does **not** — see the second half.

## The usage database (`usage/`)

`usage/` is the D1 binding's `migrations_dir` in `wrangler.toml`. Files are
numbered `NNNN_name.sql` and applied in order; D1 records which have run in its
own `d1_migrations` table.

**Apply them** from `agents/uno-bot/`:

```bash
# a local database, for `wrangler dev`
npx wrangler d1 migrations apply uno-bot-usage --local

# the deployed one — after the migration has merged to main
npx wrangler d1 migrations list  uno-bot-usage --remote   # what has not run yet
npx wrangler d1 migrations apply uno-bot-usage --remote
```

Apply a new migration to the remote database **before** deploying code that
writes its columns: a Worker writing a column the table lacks loses every record
until the migration runs (the turn itself is unaffected — a failed write is
logged and dropped). A deploy with no pending migration needs no step.

**Rules for a new one:**

- Never edit a migration that has run anywhere. Add the next number.
- Additive only: new tables, new nullable columns, new indexes. A column the
  Worker writes is also mapped in `agents/uno-bot/src/usage/d1.ts`, the one place record
  fields become SQL columns.
- Bound parameters in the Worker, always; nothing is assembled into SQL from a
  value.
- What the database never stores — message text past classification, any DM
  text (a DM ask keeps only its category labels), secrets — is ADR-030's, and a
  migration does not widen it.

**Tested** by `npm run test:workerd`: the UsageLog conformance suite applies
every file here to a local D1 before it runs, so a migration that fails to apply,
or a column the adapter names and the schema lacks, fails there.

## The retrieval schema is in the app repo

The bot's semantic-retrieval schema — `semantic_search` (`corpus_chunks`,
`blueprint_chunks_src`, `match_corpus_chunks`) — used to be authored here as
`0001..0004` and hand-applied to the hosted project. Those files are deleted.
The definition now lives, once, in the repo that owns the database:

    uno-blueprint/supabase/migrations/
      20260809000000_semantic_search_vendored.sql   -- table, index, RLS, match fn
      20260817000000_semantic_search_blueprint_chunks_phase.sql
                                                    -- current blueprint_chunks_src

### Why it moved

`uno-blueprint` owns the Supabase project, and `supabase db reset` there
replays **only** that repo's `supabase/migrations/`. A copy living here was not
a second source of truth — it was a copy that a reset would silently overwrite.
The header of the old vendored file asked a human to re-vendor by hand whenever
this repo changed, and nothing enforced it, so the two drifted: the hosted view
carried the phase segment and the app's replay definition did not.

The bot is a **consumer** of that schema, not its author. It calls
`semantic_search.match_corpus_chunks` and reads the breadcrumb shape the view
emits; it does not define either.

### How to change the retrieval schema

1. Open a PR in `uno-blueprint` adding a new, properly-timestamped migration
   under `supabase/migrations/`. Never rewrite an already-applied one.
2. Apply it to the hosted project.
3. If the change alters the breadcrumb labels or the RPC surface, update the
   canonical contract at `uno-blueprint/deployment/lib/blueprintContract.ts`,
   then re-run this repo's `node scripts/sync-blueprint-contract.mjs` (with
   `BLUEPRINT_REPO` pointed at the app checkout) and commit the regenerated
   `agents/uno-bot/src/generated/blueprint-contract.ts` — `npm run
   check:contract` fails the build on drift.
4. If the chunk text or title changed, re-run the corpus backfill so the
   embedded rows match the new view.
