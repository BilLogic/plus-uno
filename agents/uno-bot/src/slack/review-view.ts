// The Review pop-up's views: loading, the draft, the three views a confirmer
// pushes over it, and the one-line states that follow a decision or find
// nothing left to decide.
//
// Renders and posts nothing; `review-door.ts` decides which view to show and
// hands it to Slack.
//
// THE DRAFT HOLDS NO INPUT. Slack's view footer holds two buttons, submit and
// close, and an input anywhere in a view forces a submit. So the draft is
// read-only, and its footer is the decision a person makes most: Approve as
// the submit, Close beside it. The other two decisions are the body's last
// row, Needs changes and Reject, and the fields are an Edit fields button at
// the top. Each of those pushes a view of its own (`views.push`) holding the
// one input it needs, with its own submit.
//
// SAVED EDITS RIDE IN THE DRAFT'S `private_metadata`. Edit fields' Save edits
// writes the values that differ from the draft into the parent view's
// metadata and redraws its draft with them; Approve reads them back from
// there. Slack hands metadata back exactly as the Worker wrote it, and Approve
// still holds every value to the live card and the database's options
// (`reviewEdits`), so nothing a view carries is trusted to run.
//
// Every view carries the card it is about in `private_metadata`, as the
// card's own buttons carry it in the message they sit on: that ts is the
// identity, and the decision is resolved against it and nothing else.
import { textSections } from "./render";
import { CONFIRM_FOOTER } from "./proposal-render";
import { SLACK_USER_ID, escapeSlackText } from "./mrkdwn";
import { fieldInputBlocks, labelsOf, withValues, type EditableField } from "./review-fields";
import { caveatsOf, draftHeadline, readableDraft } from "./review-draft";
import type { PendingProposal, StatedCardWords } from "../thread-state/index";

/** The draft's buttons; `slack/interactive.ts` routes all three. */
export const REVIEW_CHANGES_ACTION_ID = "uno_review_changes";
export const REVIEW_REJECT_ACTION_ID = "uno_review_reject";
export const REVIEW_EDIT_ACTION_ID = "uno_review_edit";

/** Each view's `callback_id`, which names its submit to the endpoint. The
 *  draft's submit is Approve. */
export const REVIEW_CALLBACK_ID = "uno_review_draft";
export const REVIEW_CHANGES_CALLBACK_ID = "uno_review_changes_note";
export const REVIEW_REJECT_CALLBACK_ID = "uno_review_reject_note";
export const REVIEW_EDIT_CALLBACK_ID = "uno_review_edit_fields";

/** The note input: Needs changes' note, Reject's reason. */
export const NOTE_BLOCK_ID = "uno_review_note";
const NOTE_ACTION_ID = "uno_review_note_input";

/** Slack's cap on a `plain_text_input`. */
const NOTE_MAX_CHARS = 3000;

/** Slack's cap on a view's `private_metadata`. */
export const METADATA_MAX_CHARS = 3000;

/** The card a view is about, as `private_metadata` carries it, with the edits
 *  Save edits kept on the draft: field key → value. */
export interface ReviewedCard {
  channel: string;
  ts: string;
  edits?: Readonly<Record<string, string>>;
}

/** Slack's modal title cap is 24 characters. */
const TITLE = "Review proposal";

/** Slack's cap on a view's blocks. A long draft can pass it, so `fitBody`
 *  trims the draft to the room left once the head and the decision row are
 *  reserved. */
const MAX_VIEW_BLOCKS = 100;

type View = Record<string, unknown>;

/** The one alert a view carries, replaced rather than stacked. */
export const REVIEW_ALERT_BLOCK_ID = "uno_review_alert";

/** The draft's footer submit: the confirm decision. */
export const APPROVE = "Approve";

/** What a view's `private_metadata` holds for this card. */
export function reviewMetadata(card: ReviewedCard): string {
  const edits = card.edits && Object.keys(card.edits).length ? { edits: card.edits } : {};
  return JSON.stringify({ channel: card.channel, ts: card.ts, ...edits });
}

function modal(
  card: ReviewedCard,
  blocks: unknown[],
  opts: { submit?: string; callbackId?: string; title?: string } = {},
): View {
  return {
    type: "modal",
    callback_id: opts.callbackId ?? REVIEW_CALLBACK_ID,
    title: { type: "plain_text", text: opts.title ?? TITLE },
    close: { type: "plain_text", text: "Close" },
    ...(opts.submit ? { submit: { type: "plain_text", text: opts.submit } } : {}),
    private_metadata: reviewMetadata(card),
    blocks: blocks.slice(0, MAX_VIEW_BLOCKS),
  };
}

