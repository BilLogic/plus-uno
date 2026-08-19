---
title: "Blueprint retrieval upgrade: fix the prune, measure recall, fuse the ranks"
type: feat
status: active
date: 2026-08-19
supersedes: docs/plans/2026-08-07-003-blueprint-search-rpc-proposal.md
repos: plus-uno (agents/uno-bot), uno-blueprint (supabase/migrations)
---

# Blueprint retrieval upgrade

## Overview

Four changes to how uno-bot retrieves from the blueprint, in dependency order:
a one-line grant that unbreaks the nightly embed job, a retrieval-level eval
harness that makes every later change falsifiable, a chunk-quality pass that
removes 49% dead weight from the embedded text, and a hybrid search RPC that
fuses keyword and vector ranks inside Postgres.

This supersedes the 2026-08-07 proposal. That document asked the schema owner
for two things; one shipped in a better form, and the other is re-scoped here
after measurement contradicted its central cost argument.

**Not in scope:** write access (the bot stays anon), reranking (corpus too
small), new tables beyond the index's own, and any change to how the app writes
cells.

## Verified state

Everything below was measured on 2026-08-19, not assumed. Method is given so
each can be re-run.

| Fact | Value | How |
|---|---|---|
| `corpus_chunks` rows | 851 | `select count(*)` |
| Eligible source rows (`blueprint_chunks_src`) | 808 | `select count(*)` |
| **Orphan chunks** | **43** | left join src on source_key |
| Orphans whose cell was hard-deleted | 43 of 43 | left join `public.cells` |
| Stale chunks (cell edited after embed) | 0 | compare `updated_at` |
| Never-embedded eligible cells | 0 | left join |
| Chunk size | avg 277 chars, p90 452, max 777 | `length(chunk)` percentiles |
| **Breadcrumb share of embedded text** | **49.1%** | `sum(length(title))/sum(length(chunk))` |
| **Cosine similarity, unrelated chunk pairs** | **avg 0.756, min 0.586** | 120×120 cross join, n=14,400 |
| Bot's `SEMANTIC_MIN_SIMILARITY` | 0.5 | `blueprint.ts:55` |
| Vector search, HNSW | 152 ms | `explain (analyze, buffers)` |
| Vector search, index disabled | 166 ms | same, `enable_indexscan=off` |
| `search_blueprint` keyword | 97 ms | `explain (analyze)` |
| `embedding` column storage | `EXTERNAL` (TOAST) | `pg_attribute.attstorage = 'e'` |
| Extensions installed | `vector` 0.8.0 only | `pg_extension` |
| Extensions available, not installed | `pg_net`, `pg_cron`, `pgmq`, `pg_trgm` | `pg_available_extensions` |
| Edge Functions deployed | **0** | `list_edge_functions` |
| Eval baseline | 19/19 pass, p50 turn 15.4 s, p90 subrequests 20, max 35 | `eval-results.json`, build r31 |

### The nightly job has been failing since 2026-08-18

`deleteOrphans` exists in `scripts/backfill-semantic-search.mjs:163` and is
merged to `origin/main`. It runs every night and 403s every night:

```
[backfill] upserted 808/808
[backfill] FAILED: orphan delete failed (403): {"code":"42501",
"hint":"Grant the required privileges to the current role with:
GRANT DELETE ON semantic_search.corpus_chunks TO service_role;",
"message":"permission denied for table corpus_chunks"}
```

`20260809000000_semantic_search_vendored.sql` grants `select, insert, update`
to `service_role`. Never `delete`.

Because the prune runs *after* the upsert, the failure is invisible from the
data: embeddings stay current (0 stale, 0 missing) and only orphans accumulate.
The job is red in Actions and nothing routes that anywhere.

> **Method note.** A first pass at this concluded `deleteOrphans` was not on
> `main` — wrong, because the local `main` was 22 commits behind `origin/main`.
> Always check `origin/main` in this repo. Same trap as the r9 source-recovery
> episode.

## Problem statement

**P1 — The index serves 43 cells that no longer exist.** All 43 were hard
deleted from `public.cells` (the table has no soft-delete column). Semantic is
the primary retrieval path, so the bot can rank one of these first, quote its
`chunk` text as current blueprint content, and hand over a
`?cell=<uuid>` deep link that resolves to nothing. Every one of those is a
confident, well-formatted, fabricated citation — the exact failure class
`AGENT.md` is built around. Live now.

**P2 — Retrieval quality is unmeasurable.** The harness
(`scripts/run-evals.mjs`, 19 cases in `docs/evals/fixtures/uno-bot-cases.json`)
drives full agent turns through `/debug/eval` and scores the *prose* with
deterministic checks plus an LLM judge. Nothing asserts which rows came back.
The suite is 19/19 green, so it is at ceiling and cannot register an
improvement. `/debug/blueprint` is a connectivity probe — it checks that the
RPCs respond, and never calls `searchBlueprint()`. Without a retrieval-level
instrument, P3 and P4 are unfalsifiable.

