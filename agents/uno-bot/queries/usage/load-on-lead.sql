-- Load on the lead, bot side (headline): asks per workday that reached the
-- lead.
--
-- Definition: real asks in the window with escalated_to_lead = 1, divided by
-- the workdays in the window. A workday is a Monday to Friday by its UTC date;
-- holidays are not known here and count as workdays. Days after today are not
-- counted, so a window still open is not diluted by days to come. The inbox
-- side of this metric is a manual re-count and is not computed here.
--
-- Asks and turns, one row each. A turn is one row in `turns`: every message
-- the bot answered, follow-ups included. An ask is a turn whose own message
-- opened a thread (in_thread = 0): the first human turn of its thread, the
-- unit the inbox count compares with — three follow-ups in a thread the lead
-- replied to are one ask reaching the lead, not four. `turns` keeps no thread
-- root, so this is as close as the columns allow: an ask made by mentioning
-- the bot inside someone else's thread is a reply and is missed (leans low),
-- and an ask restated in a new top-level message counts twice (leans high).
-- Cite the ask row against the inbox.
--
-- Bounds. escalated_to_lead reads the lead's DMs by topic, and that same-topic
-- match is loose, so the count leans HIGH. Asks the end-of-day pass has not
-- settled, or whose DM half it could not read, have escalated_to_lead null
-- and are dropped, so it also leans LOW; `lead_unknown` counts them.
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
  real_turns AS (
    SELECT in_thread, escalated_to_lead FROM turns, win
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
  COALESCE(SUM(escalated_to_lead = 1), 0)                                   AS reaching_lead,
  workdays.n                                                                AS workdays,
  ROUND(1.0 * COALESCE(SUM(escalated_to_lead = 1), 0) / NULLIF(workdays.n, 0), 2) AS per_workday,
  COALESCE(SUM(escalated_to_lead IS NULL), 0)                               AS lead_unknown
FROM units, workdays
GROUP BY unit, ord
ORDER BY ord;
