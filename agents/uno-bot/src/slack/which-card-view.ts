// The "which one?" pop-up's views: the waiting cards to tick for a cancel,
// each card's draft on demand, and the lines that follow a Submit.
//
// Renders and posts nothing; `which-card.ts` decides which view to show and
// hands it to Slack.
//
// THE POP-UP ONLY CANCELS. It lists the waiting cards as checkboxes, and
// Submit cancels exactly the ones ticked. There is no Approve here: an
// approval writes something real, so it is made from the card's own Review,
// where the draft is the whole view. The pop-up once carried an Approve /
// Cancel switch whose choice the view's metadata kept, and on a phone the
// switch's press never arrived: the metadata still said Approve, and a card
// ticked to cancel was approved. So no decision rides the metadata, and a
// Submit decides nothing unless its state carries the cancel list's
// checkboxes (`whichSubmitOf`); a state holding a radio pick, as a view drawn
// with that switch still does, is refused.
//
// A DRAFT OPENS BELOW THE LIST. Slack modals have no accordion, so one select
// under the list, "Show a draft…", names each card by its headline, and a
// choice redraws the pop-up with that card's draft below it, drawn as its own
// Review pop-up draws it (`review-view.ts` § `draftBlocks`); a Hide draft
// button after the draft redraws it without. One draft is open at a time, so
// a long one has the whole view's room; past it, the draft is cut and points
// at the card's own Review, which has all of it. Every redraw sets each
// input's value from the state the press carried, so the ticks and the note
// survive it. The note is the cancel's reason, said on each card it closes.
//
// EACH CARD IS PICKED IN ONE PLACE: its option in the list, by its headline
// (`agent/card-identity.ts`) and what it does (`cardDoes`). An option holds
// no button, and a bare Show draft per card would not say which card it
// opens, so the drafts sit behind the one select, by headline, in the
// list's order.
//
// EVERY CHOICE SITS IN AN INPUT BLOCK. "Show a draft…" is an input block
// with `dispatch_action`, so a choice still arrives as a `block_actions` and
// redraws the pop-up; only Hide draft, a button, is in an actions block. The
// select's block_id carries the open draft, since an input keeps its own pick
// across a redraw under an unchanged block_id; presses are routed by
// action_id. On a phone, a pop-up with a choice in an actions block opened
// blank.
//
// The view carries the question it answers in `private_metadata` — the
// question's message and the cards it listed — so every press and the Submit
// are read without the message. It carries no decision: there is one.
import { proposalOperations, type PendingProposal } from "../thread-state/index";
import { gateWordsFor } from "../agent/tool-table";
import { clip } from "./card-block";
import { DESCRIPTION_CHARS } from "./review-anatomy";
import { anatomyOf, draftHeadline } from "./review-draft";
import { draftBlocks, fitBody } from "./review-view";
import type { NotionDatabaseLinks } from "./review-notion-create";
import type { WhichCard } from "../turn/index";

type View = Record<string, unknown>;

/** The pop-up's `callback_id`, which names its Submit to the endpoint. */
export const WHICH_CALLBACK_ID = "uno_which_pick";

/** The Approve / Cancel switch a view drawn before the pop-up only canceled
 *  still carries. A press on it redraws the view without it. */
export const WHICH_DECISION_ACTION_ID = "uno_which_decision";

/** "Show a draft…": each option's value is a card's ts. */
export const WHICH_DRAFT_ACTION_ID = "uno_which_draft";
/** The select's block, by the draft open, so Hide draft empties it and the
 *  same card chosen again still fires. */
const draftBlock = (shown: string | undefined) => `uno_which_draft_${shown ?? "none"}`;

/** Hide draft, after the open draft. */
export const WHICH_HIDE_ACTION_ID = "uno_which_hide";

/** The list of cards to cancel. Its block_id is the one the cancel list has
 *  always had, so a view drawn with the switch, showing Cancel, still sends
 *  its ticks under it. */
const CARDS_BLOCK = "uno_which_cards_cancel";
const CARDS_ACTION_ID = "uno_which_cards_input";

const NOTE_BLOCK = "uno_which_note";
const NOTE_ACTION_ID = "uno_which_note_input";

/** Said under the list when a Submit carries no card ticked. */
export const TICK_ONE = "Tick at least one card to cancel.";
/** Said under a choice a view drawn with the old switch still holds. */
export const REOPEN = "This pop-up is out of date, so nothing ran. Close it and press Choose… again.";

/** Slack's caps: a view's title 24 characters, its blocks 100, an option's
 *  text 75, a `plain_text_input` 3,000. */
const TITLE = "Waiting cards";
const MAX_VIEW_BLOCKS = 100;
const OPTION_CHARS = 75;
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
  /** The card whose draft is open under the list, if any. */
  shown?: string;
}

