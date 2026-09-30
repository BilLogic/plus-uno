-- Cheap path (objective): greetings and thanks cost next to nothing.
--
-- Definition: of the greetings and thanks in the window — turns where the
-- model only reacted and nothing was asked — the share run at the `chill`
-- tier with no context read (no tool but slack_react), and what they cost:
-- all of them, and the cheap ones.
--
-- THE ONE QUERY THAT READS TEST TRAFFIC, because the usage record files these
-- turns there: "a greeting with no ask" is one of the three test-traffic
-- rules (src/usage/record.ts), so a greeting is a row with test_traffic = 1
-- and disposition `reacted`. The other two kinds of test traffic are left out
-- as far as the columns allow: eval conversations by their synthetic turn id
-- (it carries "@<start ms>"), and anything that is not a bare reaction by the
-- disposition. A reaction-only turn in the sandbox channel cannot be told
-- apart from a greeting — TEST_CHANNEL_IDS is config, not a column — so it
-- counts here.
--
-- Window: ask time (turns.asked_at), UTC, the @from date inclusive to the @to
-- date exclusive. Set both with scripts/metric-query.mjs --from/--to.
-- Excludes: every real ask (test_traffic = 0), and eval turns.
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  greetings AS (
    SELECT cost_usd,
      tier = 'chill'
        AND NOT EXISTS (SELECT 1 FROM json_each(tools_called) WHERE value <> 'slack_react') AS cheap
    FROM turns
    CROSS JOIN win
    WHERE test_traffic = 1
      AND disposition = 'reacted'
      AND instr(turn_id, '@') = 0
      AND asked_at >= win.from_ms AND asked_at < win.to_ms
  )
SELECT
  COUNT(*)                                                   AS greetings,
  COALESCE(SUM(cheap), 0)                                    AS cheap,
  ROUND(1.0 * SUM(cheap) / NULLIF(COUNT(*), 0), 4)           AS cheap_share,
  ROUND(TOTAL(cost_usd), 4)                                  AS greetings_cost_usd,
  ROUND(TOTAL(CASE WHEN cheap THEN cost_usd END), 4)         AS cheap_cost_usd
FROM greetings;
