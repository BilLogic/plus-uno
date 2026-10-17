// "Which one?" — a decision that named no card, with several waiting.
//
// A thread can hold several live proposal cards (#1318). A typed ✅ / ⛔ there,
// or a "yes" the model could not tie to one card, resolves nothing: Gate
// answers with a `which-card` note (`gate/gate.ts` § `whichCardNote`) and this
// file is where it becomes a message — one short line, "2 cards are waiting,
// nothing ran yet.", and one Choose… button that opens a pop-up
// (`which-card-view.ts`). It replaced a row of numbered buttons, one per card
// (#1319): the headlines had to be listed above them for "Approve 2" to mean
// anything, and a draft could only be read on its own card.
//
// THE POP-UP DECIDES EACH CARD THROUGH THAT CARD'S OWN DOOR. Approve picks one
// card and Cancel ticks several; Submit hands each one to the Gate as a press
// on that card would (`button-door.ts`): the claim, the confirmer set, the
// pointer rule, the card edited to its outcome. A Cancel with a note goes as
// the Review pop-up's Reject, its reason said on the card. So each pick acts
// only on its own card, the cards left unpicked stay live, and a card decided
// elsewhere while the pop-up was open loses its claim and is named in the
// pop-up's answer instead of being decided twice.
//
// THE QUESTION LAPSES ON THE CARD RULE. Choose… stops working `cardExpiresAt`
// after the question was asked — 24 weekday hours (`card-expiry.ts`) — counted
// from the question's own message ts, which Slack hands back on every press
// and the pop-up carries in its metadata, so a Submit made past it runs
// nothing either. A card staged before the question can lapse first; picking
// it then says so, as a press on the card would.
//
// A CARD DECIDED ANYWHERE DROPS OUT OF IT. The turn keeps the question as
// posted in the thread store (`putWhichQuestion`), and every door that decides
// a listed card — this pop-up, the card's own Review, a reaction, a typed
// emoji, the model's `proposal_resolve` — marks it there and redraws the
// question from that record (`gate.ts` `dropFromWhichQuestion`): the decided
// card's headline struck, the count of cards still waiting, and "Decided." in
// place of Choose… once none are left. A Submit marks every card it was made
// on, on this question's record, whatever each came to, so a card that lapsed
// or was replaced stays off it too.
//
// TWO LIMITS, ACCEPTED. A card asked about again points at the newest
// question only, so an older question listing it keeps offering it; its
// pop-up leaves it out once it is decided. And two doors deciding two
// different cards at once each redraw from their own read, so the edits can
// land out of order and show one decided card too few until the next
// decision. Neither costs a wrong decision.
//
// A CANCEL SAYS ONE LINE. A press posts its outcome in the thread; a Cancel of
// several from here would post one bare "Canceled." per card, naming none. So
// a Cancel's cards post nothing each (`ButtonRequest.quiet`), and the Submit
// posts one line naming the cards it canceled (`canceledLine`) — none for a
// card refused, decided elsewhere or past the budget. An Approve is one card,
// and keeps its press's own post. A stated card canceled here is named in that
// one line like any other; its stated words stay on the card.
//
// A CANCEL OF SEVERAL IS HELD TO THE BUDGET. Each card a Submit decides edits
// its card and its record, as a press would, so a Submit checks the
// invocation's subrequest headroom before each card after the first
// (`headroom`); a card past it is left waiting and named in the answer, to be
// ticked again.
//
// Pure apart from its named dependencies: no `Env`, no fetch.