**P3 — Half the embedded text is repeated scaffolding.** The source view
concatenates the breadcrumb into the chunk body, so `Scenario: … Path: … Step:
… Layer: …` is 49.1% of all embedded characters, and 36% of chunks are under
200 chars total. Consequence: two arbitrary unrelated chunks score **0.756**
cosine similar, with a floor of 0.586 across 14,400 pairs. The bot's
`SEMANTIC_MIN_SIMILARITY = 0.5` therefore sits *below the corpus's own minimum*
— it can never reject anything, so the keyword fallback it gates never fires on
quality grounds. A tuning knob that is wired to nothing.

**P4 — Retrieval is either/or, and the keyword half is substring matching.**
`searchBlueprint()` short-circuits on 3+ semantic hits and never runs keyword;
below that it runs both and staples the lists (`mergeRows`), semantic first,
which is concatenation, not ranking. `search_blueprint` scores by counting
`ilike '%term%'` hits — no stemming, no `ts_rank`, unindexable wildcards. Exact
identifiers ("RM-2482") and structural names (`Planned:` / `Prototype:` paths)
are precisely what vector search is worst at and what this keyword path ranks
badly.

## Proposed solution

**Option B — the bot embeds the query, Postgres fuses the ranks.**

One RPC, `public.blueprint_hybrid_search(q, query_embedding, …)`, runs a
full-text keyword search and a vector search, fuses them by Reciprocal Rank
Fusion, and returns one sorted list. The bot keeps embedding the query.

Plus a **model-tag guard**: the index records which embedding model built it,
the function takes the caller's model name, and mismatches raise instead of
degrading.

### Alternatives considered

**Option A — the database embeds the query too** (the 2026-08-07 preference).
Rejected.

- Its headline benefit is false for this deployment. The proposal argued A lets
  uno-bot "drop the Vertex embedding credential entirely". It cannot:
  `getGoogleAccessToken` also serves Gemini generation (`gemini/client.ts:91`)
  and Claude-on-Vertex (`vertex/claude.ts:51`). The credential stays either way.
- It puts a synchronous external HTTP call on the read path. `pg_net` is
  asynchronous by design — you enqueue and poll `net._http_response` — so a
  blocking variant means a poll loop holding a pooler connection for a ~150 ms
  Vertex round trip.
- The function stops being `stable`.
- Vertex failure becomes a database error. Today `embedText` returns `null` and
  the ladder degrades to keyword; inside the RPC that fallback must be rebuilt
  in PL/pgSQL.
- Cost: `pg_net` + `pg_cron` + the project's **first** Edge Function + a second
  home for the SA secret, against `AGENTS.md`'s keys-in-one-place rule.
- Benefit: one subrequest, on a turn that averages 9 and peaks at 35.

The coupling worry that motivated A is real but is better solved by the model
tag (Phase 2). Postgres already rejects a wrong-*dimension* vector at the
signature; the live gap is a wrong *model at the same dimension* —
`embed.ts` falls back from `text-embedding-005` to AI Studio's
`text-embedding-004`, and both are 768-dim. That is the silent degradation the
proposal feared, and a column plus an argument closes it.

**Option 0 — status quo plus the grant fix only.** Viable, and Phase 0 delivers
it standalone. Rejected as the endpoint because it leaves P3 and P4 untouched.

**Server-side embedding at write time** (trigger → `pgmq` → `pg_cron` →
`pg_net` → Edge Function). Correct pattern, wrong urgency: staleness measured
**0**, so it solves a problem that does not currently exist. Revisit if
sub-24h freshness is ever needed. Recorded in Future Considerations.

### What this is not sold on

**Speed.** Retrieval is roughly 300–500 ms of a 15.4 s p50 turn — under 3%.
Model generation dominates (88 of ~207 subrequests in the eval run). No phase
here will make the bot feel faster, and the plan should not be justified that
way. The subrequest budget is the real constraint: worst-case blueprint search
goes 8 → 2 against a 50 cap already touched at 35.

**Cost.** ~$0.55/yr of embeddings, 14 MB of storage, $0 marginal infrastructure.
Not a decision input. (Phase 2's incremental embedding matters for Vertex
*quota* headroom, not dollars.)

## Technical approach

### Architecture

```
                        ┌── today ──────────────────────────────┐
  query ─┬─ embed (Vertex, 1 sub)                               │
         ├─ match_corpus_chunks (1 sub) ─── ≥3 hits? ── return  │
         ├─ search_blueprint (1 sub)                            │
         └─ 5-table fan-out (5 subs) ──── mergeRows = concat    │
                        └───────────────────────────────────────┘

                        ┌── after Phase 3 ──────────────────────┐
  query ─┬─ embed (Vertex, 1 sub)                               │
         └─ blueprint_hybrid_search (1 sub)                     │
              ├─ ts_rank over cells.search_tsv                  │
              ├─ cosine over corpus_chunks                      │
              └─ RRF fuse → one ranked list                     │
                        └───────────────────────────────────────┘
```

