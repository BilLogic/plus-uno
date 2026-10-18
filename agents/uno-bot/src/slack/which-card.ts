// "Which one?" — a decision that named no card, with several waiting.
//
// A thread can hold several live proposal cards (#1318). A typed ✅ / ⛔ there,
// or a "yes" the model could not tie to one card, resolves nothing: Gate
// answers with a `which-card` note (`gate/gate.ts` § `whichCardNote`) and this
// file is where it becomes a message — one short line, "2 cards are waiting,
// nothing ran yet.", and two buttons, Approve… and Cancel…, each opening its
// own pop-up (`which-card-view.ts`). It replaced a row of numbered buttons,
// one per card (#1319): the headlines had to be listed above them for
// "Approve 2" to mean anything, and a draft could only be read on its own
// card.
//
// THE BUTTON PRESSED IS THE POP-UP'S KIND. Approve… opens a pop-up that
// approves one card, picked from a radio list; Cancel… one that cancels the
// cards ticked. Both are always offered, whatever the asking ✅ or ⛔ was, and
// nothing inside a pop-up switches its kind: the kind is set at open, in the
// view's callback id, and a Submit is read from that and its state alone
// (`which-card-view.ts` § `whichSubmitOf`), never from its metadata. A pop-up
// that once offered both behind a switch kept its choice in the metadata, and
// on a phone the switch to Cancel never arrived: the card ticked to cancel
// was approved. Each kind's path hands the Gate its own constant decision
// (`CONFIRM`, `CANCEL`) and refuses a verdict that comes back as the other.
// An old Choose… button, on a question posted before the two, opens the
// Cancel pop-up.
//
// THE POP-UP DECIDES EACH CARD THROUGH THAT CARD'S OWN DOOR. Submit hands
// each card to the Gate as a press on that card would (`button-door.ts`): the
// claim, the confirmer set, the pointer rule, the card edited to its outcome.
// An Approve posts its outcome in the thread as the card's ✅ does. A cancel
// with a note goes as the Review pop-up's Reject, its reason said on the
// card. So each pick acts only on its own card, the cards not picked stay
// live, and a card decided elsewhere while the pop-up was open loses its
// claim and is named in the pop-up's answer instead of being decided twice.
// A card the question did not list is never decided from it.
//
// THE QUESTION LAPSES ON THE CARD RULE. Its buttons stop working
// `cardExpiresAt` after the question was asked — 24 weekday hours
// (`card-expiry.ts`) — counted from the question's own message ts, which
// Slack hands back on every press and the pop-up carries in its metadata, so
// a Submit made past it runs nothing either. A card staged before the
// question can lapse first; picking it then says so, as a press on the card
// would.
//
// A CARD DECIDED ANYWHERE DROPS OUT OF IT. The turn keeps the question as
// posted in the thread store (`putWhichQuestion`), and every door that decides
// a listed card — these pop-ups, the card's own Review, a reaction, a typed
// emoji, the model's `proposal_resolve` — marks it there and redraws the
// question from that record (`gate.ts` `dropFromWhichQuestion`): the decided
// card's headline struck, the count of cards still waiting, and "Decided." in
// place of the buttons once none are left. A Submit marks every card it was
// made on, on this question's record, whatever each came to, so a card that
// lapsed or was replaced stays off it too.
//
// TWO LIMITS, ACCEPTED. A card asked about again points at the newest
// question only, so an older question listing it keeps offering it; its
// pop-up leaves it out once it is decided. And two doors deciding two
// different cards at once each redraw from their own read, so the edits can
// land out of order and show one decided card too few until the next
// decision. Neither costs a wrong decision.
//
// A CANCEL SAYS ONE LINE. A press posts its outcome in the thread; a cancel
// of several from here would post one bare "Canceled." per card, naming
// none. So the cards post nothing each (`ButtonRequest.quiet`), and the
// Submit posts one line naming the cards it canceled (`canceledLine`) — none
// for a card refused, decided elsewhere or past the budget. A stated card
// canceled here is named in that one line like any other; its stated words
// stay on the card.
//
// A CANCEL OF SEVERAL IS HELD TO THE BUDGET. Each card a Submit decides edits
// its card and its record, as a press would, so a Submit checks the
// invocation's subrequest headroom before each card after the first
// (`headroom`); a card past it is left waiting and named in the answer, to be
// ticked again. An Approve is one card.
//
// Pure apart from its named dependencies: no `Env`, no fetch.

