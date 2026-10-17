// The "which one?" pop-up's views: the cards a decision could mean, the pick,
// each card's draft on demand, and the lines that follow a Submit.
//
// Renders and posts nothing; `which-card.ts` decides which view to show and
// hands it to Slack.
//
// APPROVE PICKS ONE, CANCEL TICKS SEVERAL. The decision sits at the top as an
// Approve / Cancel choice, preset from what the person typed, and switching it
// redraws the pop-up: Approve lists the cards as radio buttons, Cancel as
// checkboxes. Bill's ruling: every approval writes something real, so they go
// one at a time; a cancel writes nothing, so several can go at once. The two
// lists sit in input blocks of their own (`CARDS_BLOCK`), so what was picked
// in one is never read as the other's, and the redraw carries the pick across
// itself (`initial_option` / `initial_options`).
//
// A DRAFT OPENS BELOW THE LIST. Slack modals have no accordion, so one select
// under the list, "Show a draft…", names each card by its headline, and a
// choice redraws the pop-up with that card's draft below it, drawn as its own
// Review pop-up draws it (`review-view.ts` § `draftBlocks`); a Hide draft
// button after the draft redraws it without. One draft is open at a time, so a long one
// has the whole view's room; past it, the draft is cut and points at the
// card's own Review, which has all of it. Every redraw sets each input's
// value from the state the press carried, so the pick and the note survive
// it. The note is Cancel's reason and nothing under Approve, so it shows under
// Cancel only; a switch to Approve keeps it in the view's metadata until the
// switch back.
//
// EACH CARD IS PICKED IN ONE PLACE: its option in the list, by its headline
// (`agent/card-identity.ts`) and what it does (`cardDoes`). An option holds
// no button, and a bare Show draft per card would not say which card it
// opens, so the drafts sit behind the one select, by headline, in the
// list's order.
//
// The view carries the question it answers in `private_metadata` — the
// question's message, the decision, the cards it listed — so every press and
// the Submit are read without the message.
import { proposalOperations, type PendingProposal } from "../thread-state/index";
import { gateWordsFor } from "../agent/tool-table";
import { clip } from "./card-block";
import { DESCRIPTION_CHARS } from "./review-anatomy";
import { anatomyOf, draftHeadline } from "./review-draft";
import { draftBlocks, fitBody } from "./review-view";
import type { NotionDatabaseLinks } from "./review-notion-create";
import type { WhichCard } from "../turn/index";

type Decision = "confirm" | "cancel";
type View = Record<string, unknown>;

/** The pop-up's `callback_id`, which names its Submit to the endpoint. */
export const WHICH_CALLBACK_ID = "uno_which_pick";

/** The Approve / Cancel choice at the top; a change redraws the pop-up. */
export const WHICH_DECISION_ACTION_ID = "uno_which_decision";
const DECISION_BLOCK = "uno_which_decision_block";

/** "Show a draft…": each option's value is a card's ts. */
export const WHICH_DRAFT_ACTION_ID = "uno_which_draft";

/** Hide draft, after the open draft. */
export const WHICH_HIDE_ACTION_ID = "uno_which_hide";

/** The list of cards: one block per decision, so a pick never crosses over. */
const CARDS_BLOCK: Readonly<Record<Decision, string>> = { confirm: "uno_which_cards_confirm", cancel: "uno_which_cards_cancel" };
const CARDS_ACTION_ID = "uno_which_cards_input";

const NOTE_BLOCK = "uno_which_note";
const NOTE_ACTION_ID = "uno_which_note_input";

/** Slack's caps: a view's title 24 characters, its blocks 100, an option's
 *  text 75, a `plain_text_input` 3,000. */
const TITLE = "Waiting cards";
const MAX_VIEW_BLOCKS = 100;
const OPTION_CHARS = 75;
const NOTE_MAX_CHARS = 3000;

/** Said where an open draft was cut to the room the view has left. */
export const DRAFT_LEFT_OUT = "Cut here. Its card's Review has the rest.";

/** Slack's cap on a view's `private_metadata`: 3,000 characters. Ten cards'
 *  ts and headlines take about a third of it; a note carried across a switch
 *  to Approve is clipped to the rest. */
const METADATA_CHARS = 3000;

