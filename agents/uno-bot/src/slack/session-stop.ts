// Slack's stop control — what pressing it comes to, and the words all three
// stop doors share.
//
// TWO DOCUMENTED FACTS, AND NO THIRD. Slack's reference says a stop control
// exists for an app that subscribes to `agent_session_stopped`, and that the
// app owns the status transition — "The session status does not update
// automatically when the user clicks stop." It documents no placement and no
// appearance, and nobody here has seen the control, so nothing in this repo
// describes where it sits or what it looks like. #576's last acceptance box is
// somebody looking and writing it down.
//
// This is the third door into the cancel path, beside `/stop` and the Home-tab
// Stop button. The reference gives the handler three jobs: "Stop any
// in-progress work for the given channel and thread", "Clean up resources and
// confirm to the user that work has stopped", and transition the session.
//
// WHAT THE EVENT KNOWS, AND WHAT IT LEAVES TO US. `{ channel, thread_ts, user,
// streaming_message_ts[], event_ts }` — there is no session id, so the
// channel + thread reference everything else is keyed on IS the identity. And
// `user` is whoever PRESSED, which in a channel thread need not be whoever
// asked, so the confirmation names them. That is the same posture the gate
// takes on a staged card, where anyone in the thread may confirm (ADR-014's
// amendment, which is about CONFIRMING and is cited here as the precedent for
// the posture rather than as a rule about this control).
//
// RESULTS, NEVER EFFECTS — the boundary `gate/gate.ts` keeps. This module
// raises the cancel flag (a ThreadState write) and reads the thread's card, and
// hands back the status to settle to and the line to post. The Slack calls
// belong to the adapter (`assistant.ts` `handleSessionStopped`), which is also
// what lets the whole decision be asserted in a Node test against the in-memory
// ThreadState (`tests/session-stop.test.ts`).
//
// PURE by design: no `Env`, no Workers global, no fetch, so
// `tsconfig.test.json` compiles it.

import { proposalReplyThread, type ThreadRef, type ThreadState } from "../thread-state/index";
import { settledStatus, type SessionStatus } from "./working-signal";

// ── The words the three doors share ─────────────────────────────────────────
//
// One control with three ways in should say one thing, and saying it three
// times in three files is how "Anything already confirmed stays done" shipped
// beside two copies of "Nothing already confirmed gets undone" — a difference
// nobody chose, in the one sentence whose job is to be reassuring. So the
// clauses live here and `commands.ts` (`/stop`), `interactive.ts` (the
// Home-tab button) and this module read them.
//
// Each door still composes its own line, because they answer different
// questions: `/stop` adds what happens when nothing was running, the Home-tab
// button picks between two whole messages, and this one names who pressed.
// What is shared is the promise, which is the part that has to match.

/** The honest promise, and the reason all three make it: cancellation is
 *  COOPERATIVE. The loop reads the flag between iterations, so the step in
 *  flight finishes — nothing here can interrupt a tool mid-call, which is what
 *  keeps a half-executed proposal impossible. */
export const STOPPING_PROMISE = "Stopping — I'll finish the step I'm on and stop there.";

/** The reassurance that follows it: a stop is not an undo. Anything the gate
 *  already executed has already happened. */
export const NOTHING_UNDONE = "Nothing already confirmed gets undone.";

/** The conversation key of an unthreaded DM — the same constant `events.ts`
 *  resolves every loose DM line to, restated here because a stop event carries
 *  a `thread_ts` and the keys it has to be read against include this one. */
const DM_CONVERSATION = "dm";

/** Assistant/agent DMs are IM channels. The surface decides both halves below:
 *  which conversation keys can hold the run, and which can hold the card. */
function isDm(channel: string): boolean {
  return channel.startsWith("D");
}

/** One press of Slack's stop control, in the terms the event delivers it. */
export interface StopSignal {
  channel: string;
  /** The session's thread. In a channel this IS the conversation key; in a DM
   *  it is the per-ask reply thread, and the conversation key may be `"dm"`. */
  threadTs: string;
  /** Who pressed — not necessarily who asked. */
  userId: string;
}

/** What the press came to: where the session lands, and what the thread is
 *  told. Both are values; the adapter does the speaking. */
export interface StopVerdict {
  /** The lifecycle status to write, computed from the thread's live card. */
  settleTo: SessionStatus;
  /** The line to post in the thread. */
  text: string;
}

