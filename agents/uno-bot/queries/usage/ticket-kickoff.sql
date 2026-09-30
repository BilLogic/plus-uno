-- Ticket kickoff (supporting): whether "can you file that?" stops bouncing.
--
-- Definition: a ticket is a card a person's turn staged — a `staged` row in
-- proposal_events with via = 'turn'. Left out:
--   - re-staged cards (via 'restage'): the same ticket as the ask's card they
--     re-stage, whose turn they borrow — counting them would count it twice;
--   - worker cards (via 'worker'): nobody asked for them;
--   - cards a revision replaced (a `superseded` row via 'revision'): the
--     revision is its own staged card, and carries the ticket on.
-- For each ticket: the time from the thread's first message
-- (thread_started_at) to the card being staged, and to its ✅ — the card's
-- own `confirmed` row, or its re-stage's — and whether the ✅ came from
-- someone other than the requester (confirmed_by_other; `other_share` is over
-- the ✅s that say either way). Medians are nearest-rank, as elsewhere:
-- (50 * n + 99) / 100.
--
-- By requester role: one row for all tickets, then one per role. The role
-- comes from the checked-in role map (src/usage/roles.ts); a person not on it
-- reads `unknown`, and while the map is empty every ticket does.
--
-- Window: staging time (proposal_events.at of the staged row), UTC, the @from
-- date inclusive to the @to date exclusive. Set both with
-- scripts/metric-query.mjs --from/--to.
-- Excludes: test traffic (test_traffic = 0 only).
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  tickets AS (
    SELECT s.proposal_id, s.at AS staged_at, s.thread_started_at,
      COALESCE(s.requester_role, 'unknown') AS requester_role
    FROM proposal_events s
    CROSS JOIN win
    WHERE s.event = 'staged'
      AND s.via = 'turn'
      AND s.test_traffic = 0
      AND s.at >= win.from_ms AND s.at < win.to_ms
      AND NOT EXISTS (
        SELECT 1 FROM proposal_events r
        WHERE r.proposal_id = s.proposal_id AND r.event = 'superseded' AND r.via = 'revision'
      )
  ),
  -- A ticket's cards: itself, and every re-stage of it.
  cards AS (
    SELECT proposal_id AS ticket, proposal_id FROM tickets
    UNION ALL
    SELECT r.origin_proposal_id, r.proposal_id
    FROM proposal_events r
    JOIN tickets t ON t.proposal_id = r.origin_proposal_id
    WHERE r.event = 'staged' AND r.via = 'restage'
  ),
  confirms AS (
    SELECT c.ticket, MIN(e.at) AS confirmed_at, MAX(e.confirmed_by_other) AS by_other
    FROM cards c
    JOIN proposal_events e ON e.proposal_id = c.proposal_id AND e.event = 'confirmed'
    GROUP BY c.ticket
  ),
  measured AS (
    SELECT t.requester_role,
      t.staged_at - t.thread_started_at    AS to_staging_ms,
      k.confirmed_at - t.thread_started_at AS to_confirm_ms,
      k.confirmed_at IS NOT NULL           AS confirmed,
      k.by_other
    FROM tickets t
    LEFT JOIN confirms k ON k.ticket = t.proposal_id
  ),
  scoped AS (
    SELECT 'all' AS requester_role, to_staging_ms, to_confirm_ms, confirmed, by_other FROM measured
    UNION ALL
    SELECT requester_role, to_staging_ms, to_confirm_ms, confirmed, by_other FROM measured
  ),
  ranked AS (
    SELECT *,
      ROW_NUMBER() OVER (PARTITION BY requester_role ORDER BY to_staging_ms IS NULL, to_staging_ms) AS staging_rn,
      COUNT(to_staging_ms) OVER (PARTITION BY requester_role)                                      AS staging_n,
      ROW_NUMBER() OVER (PARTITION BY requester_role ORDER BY to_confirm_ms IS NULL, to_confirm_ms) AS confirm_rn,
      COUNT(to_confirm_ms) OVER (PARTITION BY requester_role)                                      AS confirm_n
    FROM scoped
  )
SELECT
  requester_role,
  COUNT(*)                                                     AS tickets,
  SUM(confirmed)                                               AS confirmed,
  COALESCE(SUM(by_other), 0)                                   AS confirmed_by_other,
  ROUND(1.0 * SUM(by_other) / NULLIF(COUNT(by_other), 0), 4)   AS other_share,
  MAX(CASE WHEN staging_rn = (50 * staging_n + 99) / 100 THEN to_staging_ms END) AS median_to_staging_ms,
  MAX(CASE WHEN confirm_rn = (50 * confirm_n + 99) / 100 THEN to_confirm_ms END) AS median_to_confirm_ms
FROM ranked
GROUP BY requester_role
ORDER BY requester_role <> 'all', requester_role;
