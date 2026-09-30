-- Responsiveness (headline): how long an asker waits for a correct answer.
--
-- Definition: over real asks in the window that got an answer, the wait from
-- the ask to the bot's first answer (turns.latency_ms) as a median, a p90 and
-- the share answered the next day or later — read as a wait of 24 h or more,
-- so no time zone decides it. "Correct" is a row in the graded answers with
-- grade `correct`. Ungraded answers are reported as their own cohort and are
-- never counted as correct; answers graded partial or wrong are in neither.
--
-- Percentiles are nearest-rank: the value at rank ceil(p * n) in ascending
-- order, computed as (p * n + 99) / 100 in integers. The baseline query
-- (responsiveness-baseline.sql) uses the same, so before and after compare.
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
  answered AS (
    SELECT t.latency_ms AS wait_ms, g.grade
    FROM turns t
    CROSS JOIN win
    LEFT JOIN graded_answers g ON g.turn_id = t.turn_id
    WHERE t.test_traffic = 0
      AND t.first_answer_at IS NOT NULL
      AND t.asked_at >= win.from_ms AND t.asked_at < win.to_ms
  ),
  cohorts(cohort) AS (VALUES ('correct'), ('ungraded')),
  waits AS (
    SELECT 'correct' AS cohort, wait_ms FROM answered WHERE grade = 'correct'
    UNION ALL
    SELECT 'ungraded', wait_ms FROM answered WHERE grade IS NULL
  ),
  ranked AS (
    SELECT cohort, wait_ms,
      ROW_NUMBER() OVER (PARTITION BY cohort ORDER BY wait_ms) AS rn,
      COUNT(*) OVER (PARTITION BY cohort) AS n
    FROM waits
  )
SELECT
  c.cohort,
  COUNT(r.wait_ms)                                               AS answers,
  MAX(CASE WHEN r.rn = (50 * r.n + 99) / 100 THEN r.wait_ms END) AS median_ms,
  MAX(CASE WHEN r.rn = (90 * r.n + 99) / 100 THEN r.wait_ms END) AS p90_ms,
  ROUND(AVG(r.wait_ms >= 86400000), 4)                           AS next_day_share
FROM cohorts c
LEFT JOIN ranked r ON r.cohort = c.cohort
GROUP BY c.cohort
ORDER BY c.cohort;
