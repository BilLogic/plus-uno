// The Review pop-up's views: loading, the draft, and the one-line states that
// follow a decision or find nothing left to decide.
//
// Renders and posts nothing; `review-door.ts` decides which view to show and
// hands it to Slack. Every view is a modal with a Close and no submit: the
// decision is a button in the body's last row, because a view's footer holds
// only two buttons, and Slack's ✕ closes without deciding.
//
// The view carries the card it is about in `private_metadata`, as the card's
// own buttons carry it in the message they sit on — that ts is the identity,
// and the decision is resolved against it and nothing else.
import { textSections } from "./render";
import { CONFIRM_FOOTER } from "./proposal-render";
import { SLACK_USER_ID } from "./mrkdwn";
import type { PendingProposal, StatedCardWords } from "../thread-state/index";

/** The decision row inside the pop-up; `slack/interactive.ts` routes all three. */
export const REVIEW_APPROVE_ACTION_ID = "uno_review_approve";
export const REVIEW_CHANGES_ACTION_ID = "uno_review_changes";
export const REVIEW_REJECT_ACTION_ID = "uno_review_reject";

/** The note input: Needs changes' note, Reject's reason. A decision press
 *  carries it in the view's state under these ids (`reviewNoteOf`). */
const NOTE_BLOCK_ID = "uno_review_note";
const NOTE_ACTION_ID = "uno_review_note_input";

/** Slack's cap on a `plain_text_input`. */
const NOTE_MAX_CHARS = 3000;

/** Said above the row when Needs changes was pressed with no note. */
const NOTE_NEEDED = ":warning: Needs changes needs a note: write what to change, then press it again.";

/** The card a view is about, as `private_metadata` carries it. */
export interface ReviewedCard {
  channel: string;
  ts: string;
}

/** Slack's modal title cap is 24 characters. */
const TITLE = "Review proposal";

/** Slack's cap on a view's blocks. The draft's sections stay well under it:
 *  a card's text is held to one message, at most fourteen 2,900-char sections. */
const MAX_VIEW_BLOCKS = 100;

type View = Record<string, unknown>;

function modal(card: ReviewedCard, blocks: unknown[]): View {
  return {
    type: "modal",
    title: { type: "plain_text", text: TITLE },
    close: { type: "plain_text", text: "Close" },
    private_metadata: JSON.stringify({ channel: card.channel, ts: card.ts }),
    blocks: blocks.slice(0, MAX_VIEW_BLOCKS),
  };
}

function line(text: string): unknown {
  return { type: "section", text: { type: "mrkdwn", text } };
}

/** The view `views.open` shows at once, inside Slack's three-second trigger
 *  window, before anything has been read. */
export function loadingView(card: ReviewedCard): View {
  return modal(card, [line("Loading the draft…")]);
}

/**
 * The draft, as the card states it, minus the card's footer about reactions —
 * the pop-up carries its own decision.
 *
 * `mayDecide` false is the same draft read-only: no decision row, and a line
 * naming who can decide instead.
 *
 * A confirmer's view ends with the note and then the decision row — Approve,
 * Needs changes, Reject, in that order. The note is optional to Slack, because
 * Approve ignores it and Reject takes it as an optional reason; Needs changes
 * without one is refused by the door, which re-renders this view with
 * `noteNeeded`.
 */
export function draftView(
  card: ReviewedCard,
  proposal: PendingProposal,
  access: { mayDecide: boolean; confirmers: readonly string[] },
  opts: { noteNeeded?: boolean } = {},
): View {
  const blocks: unknown[] = [...textSections(draftBody(proposal.proposalText))];
  if (access.mayDecide) {
    blocks.push({ type: "divider" });
    blocks.push(noteInput());
    if (opts.noteNeeded) blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: NOTE_NEEDED }] });
    blocks.push(decisionRow());
  } else {
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: readOnlyLine(access.confirmers) }] });
  }
  return modal(card, blocks);
}

