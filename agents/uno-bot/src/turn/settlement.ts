// Settlement — what a turn leaves the thread needing, and the gate verdict
// that ends a turn.
//
// A thread can hold several live cards, and whether it still waits on the
// person is a fact about the THREAD, not about the turn that just ran: a turn
// that answered, failed or resolved one card leaves the thread waiting while
// another card is live in it (#1319). `settlementOf` is the one place that
// mapping lives. `liveCardsOf` says which cards are waiting, and `cardLiveIn`
// and `moreLiveIn` which of them are live in the turn's own reply thread.
// `settleVerdict` is the door both of the turn's gate paths — the typed emoji
// and the model's own `proposal_resolve` — end through, so a lost race reads
// the same on each.
//
// Its own module because it changes for its own reasons: a new disposition, a
// new waiting rule or a new verdict shape edits this file and leaves the turn
// loop (`turn.ts`) and card staging (`card-staging.ts`) alone. A verdict that
// re-stages a cut-off run hands that to card staging (`restageExecution`),
// which is why this module sits above it and never the other way around.
//
// PURE as the turn is: no `Env`, no Workers type, no fetch.

import { decidedCardOf, type GateVerdict } from "../gate/index";
import { proposalReplyThread, type HistoryTurn, type PendingProposal } from "../thread-state/index";
import { restageExecution } from "./card-staging";
import type { TurnSettlement } from "./delivery";
import type { TurnDeps, TurnDisposition, TurnOutcome, TurnRequest, TurnTelemetry } from "./turn";

/** The part of the turn's memory a verdict writes: the exchange, both
 *  halves in order, and what has been written so far. */
interface VerdictMemory {
  remember(assistantText: string): Promise<void>;
  wrote(): { turns: HistoryTurn[]; compacted: number };
}

/**
 * What the turn leaves the thread needing — the one place the mapping lives.
 *
 * `active` was the settle at every exit, and it is honest at only some of them:
 * it reports the thread as ready, and a thread holding a card behind ✅ / ⛔ is
 * not ready, whatever the turn itself managed to do (#575).
 *
 * TWO REASONS TO WAIT, and the second is a fact about the THREAD rather than
 * about this turn:
 *   - the turn itself asked for something — `staged` put a card up, `asked`
 *     asked a clarifying question instead of acting;
 *   - a card is live in this reply thread and this turn did not consume it.
 *
 * WHICH DEVIATES FROM #575's LETTER, deliberately, and the issue is being
 * updated to match. It listed `failed` and `reacted` as `active` outright; the
 * consequence is that a turn that fails — or acknowledges with a 🙏 — while an
 * earlier card is still pending would OVERWRITE that thread's `suspended` with
 * `active`, which is the same claim case three of the ticket exists to stop.
 * The thread does not stop waiting because a later turn went wrong. `resolved`
 * is the one ending that consumed the card, so it is the one exempt from the
 * live-card rule — for that card only: a thread holding a second live card
 * still waits on it (#1319).
 *
 * ONE KNOWN IMPRECISION, in the safe direction. `cardLive` is the card the
 * thread held when the turn BEGAN, and one exit retires a card without
 * replacing it: the staging branch supersedes the pending card and then Slack
 * refuses the new one (`disposition: "failed"`). That thread settles
 * `suspended` with nothing live, until the next turn in it settles again.
 * Pinning it exactly would need the turn to report the retirement on its
 * outcome — a field set at one exit — and a false "still waiting" after a
 * visible failure is cheaper than a false "nothing to do" over a live card.
 *
 * The switch is exhaustive on purpose: a further disposition leaves it without
 * a return on that arm and `tsc` refuses the build, which is the only kind of
 * reminder that survives a year.
 */
export function settlementOf(settle: {
  disposition: TurnDisposition;
  /** Whether a proposal card in this thread is still awaiting a decision. */
  cardLive: boolean;
  /** Whether a SECOND card was live in this thread as well (#1318): a
   *  resolution consumes one card, never the thread's others. */
  moreLive?: boolean;
}): TurnSettlement {
  switch (settle.disposition) {
    // The turn asked for something itself, so the card need not be read: a
    // store that failed to record the card cannot turn the ask into a
    // "nothing to do".
    case "staged":
    case "asked":
      return "waiting-on-person";
    // The thread decides. An answer, a bare 🙏, a failure and a turn stopped
    // before its answer landed all leave a live card exactly as they found it.
    // A stop settles like the rest of them for the reason the whole ticket
    // turns on: the person pressed a button and the indicator has to come down
    // — and it has to come down saying the same thing the stop handler says,
    // which computes this same card-based arm (`slack/session-stop.ts`).
    case "answered":
    case "reacted":
    case "failed":
    case "stopped":
      return settle.cardLive ? "waiting-on-person" : "idle";
    // The one ending that consumed the card — the claim IS the resolution.
    // Of ONE card: with another live beside it, the thread still waits on
    // the person for that one (#1319).
    case "resolved":
      return settle.moreLive ? "waiting-on-person" : "idle";
  }
}

