-- Drawn blueprint proposals (src/blueprint-upkeep/proposal-records.ts): what
-- an approved "Draft this on the blueprint as a proposal?" card wrote, kept by
-- the thread it was offered in.
--
-- Additive: one new table and its indexes; nothing else is touched. Applied
-- with `wrangler d1 migrations apply uno-bot-usage` — see migrations/README.md
-- — BEFORE the Worker that writes it is deployed. IF NOT EXISTS, so a test that
-- replays the later migrations can apply this one again.
--
-- One row per approved card. A proposal is a new `proposed` variant path
-- beside today's: `path_id` is that path, the whole of the proposal, which a
-- promotion moves on and a removal deletes; `today_path_id` is the path it
-- was drawn beside; `cell_ids` the cells written on it. `card_id` is the
-- Roadmap card's Notion page id once the PRD becomes one; until then the row
-- is what a daily check reads to offer the proposal's removal. Ids and times
-- only (ADR-030): no cell text, no titles.

CREATE TABLE IF NOT EXISTS blueprint_proposals (
  proposal_ts   TEXT    PRIMARY KEY,           -- the approved card's ts
  channel_id    TEXT    NOT NULL,
  thread_ts     TEXT    NOT NULL,              -- the conversation key
  reply_ts      TEXT    NOT NULL,              -- a real message ts to reply under
  requester_id  TEXT    NOT NULL,              -- who asked, and alone could approve
  path_id       TEXT    NOT NULL,              -- the proposed path the approval created
  today_path_id TEXT    NOT NULL,              -- the path it was drawn beside
  cell_ids      TEXT    NOT NULL,              -- JSON list of the cells written on path_id
  written_at    INTEGER NOT NULL,              -- epoch ms the rows were written
  card_id       TEXT,                          -- the Roadmap card's Notion page id, once linked
  linked_at     INTEGER                        -- epoch ms it was linked
);

-- A thread's proposals: linking them to a card, or withdrawing them there.
CREATE INDEX IF NOT EXISTS blueprint_proposals_by_thread ON blueprint_proposals (channel_id, thread_ts);

-- The daily check: proposals still without a card, oldest first.
CREATE INDEX IF NOT EXISTS blueprint_proposals_unlinked ON blueprint_proposals (card_id, written_at);

PRAGMA optimize;