/** The question a pop-up answers, as its `private_metadata` carries it. */
export interface WhichPopup {
  channel: string;
  /** The question's own message: when it was asked, and what is redrawn. */
  questionTs: string;
  decision: Decision;
  /** The cards the question listed, in its order, by ts and headline. */
  cards: WhichCard[];
  /** The card whose draft is open under its row, if any. */
  shown?: string;
  /** Cancel's note, kept while the view shows Approve, which has none. */
  note?: string;
}

/** What the person has picked and typed, as a press or the Submit carries it. */
export interface WhichPick {
  /** The cards picked, by ts: one under Approve, any number under Cancel. */
  picked: string[];
  note: string;
}

/** What a view's `private_metadata` holds for this question. */
export function whichMetadata(popup: WhichPopup): string {
  const base = {
    c: popup.channel,
    q: popup.questionTs,
    d: popup.decision,
    k: popup.cards.map((card) => [card.ts, card.headline]),
    ...(popup.shown ? { s: popup.shown } : {}),
  };
  const bare = JSON.stringify(base);
  if (!popup.note) return bare;
  // The note's escapes count too, so it is clipped until the whole fits.
  let note = popup.note.slice(0, METADATA_CHARS);
  let out = JSON.stringify({ ...base, n: note });
  while (out.length > METADATA_CHARS && note) {
    note = note.slice(0, Math.max(0, note.length - (out.length - METADATA_CHARS)));
    out = JSON.stringify({ ...base, n: note });
  }
  return note ? out : bare;
}

/** The question back out of a view's `private_metadata`, or null for any
 *  other view's. */
export function whichPopupOf(metadata: string | undefined): WhichPopup | null {
  try {
    const m = JSON.parse(metadata ?? "") as { c?: unknown; q?: unknown; d?: unknown; k?: unknown; s?: unknown; n?: unknown };
    if (typeof m.c !== "string" || typeof m.q !== "string" || (m.d !== "confirm" && m.d !== "cancel") || !Array.isArray(m.k)) return null;
    const cards = m.k.flatMap((pair: unknown) =>
      Array.isArray(pair) && typeof pair[0] === "string" && typeof pair[1] === "string" ? [{ ts: pair[0], headline: pair[1] }] : [],
    );
    return {
      channel: m.c,
      questionTs: m.q,
      decision: m.d,
      cards,
      ...(typeof m.s === "string" ? { shown: m.s } : {}),
      ...(typeof m.n === "string" && m.n ? { note: m.n } : {}),
    };
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
    ...(submit ? { submit: { type: "plain_text", text: "Submit" } } : {}),
    private_metadata: whichMetadata(popup),
    blocks: blocks.slice(0, MAX_VIEW_BLOCKS),
  };
}

const line = (text: string): unknown => ({ type: "section", text: { type: "mrkdwn", text } });
const context = (text: string): unknown => ({ type: "context", elements: [{ type: "mrkdwn", text }] });
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

const DECISIONS: ReadonlyArray<[Decision, string]> = [
  ["confirm", "Approve"],
  ["cancel", "Cancel"],
];

/**
 * The pop-up: the decision, the cards it could mean, a row per card with its
 * Show draft or Hide draft, and the note. `waiting` are the listed cards still
 * waiting, read just now; a card no longer waiting is not offered.
 *
 * @param popup - The question, the decision chosen and the draft open
 * @param waiting - The listed cards still waiting, in the question's order
 * @param pick - What the person has picked and typed so far
 * @param opts.databases - Where a Notion create's database opens, for a draft
 */
