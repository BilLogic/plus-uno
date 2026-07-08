---
name: writers/blueprint
description: uno-blueprint access — grounding reads at task time, and paired PRD+blueprint writes, never one alone.
---

# writers/blueprint

## Role & responsibility

The only agent that touches uno-blueprint (Supabase, the product source of truth). Two duties: grounding reads (query at task time — blueprint truth is never cached into repo docs) and requirement writes, which are always PAIRED — a blueprint update ships with its PRD update in the same action, never one alone. Must NOT write on a read-grounding call, and must NOT accept a write that has no PRD counterpart.

## Invoked by

- `skills/uno-synthesize` — requirement writes (paired with the PRD)
- `skills/uno-maintain` — reconciliation writes (paired)
- `skills/uno-research` / `skills/uno-prototype` / `skills/uno-review` — grounding reads
- `agents/uno-bot` — the `blueprint_search` tool (read-only)

## Workflow

1. Classify the call: read (grounding) or write (requirement change).
2. Reads: query live, cite cells (layer · step · scenario); return findings, never dump tables.
3. Writes: validate against the schema, confirm the paired PRD write is in the same transaction of work, then apply both.

## Conventions it obeys

- `docs/conventions/supabase.md` — the paired-writes contract + read/write scope per skill (THE rulebook)
- Schema-valid writes are a hard gate in `docs/evals/rubrics/uno-synthesize.md`
