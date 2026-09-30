-- Self-maintenance (objective): what each proactive job found, proposed and
-- got accepted, and how long a fix took.
--
-- Definition: one row per job.
--   - Capture (was it written down?): sweep_items from end-of-day runs in the
--     window. found = distinct findings; proposed = those carded (posted_at
--     set); accepted = those confirmed; time to fix = resolved_at - drift_at
--     of a confirmed item, the thread's first evidence to the ✅.
--   - Reconcile (do the sources agree?): Reconcile writes no sweep items. Its
--     cards are the worker's (via 'worker') with no Notion operation — the DS
--     precedence check and the library watcher file intakes, while Capture's
--     worker cards edit Notion. proposed = those cards; accepted = those with
--     a ✅ (a re-stage's included); time to fix = staged to ✅. found is null:
--     nothing records what Reconcile looked at and did not card.
--   - Follow through (did it get done?): commitments from end-of-day runs in
--     the window. found = promises read; proposed = those nudged at least
--     once; accepted = kept (`done`, or `auto_done` when the evidence check
--     found it done before any nudge); time to fix = promised_at to
--     resolved_at of a kept one. The reminder outcomes are counted beside it:
--     done · auto_done · dropped (🙅) · not_promise (🤔) · lapsed · live (open,
--     nudged or snoozed).
-- Medians are nearest-rank: (50 * n + 99) / 100.
--
-- Window: the end-of-day run's date (run_date, UTC) for sweep items and
-- commitments; staging time for Reconcile's cards. The @from date inclusive
-- to the @to date exclusive. Set both with scripts/metric-query.mjs
-- --from/--to.
-- Excludes: test traffic on Reconcile's cards (test_traffic = 0). Sweep items
-- and commitments carry no test flag: only the end-of-day run writes them,
-- from the swept channels, and its dry run writes nothing.
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  days(from_day, to_day) AS (
    SELECT date(from_ms / 1000, 'unixepoch'), date(to_ms / 1000, 'unixepoch') FROM win
  ),
  items AS (
    SELECT s.* FROM sweep_items s, days
    WHERE s.run_date >= days.from_day AND s.run_date < days.to_day
  ),
  promises AS (
    SELECT c.* FROM commitments c, days
    WHERE c.run_date >= days.from_day AND c.run_date < days.to_day
  ),
  reconcile AS (
    SELECT s.proposal_id, s.at AS staged_at,
      (SELECT MIN(e.at) FROM proposal_events e
       WHERE e.event = 'confirmed'
         AND (e.proposal_id = s.proposal_id
              OR e.proposal_id IN (SELECT r.proposal_id FROM proposal_events r
                                   WHERE r.event = 'staged' AND r.via = 'restage'
                                     AND r.origin_proposal_id = s.proposal_id))) AS confirmed_at
    FROM proposal_events s
    CROSS JOIN win
    WHERE s.event = 'staged'
      AND s.via = 'worker'
      AND s.test_traffic = 0
      AND s.at >= win.from_ms AND s.at < win.to_ms
      AND NOT EXISTS (SELECT 1 FROM json_each(s.tools) WHERE value LIKE 'notion\_%' ESCAPE '\')
  ),
  fixes(job, fix_ms) AS (
    SELECT 'Capture', resolved_at - drift_at FROM items WHERE status = 'confirmed' AND resolved_at IS NOT NULL
    UNION ALL
    SELECT 'Reconcile', confirmed_at - staged_at FROM reconcile WHERE confirmed_at IS NOT NULL
    UNION ALL
    SELECT 'Follow through', resolved_at - promised_at FROM promises
    WHERE state IN ('done', 'auto_done') AND resolved_at IS NOT NULL
  ),
  medians AS (
    SELECT job, MAX(CASE WHEN rn = (50 * n + 99) / 100 THEN fix_ms END) AS median_fix_ms
    FROM (
      SELECT job, fix_ms,
        ROW_NUMBER() OVER (PARTITION BY job ORDER BY fix_ms) AS rn,
        COUNT(*) OVER (PARTITION BY job) AS n
      FROM fixes
    )
    GROUP BY job
  ),
  counts(ord, job, found, proposed, accepted, done, auto_done, dropped, not_promise, lapsed, live) AS (
    SELECT 1, 'Capture',
      COUNT(DISTINCT finding_id),
      COUNT(DISTINCT CASE WHEN posted_at IS NOT NULL THEN finding_id END),
      COUNT(DISTINCT CASE WHEN status = 'confirmed' THEN finding_id END),
      NULL, NULL, NULL, NULL, NULL, NULL
    FROM items
    UNION ALL
    SELECT 2, 'Reconcile', NULL, COUNT(*), COUNT(confirmed_at), NULL, NULL, NULL, NULL, NULL, NULL
    FROM reconcile
    UNION ALL
    SELECT 3, 'Follow through',
      COUNT(*),
      COALESCE(SUM(nudges > 0), 0),
      COALESCE(SUM(state IN ('done', 'auto_done')), 0),
      COALESCE(SUM(state = 'done'), 0),
      COALESCE(SUM(state = 'auto_done'), 0),
      COALESCE(SUM(state = 'dropped'), 0),
      COALESCE(SUM(state = 'not_promise'), 0),
      COALESCE(SUM(state = 'lapsed'), 0),
      COALESCE(SUM(state IN ('open', 'nudged', 'snoozed')), 0)
    FROM promises
  )
SELECT c.job, c.found, c.proposed, c.accepted, m.median_fix_ms,
  c.done, c.auto_done, c.dropped, c.not_promise, c.lapsed, c.live
FROM counts c
LEFT JOIN medians m ON m.job = c.job
ORDER BY c.ord;
