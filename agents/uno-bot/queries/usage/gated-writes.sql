-- Nothing changes without a ✅ (objective): the gate, counted.
--
-- Definition: over proposal cards staged in the window (a `staged` row in
-- proposal_events). A card is counted once: a re-staged card (via
-- 'restage') is its original again, and its events count as the original's.
--   - cards_staged, and what became of them: confirmed, cancelled,
--     expired_at_least, superseded (by a revision or a worker's newer card —
--     a re-stage's supersession is the same card moving, not an outcome);
--   - refused_stale_cards: cards whose confirmed batch refused a write because
--     the page had changed since it was read (ADR-029), and
--     refused_stale_sweep_items: sweep items refused the same way;
--   - gated_share: of the asks whose staged batch ran (resolution
--     `task_completed` on the staging turn), the share whose card has a ✅ on
--     record. A batch that ran with no ✅ recorded is a lost `confirmed`
--     write, or a gate gap;
--   - wrong_writes: of those batches, how many the graded answers grade
--     `wrong`, out of graded_writes graded at all. No column marks a write
--     wrong after the fact, so the grading is the only source.
--
-- GATED_SHARE IS CLOSE TO 1 BY CONSTRUCTION, AND IS NOT EVIDENCE THE GATE IS
-- ENFORCED. A gated tool can only run as a card's batch — the loop dispatches
-- ungated tools alone, and `tools_called` never names a gated one — and
-- `task_completed` is written only when a ✅-approved batch ran. So the share
-- measures whether the ✅ was recorded, not whether a write could slip past
-- it. Evidence of enforcement would be ungated write attempts refused, or
-- writes made with no card; no column records either, so this database
-- holds none. Cite the gate from its tests, and this query for the outcomes.
--
-- The expired count is a LOWER BOUND: expiry is computed from D1 alone, and a
-- card whose staged row was never written is never marked expired.
--
-- Joining turns to their staged rows reads via != 'restage' — a re-stage
-- borrows its original's turn id, and without the filter that turn would be
-- counted once per re-stage.
--
-- Window: staging time (proposal_events.at) for cards; ask time for the
-- batches that ran; the sweep's run date for sweep items. UTC, the @from date
-- inclusive to the @to date exclusive. Set both with scripts/metric-query.mjs
-- --from/--to.
-- Reads: the graded answers (queries/usage/graded-answers.csv), rendered in by
-- scripts/metric-query.mjs; run unrendered, it fails on the missing table.
-- Excludes: test traffic (test_traffic = 0 only, on cards and on turns).
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  -- @input graded_answers
  -- Every card and its re-stages, keyed by the original.
  lineage AS (
    SELECT proposal_id AS card, proposal_id
    FROM proposal_events WHERE event = 'staged' AND via != 'restage'
    UNION ALL
    SELECT origin_proposal_id, proposal_id
    FROM proposal_events WHERE event = 'staged' AND via = 'restage' AND origin_proposal_id IS NOT NULL
  ),
  outcomes AS (
    SELECT l.card,
      MAX(e.event = 'confirmed')                          AS confirmed,
      MAX(e.event = 'cancelled')                          AS cancelled,
      MAX(e.event = 'expired')                            AS expired,
      MAX(e.event = 'superseded' AND e.via != 'restage')  AS superseded,
      MAX(e.event = 'refused_stale')                      AS refused_stale
    FROM lineage l
    JOIN proposal_events e ON e.proposal_id = l.proposal_id
    GROUP BY l.card
  ),
  cards AS (
    SELECT o.*
    FROM proposal_events s
    CROSS JOIN win
    JOIN outcomes o ON o.card = s.proposal_id
    WHERE s.event = 'staged'
      AND s.via != 'restage'
      AND s.test_traffic = 0
      AND s.at >= win.from_ms AND s.at < win.to_ms
  ),
  ran AS (
    SELECT t.turn_id, COALESCE(o.confirmed, 0) AS confirmed, g.grade
    FROM turns t
    CROSS JOIN win
    JOIN proposal_events s ON s.turn_id = t.turn_id AND s.event = 'staged' AND s.via != 'restage'
    LEFT JOIN outcomes o ON o.card = s.proposal_id
    LEFT JOIN graded_answers g ON g.turn_id = t.turn_id
    WHERE t.test_traffic = 0
      AND t.resolution = 'task_completed'
      AND t.asked_at >= win.from_ms AND t.asked_at < win.to_ms
  )
SELECT
  (SELECT COUNT(*) FROM cards)                               AS cards_staged,
  (SELECT COALESCE(SUM(confirmed), 0) FROM cards)            AS confirmed,
  (SELECT COALESCE(SUM(cancelled), 0) FROM cards)            AS cancelled,
  (SELECT COALESCE(SUM(expired), 0) FROM cards)              AS expired_at_least,
  (SELECT COALESCE(SUM(superseded), 0) FROM cards)           AS superseded,
  (SELECT COALESCE(SUM(refused_stale), 0) FROM cards)        AS refused_stale_cards,
  (SELECT COUNT(*) FROM sweep_items, win
   WHERE status = 'refused_stale'
     AND run_date >= date(win.from_ms / 1000, 'unixepoch')
     AND run_date <  date(win.to_ms / 1000, 'unixepoch'))    AS refused_stale_sweep_items,
  (SELECT COUNT(*) FROM ran)                                 AS batches_ran,
  (SELECT COALESCE(SUM(confirmed), 0) FROM ran)              AS batches_ran_with_confirm,
  (SELECT ROUND(1.0 * SUM(confirmed) / NULLIF(COUNT(*), 0), 4) FROM ran) AS gated_share,
  (SELECT COUNT(grade) FROM ran)                             AS graded_writes,
  (SELECT COALESCE(SUM(grade = 'wrong'), 0) FROM ran)        AS wrong_writes;