### Phase 0 — Unbreak the prune ✅ SHIPPED 2026-08-19

**Repo:** uno-blueprint. **Effort:** minutes. **Blocking:** nothing.

**Result.** Migration applied, backfill re-run by hand
(`[backfill] deleted 43 orphaned chunks`, run 32308192026 green). Verified:

| | Before | After |
|---|---|---|
| `corpus_chunks` | 851 | **808** (= `src_eligible`) |
| Orphans | 43 | **0** |
| Stale | 0 | 0 |
| Searches surfacing a phantom (40 probes) | 10.0% | **0.0%** |

`supabase/migrations/20260819000000_corpus_chunks_grant_delete.sql`

```sql
-- The backfill's orphan pass (uno-bot scripts/backfill-semantic-search.mjs)
-- has 403'd nightly since 2026-08-18: 20260809000000 granted service_role
-- select/insert/update but not delete, so 43 chunks for hard-deleted cells
-- are still retrievable and still handing out dead ?cell= links.
grant delete on semantic_search.corpus_chunks to service_role;
```

Then re-run the workflow by hand (Actions → *uno-bot — embed blueprint* → Run
workflow) rather than waiting for 07:00 UTC.

**Why it is only a grant, not new code:** `deleteOrphans` already diffs the
index against the source view and deletes the difference in batches of 50.
The logic is correct and merged; it has simply never once been permitted to run.

**Verify:**
```sql
select count(*) from semantic_search.corpus_chunks c
left join semantic_search.blueprint_chunks_src s using (source_key)
where c.source = 'blueprint' and s.source_key is null;  -- expect 0
```

### Phase 0b — Make the failure audible ✅ SHIPPED 2026-08-19

**Repo:** plus-uno + uno-blueprint. **Effort:** small.

A job red for two nights told nobody. Three changes, all landed:

