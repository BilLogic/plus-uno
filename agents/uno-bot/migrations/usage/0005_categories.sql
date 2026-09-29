-- The corpus categories on the usage record: a channel ask's text, held only
-- until the end-of-day classifier labels it, and the labels themselves
-- (src/usage/categories.ts, ADR-030).
--
-- Additive: four nullable columns and one partial index. `classified_at`
-- already exists (0001).
--
-- request_text is the one column in this database that holds message text. It
-- is written for real CHANNEL asks only — a DM turn and test traffic never
-- store any — and nulled in the same write that classifies the row, and in any
-- case by the end-of-day purge once it is 14 days old.

ALTER TABLE turns ADD COLUMN request_text  TEXT;
-- The corpus Sub-type, exact-matched to the Coordination Request Corpus
-- options; null is blank (unclassified, or no option fitted).
ALTER TABLE turns ADD COLUMN sub_type      TEXT;
-- Derived from sub_type; 7 is a turn that staged a card or intake.
ALTER TABLE turns ADD COLUMN pain_category INTEGER CHECK (pain_category BETWEEN 1 AND 7);

-- The purge's target: rows still holding text. Partial, so it is as small as
-- the text kept rather than as large as the table.
CREATE INDEX turns_with_text ON turns (asked_at) WHERE request_text IS NOT NULL;

PRAGMA optimize;
