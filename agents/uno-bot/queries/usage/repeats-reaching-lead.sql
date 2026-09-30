-- Repeats reaching the lead (supporting): escalated asks the bot had already
-- answered before.
--
-- Definition: of real asks in the window with escalated_to_lead = 1 and a
-- Sub-type, the share whose Sub-type matches an earlier real ask of the same
-- unit that got an answer (first_answer_at set), at any time before it — in
-- the window or not.
--
-- Asks and turns, one row each. A turn is one row in `turns`: every message
-- the bot answered, follow-ups included. An ask is a turn whose own message
-- opened a thread (in_thread = 0): the first human turn of its thread, the
-- unit the inbox count compares with. `turns` keeps no thread root, so this is
-- as close as the columns allow: an ask made by mentioning the bot inside
-- someone else's thread is a reply and is missed (leans low), and an ask
-- restated in a new top-level message counts twice (leans high). Cite the ask
-- row.
--
-- Bounds.
--   - AN UPPER BOUND on repeats. The metric sheet matches Sub-type AND topic.
--     The usage record keeps no topic: the ask's text is nulled when it is
--     classified (ADR-030), and no column holds a topic in its place. Matching
--     on Sub-type alone counts every same-kind ask as a repeat.
--   - escalated_to_lead reads the lead's DMs by topic, and that same-topic
--     match is loose, so the escalated asks lean HIGH. Asks the end-of-day pass
--     has not settled, or whose DM half it could not read, have
--     escalated_to_lead null and are dropped, so they also lean LOW;
--     `lead_unknown` counts them.
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
  units(unit, ord, only_asks) AS (VALUES ('ask', 0, 1), ('turn', 1, 0)),
  scored AS (
    SELECT u.unit, u.ord, e.escalated_to_lead,
      e.escalated_to_lead = 1 AND e.sub_type IS NOT NULL AS counted,
      EXISTS (
        SELECT 1 FROM turns p
        WHERE p.test_traffic = 0
          AND (u.only_asks = 0 OR p.in_thread = 0)
          AND p.sub_type = e.sub_type
          AND p.first_answer_at IS NOT NULL
          AND p.asked_at < e.asked_at
      ) AS repeat
    FROM units u
    CROSS JOIN win
    JOIN turns e ON (u.only_asks = 0 OR e.in_thread = 0)
    WHERE e.test_traffic = 0
      AND e.asked_at >= win.from_ms AND e.asked_at < win.to_ms
  )
SELECT
  unit,
  COALESCE(SUM(counted), 0)                                          AS escalated_classified,
  COALESCE(SUM(counted AND repeat), 0)                               AS repeats,
  ROUND(1.0 * SUM(counted AND repeat) / NULLIF(SUM(counted), 0), 4)  AS repeat_share,
  COALESCE(SUM(escalated_to_lead IS NULL), 0)                        AS lead_unknown
FROM scored
GROUP BY unit, ord
ORDER BY ord;
