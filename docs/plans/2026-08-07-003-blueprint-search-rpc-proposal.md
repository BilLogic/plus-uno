---
title: "Proposal: one hybrid search RPC for uno-blueprint"
type: proposal
status: draft
date: 2026-08-07
audience: BilLogic/plus-uno-blueprint (schema owner)
author: uno-bot (consumer)
---

# Proposal: collapse blueprint retrieval into one RPC

**To the blueprint repo, from a consumer.** uno-bot reads this database over
PostgREST with the anon key. Everything below is a migration plus an RPC —
schema-owner work. uno-bot's side of each change is *deleting* code.

## Verified state (probed 2026-08-07 via `/debug/blueprint`, not assumed)

| capability | result |
|---|---|
| `search_blueprint` RPC | **deployed**, returns cells with layer/step |
| `semantic_search.match_corpus_chunks` | **deployed**, expects **768-dim** vectors |
| anon read: `cells`, `cell_triggers`, `findings`, `slices` | **all readable, all populated** |
| uno-bot embedding dimension | 768 — matches |

Good news first: nothing is broken. Both fast paths exist and the dimensions
line up, so the earlier worry that semantic was silently failing is **not**
supported by evidence.

## The problem that remains

uno-bot runs a three-path ladder per search:

1. embed the query via Vertex (1 subrequest) → `match_corpus_chunks` (1)
2. on miss → `search_blueprint` (1)
3. on absence → four-table keyword fan-out (4)

Worst case is 6 subrequests against a **50-per-invocation** Cloudflare cap that
one agent turn already shares with Slack, Notion, GitHub and the model. A
recent turn spent four `blueprint_search` calls in a single answer.

Two costs beyond the count:

- **Recall is either/or.** Semantic misses exact terms ("RM-2482", "Check
  Goals"); keyword misses paraphrase. Each path answers alone, so every search
  gets one or the other, never both.
- **The client owns the embedding.** uno-bot holds a Vertex credential purely
  to embed a query string, and the client must keep the model and dimension in
  sync with the index forever. That coupling is invisible until it silently
  breaks — a dimension change ships as "semantic quietly stopped matching".

## Proposal

**One RPC: `blueprint_hybrid_search(q text, match_count int)`**, doing keyword
and vector retrieval inside the database and returning fused, ranked rows in
the shape `search_blueprint` already returns.

Two variants, in preference order:

**A. Embed server-side.** The RPC takes text, embeds it in-database or via an
Edge Function, runs both retrievals, fuses (reciprocal-rank or weighted), and
returns rows. **uno-bot goes from up to 6 subrequests to 1**, drops the Vertex
embedding credential entirely, and can never drift out of sync with the index
because it no longer knows the model exists.

**B. Client embeds, RPC fuses.** If server-side embedding is impractical, the
RPC accepts `query_embedding` alongside `q` and fuses. Two subrequests, and the
dimension coupling stays. Strictly worse, still much better than today.

**Also worth doing, independent of the above: automatic embeddings.** If
`corpus_chunks` is populated by hand, then every cell edit leaves the semantic
index stale — and semantic is the *primary* path, so the bot answers
confidently from content that no longer matches the cell. Supabase's trigger +
queue + Edge Function pattern keeps them in sync on write. This is the same
staleness class uno-bot just started surfacing with `updated_at`, except
invisible: nothing about a stale embedding looks wrong in the answer.

## What uno-bot does when it lands

Deletes `trySemantic`, `tryRpc`, `searchViaTables`, the `SOURCES` table,
`BLUEPRINT_TABLE_FANOUT`, and its Vertex embedding dependency — replaced by one
call. The `retrieval` field added on 2026-08-07 becomes a constant, and the
silent-degradation ladder it was built to observe stops existing.

## What this proposal does NOT ask for

- **No write access.** uno-bot is anon, deliberately: same tier as an
  unauthenticated browser viewer. Findings triage, slice authoring, and cell
  edits stay in the app, where a service-tier session belongs.
- **No new tables.** `cell_triggers`, `findings` and `slices` are already
  readable and already consumed.
- **No schema knowledge in the client.** The point of an RPC is that uno-bot
  knows a contract, not a schema. Today it knows four table names and their
  columns; that is the coupling worth removing.

## Open questions for the schema owner

1. Is `corpus_chunks` refreshed automatically on cell writes, or by hand?
2. Is there a vector index (HNSW/IVFFlat) on it, or is this a sequential scan
   that has been fast enough at current row counts?
3. Would you rather own the fusion ranking here, or have consumers fuse? Owning
   it means every consumer — app, IDE, bot — gets the same relevance, which is
   an argument for the database.
