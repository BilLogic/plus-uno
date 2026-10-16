-- Revision or separate proposal: what a turn made each card it staged, and
-- the card a correction undid (#1320) — how often the bot tells matters
-- apart. A revision already named the card it replaced (0013's
-- `revises_proposal_id`); nothing said a card without one was a separate
-- proposal rather than a card staged before the column, or by the Worker.
--
-- Additive: two new nullable columns. Applied with `wrangler d1 migrations
-- apply uno-bot-usage` — see migrations/README.md — BEFORE the Worker that
-- writes them is deployed.
--
-- `proposal_events.staged_as`, on a staged row only: 'revision' when the
-- staging turn made the card a revision of a waiting one, 'separate' when it
-- made it a separate proposal (`src/turn/card-matter.ts`). Null — unknown,
-- not either — on a card the Worker or a re-stage staged, on every other
-- event, and on every row written before this column existed.
--
-- `proposal_events.corrects_proposal_id`, on a staged row only: the thread's
-- previous card, when this one undid the call that card was staged under — a
-- revision of a card it had been staged as separate from, or a separate
-- proposal right after a revision. A correction is counted against the card
-- it names. Null on every other row.
--
-- Ids and a two-value label only: no text of the ask, the card or the
-- correction.
--
-- SQLite has no IF NOT EXISTS for a column, so the commitments conformance
-- suite, which rewinds the migration record to 0005 and replays every later
-- file, drops both columns before it replays (as it does 0013's and 0014's).

ALTER TABLE proposal_events ADD COLUMN staged_as TEXT CHECK (staged_as IN ('revision', 'separate'));
ALTER TABLE proposal_events ADD COLUMN corrects_proposal_id TEXT;

PRAGMA optimize;
