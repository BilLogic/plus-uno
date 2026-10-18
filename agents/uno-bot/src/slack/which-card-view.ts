// The "which one?" pop-up's views: every waiting card as a row to approve,
// cancel or leave, each card's draft on demand, and the lines that follow
// Done.
//
// Renders and posts nothing; `which-card.ts` decides which view to show and
// hands it to Slack.
//
// ONE POP-UP, ONE ROW PER CARD. The question's one button, Review, opens
// "Review cards". Each waiting card is a row: a section with its headline and
// what it does, a Show draft button as its accessory, and under it an input
// block holding a three-way choice, Approve / Cancel / Leave, that starts on
// Leave. An optional note under the rows is the reason said on each card
// canceled. Done applies every row's choice; Leave does nothing.
//
// EACH ROW IS READ FROM ITS OWN BLOCK, AND NOWHERE ELSE. A row's input block
// is keyed by its card's ts (`uno_which_choice_<ts>`), and Done reads each
// listed card's choice only from the submitted state under that block, from
// the one radio control it draws (`whichSubmitOf`). Nothing is read from the
// view's metadata, the button's value or any stored decision. A row whose
// state is missing, holds an unknown value, a control of another type, or
// anything beside its own control, counts as Leave. So no card is decided
// except by its own row's on-screen choice. Earlier pop-ups kept a decision
// in the metadata, or fixed one by the button that opened them, and on a
// phone a press that never arrived left a stored Approve standing over the
// Cancel on screen.
//
// A VIEW OPENED BEFORE THIS POP-UP DECIDES NOTHING. Its callback id is one of
// the older ones, and its Done is refused with "Open the question again.",
// keyed to the first input block it drew, the only kind Slack takes an error
// under; one that drew none is answered with a notice in place of the view.
//
// A DRAFT OPENS UNDER ITS ROW. Slack modals have no accordion, so Show draft
// redraws the pop-up with that card's draft between its row and its choice,
// drawn as its own Review pop-up draws it (`review-view.ts` §
// `draftBlocks`), and the row's button becomes Hide draft. One draft is open
// at a time, so a long one has the whole view's room; past it, the draft is
// cut and points at the card's own Review. Every redraw seeds each row's
// choice and the note from the state the press carried, and keeps each
// block's id, so the choices survive it; the id carries no draft, so it
// never resets a choice.
//
// EVERY CHOICE SITS IN AN INPUT BLOCK. Slack's mobile client cannot draw a
// radio group or a select in an actions block: a pop-up with one there
// opened blank. Show draft and Hide draft are plain buttons, a section's
// accessory, and no button is colored.
//
// The view carries the question it answers in `private_metadata` — the
// question's message and the cards it listed, by ts and headline — and which
// draft is open. It carries no decision.
import { proposalOperations, type PendingProposal } from "../thread-state/index";
import { gateWordsFor } from "../agent/tool-table";
import { clip } from "./card-block";
import { escapeSlackText } from "./mrkdwn";
import { anatomyOf, draftHeadline } from "./review-draft";
import { draftBlocks, fitBody } from "./review-view";
import type { NotionDatabaseLinks } from "./review-notion-create";
import type { WhichCard } from "../turn/index";

type View = Record<string, unknown>;

/** The pop-up's `callback_id`. */
export const WHICH_REVIEW_CALLBACK_ID = "uno_which_review_cards";
/** The `callback_id`s pop-ups had before this one: a Done under any of them
 *  is refused, since nothing in such a view says what each row is. */
const OLD_CALLBACK_IDS: ReadonlySet<string> = new Set(["uno_which_pick", "uno_which_approve_pick", "uno_which_cancel_pick"]);

/** Whether a `callback_id` is this pop-up's, or an older one's. */
export function isWhichCallback(callbackId: string | undefined): boolean {
  return callbackId === WHICH_REVIEW_CALLBACK_ID || (callbackId !== undefined && OLD_CALLBACK_IDS.has(callbackId));
}

