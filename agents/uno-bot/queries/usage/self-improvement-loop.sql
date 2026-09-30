-- Self-improvement loop (objective): tickets the bot filed on itself, and
-- whether they closed.
--
-- Definition: the distinct issue URLs on BilLogic/plus-uno the bot filed
-- about itself in the window — from a turn (turns.self_filed_ticket_url) or
-- from a card's ✅ (proposal_events.ticket_url on the staged row) — each
-- dated to the earlier of the two. Then, from GitHub: the share closed, and
-- the median time from filing to closing (nearest-rank, (50 * n + 99) / 100).
-- A ticket's filing time is its turn's ask time, or its card's staging time;
-- the issue itself is created a little later, at the ✅.
--
-- Closure is not in uno-bot-usage. It is joined at query time from GitHub's
-- own export (`url`, `closedAt`), rendered in with scripts/metric-query.mjs
-- --closures. `not_in_export` counts filed tickets the export did not cover —
-- a short --limit, say — which are then neither open nor closed here.
--
-- Window: ask time or staging time, UTC, the @from date inclusive to the @to
-- date exclusive. Set both with scripts/metric-query.mjs --from/--to.
-- Reads: GitHub's closures, rendered in; run unrendered, it fails on the
-- missing table.
-- Excludes: test traffic (test_traffic = 0 only, on turns and on cards).
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  win(from_ms, to_ms) AS (SELECT
    CAST(strftime('%s', '2026-09-01') AS INTEGER) * 1000,  -- @from
    CAST(strftime('%s', '2027-01-01') AS INTEGER) * 1000   -- @to
  ),
  -- @input ticket_closures
  filed(url, filed_at) AS (
    SELECT self_filed_ticket_url, asked_at FROM turns, win
    WHERE test_traffic = 0
      AND self_filed_ticket_url IS NOT NULL
      AND asked_at >= win.from_ms AND asked_at < win.to_ms
    UNION ALL
    SELECT ticket_url, at FROM proposal_events, win
    WHERE event = 'staged'
      AND test_traffic = 0
      AND ticket_url IS NOT NULL
      AND at >= win.from_ms AND at < win.to_ms
  ),
  tickets AS (
    SELECT f.url, MIN(f.filed_at) AS filed_at,
      MAX(c.url IS NOT NULL) AS in_export,
      MAX(c.closed_at) AS closed_at
    FROM filed f
    LEFT JOIN ticket_closures c ON c.url = f.url
    GROUP BY f.url
  ),
  closes AS (
    SELECT closed_at - filed_at AS close_ms,
      ROW_NUMBER() OVER (ORDER BY closed_at - filed_at) AS rn,
      COUNT(*) OVER () AS n
    FROM tickets WHERE closed_at IS NOT NULL
  )
SELECT
  COUNT(*)                                                       AS tickets_filed,
  COUNT(closed_at)                                               AS closed,
  ROUND(1.0 * COUNT(closed_at) / NULLIF(COUNT(*), 0), 4)         AS closed_share,
  (SELECT close_ms FROM closes WHERE rn = (50 * n + 99) / 100)   AS median_close_ms,
  COALESCE(SUM(NOT in_export), 0)                                AS not_in_export
FROM tickets;
