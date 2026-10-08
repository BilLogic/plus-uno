-- What people said of an answer: one row per person per answer, from the
-- feedback buttons beneath it (src/usage/feedback.ts, ADR-030).
--
-- Keyed to the answer's own ts and the person who pressed, so a second press
-- replaces the first. `turn_id` is the turn that posted the answer — the join
-- to `turns`, and through it to the kind of question that drew the answer.
--
-- Times are epoch milliseconds. Booleans are 0/1. No text: a "bad answer"
-- keeps its reason and whether a note came with it, and the note itself is
-- posted in the answer's thread.

CREATE TABLE answer_feedback (
  answer_ts  TEXT    NOT NULL,                 -- the message the buttons sit on
  user_id    TEXT    NOT NULL,                 -- who pressed
  turn_id    TEXT,                             -- "<channel>:<ask ts>", when the buttons named it
  rating     TEXT    NOT NULL CHECK (rating IN ('up', 'down')),
  -- a "bad answer"'s pop-up, once sent; always null on a good one
  reason     TEXT    CHECK (reason IN ('wrong_facts', 'missing_source', 'too_long', 'other')),
  has_note   INTEGER NOT NULL DEFAULT 0 CHECK (has_note IN (0, 1)),
  at         INTEGER NOT NULL,                 -- when it was last said
  PRIMARY KEY (answer_ts, user_id)
);

-- Every metric is a window over time, and the join to a turn's category.
CREATE INDEX answer_feedback_by_time ON answer_feedback (at);
CREATE INDEX answer_feedback_by_turn ON answer_feedback (turn_id) WHERE turn_id IS NOT NULL;

PRAGMA optimize;