1. `.github/workflows/uno-bot-embed-blueprint.yml` — an `if: failure()` step
   files an **`automation-blocked`** issue (the label
   `harness-integrity-sweep.yml` already defines for exactly this: *"a
   scheduled automation could not run — ops signal, not a design intake"*),
   deduped by re-commenting on the open one. Chosen over a Slack ping because
   it needs no new secret and no channel decision, and it persists.
   Added `permissions: issues: write`; bumped `node-version` 20 → 24
   (Actions was already force-running 24 and warning).
2. `semantic_search.index_health()` — new security-definer function returning
   counts only (`20260819000100_semantic_index_health.sql`). Needed because
   uno-bot reads as `anon`, and both `corpus_chunks` (RLS-sealed) and
   `blueprint_chunks_src` (service_role only) are closed to it — the bot could
   not see its own index's health.
3. `agents/uno-bot/src/index.ts` — `/debug/blueprint` now reports
   `index_health`. The other probes answer *does the path respond*; this one
   answers *is what it returns still true*, which is the failure that hides.

Typecheck clean, 102/102 tests pass.

### Phase 1 — A retrieval-level eval 🟡 BUILT 2026-08-19, NOT YET BASELINED

**Repo:** plus-uno. **Effort:** medium. **Blocks:** Phases 2 and 3.

**Status.** All three parts written, typechecked, committed
(`620d2157`): `/debug/blueprint-search`, 26 cases in
`docs/evals/fixtures/blueprint-retrieval-cases.json`, and
`scripts/run-retrieval-evals.mjs` (+ `--self-test`, 11/11).

Fixture validated against the live database: **19/19 cell ids exist and are
embedded, 10/10 paths exist**, no dead references.

**Remaining, and it gates Phase 2: the suite has never run.** The endpoint
ships in the Worker, so it needs one `wrangler deploy`, then:

```bash
WORKER_URL=… DEBUG_TOKEN=… npm run evals:retrieval
```

Copy that run to `docs/evals/runs/2026-MM-DD-retrieval-baseline.json` and
commit it. **Phase 2 must not start before that file exists** — without it
there is no "before" and every later claim is unfalsifiable.

**One expectation to hold onto:** the two `absence` cases should FAIL on the
first run. That is the 0.5 floor sitting below the corpus's 0.586 minimum,
measured rather than argued. If they pass, something about the measurement is
wrong and it needs understanding before Phase 2 proceeds.

Full agent turns are the wrong instrument for retrieval — 15 s each, model
quota, LLM judge, and the answer's prose can be excellent while the rows behind
it are wrong. This phase adds a fast, deterministic, model-free harness.

**New endpoint** — `agents/uno-bot/src/index.ts`, beside `/debug/blueprint`:

```ts
// GET /debug/blueprint-search?q=…&fresh=1 — auth-gated. Returns the REAL
// searchBlueprint() result (rows, retrieval path, scores, caps) so the
// retrieval eval can assert on row identity instead of on prose.
if (request.method === "GET" && url.pathname === "/debug/blueprint-search") {
  if (!debugAuthorized(request, env)) return new Response("not found", { status: 404 });
  const q = url.searchParams.get("q") ?? "";
  const result = await searchBlueprint(env, q, { fresh: url.searchParams.get("fresh") === "1" });
  return Response.json({ build: BUILD, q, ...result });
}
```

**Golden set** — `docs/evals/fixtures/blueprint-retrieval-cases.json`. Roughly
25–40 cases, each naming the cell(s) that must appear:

```json
[
  { "id": "BR1", "q": "how does a tutor confirm attendance",
    "expectCellIds": ["<uuid>"], "k": 5, "class": "paraphrase" },
  { "id": "BR2", "q": "RM-2482",
    "expectCellIds": ["<uuid>"], "k": 3, "class": "exact-id" },
  { "id": "BR3", "q": "the Prototype reflection redesign branch",
    "expectCellIds": ["<uuid>"], "k": 5, "class": "structural-name" },
  { "id": "BR4", "q": "what happens during Warm-Up",
    "expectCellIds": ["<uuid>", "<uuid>"], "k": 10, "class": "aggregate" }
]
```

Four classes deliberately: **paraphrase** (vector should win), **exact-id** and
**structural-name** (keyword should win — these are the recall holes P4 names),
and **aggregate** (currently unserved; the corpus has no summary-level rows,
so sibling cells compete — expected to stay weak until the multi-granularity
idea in Future Considerations).

Build the expectations by hand from the app, not from what the bot currently
returns — a golden set derived from present behaviour can only ever confirm it.

**Scorer** — `agents/uno-bot/scripts/run-retrieval-evals.mjs`. Reports
recall@k, MRR, and the retrieval path taken, per class and overall. Exits 1
below a floor once a baseline exists. Runs in seconds, needs no model
credential.

**Second metric — corpus separation.** A four-line SQL check, recorded per run:

```sql
with a as (select embedding from semantic_search.corpus_chunks order by id limit 120),
     b as (select embedding from semantic_search.corpus_chunks order by id desc limit 120)
select round(avg(1 - (a.embedding <=> b.embedding))::numeric, 3) from a cross join b;
```

Today: **0.756**. This is the objective, model-free read on P3, and the number
Phase 2 must move.

**Record the baseline before changing anything.** Phase 2's success is defined
against it.

### Phase 2 — Chunk quality, model tag, incremental embed

**Repos:** uno-blueprint (view, columns), plus-uno (backfill, floor).
**Effort:** medium. **Depends on:** Phase 1 baseline.

**2a. Stop embedding the breadcrumb twice.**

> **⚠ Correction found during Phase 0 — read before writing this migration.**
> **The repo's vendored SQL is stale; the live view is materially richer.**
> The remote migration history contains entries that exist in no repo file —
> notably `20260807181119_match_corpus_chunks_source_key`,
> `20260809010154_embed_spec_columns_bot_0003`, and
> `20260817225035_semantic_search_blueprint_chunks_phase`. An earlier draft of
> this plan reproduced `20260809000000_semantic_search_vendored.sql`'s view
> definition and would have **regressed the index**, silently dropping every
> spec column from the embedded text.
>
> The live `blueprint_chunks_src` (via `pg_get_viewdef`, 2026-08-19) puts
> **Phase** in the breadcrumb and appends `Function`, `Form`, `Value`,
> `Owner`, `Perceived owner`, `Lane owner team`, and `Lane KPIs` to the body.
> **Always author this migration from `pg_get_viewdef`, never from the repo
> file.**

The change is *one deletion*: the body currently opens with the same
`concat_ws(' · ', 'Phase: …', 'Scenario: …', 'Path: …', 'Step: …', 'Layer: …')`
expression that `title` already holds. Remove that first argument from the
body's `concat_ws`. Keep `title` exactly as is — it is the citation and
`match_corpus_chunks` returns it untouched, so nothing downstream loses
context. Keep every spec column.

Baseline to beat, measured on the clean 808-row index after Phase 0:

| Metric | Value |
|---|---|
| Breadcrumb share of embedded characters | **48.8%** (111,034 of 227,419) |
| Unrelated-pair cosine similarity | **0.759** |
| Top-15 spread (rank 2 → rank 15) | **0.056** (0.962 → 0.905) |

That last row is the sharpest statement of the problem: the whole top-15 sits
in a 0.056-wide band while rank 15 is still 0.149 *above* the random baseline.
The embedding separates relevant from irrelevant but can barely order what it
finds — which is what a corpus-wide shared prefix predicts.

Sequence: write the migration from the live definition → apply → full re-embed
(`--full`) → re-measure all three numbers → only then Phase 2d.

Open question for the run, answered by measurement not argument: whether a
*short* breadcrumb (scenario + step only) beats none. Run Phase 1 both ways and
keep the winner. If separation improves but the `aggregate` class regresses,
that is the trade to look at.

**2b. Tag the index with its model.**
`supabase/migrations/20260819000200_corpus_chunks_model_tag.sql`

```sql
alter table semantic_search.corpus_chunks
  add column if not exists model text not null default 'text-embedding-005';

create table if not exists semantic_search.index_meta (
  source text primary key,
  model  text not null,
  dims   int  not null,
  updated_at timestamptz not null default now()
);
insert into semantic_search.index_meta (source, model, dims)
values ('blueprint', 'text-embedding-005', 768)
on conflict (source) do nothing;

grant select on semantic_search.index_meta to anon, authenticated, service_role;
grant select, insert, update, delete on semantic_search.corpus_chunks to service_role;
```

Closes the live silent-failure path: `vertex/embed.ts` prefers the Vertex SA
(`text-embedding-005`) and falls back to AI Studio (`text-embedding-004`) when
no SA is configured. **Both are 768-dim**, so the signature's dimension check
passes and every similarity quietly degrades. The bot sends its model name from
Phase 3 onward and the function rejects a mismatch.

**2c. Embed only what changed — lowest priority in this plan.**
`scripts/backfill-semantic-search.mjs` re-embeds all 808 chunks nightly, and
measured drift is 0 stale / 0 new, so ~100% of that work is redundant. Filter
source rows against the stored `updated_at` and embed the difference.

**Justification correction:** an earlier draft claimed this mattered for Vertex
quota headroom. It does not — `EMBED_BATCH = 100`, so 808 chunks is **9 API
requests per night**, negligible against any quota. The saving is ~$0.26/yr and
some tidiness. Do it if you are in the file anyway; do not schedule it on its
own, and do not let it delay 2a or 2d.

Keep a `--full` flag regardless: 2a requires one deliberate full re-embed, and
2c would otherwise skip every row (their `updated_at` will not have moved).

**2d. Recalibrate the floor.** After the re-embed, measure the *query-side*
distribution — embed each Phase 1 golden query with `RETRIEVAL_QUERY` and
record the similarity of the correct cell versus the best wrong one. Set
`SEMANTIC_MIN_SIMILARITY` (`blueprint.ts:55`) between them. Note the current
value of 0.5 is below the corpus's own 0.586 floor, so today the knob is inert;
the new value must be justified by this measurement and the comment must say
which run produced it.

### Phase 3 — Hybrid search RPC

**Repos:** uno-blueprint (function, tsvector), plus-uno (client).
**Effort:** medium-large. **Depends on:** Phases 1 and 2.

**3a. A real keyword index.**
`supabase/migrations/20260819000300_cells_fts.sql`

```sql
alter table public.cells
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector('english', coalesce(content, '') || ' ' || coalesce(description, ''))
  ) stored;

create index if not exists cells_search_tsv_idx on public.cells using gin (search_tsv);
```

A stored generated column cannot be written, so it does not touch the wrapper
write path or the session ledger, and it changes no RLS policy. It does rewrite
the table — 955 rows, trivial. **`src/types/database.ts` is generated and must
be regenerated** (`generate_typescript_types`), and the vendored contract in
`src/lib/blueprintContract.ts` should be checked for whether it needs the new
column (it likely does not — the bot reads via RPC).

`pg_trgm` for fuzzy identifier matching is available but deferred: measure
whether `to_tsvector` alone closes the `exact-id` class in Phase 1 first.

**3b. The function.**
`supabase/migrations/20260819000400_blueprint_hybrid_search.sql`

Lives in `public` (already an exposed schema, so the bot drops the
`content-profile: semantic_search` header it sends today), `security definer`
with a pinned `search_path` so it can read the RLS-sealed index.

```sql
create or replace function public.blueprint_hybrid_search(
  q               text,
  query_embedding extensions.vector(768),
  match_count     int  default 15,
  embed_model     text default null,
  rrf_k           int  default 60
)
returns table (
  kind text, id uuid, title text, snippet text,
  layer text, step text, scenario text, phase text,
  updated_at timestamptz, similarity float, rrf_score float, matched_by text
)
language plpgsql stable security definer
set search_path = public, extensions, semantic_search, pg_temp
as $$
declare
  idx_model text;
begin
  -- Model guard. A wrong-DIMENSION vector is already rejected by the signature;
  -- this catches the live gap — text-embedding-004 and -005 are both 768-dim,
  -- so a deployment missing the Vertex SA would otherwise degrade in silence.
  if embed_model is not null then
    select m.model into idx_model from semantic_search.index_meta m where m.source = 'blueprint';
    if idx_model is not null and idx_model <> embed_model then
      raise exception 'embedding model mismatch: caller=% index=%', embed_model, idx_model
        using hint = 'Re-embed the index or fix the caller; similarity across models is meaningless.';
    end if;
  end if;

  return query
  with kw as (
    select c.id,
           row_number() over (order by ts_rank(c.search_tsv, websearch_to_tsquery('english', q)) desc) as rank
    from public.cells c
    where c.search_tsv @@ websearch_to_tsquery('english', q)
    limit match_count * 4
  ),
  vec as (
    select cc.source_key::uuid as id,
           1 - (cc.embedding <=> query_embedding) as similarity,
           row_number() over (order by cc.embedding <=> query_embedding) as rank
    from semantic_search.corpus_chunks cc
    where cc.source = 'blueprint'
    limit match_count * 4
  ),
  fused as (
    select coalesce(kw.id, vec.id) as id,
           coalesce(1.0 / (rrf_k + kw.rank),  0.0)
         + coalesce(1.0 / (rrf_k + vec.rank), 0.0) as rrf_score,
           vec.similarity,
           case when kw.id is not null and vec.id is not null then 'both'
                when kw.id is not null then 'keyword' else 'vector' end as matched_by
    from kw full outer join vec on kw.id = vec.id
  )
  select 'cell'::text, c.id, l.name, c.content,
         l.name, st.name, sc.name, ph.name,
         c.updated_at, f.similarity, f.rrf_score, f.matched_by
  from fused f
  join public.cells c              on c.id  = f.id
  join public.layers l             on l.id  = c.layer_id
  join public.paths p              on p.id  = c.path_id
  join public.service_scenarios sc on sc.id = p.service_scenario_id
  left join public.steps st        on st.id = c.step_id
  left join public.phases ph       on ph.id = sc.phase_id
  order by f.rrf_score desc
  limit match_count;
end;
$$;

grant execute on function public.blueprint_hybrid_search(text, extensions.vector, int, text, int)
  to anon, authenticated, service_role;
```

Notes on the shape: RRF fuses by **rank**, not score, because cosine similarity
and `ts_rank` are not comparable quantities — this is the whole reason the
client's current `mergeRows` concatenation is not a ranking. `k = 60` is the
conventional default; it is a parameter so Phase 1 can tune it. `matched_by`
exists so the eval can attribute a win to the right half, and so the
silent-degradation logging survives the collapse of the ladder.

Deliberately **not** returning a `url` column: the 2026-08-07 second ask was
answered better by the cross-repo contract (below).

**3c. Client simplification.** `src/integrations/blueprint.ts` loses
`trySemantic`, `tryRpc`, `searchViaTables`, `SOURCES`, `BLUEPRINT_TABLE_FANOUT`,
`mergeRows`, `semanticCap`/`mergedCap` two-path logic, and the
`SEMANTIC_THIN_RESULTS` short-circuit — replaced by one call plus the existing
`withUrls`. `BlueprintRetrieval` narrows from a three-value path to
`matched_by`. Keep `blueprint-link.ts` untouched.

**Keep the ladder behind a flag for one release.** `SEMANTIC_SEARCH=off`
already exists as a kill switch; add `BLUEPRINT_HYBRID=off` to fall back to the
current path, and delete the old code one release after the eval confirms the
new one.

### The 2026-08-07 second ask is already resolved

That proposal asked the app to return canonical URLs per row so the bot never
assembles one. It shipped in a better form: `src/lib/blueprintContract.ts` in
uno-blueprint is the canonical URL vocabulary, vendored into
`src/generated/blueprint-contract.ts` by `scripts/sync-blueprint-contract.mjs`
and drift-checked in CI (a `--check` that fails loudly when the app checkout is
absent, after an earlier version passed vacuously). `blueprint-link.ts` builds
links from that contract. The app still owns routing; the bot cannot invent a
param. **No `url` column is needed and none is requested.**

Open questions 4 and 5 from that document are therefore closed. Question 1
(automatic refresh) is answered: nightly cron, currently 0 stale. Question 2
(vector index) is answered: HNSW, present — though see Future Considerations
for why it is barely earning its keep. Question 3 (who owns fusion) is answered
by this plan: the database.

## System-wide impact

### Interaction graph

`blueprint_search` tool → `searchBlueprint()` → per-isolate cache (60 s, keyed
on normalised query) → `embedText` → `countedFetch` (subrequest counter, 50-cap
gate) → PostgREST → `blueprint_hybrid_search` → `cells` + `corpus_chunks`.
Results flow back through `withUrls` → the tool layer → the model's context →
`AGENT.md`'s citation rules (cell link verbatim, phase from a queried row, one
confidence clause).