import { MAX_WHICH_CARDS, type Delivery, type GateNote } from "../turn/index";
import { cardExpiresAt } from "../card-expiry";
import { renderGateNote, whichCardQuestion } from "./gate-note";
import { escapeSlackText } from "./mrkdwn";
import { isDeadlineBlock } from "./card-deadline";
import { applyPressVerdict, type ButtonDoorTarget } from "./button-door";
import { awaitingDecision, resolveSignal, type GateRestage, type GateSignal, type GateVerdict } from "../gate/index";
import type { OperationOutcome } from "../gate/run-batch";
import type { CardMessage } from "./proposal-render";
import type { ReviewViews } from "./review-door";
import type { NotionDatabaseLinks } from "./review-notion-create";
import type { PendingProposal, ThreadState, WhichQuestion } from "../thread-state/index";
import { cardHeadline } from "../agent/card-identity";
import {
  whichLoadingView,
  whichNoticeView,
  whichPickOf,
  whichResultView,
  whichView,
  type WhichPick,
  type WhichPopup,
} from "./which-card-view";

type WhichNote = Extract<GateNote, { kind: "which-card" }>;
type Decision = WhichNote["decision"];

/** The question's one button: Choose…, which opens the pop-up. */
export const WHICH_CHOOSE_ACTION_ID = "uno_which_choose";

/** The numbered buttons the question carried before the pop-up ("Approve 1"),
 *  still on questions posted then until they lapse. */
const LEGACY_PRESS = /^uno_which_(?:confirm|cancel)_\d+$/;

/** Whether an action is one of the numbered buttons a question used to carry. */
export function isLegacyWhichPress(actionId: string): boolean {
  return LEGACY_PRESS.test(actionId);
}

/** Said to the presser alone on a numbered button a question posted before
 *  the pop-up still carries. */
export const LEGACY_WHICH_REPLY = "That question was redrawn, so nothing ran. Press Choose… on it, or Review on the card.";

/** What the question says in place of Choose… once every card it lists is
 *  decided. */
const DECIDED = "Decided.";

/** Said to the presser alone when the question has lapsed. */
export const WHICH_EXPIRED_REPLY = "That question expired, so nothing ran. Press Review on the card you mean.";

/** Said in the pop-up when no card it listed is waiting any more. */
export const NOTHING_WAITING = "None of these cards is waiting any more.";

/**
 * The question as Slack gets it: how many cards are waiting, and Choose…,
 * whose value is the decision and the cards' ts — what the pop-up opens on.
 * Its button still lapses on the card rule, counted from the question's ts,
 * but the message does not say when.
 *
 * Redrawn after a door decides a card it lists (`Delivery.redrawWhichCard`),
 * the decided card's headline is struck under the count of cards still
 * waiting; with every card decided, Choose… gives way to "Decided.".
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
    .map((card) => `~${escapeSlackText(card.headline.trim()).replaceAll("~", "\u223C")}~`);
  const lead = !decided.length ? whichCardQuestion(note) : open ? `${open === 1 ? "1 card is" : `${open} cards are`} still waiting.` : "";
  const text = [lead, ...struck].filter(Boolean).join("\n");
  return {
    text: renderGateNote(note),
    blocks: [
      { type: "section", text: { type: "mrkdwn", text } },
      open
        ? { type: "actions", elements: [chooseButton(note.decision, cards.map((card) => card.ts))] }
        : { type: "context", elements: [{ type: "mrkdwn", text: DECIDED }] },
    ],
  };
}

/** A kept question (`ThreadState.decideInWhichQuestion`), as Slack gets it. */
export function keptQuestionMessage(question: WhichQuestion): CardMessage {
  return whichCardMessage({ kind: "which-card", decision: question.decision, cards: question.cards }, question.decided);
}

/** Choose…: its value is the decision and every card the question lists, in
 *  its order — ten ts at most, well inside a value's 2,000 characters. */
function chooseButton(decision: Decision, cards: readonly string[]): Record<string, unknown> {
  return {
    type: "button",
    action_id: WHICH_CHOOSE_ACTION_ID,
    text: { type: "plain_text", text: "Choose…", emoji: true },
    value: `${decision}:${cards.join(",")}`,
  };
}

/** Choose…'s value back as the decision and the cards' ts; null for anything
 *  else. */
