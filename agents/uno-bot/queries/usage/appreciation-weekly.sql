-- Appreciation, weekly (supporting): thanks nobody asked for, per week.
--
-- Definition: one row per week, Monday to Sunday by UTC date, with
--   - thanks_reactions: distinct (person, message) pairs in `appreciation` —
--     a person's 🙏 and 🐐 on one answer are one thanks;
--   - thanks_replies: turns whose asker's message thanked the bot
--     (turns.thanks = 1);
--   - total: the two added.
-- A week with neither has no row.
--
-- Test traffic is NOT excluded from thanks_replies, on purpose: a message
-- that only says thanks is a greeting by the test-traffic rule, so its turn
-- has test_traffic = 1, and counting only test_traffic = 0 would lose almost
-- every thanks. The flag is set on a person's turn only — never on the debug
-- route or in the sandbox — and eval turns (turn_id with '@') are excluded
-- here as well. A reaction is recorded only on the bot's own message, from
-- someone other than the bot, and never for ✅, 👍 or 🙌.
--
-- Window: reaction time (appreciation.at) and ask time (turns.asked_at), UTC,
-- the @from date inclusive to the @to date exclusive. Set both with
-- scripts/metric-query.mjs --from/--to. The default runs 2026-09-01 to
-- 2027-01-01, the measurement window; the usage record begins on 2026-09-29,
-- and keeps thanks from the deploy of migration 0013 on.
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  reactions AS (
    SELECT date(a.at / 1000, 'unixepoch', '-6 days', 'weekday 1') AS week_of,
      COUNT(DISTINCT a.user_id || ' ' || a.channel || ' ' || a.item_ts) AS n
    FROM appreciation a, win
    WHERE a.at >= win.from_ms AND a.at < win.to_ms
    GROUP BY week_of
  ),
  replies AS (
    SELECT date(t.asked_at / 1000, 'unixepoch', '-6 days', 'weekday 1') AS week_of, COUNT(*) AS n
    FROM turns t, win
    WHERE t.thanks = 1
      AND instr(t.turn_id, '@') = 0
      AND t.asked_at >= win.from_ms AND t.asked_at < win.to_ms
    GROUP BY week_of
  ),
  weeks AS (SELECT week_of FROM reactions UNION SELECT week_of FROM replies)
SELECT
  w.week_of,
  COALESCE(r.n, 0)               AS thanks_reactions,
  COALESCE(p.n, 0)               AS thanks_replies,
  COALESCE(r.n, 0) + COALESCE(p.n, 0) AS total
FROM weeks w
LEFT JOIN reactions r ON r.week_of = w.week_of
LEFT JOIN replies p ON p.week_of = w.week_of
ORDER BY w.week_of;
