// "Which one?" — a decision that named no card, with several waiting.
//
// A thread can hold several live proposal cards (#1318). A typed ✅ / ⛔ there,
// or a "yes" the model could not tie to one card, resolves nothing: Gate
// answers with a `which-card` note (`gate/gate.ts` § `whichCardNote`) and this
// file is where it becomes a message — one short line, "2 cards are waiting,
// nothing ran yet.", and one unstyled button, Review, opening one pop-up,
// "Review cards" (`which-card-view.ts`), that lists every waiting card and
// lets each be decided in place. It replaced a row of numbered buttons, one
// per card (#1319), and then two buttons, Approve… and Cancel…, each opening
// a pop-up of one kind.
//
// EACH CARD IS DECIDED BY ITS OWN ROW ALONE. Every row starts on Leave, and
// Done reads each card's choice only from the submitted state under that
// card's own block (`which-card-view.ts` § `whichSubmitOf`): never from the
// view's metadata, the button's value, or any stored decision. A pop-up that
// once kept its decision in the metadata approved, on a phone, the card the
// person had switched to Cancel: the switch's press never arrived, and the
// stored decision stood over the one on screen. Each card's path hands the
// Gate its own constant decision (`CONFIRM`, `CANCEL`) and refuses a verdict
// that comes back as the other. Every button an earlier question carries —
// Choose…, Approve…, Cancel… — opens this pop-up; Done under an older
// pop-up's callback id is refused with "Open the question again."
//
// DONE DECIDES EACH CARD THROUGH THAT CARD'S OWN DOOR. Each card chosen is
// handed to the Gate as a press on that card would be (`button-door.ts`): the
// claim, the confirmer set, the pointer rule, the card edited to its outcome.
// An Approve posts its outcome in the thread as the card's ✅ does, so a
// person the card does not let decide it is refused for that card alone. A
// cancel with a note goes as the Review pop-up's Reject, its reason said on
// the card. A card decided elsewhere while the pop-up was open loses its
// claim and is named in the pop-up's answer instead of being decided twice.
// A card the question did not list is never decided from it.
//
// THE QUESTION LAPSES ON THE CARD RULE. Its button stops working
// `cardExpiresAt` after the question was asked — 24 weekday hours
// (`card-expiry.ts`) — counted from the question's own message ts, which
// Slack hands back on every press and the pop-up carries in its metadata, so
// a Done made past it runs nothing either. A card staged before the question
// can lapse first; choosing it then says so, as a press on the card would.
//
// A CARD DECIDED ANYWHERE DROPS OUT OF IT. The turn keeps the question as
// posted in the thread store (`putWhichQuestion`), and every door that decides
// a listed card — this pop-up, the card's own Review, a reaction, a typed
// emoji, the model's `proposal_resolve` — marks it there and redraws the
// question from that record (`gate.ts` `dropFromWhichQuestion`): the decided
// card's headline struck, the count of cards still waiting, and "Decided." in
// place of the button once none are left. Done marks every card it decided or
// tried to, on this question's record, whatever each came to, so a card that
// lapsed or was replaced stays off it too.
//
// TWO LIMITS, ACCEPTED. A card asked about again points at the newest
// question only, so an older question listing it keeps offering it; its
// pop-up leaves it out once it is decided. And two doors deciding two
// different cards at once each redraw from their own read, so the edits can
// land out of order and show one decided card too few until the next
// decision. Neither costs a wrong decision.
//
// A CANCEL SAYS ONE LINE. A press posts its outcome in the thread; several
// cancels from here would post one bare "Canceled." per card, naming none. So
// the cards canceled post nothing each (`ButtonRequest.quiet`), and Done posts
// one line naming them (`canceledLine`) — none for a card refused, decided
// elsewhere or past the budget. A stated card canceled here is named in that
// one line like any other; its stated words stay on the card.
//
// DONE IS HELD TO THE BUDGET, IN THE LIST'S ORDER. Each card it decides edits
// its card and its record, as a press would, and an Approve runs its write
// too, so before each Approve, and before each cancel after the first card
// decided, Done checks the invocation's subrequest and D1 headroom
// (`headroom`). The first card it cannot afford, and every chosen card after
// it, is left waiting and named in the answer, to be chosen again. The answer
// is drawn before the question is redrawn, so a stop never leaves the pop-up
// on "Deciding…".
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
  NOTHING_CHOSEN,
  REOPEN,
  WHICH_REVIEW_CALLBACK_ID,
  whichChoicesOf,
  whichLoadingView,
  whichNoticeView,
  whichResultView,
  whichView,
  type WhichPopup,
  type WhichSubmission,
} from "./which-card-view";

