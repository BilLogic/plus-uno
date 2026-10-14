-- Adoption (headline): how many people ask the bot, and how many keep asking.
--
-- Definition: over real asks in the window (in_thread = 0, the unit
-- load-on-lead.sql describes), the first row is the whole window: `askers`,
-- the distinct people who asked, and `regular_askers`, those who asked in 3
-- or more distinct weeks. The rows after it are one per week, Monday to
-- Sunday by UTC date, with the distinct askers that week; their
-- `regular_askers` is null. A week nobody asked in has no row.
--
-- The lead is left out of every count: the lead's own use is not adoption by
-- the team. The id is LEAD_USER_ID in agents/uno-bot/wrangler.toml, written
-- once below as `lead`.
--
-- An ask made by mentioning the bot inside someone else's thread is a reply
-- and is not counted, so a person who only ever does that is missed (leans
-- low).
--
-- Window: ask time (turns.asked_at), UTC, the @from date inclusive to the @to
-- date exclusive. Set both with scripts/metric-query.mjs --from/--to. The
-- default runs 2026-09-01 to 2027-01-01, the measurement window; the usage
-- record begins on 2026-09-29, so nothing before that date is in it. A week
-- the window cuts is counted for the days inside it.
-- Excludes: test traffic (test_traffic = 0 only), and the lead.
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  lead(user_id) AS (VALUES ('U03FYQJRQHX')),  -- LEAD_USER_ID, wrangler.toml
  asks AS (
    SELECT t.requester_id,
      date(t.asked_at / 1000, 'unixepoch', '-6 days', 'weekday 1') AS week_of
    FROM turns t, win
    WHERE t.test_traffic = 0
      AND t.in_thread = 0
      AND t.asked_at >= win.from_ms AND t.asked_at < win.to_ms
      AND t.requester_id NOT IN (SELECT user_id FROM lead)
  ),
  weeks_per_asker AS (
    SELECT requester_id, COUNT(DISTINCT week_of) AS weeks FROM asks GROUP BY requester_id
  )
SELECT
  'window'                                             AS period,
  (SELECT COUNT(*) FROM weeks_per_asker)               AS askers,
  (SELECT COUNT(*) FROM weeks_per_asker WHERE weeks >= 3) AS regular_askers
UNION ALL
SELECT * FROM (
  SELECT week_of, COUNT(DISTINCT requester_id), NULL
  FROM asks
  GROUP BY week_of
  ORDER BY week_of
);