Two levels out: the same `countedFetch` budget is shared with Slack, Notion,
GitHub and model calls in the same turn, so dropping worst-case blueprint
subrequests from 8 to 2 changes what *other* tools can afford on a multi-step
question. That is the real systemic effect, not latency.

### Error and failure propagation

- `SubrequestBudgetError` must keep propagating, not flatten into an empty
  result — an empty result reads as "not in the blueprint", a false absence.
  Preserve the existing `rethrowIfBudget` discipline in the rewritten path.
- The model-guard `raise exception` surfaces as a PostgREST 400. The bot must
  render it as a *tool failure*, never as "no results" — a mismatch that reads
  as absence is the same class of lie the guard exists to prevent.
- `embedText` returning `null` currently degrades to keyword. After Phase 3 the
  RPC needs a vector; decide explicitly: either call it with keyword-only
  semantics (pass `null` embedding and let the vector CTE yield nothing) or skip
  the RPC. Prefer the former so one contract covers both.
- Phase 0's grant means `deleteOrphans` starts deleting. If a source-view change
  ever drops rows unintentionally, the prune will now happily remove their
  chunks. 2a changes the view — run Phase 0 and 2a in separate deploys, and
  check the eligible-row count (808) before and after.

### State lifecycle risks

- The backfill upserts then prunes. A crash between the two leaves the index
  fresh but over-full — self-healing on the next run.
