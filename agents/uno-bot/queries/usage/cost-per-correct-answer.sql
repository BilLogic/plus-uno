-- Cost per correct answer (supporting), plus the monthly total.
--
-- Definition: the estimated model spend of real turns in the window
-- (turns.cost_usd, from the checked-in price table) divided by the correct
-- answers it bought, estimated as the window's answered asks times the
-- graded accuracy (correct / graded, as answer-accuracy.sql). Only a sample
-- is graded, so the divisor is an estimate and the grading's size is printed
-- beside it. Turns on an unpriced model (cost_usd null) add nothing to the
-- spend and are counted in `unpriced_turns`, so the spend is a floor while any
-- are. Then one row per calendar month (UTC) in the window: that month's spend
-- and answered asks.
--
-- Turn spend only: the end-of-day classifier's, the sweep's and reminders'
-- model calls are not on the turns table and are not in this total.
--
-- Window: ask time (turns.asked_at), UTC, the @from date inclusive to the @to
-- date exclusive. Set both with scripts/metric-query.mjs --from/--to.
-- Reads: the graded answers (queries/usage/graded-answers.csv), rendered in by
-- scripts/metric-query.mjs; run unrendered, it fails on the missing table.
-- Excludes: test traffic (test_traffic = 0 only).
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  -- @input graded_answers
  real_turns AS (
    SELECT turn_id, cost_usd, first_answer_at IS NOT NULL AS answered,
      strftime('%Y-%m', asked_at / 1000, 'unixepoch') AS month
    FROM turns
    CROSS JOIN win
    WHERE test_traffic = 0
      AND asked_at >= win.from_ms AND asked_at < win.to_ms
  ),
  grading AS (
    SELECT COUNT(*) AS graded, COALESCE(SUM(g.grade = 'correct'), 0) AS correct
    FROM graded_answers g
    JOIN real_turns r ON r.turn_id = g.turn_id
  ),
  totals AS (
    SELECT 'window' AS period, 0 AS ord,
      ROUND(TOTAL(cost_usd), 4) AS spend_usd,
      COALESCE(SUM(cost_usd IS NULL), 0) AS unpriced_turns,
      COALESCE(SUM(answered), 0) AS answered
    FROM real_turns
    UNION ALL
    SELECT month, 1, ROUND(TOTAL(cost_usd), 4), SUM(cost_usd IS NULL), SUM(answered)
    FROM real_turns
    GROUP BY month
  )
SELECT
  t.period,
  t.spend_usd,
  t.unpriced_turns,
  t.answered,
  CASE WHEN t.ord = 0 THEN g.graded END  AS graded,
  CASE WHEN t.ord = 0 THEN g.correct END AS correct,
  CASE WHEN t.ord = 0 THEN
    ROUND(t.spend_usd / NULLIF(t.answered * 1.0 * g.correct / NULLIF(g.graded, 0), 0), 4)
  END                                    AS cost_per_correct_usd
FROM totals t
CROSS JOIN grading g
ORDER BY t.ord, t.period;
