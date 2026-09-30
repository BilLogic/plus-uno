-- Card follow-ups join commitment reminders (src/follow-through/): a meeting
-- or thread to-do to make a card that never became one, an active Roadmap card
-- nobody owns, and an active card stuck in one Design Status. Each is a
-- `commitments` row of its own kind, nudged at the weekday morning run like a
-- promise.
--
-- SQLite cannot widen a CHECK in place, so the table is rebuilt from 0008's
-- exactly: the same columns in the same order, the same checks with `kind`'s
-- list widened to the three card kinds, 'thread_promise' and 'self_reminder'
-- still valid, every row copied as it is, and the same indexes recreated —
-- plus one new nullable column and its index. Nothing is dropped or
-- reinterpreted, so a Worker built before this runs on unchanged. Apply it
-- before deploying the Worker that writes card_id and the card kinds: that
-- Worker's commitment writes fail on the old table.
--
-- card_id is a Notion page id, never a link or a title (ADR-030): a card's
-- title and URL wait in KV with the rest of the follow-up's wording.
--
-- Applied with `wrangler d1 migrations apply uno-bot-usage` — see README.md.

CREATE TABLE commitments_rebuilt (
  commitment_id    TEXT    PRIMARY KEY,
  kind             TEXT    NOT NULL CHECK (kind IN ('thread_promise', 'self_reminder', 'card_todo', 'card_unowned', 'card_stale')),
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
  reminded_on, resolved_at, channel_kind
)
SELECT
  commitment_id, kind, channel_id, thread_ts, message_ts, promiser_id, requester_id, deadline_at, due_at, state,
  nudges, snoozes, confidence, promised_at, detected_at, run_date, nudge_ts, followup_ts, checked_on, holds,
  reminded_on, resolved_at, channel_kind
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

PRAGMA optimize;
