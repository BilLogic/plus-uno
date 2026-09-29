-- Bill's spot-check of the corpus categories: 20 random classified asks.
--
-- Run from agents/uno-bot/ (read-only):
--   npx wrangler d1 execute uno-bot-usage --remote --file queries/usage/categories-spot-check.sql
--
-- The text is gone by the time a row is classified (ADR-030), so the check
-- reads each ask where it was made: a channel ask by its channel and ts (open
-- https://slack.com/archives/<channel_id>/p<ts without the dot>), a DM ask by
-- its ts in the asker's DM with uno-bot. A blank sub_type is a classifier
-- answer outside the corpus options, or none.

SELECT
  turn_id,
  surface,
  channel_id,
  ask_ts,
  datetime(asked_at / 1000, 'unixepoch') AS asked_utc,
  sub_type,
  pain_category,
  proposal_id IS NOT NULL                AS staged,
  datetime(classified_at / 1000, 'unixepoch') AS classified_utc
FROM turns
WHERE classified_at IS NOT NULL
  AND test_traffic = 0
ORDER BY random()
LIMIT 20;