/**
 * The conversation keys this event's thread could be filed under.
 *
 * In a CHANNEL there is one: the thread root IS the conversation key the loop
 * reads (`run-agent.ts` `cancelThread`).
 *
 * In a DM there are two and the event cannot say which. A loose ask — the
 * common shape, typed in the composer — lives under the constant `"dm"`; an
 * ask the person threaded by hand lives under its own `thread_ts`. Telling
 * them apart from the payload alone would need a Slack round trip to ask
 * whether that ts is a thread parent, which is a subrequest and a failure mode
 * bought for a distinction both branches can simply cover.
 */
function conversationKeys(signal: StopSignal): string[] {
  return isDm(signal.channel) ? [DM_CONVERSATION, signal.threadTs] : [signal.threadTs];
}

/**
 * Was a proposal card live in this reply thread at the moment stop was pressed?
 *
 * The grain is the REPLY THREAD, as `putProposal` and `runTurn` both keep it:
 * `getProposalByThread` is keyed on the CONVERSATION, which in an unthreaded DM
 * is the constant `"dm"` shared by every ask on that surface, so the record it
 * answers with is compared against this thread through the store's own
 * `proposalReplyThread` (#579) rather than a second derivation of the fallback.
 *
 * A store error reads as "no card", which settles the session `active`. That is
 * the safe direction here for a reason particular to this control: the person
 * is looking at the thread, having just pressed a button, and an indicator that
 * stays up is the one failure this whole ticket exists to remove.
 */
async function cardLiveInThread(state: ThreadState, signal: StopSignal): Promise<boolean> {
  for (const thread of conversationKeys(signal)) {
    const ref: ThreadRef = { channel: signal.channel, thread };
    const pending = await state.getProposalByThread(ref).catch(() => null);
    if (pending && proposalReplyThread(pending) === signal.threadTs) return true;
  }
  return false;
}

/**
 * Raise the cancel flag, on every key the run named by this event could be
 * reading — and on no key outside it.
 *
 * RESOLVED BY CONVERSATION, NEVER BY PERSON, and that is a correction to how
 * this shipped for review (#586 spec review). The first cut used
 * `cancelForUser` on the DM branch, on the reasoning that the presser owns the
 * DM and their active-run pointer knows where they are running. The pointer is
 * ONE RECORD PER PERSON, overwritten by every turn they start anywhere
 * (`setActiveRun`), so the reasoning fails on an ordinary sequence: ask in a
 * DM, then ask in a channel, then press stop on the DM. The pointer names the
 * channel, `cancelForUser` flags the CHANNEL thread and reports success — so
 * an unrelated run in front of other people dies and the DM run the person
 * actually stopped keeps going. That is the opposite of "Stop any in-progress
 * work for the given channel and thread", and the event hands us the channel,
 * so this door has no reason to borrow a tool the Home-tab button needs only
 * because App Home is nowhere.
 *
 * SO IT WRITES EVERY CANDIDATE KEY, which in a DM is two. The cost is worth
 * stating plainly rather than waving at: the unused flag is not inert. It sits
 * until some turn on that key consumes it, so a turn started within
 * `CANCEL_TTL_MS` (five minutes) on the OTHER shape of the same DM — the same
 * person, the same conversation — would stop itself at its second iteration.
 * That is a visible, recoverable annoyance for the person who just pressed
 * stop, bounded to their own DM; the alternative was a silent kill in someone
 * else's channel plus a run that ignored the button. If it is ever seen, the
 * exact upgrade is a read-only `activeRunFor(userId)` on ThreadState, so the
 * pointer can be CHECKED against this channel before it is trusted — a
 * store-interface change and its conformance suite, which this ticket has no
 * reason to buy on a hypothetical.
 *
 * Best-effort throughout: a cancel that fails to land leaves the turn to finish
 * on its own, which is slower than asked and still correct.
 *
 * ONE LIMIT THE PROMISE DOES NOT COVER, recorded because this control makes it
 * reachable. The loop skips the flag check on iterations 0 and 1 to save two
 * Durable Object reads per turn (`agent/loop.ts`), on the premise that "nobody
 * types `/stop` inside the first few seconds". A control inside the thread
 * weakens that premise — the press costs one tap and arrives immediately — so
 * on a short turn the flag is written, never read, and the person gets a full
 * answer (possibly a new card) after being told work would stop. Left as it is
 * here: when the loop reads is a cost decision for every turn, and belongs in
 * its own ticket rather than riding along with a subscription.
 */