import { MAX_WHICH_CARDS, type Delivery, type GateNote } from "../turn/index";
import { cardExpiresAt } from "../card-expiry";
import { renderGateNote, whichCardQuestion } from "./gate-note";
import { escapeSlackText } from "./mrkdwn";
import { isDeadlineBlock } from "./card-deadline";
import { applyPressVerdict, type ButtonDoorTarget, type ButtonRequest } from "./button-door";
import { awaitingDecision, resolveSignal, type GateRestage, type GateSignal, type GateVerdict } from "../gate/index";
import type { OperationOutcome } from "../gate/run-batch";
import type { CardMessage } from "./proposal-render";
import type { ReviewViews } from "./review-door";
import type { NotionDatabaseLinks } from "./review-notion-create";
import type { PendingProposal, ThreadState, WhichQuestion } from "../thread-state/index";
import { cardHeadline } from "../agent/card-identity";
import {
  REOPEN,
  whichLoadingView,
  whichNoticeView,
  whichPickOf,
  whichResultView,
  whichView,
  type WhichKind,
  type WhichPopup,
  type WhichSubmission,
} from "./which-card-view";

type WhichNote = Extract<GateNote, { kind: "which-card" }>;

/** Each pop-up's one decision. */
const CONFIRM = "confirm" as const;
const CANCEL = "cancel" as const;

/** The question's two buttons, each opening its own kind of pop-up. */
export const WHICH_APPROVE_ACTION_ID = "uno_which_approve";
export const WHICH_CANCEL_ACTION_ID = "uno_which_cancel";
/** The one button, Choose…, a question carried before there were two, still
 *  on questions posted then until they lapse. It opens the Cancel pop-up. */
export const WHICH_CHOOSE_ACTION_ID = "uno_which_choose";

/** The pop-up a button on the question opens; null for any other action. */
export function whichKindOfAction(actionId: string): WhichKind | null {
  if (actionId === WHICH_APPROVE_ACTION_ID) return "approve";
  if (actionId === WHICH_CANCEL_ACTION_ID || actionId === WHICH_CHOOSE_ACTION_ID) return "cancel";
  return null;
}

/** The numbered buttons the question carried before the pop-up ("Approve 1"),
 *  still on questions posted then until they lapse. */
const LEGACY_PRESS = /^uno_which_(?:confirm|cancel)_\d+$/;

/** Whether an action is one of the numbered buttons a question used to carry. */
export function isLegacyWhichPress(actionId: string): boolean {
  return LEGACY_PRESS.test(actionId);
}

/** Said to the presser alone on a numbered button a question posted before
 *  the pop-up still carries. */
export const LEGACY_WHICH_REPLY = "Nothing ran: press Review on the card you mean.";

/** What the question says in place of its buttons once every card it lists
 *  is decided. */
const DECIDED = "Decided.";

/** Said to the presser alone when the question has lapsed. */
export const WHICH_EXPIRED_REPLY = "That question expired, so nothing ran. Press Review on the card you mean.";

/** Said in the pop-up when no card it listed is waiting any more. */
export const NOTHING_WAITING = "None of these cards is waiting any more.";

/** Said for a card a Submit names that the question did not list. */
const NOT_LISTED = "not on this question, so nothing ran.";

/**
 * The question as Slack gets it: how many cards are waiting, and Approve…
 * and Cancel…, whose value is the cards' ts — what the pop-up opens on. Its
 * buttons still lapse on the card rule, counted from the question's ts, but
 * the message does not say when.
 *
 * Redrawn after a door decides a card it lists (`Delivery.redrawWhichCard`),
 * the decided card's headline is struck under the count of cards still
 * waiting; with every card decided, the buttons give way to "Decided.".
 *
 * @param note - The question
 * @param decided - The listed cards decided since it was asked, by ts
 */