/** Show draft and Hide draft, a row's accessory: each one's value is its
 *  card's ts. */
export const WHICH_SHOW_ACTION_ID = "uno_which_show";
export const WHICH_HIDE_ACTION_ID = "uno_which_hide";
/** The presses an older pop-up drew — its Approve / Cancel switch and its
 *  "Show a draft…" select — still routed here so they are answered. */
export const WHICH_OLD_IN_VIEW_ACTION_IDS: ReadonlySet<string> = new Set(["uno_which_decision", "uno_which_draft"]);

/** A row's section and its choice's input block, each keyed by its card. */
const ROW_PREFIX = "uno_which_row_";
const CHOICE_PREFIX = "uno_which_choice_";
const CHOICE_ACTION_ID = "uno_which_choice";

const NOTE_BLOCK = "uno_which_note";
const NOTE_ACTION_ID = "uno_which_note_input";

/** What a row says to do with its card. */
export type WhichChoice = "approve" | "cancel" | "leave";
const CHOICES: ReadonlyArray<[WhichChoice, string]> = [
  ["approve", "Approve"],
  ["cancel", "Cancel"],
  ["leave", "Leave"],
];

/** Said in place of the view under a Done from a view opened before this
 *  pop-up. */
export const REOPEN = "This pop-up is out of date, so nothing ran. Open the question again.";
/** Said after a Done with every row on Leave. */
export const NOTHING_CHOSEN = "Nothing changed. Every card is still waiting.";

/** Slack's caps: a view's blocks 100, a `plain_text_input` 3,000. */
const MAX_VIEW_BLOCKS = 100;
const NOTE_MAX_CHARS = 3000;

/** Said where an open draft was cut to the room the view has left. */
export const DRAFT_LEFT_OUT = "Cut here. Its card's Review has the rest.";

/** The question a pop-up answers, as its `private_metadata` carries it. */
export interface WhichPopup {
  channel: string;
  /** The question's own message: when it was asked, and what is redrawn. */
  questionTs: string;
  /** The cards the question listed, in its order, by ts and headline. */
  cards: WhichCard[];
  /** The card whose draft is open under its row, if any. */
  shown?: string;
}

/** What the person has chosen and typed, as a redraw carries it back into
 *  the view: each row's choice by its card's ts, and the note. */
export interface WhichChoices {
  rows: Record<string, WhichChoice>;
  note: string;
}

/** Done, read from its state: the cards it decides, in the list's order,
 *  and the note. A row on Leave is not in it. */
export interface WhichSubmission {
  decide: Array<{ card: string; choice: Exclude<WhichChoice, "leave"> }>;
  note: string;
}

/** What a view's `private_metadata` holds for this question. Ten cards' ts
 *  and headlines take about a third of Slack's 3,000 characters. */
export function whichMetadata(popup: WhichPopup): string {
  return JSON.stringify({
    c: popup.channel,
    q: popup.questionTs,
    k: popup.cards.map((card) => [card.ts, card.headline]),
    ...(popup.shown ? { s: popup.shown } : {}),
  });
}

/** The question back out of a view's `private_metadata`, or null for any
 *  other view's. A decision an older view's metadata still holds is never
 *  read. */
export function whichPopupOf(metadata: string | undefined): WhichPopup | null {
  try {
    const m = JSON.parse(metadata ?? "") as { c?: unknown; q?: unknown; k?: unknown; s?: unknown };
    if (typeof m.c !== "string" || typeof m.q !== "string" || !Array.isArray(m.k)) return null;
    const cards = m.k.flatMap((pair: unknown) =>
      Array.isArray(pair) && typeof pair[0] === "string" && typeof pair[1] === "string" ? [{ ts: pair[0], headline: pair[1] }] : [],
    );
    return { channel: m.c, questionTs: m.q, cards, ...(typeof m.s === "string" ? { shown: m.s } : {}) };
  } catch {
    return null;
  }
}

/**
 * What a card does, one line, beside its headline: the Review pop-up's own
 * headline for it ("New PRD card on the Roadmap"), or its anatomy's action,
 * or the tool's words on the card.
 */
