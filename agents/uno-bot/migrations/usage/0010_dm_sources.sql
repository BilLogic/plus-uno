-- DMs with uno-bot feed Capture and Follow through (src/dm-sweep/): the
-- end-of-day run reads each 1:1 DM uno-bot answered in, with the bot token, and
-- keeps two new kinds of `commitments` row, asked about only in that DM at the
-- next weekday morning run:
--   • 'dm_unanswered' — uno-bot said it could not find an answer, or was not
--     sure of it: "Did you get it?", once;
--   • 'dm_disagreement' — uno-bot noticed two sources disagree while
--     answering: an offer to raise it, whose ✅ posts a reworded note.
-- Their `channel_kind` is always 'dm', which is the row's surface flag. A
-- decision told to uno-bot in a DM is a sweep finding, so its items take the
-- new `sweep_items.surface` column, 'dm'.
--
-- SQLite cannot widen a CHECK in place, so `commitments` is rebuilt from
-- 0009's exactly: the same columns in the same order, the same checks with
-- `kind`'s list widened by the two DM kinds, every row copied as it is (its
-- card_id with it), and the same indexes recreated. Nothing is dropped or
-- reinterpreted, so a Worker built before this runs on unchanged. Apply it
-- before deploying the Worker that writes the DM kinds and `surface`: that
-- Worker's writes of either fail on the old tables.
--
-- Still no message text or link (ADR-030): what uno-bot could not find, and
-- what two sources disagree on, wait in KV with an expiry, in uno-bot's own
-- words.
--
-- Applied with `wrangler d1 migrations apply uno-bot-usage` — see README.md.

CREATE TABLE commitments_rebuilt (
  commitment_id    TEXT    PRIMARY KEY,
  kind             TEXT    NOT NULL CHECK (kind IN ('thread_promise', 'self_reminder', 'card_todo', 'card_unowned', 'card_stale', 'dm_unanswered', 'dm_disagreement')),
  channel_id       TEXT    NOT NULL,
  thread_ts        TEXT    NOT NULL,              -- '' for a card follow-up posted at a channel's top
  message_ts       TEXT    NOT NULL,              -- '' when no message made it
  promiser_id      TEXT    NOT NULL,              -- a self_reminder's requester, the one person it mentions
  requester_id     TEXT,
  deadline_at      INTEGER,
  due_at           INTEGER NOT NULL,
  state            TEXT    NOT NULL CHECK (state IN ('open', 'nudged', 'snoozed', 'done', 'dropped', 'not_promise', 'auto_done', 'lapsed')),
  nudges           INTEGER NOT NULL DEFAULT 0,
  snoozes          INTEGER NOT NULL DEFAULT 0,
  confidence       REAL    NOT NULL,
  promised_at      INTEGER NOT NULL,
  detected_at      INTEGER NOT NULL,
  run_date         TEXT    NOT NULL,
  nudge_ts         TEXT,
  followup_ts      TEXT,
  checked_on       TEXT,
  holds            INTEGER NOT NULL DEFAULT 0,
  reminded_on      TEXT,
  resolved_at      INTEGER,
  channel_kind     TEXT    NOT NULL DEFAULT 'private'
    CHECK (channel_kind IN ('public', 'private', 'group-dm', 'dm')),
  card_id          TEXT                            -- the Roadmap card's Notion page id, for a card follow-up
);

INSERT INTO commitments_rebuilt (
  commitment_id, kind, channel_id, thread_ts, message_ts, promiser_id, requester_id, deadline_at, due_at, state,
  nudges, snoozes, confidence, promised_at, detected_at, run_date, nudge_ts, followup_ts, checked_on, holds,
  reminded_on, resolved_at, channel_kind, card_id
)
SELECT
  commitment_id, kind, channel_id, thread_ts, message_ts, promiser_id, requester_id, deadline_at, due_at, state,
  nudges, snoozes, confidence, promised_at, detected_at, run_date, nudge_ts, followup_ts, checked_on, holds,
  reminded_on, resolved_at, channel_kind, card_id
FROM commitments;

DROP TABLE commitments;
ALTER TABLE commitments_rebuilt RENAME TO commitments;

CREATE INDEX commitments_by_due ON commitments (state, due_at);
CREATE INDEX commitments_by_nudge ON commitments (nudge_ts);
CREATE INDEX commitments_by_followup ON commitments (followup_ts);
CREATE INDEX commitments_by_thread ON commitments (channel_id, thread_ts, promiser_id);
CREATE INDEX commitments_by_reminded ON commitments (reminded_on);
CREATE INDEX commitments_by_answer ON commitments (state, resolved_at);

-- The end of day asks what a card last had, so one card gets one message a week.
CREATE INDEX commitments_by_card ON commitments (card_id, detected_at);

-- The sweep's items say which were found in a person's DM with uno-bot.
-- Existing rows are every one a channel's, a group DM's, a note's or a card's.
ALTER TABLE sweep_items ADD COLUMN surface TEXT NOT NULL DEFAULT 'channel'
  CHECK (surface IN ('channel', 'dm'));

PRAGMA optimize;
