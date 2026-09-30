-- Responsiveness baseline: the human reply time, from the corpus export.
--
-- Definition: over the Coordination Request Corpus threads in the export, the
-- wait from the ask to the first human reply, as a median, a p90 and the share
-- answered the next day or later (a wait of 24 h or more) — the definitions
-- responsiveness.sql uses, so before and after share a method. Also the share
-- of replied threads the lead answered first. A thread with no reply counts
-- in `threads` and in no wait.
--
-- Percentiles are nearest-rank: the value at rank ceil(p * n), as
-- (p * n + 99) / 100 in integers — the same as responsiveness.sql. On the 299
-- sampled threads the corpus work measured median 29 min and p90 16.8 h, with
-- the lead first on 96%.
--
-- Window: none. The export is the corpus's own sample, not usage rows, so no
-- @from or @to applies and the whole export is read.
-- Reads: the corpus export (thread_id, asked_at, first_reply_at,
-- lead_replied_first), rendered in with scripts/metric-query.mjs --corpus. It
-- is not in uno-bot-usage and is never written there.
-- Excludes: nothing — the export holds no bot turns, so there is no test
-- traffic to leave out.
-- Metric sheet: Final — metrics, https://www.notion.so/3eab7cca498281c79119da63b2f2077f
-- Running and citing: agents/uno-bot/README.md § Metrics.

WITH
  -- @input corpus_threads
  replied AS (
    SELECT first_reply_at - asked_at AS wait_ms, lead_replied_first
    FROM corpus_threads
    WHERE first_reply_at IS NOT NULL
  ),
  ranked AS (
    SELECT wait_ms, lead_replied_first,
      ROW_NUMBER() OVER (ORDER BY wait_ms) AS rn,
      COUNT(*) OVER () AS n
    FROM replied
  )
SELECT
  (SELECT COUNT(*) FROM corpus_threads)                    AS threads,
  COUNT(*)                                                 AS replied,
  MAX(CASE WHEN rn = (50 * n + 99) / 100 THEN wait_ms END) AS median_ms,
  MAX(CASE WHEN rn = (90 * n + 99) / 100 THEN wait_ms END) AS p90_ms,
  ROUND(AVG(wait_ms >= 86400000), 4)                       AS next_day_share,
  ROUND(AVG(lead_replied_first), 4)                        AS lead_first_share
FROM ranked;