export function whichCardMessage(note: WhichNote, decided: readonly string[] = []): CardMessage {
  const cards = note.cards.slice(0, MAX_WHICH_CARDS);
  const open = cards.filter((card) => !decided.includes(card.ts)).length;
  // Headlines come from the model's input, so escaped — and trimmed, since
  // a strike opened or closed beside a space is not a strike. A ~ inside
  // one would close it early, so a struck line reads its look-alike.
  const struck = cards
    .filter((card) => decided.includes(card.ts))
    .map((card) => `~${escapeSlackText(card.headline.trim()).replaceAll("~", "∼")}~`);
  const still = `${open === 1 ? "1 card is" : `${open} cards are`} still waiting.`;
  const lead = !decided.length ? whichCardQuestion(note) : open ? still : "";
  const text = [lead, ...struck].filter(Boolean).join("\n");
  return {
    text: renderGateNote(note),
    blocks: [
      { type: "section", text: { type: "mrkdwn", text } },
      open
        ? { type: "actions", elements: questionButtons(cards.map((card) => card.ts)) }
        : { type: "context", elements: [{ type: "mrkdwn", text: DECIDED }] },
    ],
  };
}

/** A kept question (`ThreadState.decideInWhichQuestion`), as Slack gets it. */
export function keptQuestionMessage(question: WhichQuestion): CardMessage {
  return whichCardMessage({ kind: "which-card", decision: question.decision, cards: question.cards }, question.decided);
}

/** Approve… and Cancel…, in the default style: each one's value is every
 *  card the question lists, in its order — ten ts at most, well inside a
 *  value's 2,000 characters — after `cards:`. The kind is the button's
 *  action_id; the value never says it. */
function questionButtons(cards: readonly string[]): Array<Record<string, unknown>> {
  const value = `cards:${cards.join(",")}`;
  const button = (actionId: string, text: string) => ({ type: "button", action_id: actionId, text: { type: "plain_text", text, emoji: true }, value });
  return [button(WHICH_APPROVE_ACTION_ID, "Approve…"), button(WHICH_CANCEL_ACTION_ID, "Cancel…")];
}

/** A button's value back as the cards' ts; null for anything else. A
 *  Choose… posted before the two buttons carries `confirm:` or `cancel:`
 *  instead, and the prefix is never read as a decision. */
export function chooseValueOf(value: string | undefined): { cards: string[] } | null {
  const m = /^(?:cards|confirm|cancel):(.+)$/.exec(value ?? "");
  if (!m) return null;
  const cards = m[1]!.split(",").filter(Boolean);
  return cards.length ? { cards } : null;
}

// ── The doors ───────────────────────────────────────────────────────────────

export interface WhichDoorDeps {
  threadState: ThreadState;
  /** Gate's own `standingConfirmers`, handed through. */
  standingConfirmers?: readonly string[];
  views: ReviewViews;
  /** Where a decided card's note speaks — see `ButtonDoorDeps.delivery`. */
  delivery(target: ButtonDoorTarget): Delivery;
  /** The confirmed tool and its record — see `ButtonDoorDeps.applyVerdict`. */
  applyVerdict(verdict: GateVerdict): Promise<readonly OperationOutcome[] | void>;
  /** See `ButtonDoorDeps.restage`. */
  restage(restage: GateRestage, delivery: Delivery): Promise<void>;
  /** A decided card's message, edited to its outcome — the CARD, by its ts,
   *  not the question. */
  editCard(cardTs: string, message: CardMessage): Promise<void>;
  /** The question's message, redrawn (`chat.update`). */
  editQuestion(message: CardMessage): Promise<void>;
  /** Said to the presser alone: a button pressed on a lapsed question. */
  replyEphemeral(text: string): Promise<void>;
  /** The clock the lapse is read on. Absent, `Date.now`. */
  now?(): number;
  /** External subrequests this invocation has left. Absent, unbounded. */
  headroom?(): number;
  /** Where the Notion databases a create lands in open, for a draft. */
  notionDatabases?: NotionDatabaseLinks;
}