/** What a view has to say about the edits: an alert block, which Slack takes
 *  in a modal and nowhere else. Text is plain, so a quoted edit shows exactly
 *  as typed. */
export function alertBlock(level: "error" | "success", text: string): unknown {
  return { type: "alert", block_id: REVIEW_ALERT_BLOCK_ID, level, text: { type: "plain_text", text } };
}

function line(text: string): unknown {
  return { type: "section", text: { type: "mrkdwn", text } };
}

function context(text: string): unknown {
  return { type: "context", elements: [{ type: "mrkdwn", text }] };
}

function button(action_id: string, text: string, value: string, style?: "primary" | "danger"): unknown {
  return { type: "button", action_id, ...(style ? { style } : {}), text: { type: "plain_text", text }, value };
}

/** The view `views.open` shows at once, inside Slack's three-second trigger
 *  window, before anything has been read. */
export function loadingView(card: ReviewedCard): View {
  return modal(card, [line("Loading the draft…")]);
}

/** How the draft is drawn for this person. */
export interface DraftAccess {
  mayDecide: boolean;
  confirmers: readonly string[];
}

/**
 * The draft, written for a person: the key properties, then the body as
 * headings and paragraphs, then the card's caveats (`review-draft.ts`). A
 * proposal that file cannot read shows the card's text instead.
 *
 * A confirmer's view has Approve as its submit, Edit fields at the top when
 * the draft has fields to edit, and Needs changes and Reject as the body's
 * last row. `mayDecide` false is the same draft read-only: Close alone, and a
 * line naming who can decide.
 *
 * `opts.edits` are the values Save edits kept: the draft shows them in place,
 * says which fields they are, and carries them to Approve in the metadata.
 */
export function draftView(
  card: ReviewedCard,
  proposal: PendingProposal,
  access: DraftAccess,
  opts: { edits?: Readonly<Record<string, string>>; editable?: boolean; alert?: { level: "error" | "success"; text: string } } = {},
): View {
  const edits = access.mayDecide ? (opts.edits ?? {}) : {};
  const operations = withValues(proposal, new Map(Object.entries(edits)));
  const text = draftBody(proposal.proposalText);
  const body = readableDraft(operations, caveatsOf(text)) ?? textSections(text);

  const headline = draftHeadline(operations);
  const head: unknown[] = [];
  if (opts.alert) head.push(alertBlock(opts.alert.level, opts.alert.text));
  const editable = access.mayDecide && opts.editable !== false;
  head.push({
    type: "section",
    text: { type: "mrkdwn", text: headline ? `*${escapeSlackText(headline)}*` : "*The draft*" },
    ...(editable ? { accessory: button(REVIEW_EDIT_ACTION_ID, "Edit fields", "edit") } : {}),
  });
  const edited = labelsOf(proposal, Object.keys(edits));
  if (edited.length) head.push(context(`:pencil2: Edited here: ${edited.join(", ")}. Approve writes these values.`));

  const tail: unknown[] = access.mayDecide
    ? [
        { type: "divider" },
        {
          type: "actions",
          block_id: "uno_review_decision",
          elements: [
            button(REVIEW_CHANGES_ACTION_ID, "Needs changes", "revise"),
            button(REVIEW_REJECT_ACTION_ID, "Reject", "cancel", "danger"),
          ],
        },
      ]
    : [context(readOnlyLine(access.confirmers))];
  const fitted = fitBody(body, MAX_VIEW_BLOCKS - head.length - tail.length);
  return modal(
    { channel: card.channel, ts: card.ts, ...(Object.keys(edits).length ? { edits } : {}) },
    [...head, ...fitted, ...tail],
    access.mayDecide ? { submit: APPROVE } : {},
  );
}

/** Said where a draft too long for one view was cut. */
const LEFT_OUT =
  "Part of this draft is too long for the pop-up and was left out here. Approving runs all of it, as staged.";

/** The draft inside the blocks the view has left, so a long draft can never
 *  push the decision out of the view; past the room, its later blocks go and a
 *  line says some was left out. */
function fitBody(draft: unknown[], room: number): unknown[] {
  if (draft.length <= room) return draft;
  return [...draft.slice(0, Math.max(0, room - 1)), context(LEFT_OUT)];
}

/** The card's text without its footer, which points at the pop-up itself. */
function draftBody(text: string): string {
  return text.replace(CONFIRM_FOOTER, "").trim();
}

