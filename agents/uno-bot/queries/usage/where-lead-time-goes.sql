-- Where the lead's time goes (headline): how much of what reaches the lead is
-- judgment.
--
-- Definition: of real asks in the window with escalated_to_lead = 1 (the lead
-- replied in the thread, or the asker DMed the lead on the same topic, within
-- 24 h), the share whose pain_category is 6 (judgment). The denominator keeps
-- asks not yet classified; `unclassified_asks` says how many, so a share read
-- before the classifier has caught up is visibly provisional.
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
  )
SELECT
  COUNT(*)                                                   AS escalated_asks,
  COALESCE(SUM(pain_category = 6), 0)                        AS judgment_asks,
  COALESCE(SUM(pain_category IS NULL), 0)                    AS unclassified_asks,
  ROUND(1.0 * SUM(pain_category = 6) / NULLIF(COUNT(*), 0), 4) AS judgment_share
FROM turns
CROSS JOIN win
WHERE test_traffic = 0
  AND escalated_to_lead = 1
  AND asked_at >= win.from_ms AND asked_at < win.to_ms;
