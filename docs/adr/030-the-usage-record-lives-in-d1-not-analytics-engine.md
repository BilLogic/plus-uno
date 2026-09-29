---
embodiment: ide
summary: uno-bot's per-turn usage record is a D1 (SQLite) database, uno-bot-usage, rather than Workers Analytics Engine — rows are updated after the turn, every metric is re-runnable SQL, and nothing may be sampled or expire mid-window; with what the database is for and what it never stores (2026-09-29)
status: active
verified: 2026-09-29 (#746)
---

# ADR-030: The usage record lives in D1, not Analytics Engine (2026-09-29)

**Decision.** Every uno-bot turn writes one row to `turns` in the D1 database
`uno-bot-usage`, bound to the Worker as `USAGE_DB`. The row is written as the
turn finishes, through the `UsageLog` port (`agents/uno-bot/src/usage/`): an
in-memory adapter for the Node suite, a D1 adapter in production, held equal by
one conformance suite that runs under workerd against the real migrations
(`agents/uno-bot/migrations/usage/`). A failed or slow write is logged and
dropped; it never fails or visibly slows the turn. A Worker with no binding
answers as before and records nothing.

## Why D1 over Analytics Engine

Analytics Engine is the Workers-native home for events, and it is the wrong
shape for this record in three ways that each decide it alone:

- **Rows change after the turn.** A proposal's later events, how the ask was
  resolved, its corpus categories and the purge of its text all land on the
  turn's row hours or days later. Analytics Engine is append-only; D1 rows are
  updated in place.
- **Every published number must be re-runnable SQL.** The article's metrics
  are query files checked into the repo, run against the same rows by anyone
  with access. D1 is SQLite with joins and indexes; Analytics Engine's SQL API
  is a restricted dialect over its own schema.
- **Nothing may be sampled or expire mid-window.** Analytics Engine samples at
  volume and keeps data for a fixed retention; Workers Logs, which the
  `[uno-bot] request done` line lives in, sample and expire too. A metric
  window that loses rows is not a measurement.

D1's costs, taken knowingly: the Free plan's 50 queries per invocation (the
meter counts them, capped at 40, and refuses the query past the cap as it
refuses a subrequest — `agents/uno-bot/src/net.ts`), 100k rows written and 5M
read a day, 500 MB per database, and 7-day Time Travel as the only backup.
One row per turn is far inside all of them.

## What the database is for

Three jobs, from the spec (#742):

- **Evidence.** Every metric in the article's sheet is recomputed from
  checked-in queries over these rows.
- **Memory for proactive work.** Sweep cursors, jobs, items, commitments and
  learning examples belong here rather than in KV: free KV allows 1,000 writes a
  day, and `HARNESS_KV` already carries the Figma poll and the Gemini cache.
- **Operations.** Cost, latency and stop usage.

## What it never stores

- DM text.
- Anything about the other party in a DM beyond what a reminder strictly needs.
- Channel request text past its classification, and in any case past 14 days.
- Secrets and tokens.

The first migration stores no message text at all: the row carries ids, times,
counts, names of tools, and the *kinds* of source an answer linked to (Notion,
the blueprint, Figma), never the links or the words.

**Access** is the uno-bot Cloudflare account's members and the query files. The
bot never quotes one person's rows to another. **Retention**: turn metadata is
kept until the article's measurement window closes; purging after that is
Bill's call.

## What would reopen it

A volume the Free plan's D1 limits cannot hold, or a need for real-time
dashboards over high-rate events that SQL-on-SQLite cannot serve. Either is a
new ADR, not an edit here.

— Recorded by Claude from #742 and #746 (the choice itself is Bill's, from the
2026-09-26 grilling), Sep 2026
