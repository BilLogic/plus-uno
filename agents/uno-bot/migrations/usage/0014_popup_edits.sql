-- A card approved with edits from its Review pop-up: what "approved with
-- edits" counted only half of until now (ADR-030). A revision (Needs changes)
-- was already on the record as 0013's `revises_proposal_id`; an Approve after
-- Edit fields recorded a plain `confirmed`.
--
-- Additive: one new nullable column. Applied with `wrangler d1 migrations
-- apply uno-bot-usage` — see migrations/README.md — BEFORE the Worker that
-- writes it is deployed.
--
-- `proposal_events.confirmed_edited`, on a confirmed row only: 1 when the ✅
-- came from the Review pop-up and its Edit fields changed the batch — another
-- tool, or any input value changed, added or taken away, with a choice card's
-- own answer not counted as a change. 0 for every other ✅: an unchanged
-- pop-up Approve, a reaction, a button, a typed or the model's confirm. Null
-- on every other event, and on a confirmed row written before this column
-- existed — a card confirmed before the deploy cannot be split into with and
-- without edits.
--
-- Booleans are 0/1. No text: no field, value or wording of the edit is kept,
-- only whether there was one.
--
-- SQLite has no IF NOT EXISTS for a column, so the commitments conformance
-- suite, which rewinds the migration record to 0005 and replays every later
-- file, drops this column before it replays (as it does 0013's).

ALTER TABLE proposal_events ADD COLUMN confirmed_edited INTEGER CHECK (confirmed_edited IN (0, 1));

PRAGMA optimize;