/**
 * Whether the card the turn was handed is live in the turn's reply thread —
 * the thread's card as of the turn's START, which `settlementOf` reads.
 *
 * @param turnThread - The turn's reply thread (`cardThreadOf`)
 */
export function cardLiveIn(request: Pick<TurnRequest, "pending">, turnThread: string): boolean {
  return request.pending
    ? proposalReplyThread(request.pending) === turnThread
    : false;
}

/**
 * Whether a SECOND card is live in the turn's reply thread (#1318): a
 * resolution consumes one card, never the thread's others.
 *
 * @param turnThread - The turn's reply thread (`cardThreadOf`)
 */
export function moreLiveIn(request: Pick<TurnRequest, "pending" | "liveCards">, turnThread: string): boolean {
  return liveCardsOf(request).filter((card) => proposalReplyThread(card) === turnThread).length > 1;
}

/**
 * Every card waiting in the turn's reply thread, newest first: the caller's
 * list, with `pending` in it — a card a Needs changes sent back is the one
 * the turn was queued for, wherever the list puts it. With no list, the one
 * card the turn was handed.
 */
export function liveCardsOf(request: Pick<TurnRequest, "pending" | "liveCards">): PendingProposal[] {
  const listed = request.liveCards ?? [];
  const { pending } = request;
  if (!pending || listed.some((card) => card.proposalTs === pending.proposalTs)) return [...listed];
  return [pending, ...listed];
}

/**
 * Apply one Gate verdict, and be the turn's outcome.
 *
 * Both of the turn's gate doors — the typed emoji and the model's own
 * `proposal_resolve` — end here, which is what makes a lost race read the same
 * on each: the verdict's own note is posted, `applyVerdict` executes nothing
 * unless the claim was won, and the record says what the person was told.
 *
 * WHAT THE RECORD REMEMBERS is what the adapter reports posting, not a second
 * rendering of the note made here — the turn has none, and the conversation's
 * memory is read by the model on the next turn, so a copy that drifted would
 * make the bot remember a line nobody saw (#623).
 *
 * `note` is what the RECORD should say when that differs from what was posted
 * ("(confirmed — executing the proposal)" beside "Got it — kicking that
 * off."), and it applies only to a verdict that won: on a lost race the
 * conversation should remember what the person actually read.
 */
export async function settleVerdict(
  verdict: GateVerdict,
  ctx: {
    deps: TurnDeps;
    memory: VerdictMemory;
    telemetry: TurnTelemetry;
    note?: string;
    /** A line after the verdict's note and before any re-staged card. */
    aside?: string;
  },
): Promise<TurnOutcome> {
  const said = verdict.post
    ? await ctx.deps.delivery.postGateNote(verdict.post.note, verdict.post.card)
    : undefined;
  const posted = said?.text;
  const executed = await ctx.deps.applyVerdict(verdict);
  const remembered = (verdict.outcome === "won" ? ctx.note : undefined) ?? posted;
  if (remembered) await ctx.memory.remember(remembered);
  if (ctx.aside) {
    const said = await ctx.deps.delivery.postNote(ctx.aside);
    await ctx.memory.remember(said.ok ? said.text : ctx.aside);
  }
  // A cut-off run's leftovers go back on a card of their own, after the note
  // that explains them — the card holds the buttons, so it comes last.
  const staged = verdict.restage
    ? await restageExecution(verdict.restage, {
        ...ctx.deps,
        proposalEvents: ctx.deps.usage.proposalEvents,
      })
    : null;
  if (staged) await ctx.memory.remember(staged.proposal.proposalText);
  // The card it decided ends as a press leaves it, outcome line and View.
  // LAST, after everything the person must read: the edit is cosmetic, and
  // the adapter sends it only while the settle after it still fits the
  // delivery reserve (`CLOSE_CARD_HEADROOM`).
  const decided = decidedCardOf(verdict);
  if (decided) await ctx.deps.delivery.closeCard(decided.card, decided.outcome);
  // "Approve which one?" resolved nothing: it asked, and every card it names
  // is still waiting on the person (#1319).
  const asked = verdict.post?.note.kind === "which-card";
  return {
    disposition: staged ? "staged" : asked ? "asked" : "resolved",
    ...(staged ? { posted: staged.proposal.proposalText, staged } : posted ? { posted } : {}),
    wrote: ctx.memory.wrote(),
    telemetry: ctx.telemetry,
    ...(executed ? { executed } : {}),
  };
}
