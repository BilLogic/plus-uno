-- Which disclosed documents each turn read: the names `read_reference` served
-- (ADR-030), so the measurement window can count how often a skill's method
-- or another reference is read, before and after a document moves behind it.
--
-- Additive: one new column. Applied with `wrangler d1 migrations apply
-- uno-bot-usage` — see migrations/README.md — BEFORE the Worker that writes it
-- is deployed.
--
-- `turns.references_read`: a JSON array of reference names, in the order each
-- was first read, each once (`uno-maintain/method`,
-- `docs/connectors/slack-sweep`). A name the map does not hold read nothing
-- and is not listed. '[]' on a turn that read none, and on every row written
-- before this column existed.
--
-- A name only: never the document's text. The commitments conformance suite
-- drops this column before it replays from 0006, as it does 0013's.

ALTER TABLE turns ADD COLUMN references_read TEXT NOT NULL DEFAULT '[]';

PRAGMA optimize;
