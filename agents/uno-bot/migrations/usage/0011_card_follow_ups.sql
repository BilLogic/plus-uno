-- Card follow-ups join commitment reminders (src/follow-through/): a meeting
-- or thread to-do to make a card that never became one, an active Roadmap card
-- nobody owns, and an active card stuck in one Design Status. Each is a
-- `commitments` row of its own kind, nudged at the weekday morning run like a
-- promise.
--
-- WIDEN-ONLY REBUILD, NOT ADDITIVE. SQLite cannot alter a CHECK, and 0006's
-- `kind` CHECK allowed 'thread_promise' alone. The table is rebuilt with every
-- row and every column it had, the `kind` CHECK dropped — the adapter
-- (src/commitments/d1.ts) and the TypeScript union name the kinds, so a later
-- kind needs no rebuild — and one new nullable column. Nothing a Worker built
-- before this reads or writes changes, so it may run before or after the
-- deploy.
--
-- card_id is a Notion page id, never a link or a title (ADR-030): a card's
-- title and URL wait in KV with the rest of the follow-up's wording.
--
-- Applied with `wrangler d1 migrations apply uno-bot-usage` — see README.md.

CREATE TABLE commitments_next (
  commitment_id    TEXT    PRIMARY KEY,
  kind             TEXT    NOT NULL,              -- thread_promise | card_todo | card_unowned | card_stale
  channel_id       TEXT    NOT NULL,
  thread_ts        TEXT    NOT NULL,              -- '' for a card follow-up posted at a channel's top
  message_ts       TEXT    NOT NULL,              -- '' when no message made it
  promiser_id      TEXT    NOT NULL,              -- the one person a reminder is for
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

INSERT INTO commitments_next (
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
ALTER TABLE commitments_next RENAME TO commitments;

-- 0006's and 0007's indexes, as they were.
CREATE INDEX commitments_by_due ON commitments (state, due_at);
CREATE INDEX commitments_by_nudge ON commitments (nudge_ts);
CREATE INDEX commitments_by_followup ON commitments (followup_ts);
CREATE INDEX commitments_by_thread ON commitments (channel_id, thread_ts, promiser_id);
CREATE INDEX commitments_by_reminded ON commitments (reminded_on);
CREATE INDEX commitments_by_answer ON commitments (state, resolved_at);

-- The end of day asks what a card last had, so one card gets one message a week.
CREATE INDEX commitments_by_card ON commitments (card_id, detected_at);

PRAGMA optimize;