type WhichNote = Extract<GateNote, { kind: "which-card" }>;

/** Each card's one decision, by its path. */
const CONFIRM = "confirm" as const;
const CANCEL = "cancel" as const;

/** The question's one button. */
export const WHICH_REVIEW_ACTION_ID = "uno_which_review";
/** The buttons earlier questions carried, still on questions posted then
 *  until they lapse: Choose…, and Approve… and Cancel…. Each opens the one
 *  pop-up; what it was named never decides anything. */
const OLD_OPEN_ACTION_IDS: ReadonlySet<string> = new Set(["uno_which_choose", "uno_which_approve", "uno_which_cancel"]);

/** Whether an action is a button on the question that opens the pop-up. */
export function isWhichOpenAction(actionId: string): boolean {
  return actionId === WHICH_REVIEW_ACTION_ID || OLD_OPEN_ACTION_IDS.has(actionId);
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

/** What the question says in place of its button once every card it lists
 *  is decided. */
const DECIDED = "Decided.";

/** Said to the presser alone when the question has lapsed. */
export const WHICH_EXPIRED_REPLY = "That question expired, so nothing ran. Press Review on the card you mean.";

/** Said in the pop-up when no card it listed is waiting any more. */
export const NOTHING_WAITING = "None of these cards is waiting any more.";

/** Said in the pop-up while Done is under way. */
export const DECIDING = "Deciding…";

/** Said for a card Done names that the question did not list. */
const NOT_LISTED = "not on this question, so nothing ran.";

/** Said for a card Done did not reach before the budget ran short. */
const NOT_REACHED = "not reached this time, so it is still waiting. Choose it again.";

/**
 * The question as Slack gets it: how many cards are waiting, and Review,
 * whose value is the cards' ts — what the pop-up opens on. Its button still
 * lapses on the card rule, counted from the question's ts, but the message
 * does not say when.
 *
 * Redrawn after a door decides a card it lists (`Delivery.redrawWhichCard`),
 * the decided card's headline is struck under the count of cards still
 * waiting; with every card decided, the button gives way to "Decided.".
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
        ? { type: "actions", elements: [reviewButton(cards.map((card) => card.ts))] }
        : { type: "context", elements: [{ type: "mrkdwn", text: DECIDED }] },
    ],
  };
}

/** A kept question (`ThreadState.decideInWhichQuestion`), as Slack gets it. */
export function keptQuestionMessage(question: WhichQuestion): CardMessage {
  return whichCardMessage({ kind: "which-card", decision: question.decision, cards: question.cards }, question.decided);
}

/** Review, in the default style: its value is every card the question
 *  lists, in its order — ten ts at most, well inside a value's 2,000
 *  characters — after `cards:`. It never says a decision. */
function reviewButton(cards: readonly string[]): Record<string, unknown> {
  return { type: "button", action_id: WHICH_REVIEW_ACTION_ID, text: { type: "plain_text", text: "Review", emoji: true }, value: `cards:${cards.join(",")}` };
}

/** A button's value back as the cards' ts; null for anything else. A
 *  Choose… posted before carries `confirm:` or `cancel:` instead, and the
 *  prefix is never read as a decision. */
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

/** Review (or a button an earlier question carries), pressed on the question. */
export interface WhichOpenRequest {
  triggerId: string;
  channel: string;
  /** The question's own message: when it was asked, and what is redrawn. */
  questionTs: string;
  /** The question as Slack holds it now, redrawn when it has lapsed. */
  question: CardMessage;
  /** The button's value (`chooseValueOf`). */
  value: string | undefined;
  userId: string;
}

/**
 * A button on the question, pressed: past the question's deadline the
 * presser is told and the question loses its button; otherwise a loading
 * view opens at once, inside the trigger's three seconds, and is filled with
 * a row for every card still waiting, each on Leave.
 */
export async function runWhichOpen(request: WhichOpenRequest, deps: WhichDoorDeps): Promise<void> {
  const asked = chooseValueOf(request.value);
  if (!asked) return;
  if (lapsed(request.questionTs, (deps.now ?? Date.now)())) {
    console.log(`[which-card] review on ${request.channel}/${request.questionTs} after its deadline`);
    await deps.replyEphemeral(WHICH_EXPIRED_REPLY);
    await deps.editQuestion(withoutButtons(request.question, "Expired."));
    return;
  }
  const loading: WhichPopup = { channel: request.channel, questionTs: request.questionTs, cards: [] };
  const viewId = await deps.views.open(request.triggerId, whichLoadingView(loading));
  if (!viewId) {
    console.warn(`[which-card] views.open refused for ${request.channel}/${request.questionTs}`);
    return;
  }
  const waiting = await waitingCards(asked.cards, request.channel, deps);
  // Each card by the headline the question was asked with (`whichCardNote`).
  const popup: WhichPopup = { ...loading, cards: waiting.map((card) => ({ ts: card.proposalTs, headline: cardHeadline(card) })) };
  console.log(`[which-card] opened on ${request.channel}/${request.questionTs} by=${request.userId} waiting=${waiting.length}/${asked.cards.length}`);
  if (!waiting.length) {
    await deps.views.update(viewId, whichNoticeView(popup, NOTHING_WAITING));
    await deps.editQuestion(withoutButtons(request.question, DECIDED));
    return;
  }
  await deps.views.update(viewId, whichView(popup, waiting, { rows: {}, note: "" }, databasesOf(deps)));
}

/** A press inside the pop-up that redraws it. */
export type WhichRedraw =
  /** Show draft on a row: its draft opens under it. */
  | { kind: "show"; cardTs: string }
  /** Hide draft on the row whose draft is open. */
  | { kind: "hide" }
  /** A press inside a view opened before this pop-up. */
  | { kind: "old" };

export interface WhichRedrawRequest {
  viewId: string;
  /** The pop-up as the press found it, from its `private_metadata`. */
  popup: WhichPopup;
  /** The view's `callback_id`: anything but this pop-up's is a view opened
   *  before it. */
  callbackId: string | undefined;
  /** The view's `state`, as Slack sent it with the press. */
  state: unknown;
  /** The view's `hash` as the press found it. Every redraw carries it, so a
   *  redraw that lands after Done's ack or its answer is refused by Slack
   *  (`hash_conflict`) and dropped, instead of drawing the rows over them. */
  hash?: string;
  press: WhichRedraw;
  userId: string;
}

/**
 * Show draft or Hide draft pressed: the pop-up redrawn from the cards still
 * waiting, read now, with each row's choice and the note set back from the
 * state the press carried. Past the question's deadline the pop-up says so
 * instead; a view opened before this pop-up says to open the question again,
 * and decides nothing.
 */
export async function runWhichRedraw(request: WhichRedrawRequest, deps: WhichDoorDeps): Promise<void> {
  const { popup, press } = request;
  // A refused update is the view having moved on: nothing to do about it.
  const show = (view: Record<string, unknown>) => deps.views.update(request.viewId, view, request.hash);
  if (request.callbackId !== WHICH_REVIEW_CALLBACK_ID || press.kind === "old") {
    console.log(`[which-card] press in a view opened before the Review cards pop-up on ${popup.channel}/${popup.questionTs}`);
    await show(whichNoticeView(popup, REOPEN));
    return;
  }
  if (lapsed(popup.questionTs, (deps.now ?? Date.now)())) {
    await show(whichNoticeView(popup, WHICH_EXPIRED_REPLY));
    return;
  }
  const chosen = whichChoicesOf(request.state, popup.cards);
  const { shown: _was, ...rest } = popup;
  const next: WhichPopup = { ...rest, ...(press.kind === "show" ? { shown: press.cardTs } : {}) };
  const waiting = await waitingCards(popup.cards.map((card) => card.ts), popup.channel, deps);
  if (!waiting.length) {
    await show(whichNoticeView(next, NOTHING_WAITING));
    return;
  }
  await show(whichView(next, waiting, chosen, databasesOf(deps)));
}

/** Done, as the ack read it. */
export interface WhichSubmitRequest {
  viewId: string;
  popup: WhichPopup;
  /** What it decides, read from its own rows' state (`whichSubmitOf`). */
  submission: WhichSubmission;
  userId: string;
}

/**
 * A cancel's one line in the thread, naming the cards it canceled: "Canceled
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
 *  mark on this question — with room to spare. An Approve spends that and
 *  its write, which may take several calls. And what Done spends after the
 *  last card: the pop-up's answer, the one line in the thread and the
 *  question redrawn. */
const CANCEL_SUBREQUESTS = 10;
const APPROVE_SUBREQUESTS = 25;
const FINISH_SUBREQUESTS = 3;

/**
 * Done, decided card by card in the list's order: each Approve as that
 * card's ✅ press, each Cancel as its ⛔, each through the Gate; then the
 * pop-up answered with one line per card decided or not reached, one line in
 * the thread naming the cards canceled, and the question redrawn from its
 * record. A Done with nothing chosen decides nothing and says so.
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
    console.log(`[which-card] done on ${popup.channel}/${popup.questionTs} after its deadline`);
    await deps.views.update(request.viewId, whichNoticeView(popup, WHICH_EXPIRED_REPLY));
    return;
  }
  if (!submission.decide.length) {
    await deps.views.update(request.viewId, whichNoticeView(popup, NOTHING_CHOSEN));
    return;
  }
  const lines: string[] = [];
  const canceled: string[] = [];
  let kept: WhichQuestion | null = null;
  let thread: ButtonDoorTarget | undefined;
  let decidedOne = false;
  let stopped = false;
  for (const { card: cardTs, choice } of submission.decide) {
    const named = nameOf(popup, cardTs);
    const headline = `*${escapeSlackText(named)}*`;
    if (!listed(popup, cardTs)) {
      console.warn(`[which-card] done on ${popup.channel}/${popup.questionTs} named ${cardTs}, which it did not list: refused`);
      lines.push(`${headline}: ${NOT_LISTED}`);
      continue;
    }
    // An Approve is a write, so it is always checked; a cancel is, after the
    // first card decided. Once one card is not reached, none after it is.
    const cost = (choice === "approve" ? APPROVE_SUBREQUESTS : CANCEL_SUBREQUESTS) + FINISH_SUBREQUESTS;
    if (!stopped && (choice === "approve" || decidedOne) && (deps.headroom?.() ?? Infinity) < cost) stopped = true;
    if (stopped) {
      lines.push(`${headline}: ${NOT_REACHED}`);
      continue;
    }
    decidedOne = true;
    if (choice === "approve") {
      const decided = await approveOne(cardTs, request, deps);
      if (decided.question) kept = decided.question;
      lines.push(`${headline}: ${decided.line}`);
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
  console.log(
    `[which-card] done on ${popup.channel}/${popup.questionTs} by=${request.userId} chosen=${submission.decide.length} canceled=${canceled.length} stopped=${stopped}`,
  );
  // The pop-up's answer first: a stop after it leaves the question unstruck,
  // never the pop-up on "Deciding…".
  await deps.views.update(request.viewId, whichResultView(popup, lines));
  // The cards canceled posted no note each (`ButtonRequest.quiet`): the
  // thread hears one line naming them, and none if there were none.
  if (thread) await deps.delivery(thread).postNote(canceledLine(canceled));
  if (kept) await deps.editQuestion(keptQuestionMessage(kept));
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
 * A card whose row says Approve, approved as a ✅ press on it would be: the
 * claim, and on a win the press's own path (`applyPressVerdict`) — its
 * outcome posted in the thread, the run, the card edited. A non-win is
 * answered in the pop-up, as the Review pop-up answers one, never edited onto
 * the card. The claim is made with the constant `CONFIRM`, so its verdict
 * carries that decision; a verdict that came back as anything else would
 * still hold its claim, and is kept from the press path, so nothing runs on
 * it.
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
 * A card whose row says Cancel, canceled as a ⛔ press on it would be: the
 * claim, and on a win the press's own path (`applyPressVerdict`) — the card
 * edited to its outcome, its own note held back for Done's one line. A
 * non-win is answered in the pop-up, as the Review pop-up answers one, never
 * edited onto the card. The claim is made with the constant `CANCEL`, so its
 * verdict carries that decision; a verdict that came back as anything else
 * would still hold its claim, and is kept from the press path, so no row on
 * Cancel can reach a run.
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
  // A win posts no note of its own: Done says one line for every card it
  // canceled.
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

/** A press path's dependencies, for one card decided from the pop-up: what
 *  it would say to the presser alone is kept for the pop-up's answer, and the
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
 * A chosen card, marked on THIS question's record once it is no longer
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
 * The question without its button: the row gives way to a context line
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