async function raiseCancel(state: ThreadState, signal: StopSignal): Promise<void> {
  for (const thread of conversationKeys(signal)) {
    await state.requestCancel({ channel: signal.channel, thread }).catch(() => {});
  }
}

/**
 * The line the thread gets, which says three true things and stops.
 *
 * It NAMES THE PRESSER, because on a channel thread the person who stopped the
 * run and the person who asked for it are two people, and the other one needs
 * to know where their answer went. Then it makes the two promises the other two
 * doors make, in their exact words (see the constants above), so three doors
 * sound like one control.
 *
 * IT CANNOT SAY "nothing was running", and both other doors can. They resolve
 * by person and get `cancelled` back from the one-hop call; this one resolves
 * by conversation, and `requestCancel` raises a flag without reporting whether
 * anything will read it — which is the right shape for a flag, since the reader
 * is a loop that may not have reached its next boundary yet. The question
 * barely arises here anyway: the control is offered while a session is
 * `processing`, so a press with nothing running is the rare case rather than
 * the Home-tab button's common one.
 *
 * And when a card is still live it says so, because the session is about to be
 * left `suspended` rather than idle and the reason should be readable in the
 * thread rather than only in the status.
 */
function stopText(userId: string, cardLive: boolean): string {
  const base = `:octagonal_sign: <@${userId}> pressed stop. ${STOPPING_PROMISE} ${NOTHING_UNDONE}`;
  return cardLive
    ? `${base} The card above is still waiting on a :white_check_mark: or :no_entry:.`
    : base;
}

/**
 * One press of Slack's stop control, resolved.
 *
 * THE TWO-WRITER QUESTION, stated accurately (#576, narrowed by the #586
 * review). The handler settles the session immediately rather than waiting for
 * the turn to unwind, and the in-flight turn settles again at its own exit — so
 * the status has two writers, and the hazard is one-directional: a thread
 * holding a live card left claiming to be idle.
 *
 * WHAT IS GUARANTEED. The handler computes the CARD-BASED ARM of the turn's own
 * rule: `settledStatus` over whether this reply thread holds a live card, which
 * is what `settlementOf` (`turn/turn.ts`) returns for `answered`, `reacted` and
 * `failed`. On those three endings the two writers compute one function of one
 * piece of state and agree, whichever lands last.
 *
 * WHAT IS NOT, and the first version of this comment overclaimed it. Two
 * dispositions never consult the card: `staged` and `asked` return
 * `waiting-on-person` outright. `staged` is harmless — it staged a card, so the
 * read finds one and both writers say `suspended`. `asked` is a real
 * divergence: a clarifying question leaves no card, so the turn settles
 * `suspended` where this handler computes `active`. It is held by ORDERING
 * rather than by agreement — the handler writes within this event, the turn
 * writes at its exit afterwards, so the turn's `suspended` is the later write
 * and wins — and the residue is a thread reading idle for the moment between
 * them. `resolved` returns `idle`, and is also the ending that consumed the
 * card, so it agrees.
 *
 * THE READ AND THE WRITE ARE ADJACENT, which the first cut got wrong. It read
 * the card here, posted the confirmation, and settled after — putting a Slack
 * round trip between the read and the write it justifies, wide enough for the
 * turn to stage a card and settle `suspended` inside it, after which the
 * handler's `active` landed last and was wrong. The adapter now settles
 * straight off this verdict and posts afterwards, so the gap is the two
 * statements below. That deviates from the reference's listed order (stop,
 * confirm, transition) in one respect, deliberately: the stop still happens
 * first, which is the part with a deadline, and a confirmation arriving a beat
 * after the indicator drops is better than an indicator that outlives it.
 *
 * @param signal - The press, as the event delivered it
 * @param state - The thread's memory, for the cancel flag and the live card
 */
export async function resolveStop(signal: StopSignal, state: ThreadState): Promise<StopVerdict> {
  // Slack's order: stop the work first. Everything after it is slower than the
  // flag, and the flag is the only part with a deadline — the loop checks it at
  // every tool boundary.
  await raiseCancel(state, signal);
  const cardLive = await cardLiveInThread(state, signal);
  return {
    settleTo: settledStatus(cardLive ? "waiting-on-person" : "idle"),
    text: stopText(signal.userId, cardLive),
  };
}
