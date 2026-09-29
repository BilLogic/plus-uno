-- The corpus categories on the usage record: a channel ask's text, held only
-- until the end-of-day classifier labels it, and the labels themselves
-- (src/usage/categories.ts, ADR-030).
--
-- Additive: four nullable columns, one counter with a default, and one
-- partial index. `classified_at` already exists (0001).
--
-- request_text is the one column in this database that holds message text. It
-- is written only for real asks in a conversation known to be a channel — a
-- DM, a group DM, an unknown conversation and test traffic never store any —
-- and nulled in the same write that classifies the row, and in any case by the
-- purge, which runs morning and evening so no text outlives 14 days.

ALTER TABLE turns ADD COLUMN request_text  TEXT;
-- The corpus Sub-type, exact-matched to the Coordination Request Corpus
-- options; null is blank (unclassified, or no option fitted).
ALTER TABLE turns ADD COLUMN sub_type      TEXT;
-- Derived from sub_type; 7 is a turn that staged a card or intake.
ALTER TABLE turns ADD COLUMN pain_category INTEGER CHECK (pain_category BETWEEN 1 AND 7);
-- Failed classifications of this ask. At the limit (src/usage/classify-run.ts)
-- the ask is stored blank and its text nulled, so it stops blocking the queue.
ALTER TABLE turns ADD COLUMN classify_attempts INTEGER NOT NULL DEFAULT 0;

-- Whose conversation the ask was made in, as Slack types it: channel, group
-- (private channel), mpim (group DM) or im (app DM); null when the event did
-- not say. `surface` is where the answer was delivered, and reads `channel`
-- for a group DM, so it cannot answer this. Only channel and group rows ever
-- hold request_text.
ALTER TABLE turns ADD COLUMN conversation_type TEXT
  CHECK (conversation_type IN ('channel', 'group', 'mpim', 'im'));

-- The purge's target: rows still holding text. Partial, so it is as small as
-- the text kept rather than as large as the table.
CREATE INDEX turns_with_text ON turns (asked_at) WHERE request_text IS NOT NULL;

PRAGMA optimize;
