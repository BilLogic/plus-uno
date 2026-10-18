// The "which one?" pop-ups' views: the waiting cards to pick one to approve
// or to tick for a cancel, each card's draft on demand, and the lines that
// follow a Submit.
//
// Renders and posts nothing; `which-card.ts` decides which view to show and
// hands it to Slack.
//
// TWO POP-UPS, EACH OF ONE KIND. The question carries Approve… and Cancel…,
// and the button pressed fixes which pop-up opens: Approve lists the waiting
// cards as a pick-one radio list and Submit, "Approve card", approves the one
// picked; Cancel lists them as checkboxes with an optional note and Submit,
// "Cancel cards", cancels the ones ticked. Nothing inside a pop-up switches
// its kind. The pop-up once carried an Approve / Cancel switch whose choice
// the view's metadata kept, and on a phone the switch's press never arrived:
// the metadata still said Approve, and a card ticked to cancel was approved.
// So the kind is the view's `callback_id`, set when it opens and never
// changed by a redraw, no decision rides the metadata, and a Submit decides
// nothing unless its state holds that kind's own control under its own block
// and nothing else (`whichSubmitOf`): an Approve Submit carrying ticks, a
// Cancel Submit carrying a radio pick, or a view opened before the two
// pop-ups, is refused. Each kind's list holds exactly its own control, and
// an error is shown under an input block, the only kind Slack takes one
// under; a view opened before the two pop-ups with none is answered with a
// notice in place of the view instead.
//
// A DRAFT OPENS BELOW THE LIST. Slack modals have no accordion, so one select
// under the list, "Show a draft…", names each card by its headline, and a
// choice redraws the pop-up with that card's draft below it, drawn as its own
// Review pop-up draws it (`review-view.ts` § `draftBlocks`); a Hide draft
// button after the draft redraws it without. One draft is open at a time, so
// a long one has the whole view's room; past it, the draft is cut and points
// at the card's own Review, which has all of it. Every redraw sets each
// input's value from the state the press carried, so the pick, the ticks and
// the note survive it. The note is the cancel's reason, said on each card it
// closes.
//
// EACH CARD IS PICKED IN ONE PLACE: its option in the list, by its headline
// (`agent/card-identity.ts`) and what it does (`cardDoes`). An option holds
// no button, and a bare Show draft per card would not say which card it
// opens, so the drafts sit behind the one select, by headline, in the
// list's order.
//
// EVERY CHOICE SITS IN AN INPUT BLOCK. The list, radio or checkboxes, is an
// input block, and so is "Show a draft…", with `dispatch_action`, so a choice
// still arrives as a `block_actions` and redraws the pop-up; only Hide draft,
// a button, is in an actions block. The select's block_id carries the open
// draft, since an input keeps its own pick across a redraw under an unchanged
// block_id; presses are routed by action_id. On a phone, a pop-up with a
// choice in an actions block opened blank.
//
// The view carries the question it answers in `private_metadata` — the
// question's message and the cards it listed — so every press and the Submit
// are read without the message. It carries no decision: its kind is its
// callback id.
import { proposalOperations, type PendingProposal } from "../thread-state/index";
import { gateWordsFor } from "../agent/tool-table";
import { clip } from "./card-block";
import { DESCRIPTION_CHARS } from "./review-anatomy";
import { anatomyOf, draftHeadline } from "./review-draft";
import { draftBlocks, fitBody } from "./review-view";
import type { NotionDatabaseLinks } from "./review-notion-create";
import type { WhichCard } from "../turn/index";

type View = Record<string, unknown>;

/** What a pop-up does, fixed by the question's button that opened it. */
export type WhichKind = "approve" | "cancel";

/** Each pop-up's `callback_id`, which names its kind to the Submit. */
export const WHICH_APPROVE_CALLBACK_ID = "uno_which_approve_pick";
export const WHICH_CANCEL_CALLBACK_ID = "uno_which_cancel_pick";
/** The one `callback_id` a pop-up had before there were two: a Submit under
 *  it is refused, since nothing in such a view says what it was for. */
export const WHICH_OLD_CALLBACK_ID = "uno_which_pick";

const CALLBACK_OF: Record<WhichKind, string> = { approve: WHICH_APPROVE_CALLBACK_ID, cancel: WHICH_CANCEL_CALLBACK_ID };

/** A view's kind from its `callback_id`; null for a view opened before the
 *  two pop-ups, or any other. */
export function whichKindOf(callbackId: string | undefined): WhichKind | null {
  return callbackId === WHICH_APPROVE_CALLBACK_ID ? "approve" : callbackId === WHICH_CANCEL_CALLBACK_ID ? "cancel" : null;
}

