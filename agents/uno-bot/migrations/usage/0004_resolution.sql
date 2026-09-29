-- How each ask was resolved: the self-serve signal (src/usage/resolution.ts).
--
-- Written after the turn, never by it: a reaction on an answer, a completed ✅
-- batch, or the end-of-day pass 24 h on. Turn's upsert names its own columns
-- only, so a retried turn leaves these as they were.
--
-- Booleans are 0/1, times epoch ms. No text: the pass reads the ask and the
-- asker's DMs to the lead in memory and keeps a boolean (ADR-030, ADR-020).

ALTER TABLE turns ADD COLUMN resolution TEXT
  CHECK (resolution IN ('reaction', 'task_completed', 'no_escalation', 'none'));

-- When the current resolution was first recorded.
ALTER TABLE turns ADD COLUMN resolved_at INTEGER;

-- True when the lead replied in the thread, or the asker DMed the lead on the
-- same topic, within 24 h. Null until the pass has read both, or when it could
-- not read the DMs.
ALTER TABLE turns ADD COLUMN escalated_to_lead INTEGER
  CHECK (escalated_to_lead IN (0, 1));

-- When the end-of-day pass settled the ask. Null is its queue: an ask whose DM
-- half it could not read stays queued and is read again, at most once a day.
ALTER TABLE turns ADD COLUMN resolution_checked_at INTEGER;

-- Every read the pass makes, settled or not: how many, and the last. The last
-- is what moves a pass past what it already read today; the count is what
-- lets it give up on a thread it cannot read.
ALTER TABLE turns ADD COLUMN resolution_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE turns ADD COLUMN resolution_attempted_at INTEGER;

-- The pass's queue: real asks it has not settled. Partial, like the classifier's.
CREATE INDEX turns_resolution_unchecked ON turns (asked_at)
  WHERE resolution_checked_at IS NULL AND test_traffic = 0;

-- The completed-task write finds the staging turn by its card.
CREATE INDEX turns_by_proposal ON turns (proposal_id)
  WHERE proposal_id IS NOT NULL;

PRAGMA optimize;