- 2c's incremental embedding introduces a real risk: if `updated_at` comparison
  is wrong, cells silently stop being re-embedded and staleness returns
  invisibly. Mitigate with the `--full` flag on a weekly schedule and a stale
  count in `/debug/blueprint`.
- 2a's full re-embed is ~808 Vertex calls in one run. Batched at 100, within
  quota, but run it manually and watch rather than letting the nightly do it.

### API surface parity

`search_blueprint` stays for now — the in-app agent does not use semantic
search at all (no `match_corpus_chunks` references anywhere in
`uno-blueprint/src/lib/agent/`), so the app is unaffected by Phase 3 and
uno-bot is the only consumer to migrate. Worth flagging to the app side that
`blueprint_hybrid_search` is available to the in-app assistant too; that is the
"every consumer gets the same relevance" argument, and it is now real rather
than hypothetical.

### Integration test scenarios

1. Model mismatch — point a build at an AI Studio key only, run one search,
   confirm a loud tool failure rather than degraded results.
2. Budget exhaustion — a turn that spends 48 subrequests before a blueprint
   search; confirm the error propagates rather than returning empty.
3. Deleted cell — delete a cell in a branch DB, run the backfill, confirm the
   chunk disappears and no dead link can be produced.
4. Keyword-only query — an exact ID present in `content` but semantically
   meaningless; confirm `matched_by = 'keyword'` and a top-3 hit.