/** Whether a `callback_id` is one of these pop-ups', old or new. */
export function isWhichCallback(callbackId: string | undefined): boolean {
  return callbackId === WHICH_OLD_CALLBACK_ID || whichKindOf(callbackId) !== null;
}

/** The Approve / Cancel switch a view opened before the two pop-ups may
 *  still carry. A press on it decides nothing. */
export const WHICH_DECISION_ACTION_ID = "uno_which_decision";

/** "Show a draft…": each option's value is a card's ts. */
export const WHICH_DRAFT_ACTION_ID = "uno_which_draft";
/** The select's block, by the draft open, so Hide draft empties it and the
 *  same card chosen again still fires. */
const DRAFT_BLOCK_PREFIX = "uno_which_draft_";
const draftBlock = (shown: string | undefined) => `${DRAFT_BLOCK_PREFIX}${shown ?? "none"}`;

/** Hide draft, after the open draft. */
export const WHICH_HIDE_ACTION_ID = "uno_which_hide";

/** The Cancel pop-up's list of cards to tick. Its block_id is the one the
 *  cancel list has always had. */
const CARDS_BLOCK = "uno_which_cards_cancel";
const CARDS_ACTION_ID = "uno_which_cards_input";

/** The Approve pop-up's list of cards to pick one from: a block and an
 *  action of its own, which no view before it ever used. */
const APPROVE_BLOCK = "uno_which_approve_card";
const APPROVE_ACTION_ID = "uno_which_approve_input";

const NOTE_BLOCK = "uno_which_note";
const NOTE_ACTION_ID = "uno_which_note_input";

/** Said under the list when a Cancel Submit carries no card ticked. */
export const TICK_ONE = "Tick at least one card to cancel.";
/** Said under the list when an Approve Submit carries no card picked. */
export const PICK_ONE = "Pick the card to approve.";
/** Said under a Submit from a view opened before the two pop-ups, or one
 *  whose state holds a control that is not its own. */
export const REOPEN = "This pop-up is out of date, so nothing ran. Open the question again.";

/** Slack's caps: a view's title 24 characters, its blocks 100, an option's
 *  text 75, a `plain_text_input` 3,000. */
const MAX_VIEW_BLOCKS = 100;
const OPTION_CHARS = 75;
const NOTE_MAX_CHARS = 3000;

/** Each kind's title, and what its Submit says it does. */
const TITLE: Record<WhichKind, string> = { approve: "Approve a card", cancel: "Cancel cards" };
const SUBMIT: Record<WhichKind, string> = { approve: "Approve card", cancel: "Cancel cards" };

/** Said where an open draft was cut to the room the view has left. */
export const DRAFT_LEFT_OUT = "Cut here. Its card's Review has the rest.";

/** The question a pop-up answers, as its `private_metadata` carries it. */
export interface WhichPopup {
  channel: string;
  /** The question's own message: when it was asked, and what is redrawn. */
  questionTs: string;
  /** The cards the question listed, in its order, by ts and headline. */
  cards: WhichCard[];
  /** The card whose draft is open under the list, if any. */
  shown?: string;
}

/** What the person has picked and typed, as a redraw carries it back into
 *  the view: the one card picked to approve, or the cards ticked to cancel,
 *  by ts; and the note, which only the Cancel pop-up has. */
export interface WhichPick {
  picked: string[];
  note: string;
}

/** A Submit, read from its view's kind and state: exactly what it decides. */
export type WhichSubmission =
  /** The one card picked in an Approve pop-up. */
  | { kind: "approve"; card: string }
  /** The cards ticked in a Cancel pop-up, and its note. */
  | { kind: "cancel"; picked: string[]; note: string };

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

/** A view of `kind`'s pop-up; a null kind is a view opened before the two,
 *  answered with a line and no Submit, under the old callback id. */
function modal(kind: WhichKind | null, popup: WhichPopup, blocks: unknown[], submit = false): View {
  return {
    type: "modal",
    callback_id: kind ? CALLBACK_OF[kind] : WHICH_OLD_CALLBACK_ID,
    title: { type: "plain_text", text: kind ? TITLE[kind] : "Waiting cards" },
    close: { type: "plain_text", text: "Close" },
    ...(submit && kind ? { submit: { type: "plain_text", text: SUBMIT[kind] } } : {}),
    private_metadata: whichMetadata(popup),
    blocks: blocks.slice(0, MAX_VIEW_BLOCKS),
  };
}

const line = (text: string): unknown => ({ type: "section", text: { type: "mrkdwn", text } });
const plain = (text: string, max = OPTION_CHARS) => ({ type: "plain_text", text: clip(text, max) });

