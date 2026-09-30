-- Self-serve rate (supporting): the share of asks the bot settled without the
-- lead.
--
-- Definition: of real asks in the window, the share resolved and not
-- escalated — escalated_to_lead = 0 and a resolution of `reaction` (✅ or 👍
-- by the asker on an answer), `task_completed` (a ✅-approved batch the ask
-- staged ran) or `no_escalation` (the end-of-day pass, 24 h on). `none` (the
-- pass could not tell) is not self-served. One row for all, then one per
-- pain_category (1 find · 2 catch-up · 3 conflicting sources · 4 who owns /
-- access · 5 new cohort · 6 judgment · 7 ticket kickoff), then
-- `sweep-revision`, then the unlabelled. The self-served count is split by
-- resolution signal.
--
-- `rate` is over every row; `settled_rate` only over rows the pass has
-- settled (escalated_to_lead known). `pending` is rows it has not: the last
-- day of a window always has some, and they lower `rate` until it runs.
--
-- Asks and turns, one set of rows each (`unit`). A turn is one row in
-- `turns`: every message the bot answered, follow-ups included. An ask is a
-- turn whose own message opened a thread (in_thread = 0): the first human turn
-- of its thread, the unit the inbox count compares with. `turns` keeps no
-- thread root, so this is as close as the columns allow: an ask made by
-- mentioning the bot inside someone else's thread is a reply and is missed,
-- and an ask restated in a new top-level message counts twice. Cite the ask
-- rows.
--
-- Sweep revisions are not ticket kickoff. A reply that revises a sweep card
-- ("drop 2") stages through a turn and so records pain_category 7, but nobody
-- asked for a ticket: its card's staged row names a worker card as its origin.
-- Those turns are reported as `sweep-revision`, never under 7. They are
-- replies in the sweep's thread, so the ask rows hold none.
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
    SELECT
      t.in_thread,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM proposal_events s
          JOIN proposal_events o ON o.proposal_id = s.origin_proposal_id
            AND o.event = 'staged' AND o.via = 'worker'
          WHERE s.proposal_id = t.proposal_id AND s.event = 'staged' AND s.via = 'turn'
        ) THEN 'sweep-revision'
        ELSE COALESCE(CAST(t.pain_category AS TEXT), 'unclassified')
      END AS pain,
      t.resolution,
      t.escalated_to_lead,
      t.escalated_to_lead = 0
        AND t.resolution IN ('reaction', 'task_completed', 'no_escalation') AS self_served
    FROM turns t
    CROSS JOIN win
    WHERE t.test_traffic = 0
      AND t.asked_at >= win.from_ms AND t.asked_at < win.to_ms
  ),
  units AS (
    SELECT 'ask' AS unit, 0 AS unit_ord, * FROM real_turns WHERE in_thread = 0
    UNION ALL
    SELECT 'turn', 1, * FROM real_turns
  ),
  scoped AS (
    SELECT unit, unit_ord, 'all' AS scope, 0 AS ord, resolution, escalated_to_lead, self_served FROM units
    UNION ALL
    SELECT unit, unit_ord, pain,
      CASE pain WHEN 'sweep-revision' THEN 8 WHEN 'unclassified' THEN 9 ELSE CAST(pain AS INTEGER) END,
      resolution, escalated_to_lead, self_served
    FROM units
  )
SELECT
  unit,
  scope,
  COUNT(*)                                                                    AS n,
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
GROUP BY unit_ord, unit, ord, scope
ORDER BY unit_ord, ord;