export function cardDoes(proposal: PendingProposal): string {
  const operations = proposalOperations(proposal);
  const said = draftHeadline(operations) ?? anatomyOf(operations, proposal.proposalText)?.header;
  if (said) return said;
  const verb = gateWordsFor(operations[0]?.toolName ?? proposal.toolName)?.verb ?? proposal.toolName;
  return verb.charAt(0).toUpperCase() + verb.slice(1);
}

/** The pop-up's view: Done only where it lists rows to decide. */
function modal(popup: WhichPopup, blocks: unknown[], submit = false): View {
  return {
    type: "modal",
    callback_id: WHICH_REVIEW_CALLBACK_ID,
    title: { type: "plain_text", text: "Review cards" },
    close: { type: "plain_text", text: "Close" },
    ...(submit ? { submit: { type: "plain_text", text: "Done" } } : {}),
    private_metadata: whichMetadata(popup),
    blocks: blocks.slice(0, MAX_VIEW_BLOCKS),
  };
}

const line = (text: string): unknown => ({ type: "section", text: { type: "mrkdwn", text } });
const plain = (text: string) => ({ type: "plain_text", text });

/** The view `views.open` shows at once, inside Slack's three-second trigger
 *  window, before any card has been read. */
export function whichLoadingView(popup: WhichPopup): View {
  return modal(popup, [line("Loading the cards…")]);
}

/** One line in the pop-up, and Close: why there is nothing to decide, or
 *  that Done is under way. */
export function whichNoticeView(popup: WhichPopup, text: string): View {
  return modal(popup, [line(text)]);
}

/** After Done: one line per card it decided or could not reach. */
export function whichResultView(popup: WhichPopup, lines: readonly string[]): View {
  return modal(popup, lines.map(line));
}

/**
 * The pop-up: one row per waiting card — its headline and what it does,
 * Show draft (or Hide draft, with its draft under it), and its choice — and
 * the note. `waiting` are the listed cards still waiting, read just now; a
 * card no longer waiting is not offered.
 *
 * @param popup - The question and the draft open
 * @param waiting - The listed cards still waiting, in the question's order
 * @param chosen - What the person has chosen and typed so far
 * @param opts.databases - Where a Notion create's database opens, for a draft
 */
export function whichView(
  popup: WhichPopup,
  waiting: readonly PendingProposal[],
  chosen: WhichChoices,
  opts: { databases?: NotionDatabaseLinks } = {},
): View {
  const open = waiting.find((card) => card.proposalTs === popup.shown);
  // Each row is three blocks, its section, its choice and a divider; the
  // note is the last. An open draft has the room the rest leaves it.
  const note = {
    type: "input",
    block_id: NOTE_BLOCK,
    optional: true,
    label: plain("Note for cards canceled"),
    element: {
      type: "plain_text_input",
      action_id: NOTE_ACTION_ID,
      multiline: true,
      max_length: NOTE_MAX_CHARS,
      ...(chosen.note ? { initial_value: clip(chosen.note, NOTE_MAX_CHARS) } : {}),
    },
  };
  const room = MAX_VIEW_BLOCKS - waiting.length * 3 - 1;
  const blocks = waiting.flatMap((card) => {
    const ts = card.proposalTs;
    const shown = card === open;
    const headline = escapeSlackText(headlineOf(popup, card).trim()) || "That card";
    const row = {
      type: "section",
      block_id: `${ROW_PREFIX}${ts}`,
      text: { type: "mrkdwn", text: `*${headline}*\n${escapeSlackText(cardDoes(card))}` },
      accessory: {
        type: "button",
        action_id: shown ? WHICH_HIDE_ACTION_ID : WHICH_SHOW_ACTION_ID,
        text: plain(shown ? "Hide draft" : "Show draft"),
        value: ts,
      },
    };
    const options = CHOICES.map(([value, text]) => ({ value, text: plain(text) }));
    const initial = options.find((o) => o.value === (chosen.rows[ts] ?? "leave"))!;
    const choice = {
      type: "input",
      block_id: `${CHOICE_PREFIX}${ts}`,
      label: plain("Decision"),
      element: { type: "radio_buttons", action_id: CHOICE_ACTION_ID, options, initial_option: initial },
    };
    const draft = shown ? fitBody(draftBlocks(card, opts), room, DRAFT_LEFT_OUT) : [];
    return [row, ...draft, choice, { type: "divider" }];
  });
  return modal(popup, [...blocks, note], true);
}

