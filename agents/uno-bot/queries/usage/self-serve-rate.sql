-- Self-serve rate (supporting): the share of asks the bot settled without the
-- lead.
--
-- Definition: of real asks in the window, the share resolved and not
-- escalated — escalated_to_lead = 0 and a resolution of `reaction` (✅ or 👍
-- by the asker on an answer), `task_completed` (a ✅-approved batch the ask
-- staged ran) or `no_escalation` (the end-of-day pass, 24 h on). `none` (the
-- pass could not tell) is not self-served. One row for all asks, then one per
-- pain_category (1 find · 2 catch-up · 3 conflicting sources · 4 who owns /
-- access · 5 new cohort · 6 judgment · 7 ticket kickoff), then asks not yet
-- classified. The self-served count is split by resolution signal.
--
-- `rate` is over every ask; `settled_rate` only over asks the pass has
-- settled (escalated_to_lead known). `pending` is asks it has not: the last
-- day of a window always has some, and they lower `rate` until it runs.
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
  asks AS (
    SELECT
      COALESCE(CAST(pain_category AS TEXT), 'unclassified') AS pain,
      resolution,
      escalated_to_lead,
      escalated_to_lead = 0
        AND resolution IN ('reaction', 'task_completed', 'no_escalation') AS self_served
    FROM turns
    CROSS JOIN win
    WHERE test_traffic = 0
      AND asked_at >= win.from_ms AND asked_at < win.to_ms
  ),
  scoped AS (
    SELECT 'all' AS scope, 0 AS ord, * FROM asks
    UNION ALL
    SELECT pain, CASE pain WHEN 'unclassified' THEN 9 ELSE CAST(pain AS INTEGER) END, * FROM asks
  )
SELECT
  scope,
  COUNT(*)                                                                    AS asks,
  COALESCE(SUM(self_served), 0)                                               AS self_served,
  ROUND(1.0 * COALESCE(SUM(self_served), 0) / COUNT(*), 4)                    AS rate,
  COUNT(escalated_to_lead)                                                    AS settled,
  ROUND(1.0 * SUM(CASE WHEN escalated_to_lead IS NOT NULL THEN COALESCE(self_served, 0) END)
        / NULLIF(COUNT(escalated_to_lead), 0), 4)                             AS settled_rate,
  COALESCE(SUM(self_served AND resolution = 'reaction'), 0)                   AS by_reaction,
  COALESCE(SUM(self_served AND resolution = 'task_completed'), 0)             AS by_task_completed,
  COALESCE(SUM(self_served AND resolution = 'no_escalation'), 0)              AS by_no_escalation,
  COALESCE(SUM(escalated_to_lead = 1), 0)                                     AS escalated,
  COUNT(*) - COUNT(escalated_to_lead)                                         AS pending
FROM scoped
GROUP BY scope, ord
ORDER BY ord;
