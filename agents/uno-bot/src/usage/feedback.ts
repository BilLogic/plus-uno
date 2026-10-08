// What people said of an answer, on the usage record: one row per person per
// answer, from the feedback buttons beneath it (`slack/feedback.ts`).
//
// Keyed to the ANSWER'S ts — the message the buttons sit on — and the person
// who pressed, so a second press replaces the first rather than counting
// twice. The row carries the turn the answer belongs to, which is how a
// "bad answer" is joined to the kind of question that drew it (`turns`).
//
// A port of its own beside `UsageLog`, as the resolution record is: Turn writes
// its row once, as the turn ends; a press comes later, from someone else.
//
// Nothing here stores text. A "bad answer" keeps its reason and whether a note
// came with it; the note itself goes to the answer's thread (ADR-030).
//
// PURE: no `Env`, no Workers global. `Env` stops in `./feedback-env.ts`.

export type FeedbackRating = "up" | "down";

/** What a "bad answer" said was wrong. */
export type FeedbackReason = "wrong_facts" | "missing_source" | "too_long" | "other";

/** One person's word on one answer. */
export interface AnswerFeedbackRecord {
  /** The answer's own ts: the message the buttons sit on. */
  answerTs: string;
  /** Who pressed. */
  userId: string;
  /** The turn that posted the answer, `"<channel>:<ask ts>"`; null when the
   *  buttons did not say. */
  turnId: string | null;
  rating: FeedbackRating;
  /** Why it was bad, once the pop-up is sent. Always null on a good one. */
  reason: FeedbackReason | null;
  /** Whether the pop-up came back with a note. */
  hasNote: boolean;
  /** When it was last said, epoch ms. */
  at: number;
}

/**
 * Where feedback is written.
 *
 * LAST WORD WINS, per person per answer. A press of the other button replaces
 * the rating, and a good rating clears any reason. A write that brings no
 * reason (the press that opens the pop-up) keeps one already given, so pressing
 * "bad answer" twice does not lose what the pop-up said; a write that brings no
 * turn keeps the one the row already has. A caller treats a throw as a lost
 * record, never as a lost action.
 */
export interface AnswerFeedbackLog {
  record(feedback: AnswerFeedbackRecord): Promise<void>;
  /** One person's row on one answer, or null when they have said nothing. */
  get(answerTs: string, userId: string): Promise<AnswerFeedbackRecord | null>;
}

/** The row a write leaves, given the row before it: the rule both adapters keep. */
export function mergeFeedback(before: AnswerFeedbackRecord | null, next: AnswerFeedbackRecord): AnswerFeedbackRecord {
  if (!before) return next.rating === "up" ? { ...next, reason: null, hasNote: false } : next;
  if (next.rating === "up") return { ...next, turnId: next.turnId ?? before.turnId, reason: null, hasNote: false };
  return {
    ...next,
    turnId: next.turnId ?? before.turnId,
    reason: next.reason ?? (before.rating === "down" ? before.reason : null),
    hasNote: next.reason ? next.hasNote : before.rating === "down" && before.hasNote,
  };
}

/** The in-memory log, held equal to the D1 one by the conformance suite
 *  (`tests/helpers/answer-feedback-conformance.ts`). */
export function createInMemoryAnswerFeedbackLog(): AnswerFeedbackLog & { records(): AnswerFeedbackRecord[] } {
  const rows = new Map<string, AnswerFeedbackRecord>();
  const key = (answerTs: string, userId: string) => `${answerTs}\u0000${userId}`;
  return {
    async record(feedback) {
      const k = key(feedback.answerTs, feedback.userId);
      rows.set(k, mergeFeedback(rows.get(k) ?? null, feedback));
    },
    async get(answerTs, userId) {
      const row = rows.get(key(answerTs, userId));
      return row ? { ...row } : null;
    },
    records: () => [...rows.values()].map((r) => ({ ...r })),
  };
}
