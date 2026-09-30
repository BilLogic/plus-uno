-- Commitment reminders' records (src/commitments/store.ts): one row per
-- promise the end-of-day sweep read in a swept thread, nudged in that thread at
-- a weekday morning run.
--
-- Additive: one new table and its indexes; nothing else is touched. Applied
-- with `wrangler d1 migrations apply uno-bot-usage` — see migrations/README.md.
--
-- Times are epoch milliseconds. Nothing here holds message text or a link
-- (ADR-030): what was promised, in the detector's own short words, and each
-- reminder's body wait in KV with an expiry; the permalink is fetched again
-- from the channel and the message ts when a reminder is written.

CREATE TABLE commitments (
  commitment_id    TEXT    PRIMARY KEY,           -- "<channel>:<message ts>"
  kind             TEXT    NOT NULL CHECK (kind IN ('thread_promise')),
  channel_id       TEXT    NOT NULL,
  thread_ts        TEXT    NOT NULL,              -- where its reminder replies
  message_ts       TEXT    NOT NULL,              -- the promising message
  promiser_id      TEXT    NOT NULL,              -- the one person a reminder mentions
  requester_id     TEXT,                          -- who asked, when someone did
  deadline_at      INTEGER,                       -- the end of the day the promiser named; null when none
  due_at           INTEGER NOT NULL,              -- the next step: nudge, follow-up or lapse
  state            TEXT    NOT NULL CHECK (state IN ('open', 'nudged', 'snoozed', 'done', 'dropped', 'not_promise', 'auto_done', 'lapsed')),
  nudges           INTEGER NOT NULL DEFAULT 0,    -- reminders since the last answer
  snoozes          INTEGER NOT NULL DEFAULT 0,    -- ⏳ answers, at most two
  confidence       REAL    NOT NULL,
  promised_at      INTEGER NOT NULL,
  detected_at      INTEGER NOT NULL,
  run_date         TEXT    NOT NULL,              -- YYYY-MM-DD: the end-of-day run that found it
  nudge_ts         TEXT,                          -- the first reminder
  followup_ts      TEXT,                          -- the one follow-up
  checked_on       TEXT,                          -- YYYY-MM-DD: the morning that last looked
  resolved_at      INTEGER
);

-- The morning takes the live commitment due soonest.
CREATE INDEX commitments_by_due ON commitments (state, due_at);

-- A reaction finds its commitment by the reminder it landed on.
CREATE INDEX commitments_by_nudge ON commitments (nudge_ts);
CREATE INDEX commitments_by_followup ON commitments (followup_ts);

PRAGMA optimize;
