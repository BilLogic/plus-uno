-- Proposal outcomes (headline): what became of what the bot proposed, one row
-- per kind of proposal.
--
-- Definition: each row counts approved · approved_with_edits · rejected ·
-- refused · expired · still_live, and their total. A column a kind cannot
-- have is null.
--   - card: a card staged for a ✅ (proposal_events). A card replaced by
--     another is counted once, as the card that replaced it: a re-stage after
--     a cut-off is the same card, and so is a revision. The outcome is the
--     last card's. approved = ✅ on a card that revised nothing; approved
--     with edits = ✅ on a card whose staged row names the card it revised
--     (revises_proposal_id, which a re-staged revision keeps); rejected = ⛔;
--     expired = aged out; still live = none of these yet. A write refused
--     after its ✅ is still approved: gated-writes.sql counts refusals.
--   - upkeep_fix: one fix on an end-of-day card (sweep_items) that was carded
--     (posted_at set). approved = confirmed; rejected = dropped; refused =
--     refused_stale, refused_unwritable or failed (approved, not written);
--     expired = still proposed 72 h after it was posted; still live =
--     proposed and younger than that. A fix dropped by "drop N" is rejected,
--     so with edits is null.
--   - reminder: a promise the bot reminded about or read (commitments, the
--     thread and self reminders; DM watch's own table is not read). approved
--     = done, snoozed or dropped — the promiser answered; rejected =
--     not_promise; expired = lapsed or auto_done — no answer came; still live
--     = open or nudged.
--
-- Window: cards by when the last card was staged; upkeep fixes and reminders
-- by the end-of-day run's date (run_date). UTC, the @from date inclusive to
-- the @to date exclusive. Set both with scripts/metric-query.mjs --from/--to.
-- The default runs 2026-09-01 to 2027-01-01, the measurement window; the usage
-- record begins on 2026-09-29, so nothing before that date is in it. Expired
-- and still live read the clock when the query runs.
-- Excludes: test traffic on cards (test_traffic = 0). Sweep items and
-- commitments carry no test flag: only the end-of-day run writes them.
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  days(from_day, to_day) AS (
    SELECT date(from_ms / 1000, 'unixepoch'), date(to_ms / 1000, 'unixepoch') FROM win
  ),
  now_ms(ms) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  -- The last card of each chain: staged, and never replaced.
  cards AS (
    SELECT s.proposal_id, s.revises_proposal_id,
      (SELECT GROUP_CONCAT(o.event) FROM proposal_events o
        WHERE o.proposal_id = s.proposal_id AND o.event IN ('confirmed', 'cancelled', 'expired')) AS outcome
    FROM proposal_events s, win
    WHERE s.event = 'staged'
      AND s.test_traffic = 0
      AND s.at >= win.from_ms AND s.at < win.to_ms
      AND NOT EXISTS (SELECT 1 FROM proposal_events r
        WHERE r.proposal_id = s.proposal_id AND r.event = 'superseded')
  ),
  fixes AS (
    SELECT s.status, s.posted_at FROM sweep_items s, days
    WHERE s.run_date >= days.from_day AND s.run_date < days.to_day
      AND s.posted_at IS NOT NULL
  ),
  promises AS (
    SELECT c.state FROM commitments c, days
    WHERE c.run_date >= days.from_day AND c.run_date < days.to_day
  )
SELECT
  'card'                                                                  AS kind,
  COALESCE(SUM(outcome = 'confirmed' AND revises_proposal_id IS NULL), 0)     AS approved,
  COALESCE(SUM(outcome = 'confirmed' AND revises_proposal_id IS NOT NULL), 0) AS approved_with_edits,
  COALESCE(SUM(outcome = 'cancelled'), 0)                                 AS rejected,
  NULL                                                                    AS refused,
  COALESCE(SUM(outcome = 'expired'), 0)                                   AS expired,
  COALESCE(SUM(outcome IS NULL), 0)                                       AS still_live,
  COUNT(*)                                                                AS total
FROM cards
UNION ALL
SELECT
  'upkeep_fix',
  COALESCE(SUM(status = 'confirmed'), 0),
  NULL,
  COALESCE(SUM(status = 'dropped'), 0),
  COALESCE(SUM(status IN ('refused_stale', 'refused_unwritable', 'failed')), 0),
  COALESCE(SUM(status = 'proposed' AND posted_at + 72 * 3600000 <= now_ms.ms), 0),
  COALESCE(SUM(status = 'proposed' AND posted_at + 72 * 3600000 > now_ms.ms), 0),
  COUNT(*)
FROM fixes, now_ms
UNION ALL
SELECT
  'reminder',
  COALESCE(SUM(state IN ('done', 'snoozed', 'dropped')), 0),
  NULL,
  COALESCE(SUM(state = 'not_promise'), 0),
  NULL,
  COALESCE(SUM(state IN ('lapsed', 'auto_done')), 0),
  COALESCE(SUM(state IN ('open', 'nudged')), 0),
  COUNT(*)
FROM promises;