/** Approve… or Cancel… (or an old Choose…), pressed on the question. */
export interface WhichOpenRequest {
  triggerId: string;
  channel: string;
  /** The question's own message: when it was asked, and what is redrawn. */
  questionTs: string;
  /** The question as Slack holds it now, redrawn when it has lapsed. */
  question: CardMessage;
  /** The button's value (`chooseValueOf`). */
  value: string | undefined;
  /** The pop-up the button opens (`whichKindOfAction`). */
  kind: WhichKind;
  userId: string;
}

/**
 * A button on the question, pressed: past the question's deadline the
 * presser is told and the question loses its buttons; otherwise a loading
 * view of the button's kind opens at once, inside the trigger's three
 * seconds, and is filled with the cards still waiting.
 */
export async function runWhichOpen(request: WhichOpenRequest, deps: WhichDoorDeps): Promise<void> {
  const asked = chooseValueOf(request.value);
  if (!asked) return;
  const { kind } = request;
  if (lapsed(request.questionTs, (deps.now ?? Date.now)())) {
    console.log(`[which-card] ${kind} on ${request.channel}/${request.questionTs} after its deadline`);
    await deps.replyEphemeral(WHICH_EXPIRED_REPLY);
    await deps.editQuestion(withoutButtons(request.question, "Expired."));
    return;
  }
  const loading: WhichPopup = { channel: request.channel, questionTs: request.questionTs, cards: [] };
  const viewId = await deps.views.open(request.triggerId, whichLoadingView(kind, loading));
  if (!viewId) {
    console.warn(`[which-card] views.open refused for ${request.channel}/${request.questionTs}`);
    return;
  }
  const waiting = await waitingCards(asked.cards, request.channel, deps);
  // Each card by the headline the question was asked with (`whichCardNote`).
  const popup: WhichPopup = { ...loading, cards: waiting.map((card) => ({ ts: card.proposalTs, headline: cardHeadline(card) })) };
  console.log(`[which-card] opened ${kind} on ${request.channel}/${request.questionTs} by=${request.userId} waiting=${waiting.length}/${asked.cards.length}`);
  if (!waiting.length) {
    await deps.views.update(viewId, whichNoticeView(kind, popup, NOTHING_WAITING));
    await deps.editQuestion(withoutButtons(request.question, DECIDED));
    return;
  }
  await deps.views.update(viewId, whichView(kind, popup, waiting, { picked: [], note: "" }, databasesOf(deps)));
}

/** A press inside the pop-up that redraws it. */
export type WhichRedraw =
  /** A card chosen under "Show a draft…": its draft opens below. */
  | { kind: "draft"; cardTs: string }
  /** Hide draft, after the open draft. */
  | { kind: "hide" }
  /** The Approve / Cancel switch on a view opened before the two pop-ups. */
  | { kind: "redraw" };

export interface WhichRedrawRequest {
  viewId: string;
  /** The pop-up as the press found it, from its `private_metadata`. */
  popup: WhichPopup;
  /** The pop-up's kind, from its `callback_id` (`whichKindOf`); null for a
   *  view opened before the two pop-ups. */
  kind: WhichKind | null;
  /** The view's `state`, as Slack sent it with the press. */
  state: unknown;
  /** The view's `hash` as the press found it. Every redraw carries it, so a
   *  redraw that lands after the Submit's ack or its answer is refused by
   *  Slack (`hash_conflict`) and dropped, instead of drawing the pick over
   *  them. */
  hash?: string;
  press: WhichRedraw;
  userId: string;
}

/**
 * A draft chosen, or Hide draft pressed: the pop-up redrawn, of the same
 * kind, from the cards still waiting, read now, with what was picked and
 * typed set back in its inputs. Past the question's deadline the pop-up says
 * so instead; a view opened before the two pop-ups says to open the question
 * again, and decides nothing.
 */
