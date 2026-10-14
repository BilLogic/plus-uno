-- Answer sample (grading input): the answers a grading sample is drawn from.
--
-- Definition: every real ask in the window (in_thread = 0, the unit
-- load-on-lead.sql describes) that the bot answered with an answer —
-- disposition `answered`, so not a card, a clarifying question or a failure.
-- One row per ask: its turn id, the channel and ask ts a Slack link is built
-- from, its surface, and needs_permission: 0 only for a conversation known
-- to be a public or private channel (conversation_type 'channel' or
-- 'group'), 1 for everything else — a DM or group DM, which a grader cannot
-- open, and a conversation of unknown type, which may be one: a group DM
-- reached by @mention arrives with no type and a C… id, the same as a
-- channel. The asker is asked first. No text.
--
-- This file lists; it does not sample. scripts/sample-answers.mjs reads its
-- output and picks a reproducible sample (`--seed <s> --n 50 --second 10`),
-- printed as the CSV the graded answers are filled in from
-- (queries/usage/graded-answers.csv).
--
-- Window: ask time (turns.asked_at), UTC, the @from date inclusive to the @to
-- date exclusive. Set both with scripts/metric-query.mjs --from/--to. The
-- default runs 2026-09-01 to 2027-01-01, the measurement window; the usage
-- record begins on 2026-09-29, so nothing before that date is in it.
-- Excludes: test traffic (test_traffic = 0 only).
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  )
SELECT
  t.turn_id,
  substr(t.turn_id, 1, instr(t.turn_id, ':') - 1)                     AS channel,
  t.ask_ts,
  t.surface,
  CASE WHEN t.surface = 'channel' AND t.conversation_type IN ('channel', 'group') THEN 0 ELSE 1 END AS needs_permission
FROM turns t, win
WHERE t.test_traffic = 0
  AND t.in_thread = 0
  AND t.disposition = 'answered'
  AND t.asked_at >= win.from_ms AND t.asked_at < win.to_ms
ORDER BY t.asked_at, t.turn_id;
