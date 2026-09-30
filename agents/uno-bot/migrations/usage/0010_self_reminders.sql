-- "Remind me" (src/commitments/remind.ts): a person asks uno-bot, in its DM or
-- in a thread where they mention it, to remind them of something. It is a
-- commitment they make to themselves, kept as a `commitments` row of a second
-- kind, 'self_reminder', and delivered by the same morning job in the same DM
-- or thread.
--
-- SQLite cannot widen a CHECK in place, so the table is rebuilt: the same
-- columns in the same order, the same checks but `kind`'s, every row copied as
-- it is, and the same indexes recreated. Nothing is dropped or reinterpreted.
-- Applied with `wrangler d1 migrations apply uno-bot-usage` — see
-- migrations/README.md.
--
-- Still no message text or link (ADR-030): what the reminder is about waits in
-- KV with an expiry, and the permalink is fetched when the reminder is written.

CREATE TABLE commitments_rebuilt (
  commitment_id    TEXT    PRIMARY KEY,
  kind             TEXT    NOT NULL CHECK (kind IN ('thread_promise', 'self_reminder')),
  channel_id       TEXT    NOT NULL,
  thread_ts        TEXT    NOT NULL,
  message_ts       TEXT    NOT NULL,
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
    CHECK (channel_kind IN ('public', 'private', 'group-dm', 'dm'))
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

PRAGMA optimize;
