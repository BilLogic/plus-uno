// The feedback buttons under an answer, and the pop-up a "bad answer" opens.
//
// Renders and posts nothing; `slack/delivery.ts` puts the row under an answer
// and `slack/feedback-door.ts` answers a tap. Imports types and the pure
// `mrkdwn` escape only, so both the
// posting path and the door read one spelling of the action ids and the button
// values.
//
// THE ROW is Slack's own `context_actions` block with one `feedback_buttons`
// element — the affordance Slack renders on agent answers, posted live in
// Bill's DM on 2026-10-08. Both buttons share one action id; the pressed
// button's `value` says which it was, and carries the turn the answer belongs
// to, so a tap is tied to the ask it answered without reading the thread.
//
// THE POP-UP asks what was wrong: four reasons and an optional note. The note
// is posted in the answer's thread, where the conversation lives, and the
// usage record keeps only that there was one — it never stores text (ADR-030).

import type { FeedbackRating, FeedbackReason } from "../usage/feedback";
import { escapeSlackText } from "./mrkdwn";

/** Both feedback buttons; `slack/interactive.ts` routes it. */
export const FEEDBACK_ACTION_ID = "uno_feedback";

/** The pop-up's callback id, which its submission arrives under. */
export const FEEDBACK_VIEW_CALLBACK_ID = "uno_feedback_reason";

const REASON_BLOCK_ID = "uno_feedback_reason";
const REASON_ACTION_ID = "reason";
const NOTE_BLOCK_ID = "uno_feedback_note";
const NOTE_ACTION_ID = "note";

/** The most of a note the pop-up takes. */
export const MAX_NOTE_CHARS = 500;

const REASONS: ReadonlyArray<readonly [FeedbackReason, string]> = [
  ["wrong_facts", "Wrong facts"],
  ["missing_source", "Missing source"],
  ["too_long", "Too long"],
  ["other", "Other"],
];

/** A reason's label, as the pop-up shows it. */
export function reasonLabel(reason: FeedbackReason): string {
  return REASONS.find(([r]) => r === reason)?.[1] ?? reason;
}

/** What the posting path needs to put the row under an answer. */
export interface AnswerFeedback {
  /** The usage record's id for the turn that posted the answer. */
  turnId: string;
}

/** The row, beneath the answer's footer. */
export function feedbackBlock(feedback: AnswerFeedback): Record<string, unknown> {
  const button = (rating: FeedbackRating, text: string, label: string) => ({
    text: { type: "plain_text", text },
    accessibility_label: label,
    value: `${rating}|${feedback.turnId}`,
  });
  return {
    type: "context_actions",
    elements: [
      {
        type: "feedback_buttons",
        action_id: FEEDBACK_ACTION_ID,
        positive_button: button("up", "Good answer", "Mark this answer as good"),
        negative_button: button("down", "Bad answer", "Mark this answer as bad"),
      },
    ],
  };
}

/** A pressed button's value, read back: which it was and whose turn. */
export function feedbackOf(value: string | undefined): { rating: FeedbackRating; turnId: string | null } | null {
  if (!value) return null;
  const bar = value.indexOf("|");
  const rating = bar < 0 ? value : value.slice(0, bar);
  if (rating !== "up" && rating !== "down") return null;
  const turnId = bar < 0 ? "" : value.slice(bar + 1);
  return { rating, turnId: turnId || null };
}

/** The answer a pop-up is about, as `private_metadata` carries it. */
export interface FeedbackTarget {
  channel: string;
  /** The answer's own ts: the message the buttons sit on. */
  answerTs: string;
  /** The thread the answer is in, where a note is posted. */
  threadTs: string;
  turnId: string | null;
}

/** The pop-up a "bad answer" opens. */
export function feedbackView(target: FeedbackTarget): Record<string, unknown> {
  return {
    type: "modal",
    callback_id: FEEDBACK_VIEW_CALLBACK_ID,
    title: { type: "plain_text", text: "What went wrong?" },
    submit: { type: "plain_text", text: "Send" },
    close: { type: "plain_text", text: "Skip" },
    private_metadata: JSON.stringify(target),
    blocks: [
      {
        type: "input",
        block_id: REASON_BLOCK_ID,
        label: { type: "plain_text", text: "What was wrong with the answer?" },
        element: {
          type: "radio_buttons",
          action_id: REASON_ACTION_ID,
          options: REASONS.map(([value, text]) => ({ value, text: { type: "plain_text", text } })),
        },
      },
      {
        type: "input",
        block_id: NOTE_BLOCK_ID,
        optional: true,
        label: { type: "plain_text", text: "Anything to add?" },
        hint: { type: "plain_text", text: "Posted in the answer's thread, so the team sees it." },
        element: { type: "plain_text_input", action_id: NOTE_ACTION_ID, multiline: true, max_length: MAX_NOTE_CHARS },
      },
    ],
  };
}

/** The one line the pop-up turns into once it is sent. */
export function feedbackThanksView(): Record<string, unknown> {
  return {
    type: "modal",
    title: { type: "plain_text", text: "What went wrong?" },
    close: { type: "plain_text", text: "Close" },
    blocks: [{ type: "section", text: { type: "mrkdwn", text: "Thanks. It's recorded against this answer." } }],
  };
}

/** A submitted pop-up, as Slack sends it back. */
export interface FeedbackViewState {
  private_metadata?: string;
  state?: { values?: Record<string, Record<string, { selected_option?: { value?: string } | null; value?: string | null }>> };
}

/** A submitted pop-up, read back. Null when it is not one this Worker wrote. */
export function feedbackSubmissionOf(view: FeedbackViewState): { target: FeedbackTarget; reason: FeedbackReason; note: string } | null {
  let target: Partial<FeedbackTarget>;
  try {
    target = JSON.parse(view.private_metadata ?? "") as Partial<FeedbackTarget>;
  } catch {
    return null;
  }
  if (typeof target.channel !== "string" || typeof target.answerTs !== "string") return null;
  const values = view.state?.values ?? {};
  const picked = values[REASON_BLOCK_ID]?.[REASON_ACTION_ID]?.selected_option?.value;
  const reason = REASONS.find(([r]) => r === picked)?.[0];
  if (!reason) return null;
  const note = (values[NOTE_BLOCK_ID]?.[NOTE_ACTION_ID]?.value ?? "").trim().slice(0, MAX_NOTE_CHARS);
  return {
    target: {
      channel: target.channel,
      answerTs: target.answerTs,
      threadTs: typeof target.threadTs === "string" ? target.threadTs : target.answerTs,
      turnId: typeof target.turnId === "string" ? target.turnId : null,
    },
    reason,
    note,
  };
}

/**
 * The body to ack a submission with: the pop-up turned into one line saying it
 * registered, or null for a view this Worker cannot read, which is acked empty
 * and closes.
 */
export function feedbackAckFor(view: FeedbackViewState): Record<string, unknown> | null {
  return feedbackSubmissionOf(view) ? { response_action: "update", view: feedbackThanksView() } : null;
}

/** The note, as it is posted in the answer's thread: the person's words as
 *  words, so a note cannot ping the channel or dress a link up as another. */
export function feedbackNoteText(userId: string, reason: FeedbackReason, note: string): string {
  const words = escapeSlackText(note).replace(/\n/g, "\n> ");
  return `<@${userId}> marked the answer above as bad (${reasonLabel(reason).toLowerCase()}):\n> ${words}`;
}