function noteInput(opts: { required: boolean; label: string; hint: string }): unknown {
  return {
    type: "input",
    block_id: NOTE_BLOCK_ID,
    optional: !opts.required,
    label: { type: "plain_text", text: opts.label },
    hint: { type: "plain_text", text: opts.hint },
    element: { type: "plain_text_input", action_id: NOTE_ACTION_ID, multiline: true, max_length: NOTE_MAX_CHARS },
  };
}

/** Needs changes, pushed over the draft: the note uno-bot revises from. */
export function changesView(card: ReviewedCard): View {
  return modal(
    { channel: card.channel, ts: card.ts },
    [noteInput({ required: true, label: "What should change?", hint: "I revise the draft from this note, and the new card posts in the thread." })],
    { submit: "Send changes", callbackId: REVIEW_CHANGES_CALLBACK_ID, title: "Needs changes" },
  );
}

/** Reject, pushed over the draft: an optional reason. */
export function rejectView(card: ReviewedCard): View {
  return modal(
    { channel: card.channel, ts: card.ts },
    [
      line("Rejecting closes this proposal, and nothing runs."),
      noteInput({ required: false, label: "Reason", hint: "Optional. It shows on the card and in the thread." }),
    ],
    { submit: "Reject", callbackId: REVIEW_REJECT_CALLBACK_ID, title: "Reject proposal" },
  );
}

/** Edit fields, pushed over the draft, while the fields' options are read. */
export function editLoadingView(card: ReviewedCard): View {
  return modal({ channel: card.channel, ts: card.ts }, [line("Loading the fields…")], { title: "Edit fields" });
}

/**
 * Edit fields: the draft's fields as inputs, each holding the value the draft
 * shows now (saved edits included), with Save edits as the submit. A draft
 * with no field it can offer says so, with no submit.
 */
export function editView(card: ReviewedCard, fields: readonly EditableField[], values?: ReadonlyMap<string, string>): View {
  // The saved edits ride along, so a field this view does not offer keeps
  // its edit when Save edits writes them back to the draft.
  const meta = card;
  if (!fields.length) {
    return modal(meta, [line("Nothing in this draft can be edited here. Use Needs changes to ask for a revision.")], {
      callbackId: REVIEW_EDIT_CALLBACK_ID,
      title: "Edit fields",
    });
  }
  return modal(meta, fieldInputBlocks(fields, values), { submit: "Save edits", callbackId: REVIEW_EDIT_CALLBACK_ID, title: "Edit fields" });
}

/** What the note input holds, from a submit's `view.state` — trimmed, and
 *  empty when there is none. */
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
    context("Read-only. This proposal has already been decided."),
  ]);
}

function readOnlyLine(confirmers: readonly string[]): string {
  const who = confirmers.filter((id) => SLACK_USER_ID.test(id)).map((id) => `<@${id}>`);
  if (!who.length) return "Read-only. Nobody here can decide this proposal.";
  const names = who.length === 1 ? who[0]! : `${who.slice(0, -1).join(", ")} or ${who.at(-1)!}`;
  return `Read-only. Only ${names} can decide this proposal.`;
}

/** A card that cannot be decided any more, and why. No decision. */
export function closedView(
  card: ReviewedCard,
  why: { state: "expired"; stated?: StatedCardWords } | { state: "superseded" } | { state: "gone" },
): View {
  const meta = { channel: card.channel, ts: card.ts };
  switch (why.state) {
    case "expired":
      return modal(meta, [line(why.stated?.expired ?? "This proposal expired, so it can't be approved now. Ask me again and I'll set it up fresh.")]);
    case "superseded":
      return modal(meta, [line("This proposal was replaced by a newer one. Review the newest card in the thread instead.")]);
    case "gone":
      return modal(meta, [line("This proposal has already been decided.")]);
  }
}

/** One line in place of the draft: the decision registered, or the Gate's
 *  answer when it did not. */
export function noticeView(card: ReviewedCard, text: string): View {
  return modal({ channel: card.channel, ts: card.ts }, [line(text)]);
}

/** The card a view's `private_metadata` names, with any saved edits, or null
 *  for one this Worker did not write. */
export function reviewedCardOf(privateMetadata: string | undefined): ReviewedCard | null {
  if (!privateMetadata) return null;
  try {
    const parsed = JSON.parse(privateMetadata) as Partial<ReviewedCard>;
    if (typeof parsed.channel !== "string" || typeof parsed.ts !== "string") return null;
    const edits: Record<string, string> = {};
    if (parsed.edits && typeof parsed.edits === "object") {
      for (const [key, value] of Object.entries(parsed.edits)) if (typeof value === "string") edits[key] = value;
    }
    return { channel: parsed.channel, ts: parsed.ts, ...(Object.keys(edits).length ? { edits } : {}) };
  } catch {
    return null;
  }
}
