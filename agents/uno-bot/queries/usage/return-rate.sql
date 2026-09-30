-- Return rate (supporting): whether people come back.
--
-- Definition: one row per week (Monday to Sunday, UTC) with real asks in the
-- window:
--   - askers: distinct people who asked that week;
--   - returning_askers: of those, people with a real ask in any earlier week
--     on record, inside the window or before it;
--   - asks, and asks_per_asker (asks / askers);
--   - heavy_users: people with 5 or more asks that week;
--   - dm_asks / channel_asks: asks made in a DM or group DM with the bot (the
--     Assistant surface, or conversation_type im or mpim) against the rest.
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
  asks AS (
    SELECT
      requester_id,
      date(asked_at / 1000, 'unixepoch', '-6 days', 'weekday 1') AS week_of,
      surface = 'assistant' OR conversation_type IN ('im', 'mpim') AS in_dm
    FROM turns
    CROSS JOIN win
    WHERE test_traffic = 0
      AND asked_at >= win.from_ms AND asked_at < win.to_ms
  ),
  per_person AS (
    SELECT
      week_of,
      requester_id,
      COUNT(*) AS asks,
      EXISTS (
        SELECT 1 FROM turns p
        WHERE p.requester_id = asks.requester_id
          AND p.test_traffic = 0
          AND p.asked_at < CAST(strftime('%s', asks.week_of) AS INTEGER) * 1000
      ) AS is_returning
    FROM asks
    GROUP BY week_of, requester_id
  ),
  per_week AS (
    SELECT week_of, SUM(in_dm) AS dm_asks, SUM(NOT in_dm) AS channel_asks
    FROM asks
    GROUP BY week_of
  )
SELECT
  p.week_of,
  COUNT(*)                                AS askers,
  SUM(p.is_returning)                     AS returning_askers,
  SUM(p.asks)                             AS asks,
  ROUND(1.0 * SUM(p.asks) / COUNT(*), 2)  AS asks_per_asker,
  SUM(p.asks >= 5)                        AS heavy_users,
  w.dm_asks,
  w.channel_asks
FROM per_person p
JOIN per_week w ON w.week_of = p.week_of
GROUP BY p.week_of
ORDER BY p.week_of;
