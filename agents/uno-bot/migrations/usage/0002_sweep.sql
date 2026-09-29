-- The end-of-day sweep's records (src/sweep/store.ts): each swept channel's
-- cursor, one row per sweep job, and one row per proposed fix.
--
-- Additive: three new tables and their indexes; `turns` is untouched. Applied
-- with `wrangler d1 migrations apply uno-bot-usage` — see migrations/README.md.
--
-- Times are epoch milliseconds. List columns hold a JSON array of strings.
-- Nothing here holds message text (ADR-030): what a page and a thread said,
-- and the replacement, wait in KV until the morning post and are never
-- written here.

-- How far each channel has been swept: the last message whose thread was
-- fully processed. Here, not in KV, so the next run reads what the last one
-- wrote.
CREATE TABLE sweep_cursors (
  channel_id  TEXT    PRIMARY KEY,
  last_ts     TEXT    NOT NULL,                  -- a Slack message ts
  updated_at  INTEGER NOT NULL
);

-- One row per sweep job: an end-of-day channel read, or the morning post.
CREATE TABLE sweep_runs (
  run_id       TEXT    PRIMARY KEY,              -- "<run date>:<job key>"
  run_date     TEXT    NOT NULL,                 -- YYYY-MM-DD (UTC)
  run_name     TEXT    NOT NULL CHECK (run_name IN ('morning', 'end-of-day')),
  job_key      TEXT    NOT NULL,
  channels     TEXT    NOT NULL DEFAULT '[]',
  threads      INTEGER NOT NULL DEFAULT 0,       -- threads read, or cards posted
  items        INTEGER NOT NULL DEFAULT 0,       -- findings kept, or items proposed
  subrequests  INTEGER NOT NULL DEFAULT 0,
  d1_queries   INTEGER NOT NULL DEFAULT 0,
  outcome      TEXT    NOT NULL CHECK (outcome IN ('handled', 'deferred', 'skipped')),
  note         TEXT,                             -- why, in code's words
  started_at   INTEGER NOT NULL,
  finished_at  INTEGER NOT NULL
);

CREATE INDEX sweep_runs_by_date ON sweep_runs (run_date);

-- One row per proposed fix. Moves from proposed to confirmed, dropped,
-- refused_stale (the page moved since the sweep read it) or failed. An item
-- still proposed 72 h after posted_at expired unanswered.
CREATE TABLE sweep_items (
  item_id      TEXT    PRIMARY KEY,              -- "<card key>#<block id>"
  run_date     TEXT    NOT NULL,                 -- the end-of-day run that found it
  channel_id   TEXT    NOT NULL,
  thread_ts    TEXT    NOT NULL,
  target_url   TEXT    NOT NULL,
  block_id     TEXT    NOT NULL,
  owner_id     TEXT    NOT NULL,
  status       TEXT    NOT NULL CHECK (status IN ('proposed', 'confirmed', 'dropped', 'refused_stale', 'failed')),
  card_key     TEXT    NOT NULL,                 -- "<post date>:<destination>:<first block id>"
  proposal_ts  TEXT,                             -- the live card; a revision moves it
  drift_at     INTEGER NOT NULL,                 -- the thread's first evidence message
  detected_at  INTEGER NOT NULL,
  posted_at    INTEGER,
  resolved_at  INTEGER                           -- time from drift to fix = resolved_at - drift_at
);

-- A ✅, a ⛔ or a revision finds its items by the card they are on.
CREATE INDEX sweep_items_by_proposal ON sweep_items (proposal_ts);

-- A retried morning post asks whether its card already went out.
CREATE INDEX sweep_items_by_card ON sweep_items (card_key);

-- The morning asks what a thread has already been carded, so a fix that was
-- proposed, dropped or applied is not proposed again, and a new day's card
-- takes the next slot rather than retiring a live one.
CREATE INDEX sweep_items_by_thread ON sweep_items (channel_id, thread_ts);

PRAGMA optimize;