/** The view `views.open` shows at once, inside Slack's three-second trigger
 *  window, before any card has been read — already of its kind. */
export function whichLoadingView(kind: WhichKind, popup: WhichPopup): View {
  return modal(kind, popup, [line("Loading the cards…")]);
}

/** One line in the pop-up, and Close: why there is nothing to pick, or that a
 *  Submit is under way. */
export function whichNoticeView(kind: WhichKind | null, popup: WhichPopup, text: string): View {
  return modal(kind, popup, [line(text)]);
}

/** After a Submit: one line per card it was made on, saying what came of it. */
export function whichResultView(kind: WhichKind, popup: WhichPopup, lines: readonly string[]): View {
  return modal(kind, popup, lines.map(line));
}

/**
 * A pop-up of `kind`: the cards to pick or tick, under a label that says
 * what Submit does to them, "Show a draft…" with the open draft below it,
 * and, to cancel, the note. `waiting`
 * are the listed cards still waiting, read just now; a card no longer
 * waiting is not offered.
 *
 * @param kind - What it does, fixed when it opened
 * @param popup - The question and the draft open
 * @param waiting - The listed cards still waiting, in the question's order
 * @param pick - What the person has picked and typed so far
 * @param opts.databases - Where a Notion create's database opens, for a draft
 */
export function whichView(
  kind: WhichKind,
  popup: WhichPopup,
  waiting: readonly PendingProposal[],
  pick: WhichPick,
  opts: { databases?: NotionDatabaseLinks } = {},
): View {
  const offered = new Set(waiting.map((card) => card.proposalTs));
  const picked = pick.picked.filter((ts) => offered.has(ts));
  const option = (card: PendingProposal) => ({
    value: card.proposalTs,
    text: plain(headlineOf(popup, card)),
    description: plain(cardDoes(card), DESCRIPTION_CHARS),
  });
  const options = waiting.map(option);
  const chosen = options.filter((o) => picked.includes(o.value));
  const list =
    kind === "approve"
      ? {
          type: "input",
          block_id: APPROVE_BLOCK,
          label: plain("Approve which one?"),
          element: { type: "radio_buttons", action_id: APPROVE_ACTION_ID, options, ...(chosen[0] ? { initial_option: chosen[0] } : {}) },
        }
      : {
          type: "input",
          block_id: CARDS_BLOCK,
          label: plain("Cancel which ones?"),
          element: { type: "checkboxes", action_id: CARDS_ACTION_ID, options, ...(chosen.length ? { initial_options: chosen } : {}) },
        };
  const head: unknown[] = [list, { type: "divider" }];
  // The cancel's reason, said on each card it closes. An approval takes no
  // note here: one with edits is made from the card's own Review.
  const note = {
    type: "input",
    block_id: NOTE_BLOCK,
    optional: true,
    label: plain("Note"),
    element: {
      type: "plain_text_input",
      action_id: NOTE_ACTION_ID,
      multiline: true,
      max_length: NOTE_MAX_CHARS,
      ...(pick.note ? { initial_value: clip(pick.note, NOTE_MAX_CHARS) } : {}),
    },
  };
  const tail: unknown[] = kind === "cancel" ? [{ type: "divider" }, note] : [];

  // "Show a draft…", by headline in the list's order, opening on the card
  // whose draft is open; then that draft, cut to the room the rest of the
  // view leaves it, and Hide draft after it.
  const drafts = waiting.map((card) => ({ value: card.proposalTs, text: plain(headlineOf(popup, card)) }));
  const open = waiting.find((card) => card.proposalTs === popup.shown);
  const select = {
    type: "input",
    block_id: draftBlock(open?.proposalTs),
    dispatch_action: true,
    optional: true,
    label: plain("Draft"),
    element: {
      type: "static_select",
      action_id: WHICH_DRAFT_ACTION_ID,
      placeholder: plain("Show a draft…"),
      options: drafts,
      ...(open ? { initial_option: drafts.find((o) => o.value === open.proposalTs)! } : {}),
    },
  };
  const hide = { type: "actions", elements: [{ type: "button", action_id: WHICH_HIDE_ACTION_ID, text: plain("Hide draft"), value: "hide" }] };
  const room = MAX_VIEW_BLOCKS - head.length - tail.length - 2;
  const body = open ? [select, ...fitBody(draftBlocks(open, opts), room, DRAFT_LEFT_OUT), hide] : [select];
  return modal(kind, popup, [...head, ...body, ...tail], true);
}

/** The headline the question listed the card by, or the card's own. */
function headlineOf(popup: WhichPopup, card: PendingProposal): string {
  return popup.cards.find((c) => c.ts === card.proposalTs)?.headline ?? card.proposalTs;
}

