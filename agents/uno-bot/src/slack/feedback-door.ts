// The feedback door — a press of an answer's feedback buttons, and the pop-up
// a "bad answer" opens.
//
// Every press is recorded on the usage record against the answer's ts and the
// turn its button names (`usage/feedback.ts`). A "bad answer" also opens a
// pop-up asking what was wrong; sending it records the reason, and a note, when
// there is one, is posted in the answer's thread rather than stored.
//
// OPEN BEFORE WRITING. Slack's `trigger_id` lives three seconds, and a D1 write
// can spend part of that, so the pop-up opens first and the press is recorded
// after. A record that fails is logged and dropped: it never costs the person
// the pop-up, and never the answer.
//
// Takes named dependencies, as the review door does; `Env` is turned into
// `FeedbackDoorDeps` once, in `slack/interactive.ts`. PURE by design, so
// `tests/answer-feedback.test.ts` drives it.
import type { AnswerFeedbackLog, AnswerFeedbackRecord } from "../usage/feedback";
import { feedbackNoteText, feedbackOf, feedbackSubmissionOf, feedbackView, type FeedbackViewState } from "./feedback";

export interface FeedbackDoorDeps {
  log: AnswerFeedbackLog;
  /** `views.open`: the opened view's id, or null when Slack refused. */
  openView(triggerId: string, view: Record<string, unknown>): Promise<string | null>;
  /** A plain message in the answer's thread. */
  postNote(channel: string, threadTs: string, text: string): Promise<void>;
  now(): number;
}

/** A press of one of the buttons, as the interaction carries it. */
export interface FeedbackTap {
  channel: string;
  /** The message the buttons sit on. */
  answerTs: string;
  /** The thread it is in; the answer's own ts at the top level. */
  threadTs: string;
  userId: string;
  /** The pressed button's value (`feedbackBlock`). */
  value: string | undefined;
  triggerId?: string;
}

/** A press: recorded, and for a "bad answer" the pop-up opened first. */
export async function runFeedbackTap(tap: FeedbackTap, deps: FeedbackDoorDeps): Promise<void> {
  const pressed = feedbackOf(tap.value);
  if (!pressed) {
    console.warn(`[feedback] unreadable press on ${tap.channel}/${tap.answerTs}: ${tap.value ?? "(no value)"}`);
    return;
  }
  if (pressed.rating === "down" && tap.triggerId) {
    const target = { channel: tap.channel, answerTs: tap.answerTs, threadTs: tap.threadTs, turnId: pressed.turnId };
    const opened = await deps.openView(tap.triggerId, feedbackView(target));
    if (!opened) console.warn(`[feedback] pop-up refused for ${tap.channel}/${tap.answerTs}`);
  }
  await record(deps, {
    answerTs: tap.answerTs,
    userId: tap.userId,
    turnId: pressed.turnId,
    rating: pressed.rating,
    reason: null,
    hasNote: false,
    at: deps.now(),
  });
  console.log(`[feedback] ${pressed.rating} on ${tap.channel}/${tap.answerTs} by=${tap.userId} turn=${pressed.turnId ?? "?"}`);
}

/**
 * The pop-up, sent: the reason recorded, and the note posted in the thread.
 * The pop-up has already been answered by then (`feedbackAckFor`), inside the
 * submission's own three seconds.
 */
export async function runFeedbackReason(
  submission: { userId: string; view: FeedbackViewState },
  deps: FeedbackDoorDeps,
): Promise<void> {
  const sent = feedbackSubmissionOf(submission.view);
  if (!sent) return;
  const { target, reason, note } = sent;
  await record(deps, {
    answerTs: target.answerTs,
    userId: submission.userId,
    turnId: target.turnId,
    rating: "down",
    reason,
    hasNote: note.length > 0,
    at: deps.now(),
  });
  if (note) {
    await deps.postNote(target.channel, target.threadTs, feedbackNoteText(submission.userId, reason, note)).catch((err: unknown) => {
      console.warn(`[feedback] note not posted on ${target.channel}/${target.threadTs}: ${messageOf(err)}`);
    });
  }
  console.log(`[feedback] reason ${reason} on ${target.channel}/${target.answerTs} by=${submission.userId} note=${note.length > 0}`);
}

async function record(deps: FeedbackDoorDeps, row: AnswerFeedbackRecord): Promise<void> {
  try {
    await deps.log.record(row);
  } catch (err) {
    console.error(`[feedback] not recorded on ${row.answerTs}: ${messageOf(err)}`);
  }
}

const messageOf = (err: unknown): string => (err instanceof Error ? err.message : String(err));
