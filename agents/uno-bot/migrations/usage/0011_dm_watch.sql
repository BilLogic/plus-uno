-- DM watch (src/dm-watch/): what a person opted into on the Home tab, and the
-- promises read in their own DMs, with their own token, for those opt-ins.
--
-- Additive: two new tables and their indexes; nothing else is touched. Applied
-- with `wrangler d1 migrations apply uno-bot-usage` — see migrations/README.md.
-- IF NOT EXISTS, so a test that replays the later migrations over a rebuilt
-- `commitments` can apply this one again.
--
-- `dm_watch` is one row per person per switch that is ON. Turning a switch off
-- deletes its row. `feature` has no CHECK on purpose: the code holds the list
-- (`DM_WATCH_FEATURES`), so a later switch is a new value, not a table rebuild.
-- `read_through` is the Slack ts that switch's DMs have been read up to.
--
-- `dm_commitments` is one row per promise found in those DMs: made by the
-- person (`made`) or made to them (`made_to`). A row holds the permalink,
-- `due_at` and the state, and what the morning needs to schedule and answer a
-- reminder. It holds NO summary and NO id of the other person: at nudge time
-- the message is read again from the permalink with the owner's own token, and
-- the summary is regenerated then. The permalink is the one link ADR-030 lets
-- this table keep, because the ticket that added it allows it.

CREATE TABLE IF NOT EXISTS dm_watch (
  user_id       TEXT    NOT NULL,              -- the person who opted in, and whose token reads
  feature       TEXT    NOT NULL,              -- which switch: 'promises_made', 'promises_to_me', ...
  since         INTEGER NOT NULL,              -- epoch ms it was turned on
  read_through  TEXT    NOT NULL,              -- Slack ts this switch's DMs are read up to
  PRIMARY KEY (user_id, feature)
);

CREATE TABLE IF NOT EXISTS dm_commitments (
  commitment_id  TEXT    PRIMARY KEY,           -- "<owner>:<channel>:<message ts>", from the permalink
  owner_id       TEXT    NOT NULL,              -- the opted-in person, the only one ever told
  kind           TEXT    NOT NULL CHECK (kind IN ('made', 'made_to')),
  permalink      TEXT    NOT NULL,
  due_at         INTEGER NOT NULL,              -- the next step: reminder, follow-up or lapse
  state          TEXT    NOT NULL CHECK (state IN ('open', 'nudged', 'snoozed', 'done', 'dropped', 'not_promise', 'auto_done', 'lapsed')),
  nudges         INTEGER NOT NULL DEFAULT 0,    -- reminders posted, at most two
  snoozes        INTEGER NOT NULL DEFAULT 0,    -- ⏳ answers, at most two
  detected_at    INTEGER NOT NULL,
  nudge_ts       TEXT,                          -- the reminder, in the owner's DM with uno-bot
  followup_ts    TEXT,                          -- its one follow-up
  checked_on     TEXT,                          -- YYYY-MM-DD: the morning that last looked
  holds          INTEGER NOT NULL DEFAULT 0,    -- consecutive mornings it could not be read or posted
  reminded_on    TEXT,                          -- YYYY-MM-DD: the morning its last reminder went up
  resolved_at    INTEGER
);

-- The morning takes one owner's live rows due soonest.
CREATE INDEX IF NOT EXISTS dm_commitments_by_owner_due ON dm_commitments (owner_id, state, due_at);

-- A reaction finds its row by the reminder it landed on.
CREATE INDEX IF NOT EXISTS dm_commitments_by_nudge ON dm_commitments (nudge_ts);
CREATE INDEX IF NOT EXISTS dm_commitments_by_followup ON dm_commitments (followup_ts);

PRAGMA optimize;
