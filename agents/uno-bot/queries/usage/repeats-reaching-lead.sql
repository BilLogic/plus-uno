-- Repeats reaching the lead (supporting): escalated asks the bot had already
-- answered before.
--
-- Definition: of real asks in the window with escalated_to_lead = 1 and a
-- Sub-type, the share whose Sub-type matches an earlier real ask that got an
-- answer (first_answer_at set), at any time before it — in the window or not.
--
-- AN UPPER BOUND. The metric sheet matches Sub-type AND topic. The usage
-- record keeps no topic: the ask's text is nulled when it is classified
-- (ADR-030), and no column holds a topic in its place. Matching on Sub-type
-- alone counts every same-kind ask as a repeat, so this reads high until a
-- topic is recorded.
--
-- Window: ask time of the escalated ask (turns.asked_at), UTC, the @from date
-- inclusive to the @to date exclusive. Set both with scripts/metric-query.mjs
-- --from/--to.
-- Excludes: test traffic (test_traffic = 0 only), in the escalated asks and
-- in the earlier asks they are matched against.
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  escalated AS (
    SELECT e.turn_id,
      EXISTS (
        SELECT 1 FROM turns p
        WHERE p.test_traffic = 0
          AND p.sub_type = e.sub_type
          AND p.first_answer_at IS NOT NULL
          AND p.asked_at < e.asked_at
      ) AS repeat
    FROM turns e
    CROSS JOIN win
    WHERE e.test_traffic = 0
      AND e.escalated_to_lead = 1
      AND e.sub_type IS NOT NULL
      AND e.asked_at >= win.from_ms AND e.asked_at < win.to_ms
  )
SELECT
  COUNT(*)                                              AS escalated_classified,
  COALESCE(SUM(repeat), 0)                              AS repeats,
  ROUND(1.0 * SUM(repeat) / NULLIF(COUNT(*), 0), 4)     AS repeat_share
FROM escalated;