export async function runWhichRedraw(request: WhichRedrawRequest, deps: WhichDoorDeps): Promise<void> {
  const { popup, press, kind } = request;
  // A refused update is the view having moved on: nothing to do about it.
  const show = (view: Record<string, unknown>) => deps.views.update(request.viewId, view, request.hash);
  if (!kind) {
    console.log(`[which-card] press in a view opened before the two pop-ups on ${popup.channel}/${popup.questionTs}`);
    await show(whichNoticeView(null, popup, REOPEN));
    return;
  }
  if (lapsed(popup.questionTs, (deps.now ?? Date.now)())) {
    await show(whichNoticeView(kind, popup, WHICH_EXPIRED_REPLY));
    return;
  }
  const pick = whichPickOf(kind, request.state);
  const shown = press.kind === "draft" ? press.cardTs : press.kind === "hide" ? undefined : popup.shown;
  const { shown: _was, ...rest } = popup;
  const next: WhichPopup = { ...rest, ...(shown ? { shown } : {}) };
  const waiting = await waitingCards(popup.cards.map((card) => card.ts), popup.channel, deps);
  if (!waiting.length) {
    await show(whichNoticeView(kind, next, NOTHING_WAITING));
    return;
  }
  await show(whichView(kind, next, waiting, pick, databasesOf(deps)));
}

/** A Submit from a pop-up, as the ack read it. */
export interface WhichSubmitRequest {
  viewId: string;
  popup: WhichPopup;
  /** What it decides, read from its kind and its state (`whichSubmitOf`). */
  submission: WhichSubmission;
  userId: string;
}

type ApproveSubmission = Extract<WhichSubmission, { kind: "approve" }>;
type CancelSubmission = Extract<WhichSubmission, { kind: "cancel" }>;

/**
 * A Cancel's one line in the thread, naming the cards it canceled: "Canceled
 * *A*.", "Canceled *A* and *B*.", "Canceled *A*, *B* and *C*.". Headlines
 * come from the model's input, so escaped, and trimmed, since bold opened
 * beside a space is not bold.
 */
export function canceledLine(headlines: readonly string[]): string {
  const names = headlines.map((headline) => `*${escapeSlackText(headline.trim())}*`);
  const last = names.pop();
  return `Canceled ${names.length ? `${names.join(", ")} and ${last}` : last}.`;
}

/** The subrequests one card's cancel spends, as a press does: the working
 *  signal raised and settled, its card edited, the decision's record, and its
 *  mark on this question — with room to spare. And what the Submit spends
 *  after the last card: the one line in the thread, the pop-up's answer and
 *  the question redrawn. */
const PER_CARD_SUBREQUESTS = 10;
const FINISH_SUBREQUESTS = 3;

/**
 * A Submit, decided by its kind: an Approve's one card approved, or a
 * Cancel's ticked cards canceled, each through the Gate as a press on that
 * card, and then the question redrawn from its record and the pop-up
 * answered with one line per card.
 *
 * Past the question's deadline nothing is resolved: the pop-up says so, and
 * the question is left for its next press to find lapsed. A card that did
 * not win — decided elsewhere, lapsed, replaced, waiting on someone else — is
 * named in the answer with the Gate's own words for why, and is marked on
 * this question so it is not offered again.
 */
export async function runWhichSubmit(request: WhichSubmitRequest, deps: WhichDoorDeps): Promise<void> {
  const { popup, submission } = request;
  if (lapsed(popup.questionTs, (deps.now ?? Date.now)())) {
    console.log(`[which-card] ${submission.kind} on ${popup.channel}/${popup.questionTs} after its deadline`);
    await deps.views.update(request.viewId, whichNoticeView(submission.kind, popup, WHICH_EXPIRED_REPLY));
    return;
  }
  if (submission.kind === "approve") return runWhichApprove(request, submission, deps);
  return runWhichCancel(request, submission, deps);
}

/** The card's name in the pop-up's answer: the headline the question listed
 *  it by, trimmed before the fallback, so a blank one is never drawn as
 *  `**`. */