export function chooseValueOf(value: string | undefined): { decision: Decision; cards: string[] } | null {
  const m = /^(confirm|cancel):(.+)$/.exec(value ?? "");
  if (!m) return null;
  const cards = m[2]!.split(",").filter(Boolean);
  return cards.length ? { decision: m[1] as Decision, cards } : null;
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
  /** Said to the presser alone: Choose… pressed on a lapsed question. */
  replyEphemeral(text: string): Promise<void>;
  /** The clock the lapse is read on. Absent, `Date.now`. */
  now?(): number;
  /** External subrequests this invocation has left. Absent, unbounded. */
  headroom?(): number;
  /** Where the Notion databases a create lands in open, for a draft. */
  notionDatabases?: NotionDatabaseLinks;
}

/** Choose…, pressed on the question. */
export interface WhichOpenRequest {
  triggerId: string;
  channel: string;
  /** The question's own message: when it was asked, and what is redrawn. */
  questionTs: string;
  /** The question as Slack holds it now, redrawn when it has lapsed. */
  question: CardMessage;
  /** Choose…'s value (`chooseValueOf`). */
  value: string | undefined;
  userId: string;
}

/**
 * Choose…, pressed: past the question's deadline the presser is told and the
 * question loses its button; otherwise a loading view opens at once, inside
 * the trigger's three seconds, and is filled with the cards still waiting,
 * the decision preset from the one that asked.
 */
export async function runWhichOpen(request: WhichOpenRequest, deps: WhichDoorDeps): Promise<void> {
  const asked = chooseValueOf(request.value);
  if (!asked) return;
  if (lapsed(request.questionTs, (deps.now ?? Date.now)())) {
    console.log(`[which-card] Choose… on ${request.channel}/${request.questionTs} after its deadline`);
    await deps.replyEphemeral(WHICH_EXPIRED_REPLY);
    await deps.editQuestion(withoutChoose(request.question, "Expired."));
    return;
  }
  const loading: WhichPopup = { channel: request.channel, questionTs: request.questionTs, decision: asked.decision, cards: [] };
  const viewId = await deps.views.open(request.triggerId, whichLoadingView(loading));
  if (!viewId) {
    console.warn(`[which-card] views.open refused for ${request.channel}/${request.questionTs}`);
    return;
  }
  const waiting = await waitingCards(asked.cards, request.channel, deps);
  // Each card by the headline the question was asked with (`whichCardNote`).
  const popup: WhichPopup = { ...loading, cards: waiting.map((card) => ({ ts: card.proposalTs, headline: cardHeadline(card) })) };
  console.log(`[which-card] opened ${request.channel}/${request.questionTs} by=${request.userId} waiting=${waiting.length}/${asked.cards.length}`);
  if (!waiting.length) {
    await deps.views.update(viewId, whichNoticeView(popup, NOTHING_WAITING));
    await deps.editQuestion(withoutChoose(request.question, DECIDED));
    return;
  }
  await deps.views.update(viewId, whichView(popup, waiting, { picked: [], note: "" }, databasesOf(deps)));
}

/** A press inside the pop-up that redraws it. */
export type WhichRedraw =
  /** Approve or Cancel, switched at the top. */
  | { kind: "decision"; decision: Decision }
  /** A card chosen under "Show a draft…": its draft opens below. */
  | { kind: "draft"; cardTs: string }
  /** Hide draft, after the open draft. */
  | { kind: "hide" };

