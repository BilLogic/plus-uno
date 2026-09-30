-- Return rate (supporting): whether people come back.
--
-- Definition: one row per week (Monday to Sunday, UTC) with real asks in the
-- window:
--   - askers: distinct people who made an ask that week;
--   - returning_askers: of those, people with a real ask in any earlier week
--     on record, inside the window or before it;
--   - asks, and asks_per_asker (asks / askers);
--   - heavy_users: people with 5 or more asks that week;
--   - dm_asks / channel_asks / unknown_asks: asks made in a DM or group DM
--     with the bot (the Assistant surface, or conversation_type im or mpim),
--     in a channel (conversation_type channel or group), and asks whose event
--     did not say (conversation_type null on a channel turn). The three add
--     up to asks;
--   - turns: every real turn that week, follow-ups included, for reference.
--
-- Asks, not turns. A turn is one row in `turns`: every message the bot
-- answered, follow-ups included. An ask is a turn whose own message opened a
-- thread (in_thread = 0): the first human turn of its thread, the unit the
-- inbox count compares with. `turns` keeps no thread root, so this is as close
-- as the columns allow: an ask made by mentioning the bot inside someone
-- else's thread is a reply and is missed (leans low), and an ask restated in a
-- new top-level message counts twice (leans high). Someone whose only turns
-- that week were replies is not an asker that week.
--
-- Window: ask time (turns.asked_at), UTC, the @from date inclusive to the @to
-- date exclusive. Set both with scripts/metric-query.mjs --from/--to. A window
-- that does not start on a Monday makes its first week partial.
-- Excludes: test traffic (test_traffic = 0 only), in the week's asks and in
-- the earlier asks that make someone returning.
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  real_turns AS (
    SELECT
      requester_id,
      in_thread,
      date(asked_at / 1000, 'unixepoch', '-6 days', 'weekday 1') AS week_of,
      CASE
        WHEN surface = 'assistant' OR conversation_type IN ('im', 'mpim') THEN 'dm'
        WHEN conversation_type IN ('channel', 'group') THEN 'channel'
        ELSE 'unknown'
      END AS place
    FROM turns
    CROSS JOIN win
    WHERE test_traffic = 0
      AND asked_at >= win.from_ms AND asked_at < win.to_ms
  ),
  asks AS (SELECT * FROM real_turns WHERE in_thread = 0),
  per_person AS (
    SELECT
      week_of,
      requester_id,
      COUNT(*) AS asks,
      EXISTS (
        SELECT 1 FROM turns p
        WHERE p.requester_id = asks.requester_id
          AND p.test_traffic = 0
          AND p.in_thread = 0
          AND p.asked_at < CAST(strftime('%s', asks.week_of) AS INTEGER) * 1000
      ) AS is_returning
    FROM asks
    GROUP BY week_of, requester_id
  ),
  per_week AS (
    SELECT week_of,
      SUM(place = 'dm')      AS dm_asks,
      SUM(place = 'channel') AS channel_asks,
      SUM(place = 'unknown') AS unknown_asks
    FROM asks
    GROUP BY week_of
  ),
  turn_counts AS (
    SELECT week_of, COUNT(*) AS turns FROM real_turns GROUP BY week_of
  )
SELECT
  p.week_of,
  COUNT(*)                                AS askers,
  SUM(p.is_returning)                     AS returning_askers,
  SUM(p.asks)                             AS asks,
  ROUND(1.0 * SUM(p.asks) / COUNT(*), 2)  AS asks_per_asker,
  SUM(p.asks >= 5)                        AS heavy_users,
  w.dm_asks,
  w.channel_asks,
  w.unknown_asks,
  c.turns
FROM per_person p
JOIN per_week w ON w.week_of = p.week_of
JOIN turn_counts c ON c.week_of = p.week_of
GROUP BY p.week_of
ORDER BY p.week_of;