/** What the person has ticked and typed, as a press or the Submit carries it. */
export interface WhichPick {
  /** The cards ticked to cancel, by ts. */
  picked: string[];
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

function modal(popup: WhichPopup, blocks: unknown[], submit = false): View {
  return {
    type: "modal",
    callback_id: WHICH_CALLBACK_ID,
    title: { type: "plain_text", text: TITLE },
    close: { type: "plain_text", text: "Close" },
    ...(submit ? { submit: { type: "plain_text", text: "Cancel cards" } } : {}),
    private_metadata: whichMetadata(popup),
    blocks: blocks.slice(0, MAX_VIEW_BLOCKS),
  };
}

const line = (text: string): unknown => ({ type: "section", text: { type: "mrkdwn", text } });
const plain = (text: string, max = OPTION_CHARS) => ({ type: "plain_text", text: clip(text, max) });

/** The view `views.open` shows at once, inside Slack's three-second trigger
 *  window, before any card has been read. */
export function whichLoadingView(popup: WhichPopup): View {
  return modal(popup, [line("Loading the cards…")]);
}

/** One line in the pop-up, and Close: why there is nothing to pick, or that a
 *  Submit is under way. */
export function whichNoticeView(popup: WhichPopup, text: string): View {
  return modal(popup, [line(text)]);
}

/** After a Submit: one line per card it was made on, saying what came of it. */
export function whichResultView(popup: WhichPopup, lines: readonly string[]): View {
  return modal(popup, lines.map(line));
}

/** Said at the top of the pop-up: what it does, and where an approval is
 *  made instead. */
export const WHICH_LEAD = "Tick the cards to cancel. To approve one, use its card's Review.";

/**
 * The pop-up: what it does, the cards to tick, "Show a draft…" with the open
 * draft below it, and the note. `waiting` are the listed cards still waiting,
 * read just now; a card no longer waiting is not offered.
 *
 * @param popup - The question and the draft open
 * @param waiting - The listed cards still waiting, in the question's order
 * @param pick - What the person has ticked and typed so far
 * @param opts.databases - Where a Notion create's database opens, for a draft
 */
export function whichView(
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
  const head: unknown[] = [
    line(WHICH_LEAD),
    {
      type: "input",
      block_id: CARDS_BLOCK,
      label: plain("Cancel which ones?"),
      element: { type: "checkboxes", action_id: CARDS_ACTION_ID, options, ...(chosen.length ? { initial_options: chosen } : {}) },
    },
    { type: "divider" },
  ];
  // The cancel's reason, said on each card it closes.
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
  const tail: unknown[] = [{ type: "divider" }, note];

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
  return modal(popup, [...head, ...body, ...tail], true);
}

/** The headline the question listed the card by, or the card's own. */
function headlineOf(popup: WhichPopup, card: PendingProposal): string {
  return popup.cards.find((c) => c.ts === card.proposalTs)?.headline ?? card.proposalTs;
}

type StateValue = { type?: unknown; value?: unknown; selected_option?: { value?: unknown } | null; selected_options?: unknown };
type ViewValues = { values?: Record<string, Record<string, StateValue>> };

/** The cancel list's ticks, read from a view's state: null when the state
 *  holds no checkboxes value for it at all. */
function ticksOf(values: ViewValues["values"]): string[] | null {
  const input = values?.[CARDS_BLOCK]?.[CARDS_ACTION_ID];
  if (!input || !Array.isArray(input.selected_options)) return null;
  if (input.type !== undefined && input.type !== "checkboxes") return null;
  return (input.selected_options as Array<{ value?: unknown } | null>)
    .map((o) => o?.value)
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

/**
 * What the person has ticked and typed, from a view's `state`: the cards
 * ticked in the cancel list, and the note.
 */
export function whichPickOf(state: unknown): WhichPick {
  const values = (state as ViewValues | undefined)?.values;
  const typed = values?.[NOTE_BLOCK]?.[NOTE_ACTION_ID]?.value;
  return { picked: ticksOf(values) ?? [], note: typeof typed === "string" ? typed : "" };
}

/** The block a view drawn with the old Approve / Cancel switch holds a radio
 *  pick under, if the state carries one: its switch, or its Approve list. */
function radioBlockOf(values: ViewValues["values"]): string | null {
  for (const [blockId, inputs] of Object.entries(values ?? {})) {
    if (blockId === CARDS_BLOCK || blockId === NOTE_BLOCK || blockId.startsWith("uno_which_draft_")) continue;
    for (const input of Object.values(inputs ?? {})) {
      if (input?.type === "radio_buttons" || (input && "selected_option" in input)) return blockId;
    }
  }
  return null;
}

/**
 * The ticks as a Submit sends them, or the error Slack shows in the pop-up.
 * A Submit decides only what its state says: the cancel list's checkboxes,
 * ticked. A state holding a radio pick (a view drawn with the old Approve /
 * Cancel switch), or no checkboxes value for the list, or none ticked, is
 * refused, and nothing is decided.
 */
export function whichSubmitOf(state: unknown): { ok: true; pick: WhichPick } | { ok: false; errors: Record<string, string> } {
  const values = (state as ViewValues | undefined)?.values;
  const radio = radioBlockOf(values);
  if (radio) return { ok: false, errors: { [radio]: REOPEN } };
  const ticks = ticksOf(values);
  if (!ticks?.length) return { ok: false, errors: { [CARDS_BLOCK]: TICK_ONE } };
  return { ok: true, pick: { picked: ticks, note: whichPickOf(state).note.trim() } };
}
