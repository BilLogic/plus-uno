// The Review pop-up's views: loading, the draft, the three views a confirmer
// pushes over it, and the one-line states that follow a decision or find
// nothing left to decide.
//
// Renders and posts nothing; `review-door.ts` decides which view to show and
// hands it to Slack.
//
// THE DECISION IS AN INPUT, AND SUBMIT IS THE FOOTER. Slack's view footer
// holds two buttons, submit and close, and nothing custom, so three decision
// buttons cannot sit there. The draft ends instead with the decision as a
// choice — Approve, Needs changes, Reject — and a note, and the footer's
// Submit decides it, beside Close: the decision is always one press from the
// fixed foot of the pop-up, however long the draft. Needs changes needs the
// note; Reject takes it as an optional reason. A card with answers of its
// own (`PendingProposal.choices`: a follow-up's Done · Still on it · Drop it)
// offers those in the same input instead, each deciding as its verdict.
//
// TEXT IS EDITED IN PLACE, AND NOTHING IS SAVED BY HAND. Every text field is
// an input in the draft itself, prefilled — a change's under the value it
// replaces (`review-draft.ts` § Before and after), a create's under its own
// label — and rides the Submit with the decision; a field the reading does not
// draw is added after the draft. A select needs its options read, so it sits
// behind an Edit fields button at the top, which pushes a view of its own
// (`views.push`) with no submit: each pick keeps itself, and its close, Done,
// goes back to the draft.
//
// KEPT PICKS LIVE ON THE CARD'S RECORD, not in a view. Each pick is merged
// into the person's kept picks in the thread store (`ThreadState.keepPick`),
// one transaction per pick, so two quick picks both survive whichever lands
// first; the draft is redrawn from the merged set, and Approve reads it from
// the same record. Approve still holds every value to the live card and the
// database's options (`reviewEdits`), so nothing kept is trusted to run.
//
// Every view carries the card it is about in `private_metadata`, as the
// card's own buttons carry it in the message they sit on: that ts is the
// identity, and the decision is resolved against it and nothing else.
import { textSections } from "./render";
import { CONFIRM_FOOTER, withoutInternalFields } from "./proposal-render";
import { clip } from "./card-block";
import { splitDeadline } from "./card-deadline";
import { EXPIRED_CARD } from "./gate-note";
import { anatomyBlocks, decisionWords, DESCRIPTION_CHARS, reviewTitle, type DecisionWords, type DraftAlert, type DraftAnatomy } from "./review-anatomy";
import { batchAnatomy } from "./review-batch";
import { SLACK_USER_ID, escapeSlackText, unescapeSlackText } from "./mrkdwn";
import {
  draftValuesOf,
  FIELD_ACTION_ID,
  FIELD_BLOCK_PREFIX,
  fieldInputBlocks,
  fieldSelectBlocks,
  fieldsFromBlocks,
  inlineFields,
  labelsOf,
  withValues,
  type EditableField,
  type ReviewViewState,
} from "./review-fields";
import { anatomyOf, caveatsOf, draftHeadline, readableDraft } from "./review-draft";
import type { NotionDatabaseLinks } from "./review-notion-create";
import { proposalOperations, type DecidedProposal, type PendingProposal, type ProposalOperation, type ReviewChoice, type StatedCardWords } from "../thread-state/index";
import type { ReviewDecision } from "../gate/index";

/** The draft's one button; `slack/interactive.ts` routes it. */
export const REVIEW_EDIT_ACTION_ID = "uno_review_edit";

/** Each view's `callback_id`, which names its submit to the endpoint. The
 *  draft's submit decides it. */
export const REVIEW_CALLBACK_ID = "uno_review_draft";
export const REVIEW_EDIT_CALLBACK_ID = "uno_review_edit_fields";

/** The decision input: Approve, Needs changes or Reject. */
export const CHOICE_BLOCK_ID = "uno_review_choice";
const CHOICE_ACTION_ID = "uno_review_choice_input";

/** The note input: Needs changes' note, Reject's reason. */
export const NOTE_BLOCK_ID = "uno_review_note";
const NOTE_ACTION_ID = "uno_review_note_input";

/** Slack's cap on a `plain_text_input`. */
const NOTE_MAX_CHARS = 3000;

/** The card a view is about, as `private_metadata` carries it. */
export interface ReviewedCard {
  channel: string;
  ts: string;
}

/** The title of a view that is not a draft: loading, a closed card, a notice.
 *  A draft is titled for its tool (`review-anatomy.ts` § `reviewTitle`), at
 *  most Slack's 24 characters. */
const TITLE = "Review proposal";

/** Slack's cap on a view's blocks. A long draft can pass it, so `fitBody`
 *  trims the draft to the room left once the head and the decision row are
 *  reserved. */
const MAX_VIEW_BLOCKS = 100;

type View = Record<string, unknown>;

