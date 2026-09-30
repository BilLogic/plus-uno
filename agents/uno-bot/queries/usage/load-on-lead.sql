-- Load on the lead, bot side (headline): asks per workday that reached the
-- lead.
--
-- Definition: real asks in the window with escalated_to_lead = 1, divided by
-- the weekdays (Monday to Friday, UTC dates) in the window. Days after today
-- are not counted, so a window still open is not diluted by days to come. The
-- inbox side of this metric is a manual re-count and is not computed here.
--
-- Window: ask time (turns.asked_at), UTC, the @from date inclusive to the @to
-- date exclusive. Set both with scripts/metric-query.mjs --from/--to.
-- Excludes: test traffic (test_traffic = 0 only).
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH RECURSIVE
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  last_day(d) AS (
    SELECT min(date(to_ms / 1000, 'unixepoch', '-1 day'), date('now')) FROM win
  ),
  days(d) AS (
    SELECT date(from_ms / 1000, 'unixepoch') FROM win
    UNION ALL
    SELECT date(days.d, '+1 day') FROM days, last_day WHERE days.d < last_day.d
  ),
  workdays(n) AS (
    SELECT COUNT(*) FROM days, last_day
    WHERE days.d <= last_day.d AND strftime('%w', days.d) NOT IN ('0', '6')
  ),
  reached(n) AS (
    SELECT COUNT(*) FROM turns, win
    WHERE test_traffic = 0
      AND escalated_to_lead = 1
      AND asked_at >= win.from_ms AND asked_at < win.to_ms
  )
SELECT
  reached.n                                          AS asks_reaching_lead,
  workdays.n                                         AS workdays,
  ROUND(1.0 * reached.n / NULLIF(workdays.n, 0), 2)  AS per_workday
FROM reached, workdays;
