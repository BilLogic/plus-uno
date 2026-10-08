// The Review pop-up's views: loading, the draft, and the one-line states that
// follow a decision or find nothing left to decide.
//
// Renders and posts nothing; `review-door.ts` decides which view to show and
// hands it to Slack. Every view is a modal with a Close, and the decision is a
// button in the body's last row, because a view's footer holds only two
// buttons, and Slack's ✕ closes without deciding. A confirmer's draft also
// has a submit, because Slack requires one beside an input (the fields, the
// note); it is Check edits, which decides nothing (`CHECK_EDITS`).
//
// The view carries the card it is about in `private_metadata`, as the card's
// own buttons carry it in the message they sit on — that ts is the identity,
// and the decision is resolved against it and nothing else.
import { textSections } from "./render";
import { CONFIRM_FOOTER } from "./proposal-render";
import { SLACK_USER_ID } from "./mrkdwn";
import { fieldInputBlocks, type EditableField } from "./review-fields";
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

/** Slack's cap on a view's blocks. A draft can pass it — a long draft's
 *  sections plus its field inputs — so `fitBody` trims the draft to the room
 *  left once the decision row and the note are reserved. */
const MAX_VIEW_BLOCKS = 100;

type View = Record<string, unknown>;

/** A view's `callback_id`, which names the pop-up's submit to the endpoint. */
export const REVIEW_CALLBACK_ID = "uno_review";

/** The one alert a view carries, replaced rather than stacked. */
export const REVIEW_ALERT_BLOCK_ID = "uno_review_alert";

/**
 * The footer's submit, on every view a confirmer can decide from. Slack
 * requires a submit on any view with an input block — the fields, and the
 * note every confirmer's view carries — and pressing Enter in a field
 * presses it, so it decides nothing: it runs the edit checks and answers in
 * the pop-up. The decision stays in the body's last row.
 */
export const CHECK_EDITS = "Check edits";

function modal(card: ReviewedCard, blocks: unknown[], opts: { submit?: string } = {}): View {
  return {
    type: "modal",
    callback_id: REVIEW_CALLBACK_ID,
    title: { type: "plain_text", text: TITLE },
    close: { type: "plain_text", text: "Close" },
    ...(opts.submit ? { submit: { type: "plain_text", text: opts.submit } } : {}),
    private_metadata: JSON.stringify({ channel: card.channel, ts: card.ts }),
    blocks: blocks.slice(0, MAX_VIEW_BLOCKS),
  };
}

/** What the pop-up has to say about the edits: an alert block, which Slack
 *  takes in a modal and nowhere else. Text is plain, so a quoted edit shows
 *  exactly as typed. */
export function alertBlock(level: "error" | "success", text: string): unknown {
  return { type: "alert", block_id: REVIEW_ALERT_BLOCK_ID, level, text: { type: "plain_text", text } };
}

/** The draft's fields, editable, and what the pop-up says about them. */
export interface DraftEdit {
  fields: readonly EditableField[];
  /** The person's own values, kept across a redraw. */
  values?: ReadonlyMap<string, string>;
  alert?: { level: "error" | "success"; text: string };
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
 * `edit` gives a confirmer the draft's fields as inputs, under the draft and
 * above the decision; an alert about them opens the view, where it is seen.
 * Read-only views take no fields.
 *
 * A confirmer's view ends with the note and then the decision row — Approve,
 * Needs changes, Reject, in that order. The note is optional to Slack, because
 * Approve ignores it and Reject takes it as an optional reason; Needs changes
 * without one is refused by the door, which re-renders this view with
 * `noteNeeded`. The note is an input too, so every confirmer's view carries
 * the Check edits submit Slack requires beside one.
 */
export function draftView(
  card: ReviewedCard,
  proposal: PendingProposal,
  access: { mayDecide: boolean; confirmers: readonly string[] },
  edit?: DraftEdit,
  opts: { noteNeeded?: boolean } = {},
): View {
  const fields = access.mayDecide ? (edit?.fields ?? []) : [];
  const head: unknown[] = fields.length && edit?.alert ? [alertBlock(edit.alert.level, edit.alert.text)] : [];
  const draft = textSections(draftBody(proposal.proposalText));
  const inputs = fieldInputBlocks(fields, edit?.values);
  const tail: unknown[] = [];
  if (access.mayDecide) {
    tail.push({ type: "divider" });
    tail.push(noteInput());
    if (opts.noteNeeded) tail.push({ type: "context", elements: [{ type: "mrkdwn", text: NOTE_NEEDED }] });
    tail.push(decisionRow());
  } else {
    tail.push({ type: "context", elements: [{ type: "mrkdwn", text: readOnlyLine(access.confirmers) }] });
  }
  const body = fitBody(draft, inputs, MAX_VIEW_BLOCKS - head.length - tail.length);
  return modal(card, [...head, ...body, ...tail], access.mayDecide ? { submit: CHECK_EDITS } : {});
}

/** Said where a draft too long for one view was cut. */
const LEFT_OUT =
  "Part of this draft is too long for the pop-up and was left out here. Approving runs all of it, as staged.";

/**
 * The draft's sections and the field inputs, inside the blocks the view has
 * left once its alert, note and decision row are reserved — so a long draft
 * can never push the decision out of the view. Past the room, the draft's
 * later sections go first, then the later inputs (an input not offered is a
 * field approved as staged), and a line says some was left out.
 */
function fitBody(draft: unknown[], inputs: unknown[], room: number): unknown[] {
  const divided = inputs.length ? [{ type: "divider" }, ...inputs] : [];
  if (draft.length + divided.length <= room) return [...draft, ...divided];
  const space = room - 1; // the left-out line
  // The draft keeps at least its opening section; the inputs take what they
  // need of the rest.
  const keptInputs = Math.max(0, Math.min(inputs.length, space - 2));
  const keptDivided = keptInputs ? [{ type: "divider" }, ...inputs.slice(0, keptInputs)] : [];
  const keptDraft = Math.max(0, space - keptDivided.length);
  return [
    ...draft.slice(0, keptDraft),
    { type: "context", elements: [{ type: "mrkdwn", text: LEFT_OUT }] },
    ...keptDivided,
  ];
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