function nameOf(popup: WhichPopup, cardTs: string): string {
  return popup.cards.find((c) => c.ts === cardTs)?.headline.trim() || "That card";
}

/** Whether the question this pop-up answers listed the card. */
function listed(popup: WhichPopup, cardTs: string): boolean {
  return popup.cards.some((c) => c.ts === cardTs);
}

/**
 * An Approve pop-up's Submit: its one picked card, approved as that card's
 * own ✅ press would be (`approveOne`), the question redrawn, and the pop-up
 * answered with one line. A card the question did not list runs nothing.
 */
async function runWhichApprove(request: WhichSubmitRequest, submission: ApproveSubmission, deps: WhichDoorDeps): Promise<void> {
  const { popup } = request;
  const cardTs = submission.card;
  const headline = `*${escapeSlackText(nameOf(popup, cardTs))}*`;
  if (!listed(popup, cardTs)) {
    console.warn(`[which-card] approve on ${popup.channel}/${popup.questionTs} named ${cardTs}, which it did not list: refused`);
    await deps.views.update(request.viewId, whichResultView("approve", popup, [`${headline}: ${NOT_LISTED}`]));
    return;
  }
  const decided = await approveOne(cardTs, request, deps);
  console.log(`[which-card] approve on ${popup.channel}/${popup.questionTs} by=${request.userId} card=${cardTs}`);
  // The pop-up's answer first: a budget stop after the write leaves the
  // question unstruck, never the pop-up on "Approving…".
  await deps.views.update(request.viewId, whichResultView("approve", popup, [`${headline}: ${decided.line}`]));
  if (decided.question) await deps.editQuestion(keptQuestionMessage(decided.question));
}

/**
 * The picked card, approved as a ✅ press on it would be: the claim, and on a
 * win the press's own path (`applyPressVerdict`) — its outcome posted in the
 * thread, the run, the card edited. A non-win is answered in the pop-up, as
 * the Review pop-up answers one, never edited onto the card. The claim is
 * made with the constant `CONFIRM`, so its verdict carries that decision; a
 * verdict that came back as anything else would still hold its claim, and is
 * kept from the press path, so nothing runs on it.
 */
async function approveOne(cardTs: string, request: WhichSubmitRequest, deps: WhichDoorDeps): Promise<{ line: string; question: WhichQuestion | null }> {
  const { popup, userId } = request;
  const decision = CONFIRM;
  const signal: GateSignal = { kind: "button", messageTs: cardTs, decision, userId };
  const verdict = await resolveSignal(signal, { threadState: deps.threadState, standingConfirmers: deps.standingConfirmers });
  console.log(`[which-card] approve on ${popup.channel}/${cardTs} by=${userId} outcome=${verdict.outcome}`);
  if (verdict.decision !== undefined && verdict.decision !== CONFIRM) {
    // Past the claim: the card is held, not run.
    console.error(`[which-card] ${popup.channel}/${cardTs} came back as ${verdict.decision}, not an approval: not applied`);
    return { line: "Nothing ran. Use its card's Review.", question: null };
  }
  if (verdict.outcome !== "won" && verdict.post && verdict.post.note.kind !== "cut-off") {
    return { line: renderGateNote(verdict.post.note), question: await markHere(cardTs, popup, deps) };
  }
  let said = "";
  // A win posts its own outcome in the thread, as the card's ✅ does.
  const press: ButtonRequest = { channel: popup.channel, messageTs: cardTs, decision, userId, fromQuestion: popup.questionTs };
  const question = await applyPressVerdict(press, verdict, pressDeps(cardTs, deps, (text) => void (said = text)));
  if (verdict.outcome === "won") return { line: "Approved.", question: question ?? (await markHere(cardTs, popup, deps)) };
  return { line: said || (verdict.post ? renderGateNote(verdict.post.note) : "Nothing changed."), question: question ?? (await markHere(cardTs, popup, deps)) };
}