export function whichView(
  popup: WhichPopup,
  waiting: readonly PendingProposal[],
  pick: WhichPick,
  opts: { databases?: NotionDatabaseLinks } = {},
): View {
  const { decision } = popup;
  const offered = new Set(waiting.map((card) => card.proposalTs));
  const picked = pick.picked.filter((ts) => offered.has(ts));
  const option = (card: PendingProposal) => ({
    value: card.proposalTs,
    text: plain(headlineOf(popup, card)),
    description: plain(cardDoes(card), DESCRIPTION_CHARS),
  });
  const options = waiting.map(option);
  const chosen = options.filter((o) => picked.includes(o.value));
  const cards =
    decision === "confirm"
      ? {
          type: "input",
          block_id: CARDS_BLOCK.confirm,
          label: plain("Approve which one?"),
          element: { type: "radio_buttons", action_id: CARDS_ACTION_ID, options, ...(chosen[0] ? { initial_option: chosen[0] } : {}) },
        }
      : {
          type: "input",
          block_id: CARDS_BLOCK.cancel,
          label: plain("Cancel which ones?"),
          element: { type: "checkboxes", action_id: CARDS_ACTION_ID, options, ...(chosen.length ? { initial_options: chosen } : {}) },
        };
  const choice = DECISIONS.map(([value, text]) => ({ value, text: plain(text) }));
  const head: unknown[] = [
    {
      type: "actions",
      block_id: DECISION_BLOCK,
      elements: [
        { type: "radio_buttons", action_id: WHICH_DECISION_ACTION_ID, options: choice, initial_option: choice.find((c) => c.value === decision)! },
      ],
    },
    cards,
    { type: "divider" },
  ];
  // Cancel's reason, said on each card it closes. Approve has no use for
  // one, so it shows under Cancel only.
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
  const tail: unknown[] = decision === "cancel" ? [{ type: "divider" }, note] : [];
  // Under Approve, the note typed under Cancel waits in the metadata.
  const kept: WhichPopup = decision === "confirm" && pick.note ? { ...popup, note: pick.note } : popup;

  // "Show a draft…", by headline in the list's order, opening on the card
  // whose draft is open; then that draft, cut to the room the rest of the
  // view leaves it, and Hide draft after it.
  const drafts = waiting.map((card) => ({ value: card.proposalTs, text: plain(headlineOf(popup, card)) }));
  const open = waiting.find((card) => card.proposalTs === popup.shown);
  const select = {
    type: "actions",
    elements: [
      {
        type: "static_select",
        action_id: WHICH_DRAFT_ACTION_ID,
        placeholder: plain("Show a draft…"),
        options: drafts,
        ...(open ? { initial_option: drafts.find((o) => o.value === open.proposalTs)! } : {}),
      },
    ],
  };
  const hide = { type: "actions", elements: [{ type: "button", action_id: WHICH_HIDE_ACTION_ID, text: plain("Hide draft"), value: "hide" }] };
  const room = MAX_VIEW_BLOCKS - head.length - tail.length - 2;
  const body = open ? [select, ...fitBody(draftBlocks(open, opts), room, DRAFT_LEFT_OUT), hide] : [select];
  return modal(kept, [...head, ...body, ...tail], true);
}

/** The headline the question listed the card by, or the card's own. */
function headlineOf(popup: WhichPopup, card: PendingProposal): string {
  return popup.cards.find((c) => c.ts === card.proposalTs)?.headline ?? card.proposalTs;
}

type ViewValues = {
  values?: Record<
    string,
    Record<string, { value?: unknown; selected_option?: { value?: unknown } | null; selected_options?: Array<{ value?: unknown }> }>
  >;
};

/**
 * What the person has picked and typed, from a view's `state`: the cards in
 * the list `decision` shows, and the note — or, under Approve, which has no
 * note input, the one kept in the metadata (`kept`).
 */
export function whichPickOf(state: unknown, decision: Decision, kept = ""): WhichPick {
  const values = (state as ViewValues | undefined)?.values;
  const input = values?.[CARDS_BLOCK[decision]]?.[CARDS_ACTION_ID];
  const picked =
    decision === "confirm"
      ? [input?.selected_option?.value]
      : (input?.selected_options ?? []).map((o) => o.value);
  const typed = values?.[NOTE_BLOCK]?.[NOTE_ACTION_ID]?.value;
  const note = decision === "cancel" ? (typeof typed === "string" ? typed : "") : kept;
  return { picked: picked.filter((v): v is string => typeof v === "string" && v.length > 0), note };
}

/**
 * The pick as a Submit sends it, or the error Slack shows under the list when
 * nothing was picked. Approve's radio buttons hold one card at most; Cancel's
 * checkboxes any number.
 */
export function whichSubmitOf(state: unknown, decision: Decision): { ok: true; pick: WhichPick } | { ok: false; errors: Record<string, string> } {
  const pick = whichPickOf(state, decision);
  if (!pick.picked.length) {
    return { ok: false, errors: { [CARDS_BLOCK[decision]]: decision === "confirm" ? "Choose the card to approve." : "Tick at least one card to cancel." } };
  }
  return { ok: true, pick: { picked: decision === "confirm" ? pick.picked.slice(0, 1) : pick.picked, note: pick.note.trim() } };
}