5. Both-paths agreement — a paraphrase whose target also shares terms; confirm
   `matched_by = 'both'` and that it outranks single-path hits.

## Acceptance criteria

### Functional

- [ ] Orphan chunks = 0, and the nightly workflow is green
- [ ] A failed embed job notifies somewhere a human reads
- [ ] `/debug/blueprint` reports `orphan_chunks` and a stale count
- [ ] `/debug/blueprint-search` returns real `searchBlueprint()` results
- [ ] Golden retrieval set exists with all four query classes represented
- [ ] `run-retrieval-evals.mjs` reports recall@k and MRR per class, exits 1 below floor
- [ ] `corpus_chunks.chunk` no longer contains the breadcrumb; `title` still does
- [ ] `index_meta` records model and dims; the RPC rejects a mismatch
- [ ] Backfill embeds only changed rows, with a `--full` escape hatch
- [ ] `SEMANTIC_MIN_SIMILARITY` set from a recorded query-side measurement
- [ ] `blueprint_hybrid_search` deployed, granted to `anon`, returning `matched_by`
- [ ] `cells.search_tsv` + GIN index live; `database.ts` regenerated
- [ ] Bot calls one RPC; ladder retained behind `BLUEPRINT_HYBRID` for one release

### Non-functional

- [ ] No RLS policy widened; no new write path; bot stays anon
- [ ] No credential added to a second store
- [ ] `npm run lint` at zero; `npm test` green; `npm run build` type-checks
- [ ] `check:contract` still passes (contract drift gate intact)

### Quality gates

- [ ] Phase 1 baseline recorded *before* Phase 2 changes anything
- [ ] Existing 19-case suite still 19/19
- [ ] Each migration idempotent and replayable on a fresh `db reset`

## Success metrics

| Metric | Today | Target |
|---|---|---|
| Orphan chunks | 43 | 0, and staying 0 |
| Nightly job | red 2 nights | green |
| Unrelated-pair similarity | 0.756 | materially lower — set the bar from the first post-2a run |
| Recall@5, `paraphrase` | unknown | baseline, then no regression |
| Recall@5, `exact-id` + `structural-name` | unknown (expected poor) | the class this work is for; improvement here is the headline |
| Blueprint subrequests, worst case | 8 | 2 |
| Redundant nightly embeddings | ~808/night | ~0 on a no-change day |
| Turn latency | p50 15.4 s | **unchanged, and that is fine** |

Deliberately not setting a numeric recall target before the baseline exists —
a target invented ahead of measurement is a number to game, not a bar to clear.

## Dependencies and prerequisites

- Phase 1 gates 2 and 3. Phase 0 gates nothing and should ship immediately.
- 2a's re-embed must land before 2d's recalibration.
- 3a must land before 3b (the function reads `search_tsv`).
- uno-blueprint holds all DDL — the bot repo deleted its vendored copies in
  `f5b3d7bb chore(uno-bot): delete the vendored retrieval DDL; the app repo owns it`.
  Every migration above goes in uno-blueprint.
- Local `main` in plus-uno was 22 commits behind `origin/main`; fetch before
  branching off anything.
