-- Answer accuracy (supporting): the share of graded answers that were correct.
--
-- Definition: of the graded answers whose turn is a real ask in the window,
-- the share graded `correct`, with the partial and wrong counts beside it.
-- `unmatched_grades` counts graded rows that name no turn in the database at
-- all — a mistyped turn id — so a grading that lost rows says so instead of
-- quietly shrinking.
--
-- Window: ask time of the graded turn (turns.asked_at), UTC, the @from date
-- inclusive to the @to date exclusive. Set both with scripts/metric-query.mjs
-- --from/--to.
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
  graded AS (
    SELECT g.grade
    FROM graded_answers g
    JOIN turns t ON t.turn_id = g.turn_id
    CROSS JOIN win
    WHERE t.test_traffic = 0
      AND t.asked_at >= win.from_ms AND t.asked_at < win.to_ms
  )
SELECT
  COUNT(*)                                                   AS graded,
  COALESCE(SUM(grade = 'correct'), 0)                        AS correct,
  COALESCE(SUM(grade = 'partial'), 0)                        AS partial,
  COALESCE(SUM(grade = 'wrong'), 0)                          AS wrong,
  ROUND(1.0 * SUM(grade = 'correct') / NULLIF(COUNT(*), 0), 4) AS accuracy,
  (SELECT COUNT(*) FROM graded_answers g
   WHERE NOT EXISTS (SELECT 1 FROM turns t WHERE t.turn_id = g.turn_id)) AS unmatched_grades
FROM graded;
