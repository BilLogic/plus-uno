-- Drawn blueprint proposals (src/blueprint-upkeep/proposal-records.ts): what
-- an approved "Draft this on the blueprint as a proposal?" card wrote, kept by
-- the thread it was offered in.
--
-- Additive: one new table and its indexes; nothing else is touched. Applied
-- with `wrangler d1 migrations apply uno-bot-usage` — see migrations/README.md
-- — BEFORE the Worker that writes it is deployed. IF NOT EXISTS, so a test that
-- replays the later migrations can apply this one again.
--
-- One row per approved card. `rows` is the slots its `proposed` cells were
-- written to, a JSON list of {"laneId","stepId"} on `path_id`: the key every
-- authoring write takes, so the rows can be promoted or removed through the
-- same RPCs. `card_id` is the Roadmap card's Notion page id once the PRD
-- becomes one; until then the row is what a daily check reads to offer the
-- rows' removal. Ids and times only (ADR-030): no cell text, no titles.

CREATE TABLE IF NOT EXISTS blueprint_proposals (
  proposal_ts   TEXT    PRIMARY KEY,           -- the approved card's ts
  channel_id    TEXT    NOT NULL,
  thread_ts     TEXT    NOT NULL,              -- the conversation key
  reply_ts      TEXT    NOT NULL,              -- a real message ts to reply under
  requester_id  TEXT    NOT NULL,              -- who asked, and alone could approve
  path_id       TEXT    NOT NULL,              -- the blueprint path the rows are on
  rows          TEXT    NOT NULL,              -- JSON [{"laneId","stepId"}]
  written_at    INTEGER NOT NULL,              -- epoch ms the rows were written
  card_id       TEXT,                          -- the Roadmap card's Notion page id, once linked
  linked_at     INTEGER                        -- epoch ms it was linked
);

-- A thread's proposals: linking them to a card, or withdrawing them there.
CREATE INDEX IF NOT EXISTS blueprint_proposals_by_thread ON blueprint_proposals (channel_id, thread_ts);

-- The daily check: proposals still without a card, oldest first.
CREATE INDEX IF NOT EXISTS blueprint_proposals_unlinked ON blueprint_proposals (card_id, written_at);

PRAGMA optimize;