- The kit repo currently sits on `chore/drop-vendored-semantic-search-ddl`,
  which is already contained in `origin/main`.

## Risk analysis and mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| Re-embed makes retrieval worse | High | Phase 1 baseline first; keep the old chunk text recoverable by re-running the previous view definition; ship 2a alone and measure before anything else |
| Grant lets a bad prune delete real rows | Medium | Deploy Phase 0 and 2a separately; assert eligible-row count 808 before/after |
| Incremental embed silently stops refreshing | Medium | Weekly `--full`; stale count on `/debug/blueprint` |
| `search_tsv` rewrite on `cells` | Low | 955 rows; generated column, no write-path effect; regenerate `database.ts` |
| RRF ranks worse than the current concat | Medium | `BLUEPRINT_HYBRID=off` kill switch; `rrf_k` is a parameter |
| Model guard fires in production | Low but loud | It is the point; verify the SA is configured everywhere before Phase 3 ships |
| Two-repo drift | Medium | `check:contract` already gates; add the migrations to the same PR pair and land app-side first |

**Rollback:** each phase reverses cleanly. Phase 0 — `revoke delete`. Phase 2a —
restore the prior view and `--full`. Phase 3 — flip `BLUEPRINT_HYBRID=off`; the
old ladder is still compiled in for one release. No migration drops a column
containing data anyone else reads.

## Future considerations

- **Multi-granularity chunks.** The corpus has no step- or path-level summary
  rows, so "what happens in Warm-Up" makes a dozen sibling cells compete rather
  than matching one summary. The `aggregate` eval class exists to size this.
- **Automatic embeddings at write time** (trigger → `pgmq` → `pg_cron` →
  `pg_net` → Edge Function). The correct home for server-side embedding. Not
  now: staleness is 0.
- **`halfvec(768)` or 256-dim.** `embedding` is `EXTERNAL` — 3072 bytes exceeds
  the TOAST threshold, so every vector is fetched out-of-line per comparison.
  Measured effect: HNSW 152 ms vs brute-force 166 ms, i.e. the index buys ~8%
  on 851 rows. `halfvec` is 1536 bytes and stays inline. Real, worth doing,
  invisible at turn level — schedule it for convenience, never as a priority.
- **Non-blueprint sources.** `corpus_chunks.source` already allows
  `ds_component` and `notion_catalog`; only `blueprint` is populated. Indexing
  the Notion catalogs (Decisions, Running Notes, Help Center) reuses this entire
  pipeline and is the largest expansion of what the bot can answer
  semantically. Separate plan.
- **`pg_trgm`** for fuzzy identifiers, if `to_tsvector` alone does not close the
  `exact-id` class.

## Documentation

- `docs/conventions/supabase.md` — the hybrid RPC contract and the model tag
- `docs/conventions/blueprint-navigation.md` — `matched_by` replacing the
  three-path `retrieval` vocabulary
- `docs/evals/README.md` — the retrieval harness and how to extend the golden set
- `agents/uno-bot/AGENT.md` — only if the tool's user-visible contract changes
- Mark `2026-08-07-003-blueprint-search-rpc-proposal.md` frontmatter
  `status: superseded`, `distilled-into:` this file

## Sources and references

### Internal

- `agents/uno-bot/src/integrations/blueprint.ts:211` — `searchBlueprint()` ladder
- `agents/uno-bot/src/integrations/blueprint.ts:55` — `SEMANTIC_MIN_SIMILARITY`
- `agents/uno-bot/src/integrations/blueprint.ts:400` — `mergeRows` (concat, not fusion)
- `agents/uno-bot/src/vertex/embed.ts:47` — SA path; AI Studio fallback at same 768 dims
- `agents/uno-bot/scripts/backfill-semantic-search.mjs:163` — `deleteOrphans`
- `agents/uno-bot/scripts/run-evals.mjs` — existing harness, `/debug/eval`
- `agents/uno-bot/src/index.ts:268` — `/debug/blueprint` connectivity probe
- `agents/uno-bot/src/integrations/blueprint-link.ts` — URL construction from the contract
- `uno-blueprint/supabase/migrations/20260809000000_semantic_search_vendored.sql` — the missing grant
- `uno-blueprint/supabase/migrations/20260809000100_search_blueprint_versioned.sql` — `ilike` keyword path
- `.github/workflows/uno-bot-embed-blueprint.yml` — nightly cron

### Superseded

- `docs/plans/2026-08-07-003-blueprint-search-rpc-proposal.md` — Options A/B and
  the URL ask. Carried forward: hybrid fusion in the database, one consumer
  contract, no write access, no new tables. Rejected: Option A's server-side
  query embedding (its credential argument does not hold here) and the `url`
  column (solved by the vendored contract).

### Evidence

- GitHub Actions run 32229190507 (2026-08-19) — the 403 quoted verbatim
- `eval-results.json` (2026-08-06, build r31) — 19/19, latency and subrequest baseline
- Live SQL probes, 2026-08-19 — every figure in Verified State
