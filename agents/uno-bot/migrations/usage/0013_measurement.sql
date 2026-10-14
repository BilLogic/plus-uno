-- What the measurement window counts and the record did not hold yet: a card
-- approved after a revision, and thanks nobody asked for (ADR-030).
--
-- Additive: two new columns and one new table. Applied with `wrangler d1
-- migrations apply uno-bot-usage` — see migrations/README.md — BEFORE the
-- Worker that writes them is deployed.
--
-- `proposal_events.revises_proposal_id`, on a staged row only: the ts of the
-- card this one replaced by revision (a turn's revision, a sweep card's "drop
-- N"). A re-staged revision keeps its original's, so it resolves to the same
-- chain. Null on a card that revised nothing.
--
-- `turns.thanks`: 1 when the asker's message thanked the bot (thanks, thank
-- you, thx, ty, tysm, appreciate it, goat, 🙏). The message is read in memory
-- as the turn ends and only the 0/1 is kept. Set on a person's turn only —
-- never on the debug route or in a `TEST_CHANNEL_IDS` channel — and whatever
-- `test_traffic` says: a thanks-only message is a greeting by that rule, and
-- this flag is what counts it.
--
-- `appreciation` is one row per thanks reaction on one of the bot's own
-- messages: per (channel, message ts, person, emoji), so a reaction taken off
-- and put back counts once. `emoji` is the reaction's short name and nothing
-- else; the gate's verdict emoji (✅ 👍 ⛔ …) and 🙌 are never recorded here.
-- `turn_id` is the turn the message belongs to when the record already knows
-- it (an answer rated with its buttons, a card a turn staged); null otherwise.
-- `conversation_type` is that turn's, else what the channel id proves (`D…` is
-- the app DM), else null.
--
-- Times are epoch milliseconds. Booleans are 0/1. No text: no message, no
-- reply, nothing a person typed.
--
-- IF NOT EXISTS on the table, as 0011: the commitments conformance suite
-- rewinds the migration record to 0005 and replays every later file over
-- tables that are still there. SQLite has no IF NOT EXISTS for a column, so
-- that suite drops the two columns before it replays.

ALTER TABLE proposal_events ADD COLUMN revises_proposal_id TEXT;

ALTER TABLE turns ADD COLUMN thanks INTEGER NOT NULL DEFAULT 0 CHECK (thanks IN (0, 1));

CREATE TABLE IF NOT EXISTS appreciation (
  channel           TEXT    NOT NULL,           -- where the bot's message is
  item_ts           TEXT    NOT NULL,           -- the bot's message that was reacted to
  user_id           TEXT    NOT NULL,           -- who reacted: a person, never the bot
  emoji             TEXT    NOT NULL,           -- the short name: 'pray', 'goat', 'clap', ...
  at                INTEGER NOT NULL,           -- when it was recorded
  conversation_type TEXT    CHECK (conversation_type IN ('channel', 'group', 'mpim', 'im')),
  turn_id           TEXT,                       -- "<channel>:<ask ts>", when the message is a known answer
  PRIMARY KEY (channel, item_ts, user_id, emoji)
);

-- Every metric is a window over time.
CREATE INDEX IF NOT EXISTS appreciation_by_time ON appreciation (at);

PRAGMA optimize;