/** The card's text without its footer, which points at the pop-up itself. */
function draftBody(text: string): string {
  return text.replace(CONFIRM_FOOTER, "").trim();
}

function noteInput(): unknown {
  return {
    type: "input",
    block_id: NOTE_BLOCK_ID,
    optional: true,
    label: { type: "plain_text", text: "Note" },
    hint: { type: "plain_text", text: "Needed for Needs changes: I revise the draft from it. Optional for Reject, as the reason." },
    element: { type: "plain_text_input", action_id: NOTE_ACTION_ID, multiline: true, max_length: NOTE_MAX_CHARS },
  };
}

function decisionRow(): unknown {
  const button = (action_id: string, text: string, value: string, style?: "primary" | "danger") => ({
    type: "button",
    action_id,
    ...(style ? { style } : {}),
    text: { type: "plain_text", text },
    value,
  });
  return {
    type: "actions",
    block_id: "uno_review_decision",
    elements: [
      button(REVIEW_APPROVE_ACTION_ID, "Approve", "confirm", "primary"),
      button(REVIEW_CHANGES_ACTION_ID, "Needs changes", "revise"),
      button(REVIEW_REJECT_ACTION_ID, "Reject", "cancel", "danger"),
    ],
  };
}

/** What the note input holds, from a decision press's `view.state.values` —
 *  trimmed, and empty when there is none. */
export function reviewNoteOf(state: unknown): string {
  const values = (state as { values?: Record<string, Record<string, { value?: unknown }>> } | undefined)?.values;
  const value = values?.[NOTE_BLOCK_ID]?.[NOTE_ACTION_ID]?.value;
  return typeof value === "string" ? value.trim() : "";
}

/**
 * A decided card, opened from View: its own words, read-only. The record is
 * gone once a card is decided, so the words are the card's message as Slack
 * hands it with the click, outcome line included.
 */
export function decidedView(card: ReviewedCard, cardText: string): View {
  return modal(card, [
    ...textSections(draftBody(cardText)),
    { type: "context", elements: [{ type: "mrkdwn", text: "Read-only. This proposal has already been decided." }] },
  ]);
}

function readOnlyLine(confirmers: readonly string[]): string {
  const who = confirmers.filter((id) => SLACK_USER_ID.test(id)).map((id) => `<@${id}>`);
  if (!who.length) return "Read-only. Nobody here can decide this proposal.";
  const names = who.length === 1 ? who[0]! : `${who.slice(0, -1).join(", ")} or ${who.at(-1)!}`;
  return `Read-only. Only ${names} can decide this proposal.`;
}

/** A card that cannot be decided any more, and why. No decision row. */
export function closedView(
  card: ReviewedCard,
  why: { state: "expired"; stated?: StatedCardWords } | { state: "superseded" } | { state: "gone" },
): View {
  switch (why.state) {
    case "expired":
      return modal(card, [line(why.stated?.expired ?? "This proposal expired, so it can't be approved now. Ask me again and I'll set it up fresh.")]);
    case "superseded":
      return modal(card, [line("This proposal was replaced by a newer one. Review the newest card in the thread instead.")]);
    case "gone":
      return modal(card, [line("This proposal has already been decided.")]);
  }
}

/** One line in place of the draft: the decision registered, or the Gate's
 *  answer when it did not. */
export function noticeView(card: ReviewedCard, text: string): View {
  return modal(card, [line(text)]);
}

/** The card a view's `private_metadata` names, or null for one this Worker
 *  did not write. */
export function reviewedCardOf(privateMetadata: string | undefined): ReviewedCard | null {
  if (!privateMetadata) return null;
  try {
    const parsed = JSON.parse(privateMetadata) as Partial<ReviewedCard>;
    return typeof parsed.channel === "string" && typeof parsed.ts === "string"
      ? { channel: parsed.channel, ts: parsed.ts }
      : null;
  } catch {
    return null;
  }
}