/**
 * A Cancel pop-up's Submit: each ticked card in turn canceled, through the
 * Gate as a ⛔ press on that card (`cancelOne`), then one line in the thread
 * naming the cards canceled, the question redrawn from its record, and the
 * pop-up answered with one line per card.
 */
async function runWhichCancel(request: WhichSubmitRequest, submission: CancelSubmission, deps: WhichDoorDeps): Promise<void> {
  const { popup } = request;
  const lines: string[] = [];
  let kept: WhichQuestion | null = null;
  const canceled: string[] = [];
  let thread: ButtonDoorTarget | undefined;
  for (const [i, cardTs] of submission.picked.entries()) {
    const named = nameOf(popup, cardTs);
    const headline = `*${escapeSlackText(named)}*`;
    if (!listed(popup, cardTs)) {
      lines.push(`${headline}: ${NOT_LISTED}`);
      continue;
    }
    if (i > 0 && (deps.headroom?.() ?? Infinity) < PER_CARD_SUBREQUESTS + FINISH_SUBREQUESTS) {
      lines.push(`${headline}: not reached this time, so it is still waiting. Tick it again.`);
      continue;
    }
    const decided = await cancelOne(cardTs, request, submission.note, deps);
    if (decided.question) kept = decided.question;
    if (decided.canceledIn) {
      canceled.push(named);
      thread ??= decided.canceledIn;
    }
    lines.push(`${headline}: ${decided.line}`);
  }
  console.log(`[which-card] cancel on ${popup.channel}/${popup.questionTs} by=${request.userId} cards=${submission.picked.length} canceled=${canceled.length}`);
  // The cards posted no note each (`ButtonRequest.quiet`): the thread hears
  // one line naming the ones it canceled, and none if it canceled none.
  if (thread) await deps.delivery(thread).postNote(canceledLine(canceled));
  if (kept) await deps.editQuestion(keptQuestionMessage(kept));
  await deps.views.update(request.viewId, whichResultView("cancel", popup, lines));
}

/**
 * One ticked card, canceled as a ⛔ press on it would be: the claim, and on a
 * win the press's own path (`applyPressVerdict`) — the card edited to its
 * outcome. A non-win is answered in the pop-up, as the Review pop-up answers
 * one, never edited onto the card. The claim is made with the constant
 * `CANCEL`, so its verdict carries that decision; a verdict that came back
 * as anything else would still hold its claim, and is kept from the press
 * path, so no Cancel Submit can reach a run.
 */
async function cancelOne(
  cardTs: string,
  request: WhichSubmitRequest,
  note: string,
  deps: WhichDoorDeps,
): Promise<{ line: string; question: WhichQuestion | null; canceledIn?: ButtonDoorTarget }> {
  const { popup, userId } = request;
  const decision = CANCEL;
  // A cancel with a note is the Review pop-up's Reject: the note is its
  // reason, said on the card. Without one, it is the card's ⛔, pressed.
  const signal: GateSignal = note
    ? { kind: "review", messageTs: cardTs, decision, note, userId }
    : { kind: "button", messageTs: cardTs, decision, userId };
  const verdict = await resolveSignal(signal, { threadState: deps.threadState, standingConfirmers: deps.standingConfirmers });
  console.log(`[which-card] cancel on ${popup.channel}/${cardTs} by=${userId} outcome=${verdict.outcome}`);
  if (verdict.decision !== undefined && verdict.decision !== CANCEL) {
    // Past the claim: the card is held, not run.
    console.error(`[which-card] ${popup.channel}/${cardTs} came back as ${verdict.decision}, not a cancel: not applied`);
    return { line: "Nothing ran. Use its card's Review.", question: null };
  }
  if (verdict.outcome !== "won" && verdict.post && verdict.post.note.kind !== "cut-off") {
    return { line: renderGateNote(verdict.post.note), question: await markHere(cardTs, popup, deps) };
  }
  let said = "";
  // A win posts no note of its own: the Submit says one line for every card
  // it canceled.
  const press: ButtonRequest = { channel: popup.channel, messageTs: cardTs, decision, userId, fromQuestion: popup.questionTs, quiet: true };
  const question = await applyPressVerdict(press, verdict, pressDeps(cardTs, deps, (text) => void (said = text)));
  if (verdict.outcome === "won") {
    const marked = question ?? (await markHere(cardTs, popup, deps));
    const { proposal, post } = verdict;
    const canceledIn =
      proposal && post?.note.kind === "resolved"
        ? { channel: proposal.channel, replyTs: post.replyTs, userMsgTs: proposal.userMsgTs, userId }
        : undefined;
    return { line: "Canceled.", question: marked, ...(canceledIn ? { canceledIn } : {}) };
  }
  return { line: said || (verdict.post ? renderGateNote(verdict.post.note) : "Nothing changed."), question: question ?? (await markHere(cardTs, popup, deps)) };
}