/** The one alert a view carries, replaced rather than stacked. */
export const REVIEW_ALERT_BLOCK_ID = "uno_review_alert";

/** What a view's `private_metadata` holds for this card. */
export function reviewMetadata(card: ReviewedCard): string {
  return JSON.stringify({ channel: card.channel, ts: card.ts });
}

function modal(
  card: ReviewedCard,
  blocks: unknown[],
  opts: { submit?: string; close?: string; callbackId?: string; title?: string } = {},
): View {
  return {
    type: "modal",
    callback_id: opts.callbackId ?? REVIEW_CALLBACK_ID,
    title: { type: "plain_text", text: opts.title ?? TITLE },
    close: { type: "plain_text", text: opts.close ?? "Close" },
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

/** Slack's cap on an alert's text. */
const ALERT_CHARS = 200;

// AN ALERT NAMES NOBODY. Slack's alert takes mrkdwn, but its docs say nothing
// of a mention inside one, and none has been seen to render; a pill that came
// out as `<@U…>` would be the one line a person reads first. So an alert that
// would name someone says its outcome in plain text, and the people and the
// channel go on a `rich_text` line under it, as `user` and `channel`
// elements, which render as pills everywhere a modal does.

/** Slack's cap on a text element of a rich text line. */
const RICH_TEXT_CHARS = 3000;

/** A mention, a channel or a link in mrkdwn, as this file and the card write them. */
const MRKDWN_TOKEN = /<@([UW][A-Z0-9]{6,})>|<#([CG][A-Z0-9]{6,})(?:\|[^>]*)?>|<(https?:\/\/[^|>\s]+)(?:\|([^>]*))?>/g;

/** mrkdwn's entities back to the characters: rich text is read as written. */
const unescaped = unescapeSlackText;

/** A line of mrkdwn as rich text elements: each `<@U…>` a user pill, each
 *  `<#C…>` a channel pill, each `<url|text>` a link, the rest its words. */
export function richElements(mrkdwn: string): unknown[] {
  const out: unknown[] = [];
  let at = 0;
  const words = (t: string) => {
    if (t) out.push({ type: "text", text: clip(unescaped(t), RICH_TEXT_CHARS) });
  };
  for (const m of mrkdwn.matchAll(MRKDWN_TOKEN)) {
    words(mrkdwn.slice(at, m.index));
    if (m[1]) out.push({ type: "user", user_id: m[1] });
    else if (m[2]) out.push({ type: "channel", channel_id: m[2] });
    else out.push({ type: "link", url: m[3]!, ...(m[4] ? { text: unescaped(m[4]) } : {}) });
    at = m.index + m[0].length;
  }
  words(mrkdwn.slice(at));
  return out;
}

/** One rich text line: what an alert would have said with a pill in it. */
function richLine(elements: readonly unknown[]): unknown {
  return { type: "rich_text", elements: [{ type: "rich_text_section", elements }] };
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
  /** When an item of a decision report closes undecided: its card shows
   *  neither who decides nor when, so the decision's own pop-up says both. */
  closesAt?: number;
  /** A decided card, opened from View: how it closed, who closed it and
   *  when. Drawn read-only under an alert saying so, without its where line
   *  and caveats, which were about a decision now made. */
  decided?: Pick<DecidedProposal, "decision" | "by" | "reason" | "at">;
}

/** How `draftView` draws the draft beyond who may decide it. */
export interface DraftOptions {
  edits?: Readonly<Record<string, string>>;
  /** What was typed into the fields in place, kept when the draft is redrawn
   *  around an alert: shown, never stored. */
  typed?: ReadonlyMap<string, string>;
  editable?: boolean;
  alert?: { level: "error" | "success"; text: string };
  /** Where the Notion databases a create lands in open, for its where line. */
  databases?: NotionDatabaseLinks;
}

/**
 * The draft, written for a person, under its tool's title. A tool read in the
 * shared anatomy (`review-draft.ts` § `anatomyOf`) is drawn in its zones —
 * what it does and where, its caveats as alerts, the object as a card, then
 * its content. Any other: the key properties, then the body as headings and
 * paragraphs, then the card's caveats; and a proposal that file cannot read
 * shows the card's text, its internal inputs left out.
 *
 * A confirmer's view has Edit fields at the top when the draft has fields to
 * edit, ends with the decision and a note, and has Submit as its footer.
 * `mayDecide` false is the same draft read-only: no input, Close alone, and
 * an `info` alert at the top naming who can decide. A `decided` card is
 * read-only too, under a `success` alert (or a plain one for a Reject) saying
 * who decided it and, where the reading knows, where it went.
 *
 * `opts.edits` are the values kept under Edit fields: the draft shows them in
 * place and says which fields they are. Approve reads them from the card's
 * record, not from the view.
 */
export function draftView(
  card: ReviewedCard,
  proposal: PendingProposal,
  access: DraftAccess,
  opts: DraftOptions = {},
): View {
  const { mayDecide, operations, anatomy, reading, body, editButton, edited } = drawDraft(proposal, access, opts);

  const head: unknown[] = [];
  // A refused edit's alert stays first, above every zone; then, for a view
  // that cannot decide, why not.
  if (opts.alert) head.push(alertBlock(opts.alert.level, opts.alert.text));
  if (access.decided) head.push(...decidedAlert(access.decided, proposal, reading));
  else if (!mayDecide) head.push(stateAlert("info", "Read-only."), richLine(readOnlyLine(access.confirmers)));
  if (!anatomy) head.push(headlineBlock(operations, editButton), ...edited);

  const words = decisionWords(operations);
  const tail: unknown[] = mayDecide
    ? [
        { type: "divider" },
        choiceInput(proposal.choices, {
          ...words,
          ...(anatomy?.approve ? { confirm: anatomy.approve } : {}),
          ...(anatomy?.revise ? { revise: anatomy.revise } : {}),
        }),
        noteInput(Boolean(proposal.choices?.length), Boolean(anatomy)),
        ...(access.closesAt !== undefined ? [context(openLine(access.closesAt, access.confirmers))] : []),
      ]
    : [];
  const fitted = fitBody(body, MAX_VIEW_BLOCKS - head.length - tail.length);
  return modal(
    { channel: card.channel, ts: card.ts },
    [...head, ...fitted, ...tail],
    { title: reviewTitle(operations), ...(mayDecide ? { submit: SUBMIT } : {}) },
  );
}

/** The draft drawn for this person: its reading, and its body as blocks,
 *  before the head and the decision row a view puts around it. */
function drawDraft(
  proposal: PendingProposal,
  access: DraftAccess,
  opts: DraftOptions,
): {
  mayDecide: boolean;
  operations: ProposalOperation[];
  anatomy: DraftAnatomy | null;
  reading: DraftAnatomy | null;
  body: unknown[];
  editButton: unknown;
  edited: unknown[];
} {
  const mayDecide = access.mayDecide && !access.decided;
  const edits = mayDecide ? (opts.edits ?? {}) : {};
  const operations = withValues(proposal, new Map(Object.entries(edits)));
  const text = draftBody(proposal.proposalText);
  const inline = mayDecide ? inlineKeysOf(proposal) : new Set<string>();
  const inPlace = new Map(
    inlineFields(proposal)
      .filter((f) => inline.has(f.key))
      .map((f) => [f.key, { ...f, value: opts.typed?.get(f.key) ?? edits[f.key] ?? f.value }] as const),
  );
  // Edit fields only for what the draft does not already hold in place.
  const editable =
    mayDecide && opts.editable !== false && [...draftValuesOf(proposal).keys()].some((key) => !inline.has(key));
  const editButton = editable ? button(REVIEW_EDIT_ACTION_ID, "Edit fields", "edit") : undefined;
  const detail = {
    ...(proposal.before ? { before: proposal.before } : {}),
    ...(proposal.issue ? { issue: proposal.issue } : {}),
    ...(proposal.facts ? { facts: proposal.facts } : {}),
    inline: inPlace,
    editing: mayDecide,
    ...(editButton ? { editButton } : {}),
    ...(opts.databases ? { databases: opts.databases } : {}),
  };
  const editedLabels = labelsOf(proposal, Object.keys(edits));
  const edited = editedLabels.length ? [context(`Edited here: ${editedLabels.join(", ")}. Approve writes these values.`)] : [];

  // A tool read in the shared anatomy (`review-anatomy.ts`), or a batch
  // (`review-batch.ts`), opens on what it does; any other draft opens on its
  // headline, as before. Once decided, its where line and caveats go: the
  // alert at the top says what happened instead. A reading that sets Edit
  // fields beside its facts needs no line of its own for it.
  const reading = operations.length > 1 ? batchAnatomy(operations, text, detail) : anatomyOf(operations, text, detail);
  const anatomy = reading && access.decided ? settled(reading) : reading;
  const holdsEdit = !!editButton && !!anatomy?.content.some((b) => (b as { accessory?: unknown }).accessory === editButton);
  const read = anatomy
    ? anatomyBlocks(anatomy, [...(editButton && !holdsEdit ? [{ type: "section", text: { type: "mrkdwn", text: "*Fields*" }, accessory: editButton }] : []), ...edited])
    : (readableDraft(operations, access.decided ? [] : caveatsOf(text), detail) ?? textSections(withoutInternalFields(text)));
  // A field the reading did not draw — the batch has a tool it cannot read —
  // still goes in place, after the draft, so it is never left uneditable.
  const drawn = new Set(read.map((b) => (b as { block_id?: string }).block_id));
  const rest = [...inPlace.values()].filter((f) => !drawn.has(`${FIELD_BLOCK_PREFIX}${f.key}`));
  const body = rest.length ? [...read, { type: "divider" }, ...fieldInputBlocks(rest)] : read;
  return { mayDecide, operations, anatomy, reading, body, editButton, edited };
}

/** A draft with no reading opens on its headline, and Edit fields beside it. */
function headlineBlock(operations: readonly ProposalOperation[], editButton?: unknown): unknown {
  const headline = draftHeadline(operations);
  return {
    type: "section",
    text: { type: "mrkdwn", text: headline ? `*${escapeSlackText(headline)}*` : "*The draft*" },
    ...(editButton ? { accessory: editButton } : {}),
  };
}

/**
 * A card's draft as its Review pop-up draws it for someone who cannot decide
 * it — the same reading, without the alert saying so, the inputs or the
 * decision — for a view that shows a draft beside others: the "which one?"
 * pop-up's Show draft (`which-card-view.ts`).
 *
 * @param proposal - The card
 * @param opts.databases - Where the Notion databases a create lands in open
 */
export function draftBlocks(proposal: PendingProposal, opts: { databases?: NotionDatabaseLinks } = {}): unknown[] {
  const { anatomy, operations, body } = drawDraft(proposal, { mayDecide: false, confirmers: [] }, opts);
  return anatomy ? body : [headlineBlock(operations), ...body];
}

/** A decided card's reading: its content, without the where line and the
 *  caveats, which were about the decision — or its own settled reading, where
 *  it has one. */
function settled(anatomy: DraftAnatomy): DraftAnatomy {
  const { where: _where, alerts: _alerts, settled: own, ...rest } = anatomy;
  return own ?? rest;
}

/** How a decision reads at the top of View: the alert, its level, and the
 *  verb its line opens with. A card's own answers read "Answered" for an
 *  Approve or a Reject alike. */
const DECISIONS: Record<"confirm" | "cancel" | "noted" | "withdrawn", { alert: string; level: DraftAlert["level"]; verb: string }> = {
  confirm: { alert: "Approved.", level: "success", verb: "Approved" },
  cancel: { alert: "Rejected.", level: "info", verb: "Rejected" },
  noted: { alert: "Noted.", level: "info", verb: "Noted" },
  withdrawn: { alert: "Withdrawn.", level: "info", verb: "Withdrawn" },
};

/** What a replaced card says, in View and on Review alike. */
const REPLACED_CARD = "This proposal was replaced by a newer one. Review the newest card in the thread instead.";

/** What a report's item whose time ran out says, as its card on the report
 *  does (`decision-cards.ts` `shownAs`). */
const ITEM_EXPIRED = "Closed, no decision.";

/** When a card closed, as View says it: "Oct 19 at 9:13 AM ET". */
export function closedWhen(at: number): string {
  const part = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", ...opts }).format(new Date(at));
  return `${part({ month: "short", day: "numeric" })} at ${part({ hour: "numeric", minute: "2-digit" })} ET`;
}

/** Words split at their first full stop: the outcome, and what follows it. */
function firstSentence(text: string): [string, string] {
  const split = /^(.+?[.!?])\s+(\S.*)$/s.exec(text.trim());
  return split ? [split[1]!, split[2]!] : [text.trim(), ""];
}

/**
 * What a decided card says at the top (#1362): how it closed, as an alert,
 * then a rich text line with who closed it and when, and what else there is
 * to say. Decided: "Approved.", "Rejected.", "Answered." on a card with its
 * own answers, "Noted." or "Withdrawn.", over "Approved by @Bill on Oct 19 at
 * 9:13 AM ET to post in #channel." or "Noted by @Bill on Oct 19 at 9:13 AM
 * ET: deliberate.". Replaced or out of time, it says what Review says of such
 * a card, over when: "This proposal was replaced by a newer one." over
 * "Replaced on Oct 19 at 9:13 AM ET, after @Bill asked for changes. Review
 * the newest card in the thread instead.", or its expired words — a stated
 * card's own, a report item's "Closed, no decision." — over "Closed on Oct
 * 21 at 9:00 AM ET.". A card closed before the time was kept names no time.
 */
function decidedAlert(
  decided: NonNullable<DraftAccess["decided"]>,
  proposal: PendingProposal,
  reading: DraftAnatomy | null,
): unknown[] {
  const who = decided.by && SLACK_USER_ID.test(decided.by) ? decided.by : undefined;
  const user = who ? [{ type: "user", user_id: who }] : [];
  const when = decided.at !== undefined ? [{ type: "text", text: ` on ${closedWhen(decided.at)}` }] : [];
  const text = (t: string) => ({ type: "text", text: t });

  if (decided.decision === "replaced") {
    const [outcome, next] = firstSentence(REPLACED_CARD);
    const asked = user.length ? [text(", after "), ...user, text(" asked for changes")] : [];
    return [stateAlert("warning", outcome), richLine([text("Replaced"), ...when, ...asked, text(`. ${next}`)])];
  }
  if (decided.decision === "expired") {
    // A stated card's own words; a report's item as its card says it; any
    // other card as Review says it.
    const [outcome, next] = firstSentence(proposal.stated?.expired ?? (proposal.item ? ITEM_EXPIRED : EXPIRED_CARD));
    const alert = stateAlert("warning", outcome);
    if (!when.length && !next) return [alert];
    const closed = when.length ? [text("Closed"), ...when, text(next ? `. ${next}` : ".")] : [text(next)];
    return [alert, richLine(closed)];
  }

  const close = DECISIONS[decided.decision];
  const answered = !!proposal.choices?.length && (decided.decision === "confirm" || decided.decision === "cancel");
  const verb = answered ? "Answered" : close.verb;
  const alert = stateAlert(close.level, answered ? "Answered." : close.alert);
  const by = user.length ? [text(" by "), ...user] : [];
  const reason = answered || decided.decision === "confirm" ? "" : (decided.reason?.trim() ?? "");
  const where = verb === "Approved" && reading?.destination ? [text(" to "), ...richElements(reading.destination)] : [];
  const tail = reason ? [text(`: ${clip(reason, RICH_TEXT_CHARS - 2)}`)] : [];
  // Nobody, no time and nowhere to name: the alert says it all.
  if (!by.length && !when.length && !where.length && !tail.length) return [alert];
  const stop = /[.!?]$/.test(reason) ? [] : [text(".")];
  return [alert, richLine([text(verb), ...by, ...when, ...where, ...tail, ...stop])];
}

/** The keys of the fields the draft holds as inputs in place: every text
 *  field, drawn where the reading puts it or after the draft. */
export function inlineKeysOf(proposal: PendingProposal): Set<string> {
  return new Set(inlineFields(proposal).map((f) => f.key));
}

/** The draft's footer submit, which decides it. */
const SUBMIT = "Submit";

/** Said where a draft too long for one view was cut. */
const LEFT_OUT =
  "Part of this draft is too long for the pop-up and was left out here. Approving runs all of it, as staged.";

/** The draft inside the blocks the view has left, so a long draft can never
 *  push the decision out of the view; past the room, its later blocks go and a
 *  line says some was left out. A field in place is never cut: what can be
 *  edited stays editable, whatever is left out around it. */
export function fitBody(draft: unknown[], room: number, leftOut: string = LEFT_OUT): unknown[] {
  if (draft.length <= room) return draft;
  const isInput = (b: unknown) => (b as { type?: string }).type === "input";
  let others = Math.max(0, room - 1 - draft.filter(isInput).length);
  const out: unknown[] = [];
  let cut = false;
  for (const block of draft) {
    if (isInput(block)) out.push(block);
    else if (others > 0) {
      out.push(block);
      others--;
    } else if (!cut) {
      out.push(context(leftOut));
      cut = true;
    }
  }
  return out;
}

/** The card's text without its footer, which points at the pop-up itself. */
function draftBody(text: string): string {
  // The card's deadline is the thread's to show, not a line of the draft.
  return splitDeadline(text).text.replace(CONFIRM_FOOTER, "").trim();
}

const CHOICES: ReadonlyArray<[ReviewDecision, string]> = [
  ["confirm", "Approve"],
  ["revise", "Needs changes"],
  ["cancel", "Reject"],
];

/** A card's own answer, as its radio option's value carries it: the verdict
 *  and the answer, so Submit is read without the card. The door holds both
 *  to the card's own list before anything runs. */
const OWN_CHOICE = "choice:";

/** An option's description: what choosing it does, plain, at most 75. */
function description(text: string): { description: { type: "plain_text"; text: string } } {
  return { description: { type: "plain_text", text: clip(text, DESCRIPTION_CHARS) } };
}

/** The decision: Approve, Needs changes and Reject, each saying what it does
 *  on this card — or the card's own answers, each with its decided words. */
function choiceInput(own: readonly ReviewChoice[] | undefined, words: DecisionWords): unknown {
  const options = own?.length
    ? own.map((c) => ({
        value: `${OWN_CHOICE}${c.verdict}:${c.value}`,
        text: { type: "mrkdwn", text: c.label },
        ...(c.decided?.trim() ? description(c.decided.trim()) : {}),
      }))
    : CHOICES.map(([value, text]) => ({ value, text: { type: "plain_text", text }, ...description(words[value]) }));
  return {
    type: "input",
    block_id: CHOICE_BLOCK_ID,
    label: { type: "plain_text", text: own?.length ? "Your answer" : "Decision" },
    element: { type: "radio_buttons", action_id: CHOICE_ACTION_ID, options },
  };
}

/** The note's hint. A draft in the shared anatomy leaves out "I revise the
 *  draft from it", which Needs changes' own description already says. */
function noteInput(own = false, anatomy = false): unknown {
  const hint = own
    ? "Optional context for your answer."
    : anatomy
      ? "Needs changes: what should change. Reject: an optional reason."
      : "Needs changes: what should change. I revise the draft from it. Reject: an optional reason.";
  return {
    type: "input",
    block_id: NOTE_BLOCK_ID,
    optional: true,
    label: { type: "plain_text", text: "Note" },
    hint: { type: "plain_text", text: hint },
    element: { type: "plain_text_input", action_id: NOTE_ACTION_ID, multiline: true, max_length: NOTE_MAX_CHARS },
  };
}

type ViewValues = { values?: Record<string, Record<string, { value?: unknown; selected_option?: { value?: unknown } }>> };

/**
 * The draft's Submit, read from its `view.state`: the decision and the
 * trimmed note, or the errors Slack shows under the input that needs one —
 * no choice made, or Needs changes with no note.
 */
export function draftSubmitOf(
  state: unknown,
): { ok: true; decision: ReviewDecision; note: string; choice?: string } | { ok: false; errors: Record<string, string> } {
  const values = (state as ViewValues | undefined)?.values;
  const picked = values?.[CHOICE_BLOCK_ID]?.[CHOICE_ACTION_ID]?.selected_option?.value;
  // One of the card's own answers: its verdict decides, and the door checks
  // the answer against the card.
  const own = typeof picked === "string" ? /^choice:(confirm|cancel):(.+)$/.exec(picked) : null;
  if (own) return { ok: true, decision: own[1] as "confirm" | "cancel", note: reviewNoteOf(state), choice: own[2]! };
  const decision = CHOICES.find(([value]) => value === picked)?.[0];
  if (!decision) return { ok: false, errors: { [CHOICE_BLOCK_ID]: "Choose Approve, Needs changes or Reject." } };
  const note = reviewNoteOf(state);
  if (decision === "revise" && !note) {
    return { ok: false, errors: { [NOTE_BLOCK_ID]: "Write what to change, so I can revise the draft." } };
  }
  return { ok: true, decision, note };
}

/** A decision, as the draft's Submit sends it. */
export interface ReviewSubmit {
  decision: ReviewDecision;
  note?: string;
  choice?: string;
  /** Approve only: the state holding the fields in place, and those fields
   *  with the values they opened with. */
  state?: ReviewViewState;
  fields?: EditableField[];
}

/**
 * The draft's Submit, read off the submitted view: the decision and its note,
 * and for Approve the fields in place from the state, read against the blocks
 * they were offered in. Only Approve writes, so only Approve carries edits;
 * the picks kept under Edit fields it reads from the card's record. Or the
 * errors Slack shows under the input that needs one.
 */
export function reviewSubmitOf(
  view: { state?: unknown; blocks?: unknown; private_metadata?: string },
): { ok: true; request: ReviewSubmit } | { ok: false; errors: Record<string, string> } {
  const submitted = draftSubmitOf(view.state);
  if (!submitted.ok) return submitted;
  const { decision, note, choice } = submitted;
  const request: ReviewSubmit = { decision, ...(note ? { note } : {}), ...(choice ? { choice } : {}) };
  if (decision !== "confirm") return { ok: true, request };
  const fields = fieldsFromBlocks(Array.isArray(view.blocks) ? view.blocks : []);
  const values = (view.state as { values?: ReviewViewState } | undefined)?.values;
  return {
    ok: true,
    request: { ...request, ...(fields.length && values ? { state: values, fields } : {}) },
  };
}

/** Edit fields, pushed over the draft, while the fields' options are read. */
export function editLoadingView(card: ReviewedCard): View {
  return modal({ channel: card.channel, ts: card.ts }, [line("Loading the fields…")], EDIT_VIEW);
}

/** Edit fields has no submit: every pick keeps itself, so its close only goes
 *  back to the draft. */
const EDIT_VIEW = { callbackId: REVIEW_EDIT_CALLBACK_ID, title: "Edit fields", close: "Done" };

/**
 * Edit fields: the draft's selects, each holding the value the draft shows
 * now (kept picks included), each pick kept on the draft as it is made. A
 * draft with no select it can offer says so. `alert` is a pick refused.
 */
export function editView(
  card: ReviewedCard,
  fields: readonly EditableField[],
  values?: ReadonlyMap<string, string>,
  alert?: string,
): View {
  const selects = fieldSelectBlocks(fields, values);
  if (!selects.length) {
    return modal(card, [line("Nothing in this draft can be edited here. Use Needs changes to ask for a revision.")], EDIT_VIEW);
  }
  return modal(card, [...(alert ? [alertBlock("error", alert)] : []), ...selects], EDIT_VIEW);
}

/** What the note input holds, from a submit's `view.state` — trimmed, and
 *  empty when there is none. */
function reviewNoteOf(state: unknown): string {
  const values = (state as ViewValues | undefined)?.values;
  const value = values?.[NOTE_BLOCK_ID]?.[NOTE_ACTION_ID]?.value;
  return typeof value === "string" ? value.trim() : "";
}

/**
 * An item of a decision report, closed before its record kept the decided
 * draft (#1362) and opened from View: its words off the report's record,
 * read-only, outcome included. Every item closed since keeps its draft, which
 * View draws instead (`draftView` with `decided`).
 */
export function decidedView(card: ReviewedCard, cardText: string, title?: string): View {
  return modal(
    card,
    [...textSections(withoutInternalFields(draftBody(cardText))), context("Read-only. This proposal has already been decided.")],
    title ? { title } : {},
  );
}

/** Said under the outcome when the decided draft is no longer kept: a card
 *  decided before its record kept it, or past its lifetime. */
export const DRAFT_NOT_KEPT = "The draft behind this card is no longer kept, so only its outcome shows here. The card in the thread has the rest.";

/** An outcome line led by an emoji: a run cut off before it reported back,
 *  which still leads with `:warning:`, or a card decided before an Approve or
 *  a Reject said so in words alone, which still ends with ✅ or ⛔. */
const EMOJI_OUTCOME = /^:(white_check_mark|no_entry|warning):\s*/;

/** An outcome line's level, from its words: "Approved by", "Answered by",
 *  "Rejected by", "Canceled by", or a stated card's ⛔ phrase ending
 *  ", decided by <@U>." (`statedCancelledNote`). */
function outcomeLevelOf(words: string): DraftAlert["level"] | null {
  if (/^(Approved|Answered) by /.test(words)) return "success";
  // Either spelling: a card decided before "Canceled" still says "Cancelled".
  if (/^(Rejected|Cancell?ed)\b/.test(words)) return "info";
  const stated = /, decided by <@([^>]+)>\.$/.exec(words);
  return stated && SLACK_USER_ID.test(stated[1]!) ? "info" : null;
}

/** A decided card's outcome line, as the card's message ends with it: the
 *  level its words mean — or, on a line led by an emoji, the level its emoji
 *  means — and its words without the emoji. */
function outcomeOf(cardText: string): { level: DraftAlert["level"]; text: string } | null {
  const last = cardText.split("\n").map((l) => l.trim()).filter(Boolean).at(-1) ?? "";
  const emoji = EMOJI_OUTCOME.exec(last);
  if (emoji) {
    const level = emoji[1] === "white_check_mark" ? "success" : emoji[1] === "warning" ? "warning" : "info";
    return { level, text: last.slice(emoji[0].length) };
  }
  const level = outcomeLevelOf(last);
  return level ? { level, text: last } : null;
}

/**
 * A decided card opened from View when its record keeps no draft — decided
 * before the record was kept, or past its `DECIDED_TTL_MS`: the outcome the
 * card's message ends with, under an alert at the level its words mean
 * (the line names who decided, so it is rich text, not the alert), and a line
 * saying the draft is gone. A message with no outcome line reads as decided,
 * plainly.
 */
export function outcomeView(card: ReviewedCard, cardText: string): View {
  const outcome = outcomeOf(cardText);
  return modal(card, [
    stateAlert(outcome?.level ?? "info", "This proposal has already been decided."),
    ...(outcome ? [richLine(richElements(outcome.text))] : []),
    line(DRAFT_NOT_KEPT),
  ]);
}

/** Who may decide a report's item and until when: "Open until Mon 9:00 ET ·
 *  <@A> or <@B> can decide." */
export function openLine(closesAt: number, confirmers: readonly string[]): string {
  const when = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit", hourCycle: "h23" }).format(new Date(closesAt));
  const who = confirmers.filter((id) => SLACK_USER_ID.test(id)).map((id) => `<@${id}>`);
  const names = who.length <= 1 ? (who[0] ?? "") : `${who.slice(0, -1).join(", ")} or ${who.at(-1)!}`;
  return `Open until ${when} ET${names ? ` · ${names} can decide.` : "."}`;
}

/** Who can decide a read-only draft, as rich text elements: "Only @A or @B
 *  can decide this proposal." */
function readOnlyLine(confirmers: readonly string[]): unknown[] {
  const who = confirmers.filter((id) => SLACK_USER_ID.test(id));
  if (!who.length) return [{ type: "text", text: "Nobody here can decide this proposal." }];
  const names = who.flatMap((id, i) => [
    ...(i === 0 ? [] : [{ type: "text", text: i === who.length - 1 ? " or " : ", " }]),
    { type: "user", user_id: id },
  ]);
  return [{ type: "text", text: "Only " }, ...names, { type: "text", text: " can decide this proposal." }];
}

/** A state's alert: plain text, the outcome only. */
function stateAlert(level: DraftAlert["level"], text: string): unknown {
  return { type: "alert", level, text: { type: "plain_text", text: clip(text, ALERT_CHARS) } };
}

/**
 * A state in place of the draft (§ 14): an alert with the outcome, then one
 * line saying what happens next. A sentence that says both is split at its
 * first full stop: "Approved. I'm running it now…" is the alert "Approved."
 * over the line "I'm running it now…".
 *
 * @param level - `success` for an Approve, `info` for a Reject and for
 *   sent back and being revised, `warning` for expired and replaced
 * @param text - The outcome, and what happens next after its first sentence
 * @param title - The draft's title, where the view knows the card's tool
 */
export function stateView(card: ReviewedCard, level: DraftAlert["level"], text: string, title?: string): View {
  const split = /^(.+?[.!?])\s+(\S.*)$/s.exec(text.trim());
  const [outcome, next] = split ? [split[1]!, split[2]!] : [text.trim(), ""];
  return modal({ channel: card.channel, ts: card.ts }, [stateAlert(level, outcome), ...(next ? [line(next)] : [])], title ? { title } : {});
}

/** A card that cannot be decided any more, and why. No decision. Titled for
 *  the card's tool where the lookup that found it named its batch. */
export function closedView(
  card: ReviewedCard,
  why:
    | { state: "expired"; stated?: StatedCardWords; operations?: readonly ProposalOperation[] }
    | { state: "superseded"; operations?: readonly ProposalOperation[] }
    | { state: "gone"; decided?: Pick<DecidedProposal, "proposal"> },
): View {
  const title = closedTitle(why);
  switch (why.state) {
    case "expired":
      return stateView(card, "warning", why.stated?.expired ?? EXPIRED_CARD, title);
    case "superseded":
      return stateView(card, "warning", REPLACED_CARD, title);
    case "gone":
      return stateView(card, "info", "This proposal has already been decided. Its outcome is on the card in the thread.", title);
  }
}

/** A closed card's title: its tool's, from the batch its lookup named, or
 *  nothing (the generic title) when the lookup named none. */
export function closedTitle(
  why: { operations?: readonly ProposalOperation[]; decided?: Pick<DecidedProposal, "proposal"> },
): string | undefined {
  const operations = why.operations ?? (why.decided ? proposalOperations(why.decided.proposal) : undefined);
  return operations?.length ? reviewTitle(operations) : undefined;
}

/** One line in place of the draft: the decision registered, or the Gate's
 *  answer when it did not — under the card's title where the door knows it. */
export function noticeView(card: ReviewedCard, text: string, title?: string): View {
  return modal({ channel: card.channel, ts: card.ts }, [line(text)], title ? { title } : {});
}

/** The card a view's `private_metadata` names, or null for one this Worker
 *  did not write. */
export function reviewedCardOf(privateMetadata: string | undefined): ReviewedCard | null {
  if (!privateMetadata) return null;
  try {
    const parsed = JSON.parse(privateMetadata) as Partial<ReviewedCard>;
    if (typeof parsed.channel !== "string" || typeof parsed.ts !== "string") return null;
    return { channel: parsed.channel, ts: parsed.ts };
  } catch {
    return null;
  }
}

/** A pick under Edit fields, as a `block_actions` payload carries it. */
export interface ReviewPick {
  /** The Edit fields view, and the draft under it. */
  viewId: string;
  rootViewId: string;
  card: ReviewedCard;
  userId: string;
  /** The Edit fields view's blocks: the selects it offered. */
  blocks: readonly unknown[];
  /** The field picked, by key, and the option picked. */
  pick: { key: string; value: string };
}

type PickPayload = {
  user?: { id?: string };
  actions?: Array<{ action_id?: string; block_id?: string; selected_option?: { value?: string } | null }>;
  view?: { id?: string; root_view_id?: string; callback_id?: string; private_metadata?: string; blocks?: unknown };
};

/**
 * A `block_actions` payload read as a pick under Edit fields, or null when it
 * is anything else: another view's action, or a pick that names no field, no
 * option or no draft under it.
 */
export function reviewPickOf(payload: PickPayload): ReviewPick | null {
  const { view } = payload;
  const action = payload.actions?.[0];
  if (view?.callback_id !== REVIEW_EDIT_CALLBACK_ID || action?.action_id !== FIELD_ACTION_ID) return null;
  const card = reviewedCardOf(view.private_metadata);
  const userId = payload.user?.id;
  const key = action.block_id?.startsWith(FIELD_BLOCK_PREFIX) ? action.block_id.slice(FIELD_BLOCK_PREFIX.length) : "";
  const value = action.selected_option?.value;
  if (!card || !userId || !view.id || !view.root_view_id || view.root_view_id === view.id || !key || !value) return null;
  return {
    viewId: view.id,
    rootViewId: view.root_view_id,
    card,
    userId,
    blocks: Array.isArray(view.blocks) ? view.blocks : [],
    pick: { key, value },
  };
}