/** The headline the question listed the card by, or the card's own ts. */
function headlineOf(popup: WhichPopup, card: PendingProposal): string {
  return popup.cards.find((c) => c.ts === card.proposalTs)?.headline ?? card.proposalTs;
}

type StateValue = { type?: unknown; value?: unknown; selected_option?: { value?: unknown } | null };
type ViewValues = { values?: Record<string, Record<string, StateValue>> };

/**
 * One card's choice, read from its own block in a view's state and nowhere
 * else: the one radio control the row draws, holding one of its three
 * values. Anything else — no block, no pick, an unknown value, another
 * control, or anything beside its own — is Leave.
 */
function choiceOf(values: ViewValues["values"], ts: string): WhichChoice {
  const block = values?.[`${CHOICE_PREFIX}${ts}`];
  if (!block || Object.keys(block).some((actionId) => actionId !== CHOICE_ACTION_ID)) return "leave";
  const input = block[CHOICE_ACTION_ID];
  if (!input || "selected_options" in input) return "leave";
  if (input.type !== undefined && input.type !== "radio_buttons") return "leave";
  const value = input.selected_option?.value;
  return value === "approve" || value === "cancel" ? value : "leave";
}

/** The note, as typed. */
function noteOf(values: ViewValues["values"]): string {
  const typed = values?.[NOTE_BLOCK]?.[NOTE_ACTION_ID]?.value;
  return typeof typed === "string" ? typed : "";
}

/**
 * What the person has chosen and typed, from a view's `state`, for a redraw:
 * each listed card's choice from its own block, and the note.
 */
export function whichChoicesOf(state: unknown, cards: readonly WhichCard[]): WhichChoices {
  const values = (state as ViewValues | undefined)?.values;
  return { rows: Object.fromEntries(cards.map((card) => [card.ts, choiceOf(values, card.ts)])), note: noteOf(values) };
}

/** The first input block a view drew, by its block_id: where Slack will take
 *  an error. */
function firstInputOf(blocks: readonly unknown[] | undefined): string | null {
  for (const block of blocks ?? []) {
    const b = block as { type?: unknown; block_id?: unknown };
    if (b?.type === "input" && typeof b.block_id === "string") return b.block_id;
  }
  return null;
}

/**
 * Done, read as exactly what it decides: each card the question listed
 * (`cards`, in its order), by the choice under that card's own block in the
 * submitted state alone, with every Leave and every unreadable row left out;
 * and the note. A Done from a view opened before this pop-up is refused
 * under the first input block it drew (`blocks`), or, drawing none, answered
 * with a notice in its place, and decides nothing.
 */
export function whichSubmitOf(
  callbackId: string | undefined,
  state: unknown,
  blocks: readonly unknown[] | undefined,
  cards: readonly WhichCard[],
): { ok: true; submission: WhichSubmission } | { ok: false; errors: Record<string, string> } | { ok: false; notice: string } {
  if (callbackId !== WHICH_REVIEW_CALLBACK_ID) {
    const input = firstInputOf(blocks);
    return input ? { ok: false, errors: { [input]: REOPEN } } : { ok: false, notice: REOPEN };
  }
  const values = (state as ViewValues | undefined)?.values;
  const decide = cards.flatMap((card) => {
    const choice = choiceOf(values, card.ts);
    return choice === "leave" ? [] : [{ card: card.ts, choice }];
  });
  return { ok: true, submission: { decide, note: noteOf(values).trim() } };
}