type StateValue = { type?: unknown; value?: unknown; selected_option?: { value?: unknown } | null; selected_options?: unknown };
type ViewValues = { values?: Record<string, Record<string, StateValue>> };

/** The Cancel list's ticks, read from a view's state: null when the state
 *  holds no checkboxes value for it at all. */
function ticksOf(values: ViewValues["values"]): string[] | null {
  const input = values?.[CARDS_BLOCK]?.[CARDS_ACTION_ID];
  if (!input || !Array.isArray(input.selected_options)) return null;
  if (input.type !== undefined && input.type !== "checkboxes") return null;
  return (input.selected_options as Array<{ value?: unknown } | null>)
    .map((o) => o?.value)
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

/** The Approve list's one pick, read from a view's state: null when the
 *  state holds no radio pick for it. */
function radioOf(values: ViewValues["values"]): string | null {
  const input = values?.[APPROVE_BLOCK]?.[APPROVE_ACTION_ID];
  if (!input || "selected_options" in input) return null;
  if (input.type !== undefined && input.type !== "radio_buttons") return null;
  const value = input.selected_option?.value;
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * What the person has picked and typed, from a view's `state`, for a redraw
 * of a pop-up of `kind`: the one card picked, or the cards ticked, and the
 * note.
 */
export function whichPickOf(kind: WhichKind, state: unknown): WhichPick {
  const values = (state as ViewValues | undefined)?.values;
  if (kind === "approve") {
    const card = radioOf(values);
    return { picked: card ? [card] : [], note: "" };
  }
  const typed = values?.[NOTE_BLOCK]?.[NOTE_ACTION_ID]?.value;
  return { picked: ticksOf(values) ?? [], note: typeof typed === "string" ? typed : "" };
}

/** The blocks a pop-up of `kind` draws inputs in: its list, its select,
 *  and, to cancel, its note. */
function ownBlock(kind: WhichKind, blockId: string): boolean {
  if (blockId.startsWith(DRAFT_BLOCK_PREFIX)) return true;
  return kind === "approve" ? blockId === APPROVE_BLOCK : blockId === CARDS_BLOCK || blockId === NOTE_BLOCK;
}

/** Whether the kind's list, if the state holds it, holds only its own
 *  control's action id. */
function listIsOwn(kind: WhichKind, values: ViewValues["values"]): boolean {
  const [block, action] = kind === "approve" ? [APPROVE_BLOCK, APPROVE_ACTION_ID] : [CARDS_BLOCK, CARDS_ACTION_ID];
  const inputs = values?.[block];
  return !inputs || Object.keys(inputs).every((actionId) => actionId === action);
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
 * A Submit, read as exactly what it decides, or what the pop-up says
 * instead. Its kind is its view's `callback_id`, never its metadata: an
 * Approve pop-up's Submit is the one radio pick under the Approve list, a
 * Cancel pop-up's the checkboxes ticked under the Cancel list, each list
 * holding exactly that control. A state holding any block that kind does not
 * draw — the other kind's list, an old switch — or anything else under its
 * list, is refused under that list; a Submit with nothing picked is too.
 * A view opened before the two pop-ups is refused under the first input
 * block it drew (`blocks`), or, drawing none, answered with a notice in its
 * place. Nothing is decided.
 */
export function whichSubmitOf(
  callbackId: string | undefined,
  state: unknown,
  blocks?: readonly unknown[],
): { ok: true; submission: WhichSubmission } | { ok: false; errors: Record<string, string> } | { ok: false; notice: string } {
  const values = (state as ViewValues | undefined)?.values;
  const kind = whichKindOf(callbackId);
  if (!kind) {
    const input = firstInputOf(blocks);
    return input ? { ok: false, errors: { [input]: REOPEN } } : { ok: false, notice: REOPEN };
  }
  const list = kind === "approve" ? APPROVE_BLOCK : CARDS_BLOCK;
  const stray = Object.keys(values ?? {}).some((blockId) => !ownBlock(kind, blockId));
  if (stray || !listIsOwn(kind, values)) return { ok: false, errors: { [list]: REOPEN } };
  if (kind === "approve") {
    const card = radioOf(values);
    return card ? { ok: true, submission: { kind, card } } : { ok: false, errors: { [APPROVE_BLOCK]: PICK_ONE } };
  }
  const ticks = ticksOf(values);
  if (!ticks?.length) return { ok: false, errors: { [CARDS_BLOCK]: TICK_ONE } };
  return { ok: true, submission: { kind, picked: ticks, note: whichPickOf(kind, state).note.trim() } };
}
