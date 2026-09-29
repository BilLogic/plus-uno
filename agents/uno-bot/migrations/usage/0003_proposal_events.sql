-- A proposal's history on the usage record: one row per thing that happened to
-- a staged card (src/usage/proposal-events.ts, ADR-030).
--
-- Keyed to the card's ts, which is `turns.proposal_id` on the turn that staged
-- it. Each event happens to a card at most once — it is staged once, the claim
-- lets one ✅ or ⛔ win, a revision replaces it once, it ages out once, and a
-- batch that refused a stale write is one refusal however many operations it
-- held — so the key is the pair, and a write retried by an alarm or recorded
-- by two paths lands once.
--
-- Times are epoch milliseconds. Booleans are 0/1. `tools` is a JSON array of
-- tool names. No message text: ids, times, tool names and roles only.

CREATE TABLE proposal_events (
  proposal_id        TEXT    NOT NULL,              -- the card's ts
  event              TEXT    NOT NULL CHECK (event IN
                       ('staged', 'confirmed', 'cancelled', 'superseded', 'expired', 'refused_stale')),
  at                 INTEGER NOT NULL,
  -- how it happened: the door a verdict came through (reaction, button, typed,
  -- model), or who staged, replaced, aged out or refused it (turn, restage,
  -- worker, revision, end-of-day, executor)
  via                TEXT    NOT NULL,
  channel_id         TEXT,

  -- staged: what was staged, by whom, and for how long
  turn_id            TEXT,                          -- the staging turn, when a turn staged it
  requester_id       TEXT,
  tools              TEXT    NOT NULL DEFAULT '[]',
  ttl_ms             INTEGER,                       -- how long it stayed confirmable

  -- staged: ticket kickoff — who asked, who they asked, and when the thread began
  requester_role     TEXT    CHECK (requester_role IN ('pm', 'dev', 'design')),
  aimed_at_role      TEXT    CHECK (aimed_at_role IN ('pm', 'dev', 'design')),
  thread_started_at  INTEGER,

  -- confirmed and cancelled: who decided, and whether that was someone other
  -- than the requester
  actor_id           TEXT,
  confirmed_by_other INTEGER CHECK (confirmed_by_other IN (0, 1)),

  PRIMARY KEY (proposal_id, event)
);

-- The end-of-day expiry pass scans staged rows by time, and every metric is a
-- window over one kind of event.
CREATE INDEX proposal_events_by_event ON proposal_events (event, at);

PRAGMA optimize;
