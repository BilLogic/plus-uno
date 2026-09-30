-- Where the lead's time goes (headline): how much of what reaches the lead is
-- judgment.
--
-- Definition: of real asks in the window with escalated_to_lead = 1 (the lead
-- replied in the thread, or the asker DMed the lead on the same topic, within
-- 24 h), the share whose pain_category is 6 (judgment). Two shares:
--   - judgment_share: over every escalated ask, so an ask not yet labelled
--     counts against it;
--   - classified_share: over escalated asks with a pain_category.
-- Beside them, the unlabelled are split: `blank` asks were classified and no
-- Sub-type fitted (classified_at set, pain_category null); `not_yet` asks the
-- classifier has not reached (classified_at null).
--
-- Asks and turns, one row each. A turn is one row in `turns`: every message
-- the bot answered, follow-ups included. An ask is a turn whose own message
-- opened a thread (in_thread = 0): the first human turn of its thread, the
-- unit the inbox count compares with. `turns` keeps no thread root, so this is
-- as close as the columns allow: an ask made by mentioning the bot inside
-- someone else's thread is a reply and is missed (leans low), and an ask
-- restated in a new top-level message counts twice (leans high). Cite the ask
-- row against the inbox.
--
-- Bounds. escalated_to_lead reads the lead's DMs by topic, and that same-topic
-- match is loose, so the escalated count leans HIGH. Asks the end-of-day pass
-- has not settled, or whose DM half it could not read, have escalated_to_lead
-- null and are dropped, so it also leans LOW; `lead_unknown` counts them.
--
-- Window: ask time (turns.asked_at), UTC, the @from date inclusive to the @to
-- date exclusive. Set both with scripts/metric-query.mjs --from/--to.
-- Excludes: test traffic (test_traffic = 0 only).
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  real_turns AS (
    SELECT in_thread, escalated_to_lead, pain_category, classified_at
    FROM turns
    CROSS JOIN win
    WHERE test_traffic = 0
      AND asked_at >= win.from_ms AND asked_at < win.to_ms
  ),
  units AS (
    SELECT 'ask' AS unit, 0 AS ord, * FROM real_turns WHERE in_thread = 0
    UNION ALL
    SELECT 'turn', 1, * FROM real_turns
  )
SELECT
  unit,
  COALESCE(SUM(escalated_to_lead = 1), 0)                                        AS escalated,
  COALESCE(SUM(escalated_to_lead = 1 AND pain_category = 6), 0)                  AS judgment,
  COALESCE(SUM(escalated_to_lead = 1 AND pain_category IS NOT NULL), 0)          AS classified,
  COALESCE(SUM(escalated_to_lead = 1 AND pain_category IS NULL AND classified_at IS NOT NULL), 0) AS blank,
  COALESCE(SUM(escalated_to_lead = 1 AND pain_category IS NULL AND classified_at IS NULL), 0)     AS not_yet,
  ROUND(1.0 * SUM(escalated_to_lead = 1 AND pain_category = 6)
        / NULLIF(SUM(escalated_to_lead = 1), 0), 4)                             AS judgment_share,
  ROUND(1.0 * SUM(escalated_to_lead = 1 AND pain_category = 6)
        / NULLIF(SUM(escalated_to_lead = 1 AND pain_category IS NOT NULL), 0), 4) AS classified_share,
  COALESCE(SUM(escalated_to_lead IS NULL), 0)                                    AS lead_unknown
FROM units
GROUP BY unit, ord
ORDER BY ord;
