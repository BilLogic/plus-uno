-- The usage record: one row per uno-bot turn (src/usage/, ADR-030).
--
-- Applied with `wrangler d1 migrations apply uno-bot-usage` — see
-- migrations/README.md. Never edit a migration that has been applied; add the
-- next number instead.
--
-- Times are epoch milliseconds. Booleans are 0/1. List columns hold a JSON
-- array of strings. Nothing here holds message text: what the database never
-- stores is ADR-030's.

CREATE TABLE turns (
  -- identity and place
  turn_id               TEXT    PRIMARY KEY,           -- "<channel>:<ask ts>" (evals: "@<start ms>" added)
  build                 TEXT    NOT NULL,
  requester_id          TEXT    NOT NULL,
  surface               TEXT    NOT NULL CHECK (surface IN ('assistant', 'channel')),
  in_thread             INTEGER NOT NULL CHECK (in_thread IN (0, 1)),
  channel_id            TEXT,                          -- channel turns only

  -- timing
  ask_ts                TEXT    NOT NULL,
  asked_at              INTEGER NOT NULL,
  first_answer_at       INTEGER,
  latency_ms            INTEGER,

  -- model
  tier                  TEXT    NOT NULL,
  route_reason          TEXT    NOT NULL,
  provider              TEXT,
  model                 TEXT,
  fallback_used         INTEGER NOT NULL DEFAULT 0 CHECK (fallback_used IN (0, 1)),
  tokens_in             INTEGER NOT NULL DEFAULT 0,
  tokens_out            INTEGER NOT NULL DEFAULT 0,
  tokens_thinking       INTEGER NOT NULL DEFAULT 0,
  tokens_cached         INTEGER NOT NULL DEFAULT 0,
  cost_usd              REAL,                          -- null: model not priced

  -- behaviour
  tools_called          TEXT    NOT NULL DEFAULT '[]',
  sources_cited         TEXT    NOT NULL DEFAULT '[]',
  disposition           TEXT    NOT NULL,

  -- proposal
  proposal_id           TEXT,

  -- other
  stop_used             INTEGER NOT NULL DEFAULT 0 CHECK (stop_used IN (0, 1)),
  self_filed_ticket_url TEXT,
  test_traffic          INTEGER NOT NULL DEFAULT 0 CHECK (test_traffic IN (0, 1)),

  -- When the end-of-day classifier tagged this row. Nothing writes it yet; it
  -- exists so the unclassified-rows index below has a column to key on.
  classified_at         INTEGER
);

-- Every metric is a window over ask time.
CREATE INDEX turns_by_time ON turns (asked_at);

-- Per-person metrics: returning askers, asks per asker per week.
CREATE INDEX turns_by_requester ON turns (requester_id, asked_at);

-- The classifier's queue: real asks not yet tagged. Partial, so it stays as
-- small as the backlog rather than as large as the table.
CREATE INDEX turns_unclassified ON turns (asked_at)
  WHERE classified_at IS NULL AND test_traffic = 0;

PRAGMA optimize;
