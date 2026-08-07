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

## Second ask: canonical URLs on the read

**The problem, investigated 2026-08-07 rather than assumed.** uno-bot wants to
link an answer back into the app — "here is the cell, here is the scenario" —
and cannot, because it has no URL contract. What the deployed bundle shows:

- `?slice=<id>` appears, but inside **vendored skill markdown**, not routing
  code: *"render-checker confirms every frame renders at `?slice=<id>`"*. Real
  convention, real consumer, but documentation rather than proof.
- No `searchParams.get(...)` for it in the minified source, and **no
  cell/scenario/phase parameters at all**.

So the bot can either construct URLs from a guessed scheme, or link nothing.
Constructing them is not an option: presenting an unverified URL as in-hand is
the fabrication rule this bot is built around, and a link that 404s is worse
than no link because it looks authoritative.

**The ask: return the canonical URL with the row.** Not a documented scheme for
consumers to assemble — the URL itself, from the side that owns routing.

This is the cockpit plan's own principle applied one layer out: `get_compare_diff`
exists so the agent learns slot keys from a read before issuing writes, *"the way
`list_slices` grounds `open_slice_tab`"*. Same shape here — the read grounds the
link.

Why the app should own it rather than each consumer:

- **Routing changes are the app's to make.** A scheme published to three
  consumers becomes three places to update, and the two that lag ship dead links.
- **Consumers cannot verify.** uno-bot has no way to check that a URL it built
  resolves; the app knows by construction.
- **It scales to cells.** Slices may already work by convention, but cell-level
  links do not exist. If the read returns them, they exist for everyone at once.

Concretely: `search_blueprint` (or the hybrid RPC) gains a `url` column per row,
and slice reads return theirs. uno-bot links what it was given, and never
assembles one.

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
4. Is `?slice=<id>` actually live, or only documented in the skill text? A
   browser check settles it in seconds and we have not run one.
5. Is there any deep-link target below a slice — a cell, a scenario, a phase?
   If not, is adding one worth it, or should the bot link the slice and describe
   the cell in words?