/** A press path's dependencies, for one card decided from a pop-up: what it
 *  would say to the presser alone is kept for the pop-up's answer, and the
 *  card, not the question, is the message edited. */
function pressDeps(cardTs: string, deps: WhichDoorDeps, say: (text: string) => void): Parameters<typeof applyPressVerdict>[2] {
  return {
    delivery: deps.delivery,
    applyVerdict: deps.applyVerdict,
    restage: deps.restage,
    replyEphemeral: async (text) => say(text),
    replaceCard: (message) => deps.editCard(cardTs, message),
    reports: deps.threadState,
    threadState: deps.threadState,
    ...(deps.now ? { now: deps.now } : {}),
  };
}

/**
 * A picked card, marked on THIS question's record once it is no longer
 * waiting — decided here, decided elsewhere, lapsed, replaced — whenever the
 * press path did not mark it there itself (its pointer names a newer
 * question, or it did not win), so a later redraw from the record does not
 * offer it again. Inside the card's own step, so the budget held back for
 * each card covers it. Null when the card still waits, there is no record,
 * or another door marked it already and redrew.
 */
async function markHere(cardTs: string, popup: WhichPopup, deps: Pick<WhichDoorDeps, "threadState">): Promise<WhichQuestion | null> {
  const after = await deps.threadState.getProposalByTs(cardTs).catch(() => null);
  if (!after || (after.state === "found" && awaitingDecision([after.proposal]).length)) return null;
  return deps.threadState.decideInWhichQuestion(cardTs, popup.questionTs).catch(() => null);
}

/**
 * The question without its buttons: the row gives way to a context line
 * saying why, and a deadline line, on a question old enough to carry one,
 * goes with it.
 */
function withoutButtons(question: CardMessage, done: string): CardMessage {
  const blocks = (question.blocks as Array<{ type?: string }>).flatMap((block): unknown[] => {
    if (isDeadlineBlock(block)) return [];
    if (block.type !== "actions") return [block];
    return [{ type: "context", elements: [{ type: "mrkdwn", text: done }] }];
  });
  return { text: question.text, blocks };
}

/** The listed cards still waiting on a decision, read now, in the order
 *  listed. A read that fails leaves its card out. */
async function waitingCards(cards: readonly string[], channel: string, deps: Pick<WhichDoorDeps, "threadState">): Promise<PendingProposal[]> {
  const read = await Promise.all(
    cards.map((ts) =>
      deps.threadState.getProposalByTs(ts).catch((err: unknown) => {
        console.warn(`[which-card] ${channel}/${ts} not read: ${err instanceof Error ? err.message : String(err)}`);
        return null;
      }),
    ),
  );
  return awaitingDecision(read.flatMap((lookup) => (lookup?.state === "found" ? [lookup.proposal] : [])));
}

/** Whether the question asked at `questionTs` has lapsed by `now`. */
function lapsed(questionTs: string, now: number): boolean {
  const askedAt = Number.parseFloat(questionTs) * 1000;
  return !Number.isFinite(askedAt) || now > cardExpiresAt(askedAt);
}

function databasesOf(deps: Pick<WhichDoorDeps, "notionDatabases">): { databases?: NotionDatabaseLinks } {
  return deps.notionDatabases ? { databases: deps.notionDatabases } : {};
}
