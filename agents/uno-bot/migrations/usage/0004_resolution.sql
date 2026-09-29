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

-- When the resolving signal arrived.
ALTER TABLE turns ADD COLUMN resolved_at INTEGER;

-- True when the lead replied in the thread, or the asker DMed the lead on the
-- same topic, within 24 h. Null until the pass has read both, or when it could
-- not read the DMs.
ALTER TABLE turns ADD COLUMN escalated_to_lead INTEGER
  CHECK (escalated_to_lead IN (0, 1));

-- When the end-of-day pass handled the ask. Null is its queue.
ALTER TABLE turns ADD COLUMN resolution_checked_at INTEGER;

-- The pass's queue: real asks it has not read. Partial, like the classifier's.
CREATE INDEX turns_resolution_unchecked ON turns (asked_at)
  WHERE resolution_checked_at IS NULL AND test_traffic = 0;

-- The completed-task write finds the staging turn by its card.
CREATE INDEX turns_by_proposal ON turns (proposal_id)
  WHERE proposal_id IS NOT NULL;

PRAGMA optimize;