export interface WhichRedrawRequest {
  viewId: string;
  /** The pop-up as the press found it, from its `private_metadata`. */
  popup: WhichPopup;
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
 * A switch of the decision, a draft chosen, or Hide draft pressed: the pop-up
 * redrawn from the cards still waiting, read now, with what was picked and
 * typed set back in its inputs. A switch to Approve keeps the first card that
 * was ticked; a switch to Cancel ticks the one that was picked. Past the
 * question's deadline the pop-up says so instead.
 */
export async function runWhichRedraw(request: WhichRedrawRequest, deps: WhichDoorDeps): Promise<void> {
  const { popup, press } = request;
  // A refused update is the view having moved on: nothing to do about it.
  const show = (view: Record<string, unknown>) => deps.views.update(request.viewId, view, request.hash);
  if (lapsed(popup.questionTs, (deps.now ?? Date.now)())) {
    await show(whichNoticeView(popup, WHICH_EXPIRED_REPLY));
    return;
  }
  const pick = whichPickOf(request.state, popup.decision, popup.note);
  const decision = press.kind === "decision" ? press.decision : popup.decision;
  const shown = press.kind === "draft" ? press.cardTs : press.kind === "hide" ? undefined : popup.shown;
  const { shown: _was, note: _note, ...rest } = popup;
  const next: WhichPopup = { ...rest, decision, ...(shown ? { shown } : {}) };
  const waiting = await waitingCards(popup.cards.map((card) => card.ts), popup.channel, deps);
  if (!waiting.length) {
    await show(whichNoticeView(next, NOTHING_WAITING));
    return;
  }
  const picked = decision === "confirm" ? pick.picked.slice(0, 1) : pick.picked;
  await show(whichView(next, waiting, { picked, note: pick.note }, databasesOf(deps)));
}

/** A Submit from the pop-up, as the ack read it. */
export interface WhichSubmitRequest {
  viewId: string;
  popup: WhichPopup;
  /** The cards picked and the note (`whichSubmitOf`). */
  pick: WhichPick;
  userId: string;
}

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

/** What each decision is said as in the pop-up's answer. */
const DONE: Readonly<Record<Decision, string>> = { confirm: "Approved", cancel: "Canceled" };

/** The subrequests one card's decision spends, as a press does: its note in
 *  the thread (an Approve's; a Cancel's cards post none), the working signal
 *  raised and settled, its card edited, the decision's record, and its mark
 *  on this question — with room to spare. And what the Submit spends after
 *  the last card: a Cancel's one line in the thread, the pop-up's answer and
 *  the question redrawn. */
const PER_CARD_SUBREQUESTS = 10;
const FINISH_SUBREQUESTS = 3;

/**
 * A Submit, decided: each picked card in turn, through the Gate as a press
 * on that card (`applyPressVerdict`), and then the question redrawn from its
 * record and the pop-up answered with one line per card.
 *
 * Past the question's deadline nothing is resolved: the pop-up says so, and
 * the question is left for its next Choose… to find lapsed. A card that did
 * not win — decided elsewhere, lapsed, replaced, waiting on someone else — is
 * named in the answer with the Gate's own words for why, and is marked on
 * this question so it is not offered again.
 */
export async function runWhichSubmit(request: WhichSubmitRequest, deps: WhichDoorDeps): Promise<void> {
  const { popup, pick } = request;
  const where = `${popup.channel}/${popup.questionTs}`;
  if (lapsed(popup.questionTs, (deps.now ?? Date.now)())) {
    console.log(`[which-card] submit on ${where} after its deadline`);
    await deps.views.update(request.viewId, whichNoticeView(popup, WHICH_EXPIRED_REPLY));
    return;
  }
  const lines: string[] = [];
  let kept: WhichQuestion | null = null;
  const canceled: string[] = [];
  let thread: ButtonDoorTarget | undefined;
  for (const [i, cardTs] of pick.picked.entries()) {
    // Trimmed before the fallback, so a blank headline is never drawn as `**`.
    const named = popup.cards.find((c) => c.ts === cardTs)?.headline.trim() || "That card";
    const headline = `*${escapeSlackText(named)}*`;
    if (i > 0 && (deps.headroom?.() ?? Infinity) < PER_CARD_SUBREQUESTS + FINISH_SUBREQUESTS) {
      lines.push(`${headline}: not reached this time, so it is still waiting. Choose it again.`);
      continue;
    }
    const decided = await decideOne(cardTs, request, deps);
    if (decided.question) kept = decided.question;
    if (decided.canceledIn) {
      canceled.push(named);
      thread ??= decided.canceledIn;
    }
    lines.push(`${headline}: ${decided.line}`);
  }
  console.log(`[which-card] ${popup.decision} on ${where} by=${request.userId} cards=${pick.picked.length} canceled=${canceled.length}`);
  // A Cancel's cards posted no note each (`ButtonRequest.quiet`): the thread
  // hears one line naming the ones it canceled, and none if it canceled none.
  if (thread) await deps.delivery(thread).postNote(canceledLine(canceled));
  if (kept) await deps.editQuestion(keptQuestionMessage(kept));
  await deps.views.update(request.viewId, whichResultView(popup, lines));
}

/**
 * One picked card, decided as a press on it would be: the claim, and on a
 * win the press's own path (`applyPressVerdict`) — the note in the thread,
 * the run, the card edited. A non-win is answered in the pop-up, as the
 * Review pop-up answers one, never edited onto the card.
 */
async function decideOne(
  cardTs: string,
  request: WhichSubmitRequest,
  deps: WhichDoorDeps,
): Promise<{ line: string; question: WhichQuestion | null; canceledIn?: ButtonDoorTarget }> {
  const { popup, pick, userId } = request;
  const decision = popup.decision;
  // A Cancel with a note is the Review pop-up's Reject: the note is its reason,
  // said on the card. Without one, it is the card's ⛔, pressed.
  const signal: GateSignal =
    decision === "cancel" && pick.note
      ? { kind: "review", messageTs: cardTs, decision, note: pick.note, userId }
      : { kind: "button", messageTs: cardTs, decision, userId };
  const verdict = await resolveSignal(signal, { threadState: deps.threadState, standingConfirmers: deps.standingConfirmers });
  console.log(`[which-card] ${decision} on ${popup.channel}/${cardTs} by=${userId} outcome=${verdict.outcome}`);
  if (verdict.outcome !== "won" && verdict.post && verdict.post.note.kind !== "cut-off") {
    return { line: renderGateNote(verdict.post.note), question: await markHere(cardTs, popup, deps) };
  }
  let said = "";
  // A Cancel's win posts no note of its own: the Submit says one line for
  // every card it canceled. An Approve is one card, and keeps its post.
  const quiet = decision === "cancel";
  const question = await applyPressVerdict(
    { channel: popup.channel, messageTs: cardTs, decision, userId, fromQuestion: popup.questionTs, ...(quiet ? { quiet } : {}) },
    verdict,
    {
      delivery: deps.delivery,
      applyVerdict: deps.applyVerdict,
      restage: deps.restage,
      replyEphemeral: async (text) => void (said = text),
      replaceCard: (message) => deps.editCard(cardTs, message),
      reports: deps.threadState,
      threadState: deps.threadState,
      ...(deps.now ? { now: deps.now } : {}),
    },
  );
  if (verdict.outcome === "won") {
    const marked = question ?? (await markHere(cardTs, popup, deps));
    const { proposal, post } = verdict;
    const canceledIn =
      quiet && proposal && post?.note.kind === "resolved"
        ? { channel: proposal.channel, replyTs: post.replyTs, userMsgTs: proposal.userMsgTs, userId }
        : undefined;
    return { line: `${DONE[decision]}.`, question: marked, ...(canceledIn ? { canceledIn } : {}) };
  }
  return { line: said || (verdict.post ? renderGateNote(verdict.post.note) : "Nothing changed."), question: question ?? (await markHere(cardTs, popup, deps)) };
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
 * The question without Choose…: the row gives way to a context line saying
 * why, and a deadline line, on a question old enough to carry one, goes with
 * it.
 */
function withoutChoose(question: CardMessage, done: string): CardMessage {
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
