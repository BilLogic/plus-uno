// Slack's own stop control — what pressing it comes to.
//
// While an **agent session** sits in `processing`, Slack renders the **working
// signal** and, next to it, a stop button — but only for an app that subscribes
// to `agent_session_stopped`. This app subscribes as of #576, so the button is
// now the third door into the cancel path, beside `/stop` and the Home-tab Stop
// button. Slack's reference gives the handler three jobs, in this order: "Stop
// any in-progress work for the given channel and thread", "Clean up resources
// and confirm to the user that work has stopped", and transition the session
// yourself, because "The session status does not update automatically when the
// user clicks stop."
//
// WHAT THE EVENT KNOWS, AND WHAT IT LEAVES TO US. `{ channel, thread_ts, user,
// streaming_message_ts[], event_ts }` — there is no session id, so the
// channel + thread reference everything else is keyed on IS the identity. And
// `user` is whoever PRESSED, which in a channel thread need not be whoever
// asked. Anyone in the thread may act (ADR-014), the same posture the gate
// takes, so the confirmation names the presser the way a resolution names the
// approver.
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

/** The conversation key of an unthreaded DM — the same constant `events.ts`
 *  resolves every loose DM line to, restated here because a stop event carries
 *  a `thread_ts` and the key it has to be read against is this one. */
const DM_CONVERSATION = "dm";

/** Assistant/agent DMs are IM channels. The surface decides both halves below:
 *  which cancel key is exact, and which conversation keys can hold the card. */
function isDm(channel: string): boolean {
  return channel.startsWith("D");
}

/** One press of Slack's stop button, in the terms the event delivers it. */
export interface StopSignal {
  channel: string;
  /** The session's thread. In a channel this IS the conversation key; in a DM
   *  it is the per-ask reply thread and the conversation key is `"dm"`. */
  threadTs: string;
  /** Who pressed — not necessarily who asked. */
  userId: string;
}

/** What the press came to: where the session lands, and what the thread is
 *  told. Both are values; the adapter does the speaking. */
export interface StopVerdict {
  /** The lifecycle status to write, computed by the turn's own rule. */
  settleTo: SessionStatus;
  /** The line to post in the thread. */
  text: string;
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
 * TWO KEYS IN A DM, one in a channel. A DM ask that was never explicitly
 * threaded lives under `"dm"`; a DM ask the person threaded by hand lives under
 * its own `thread_ts`. The event says which thread, and it cannot say which of
 * the two keys that thread was filed under — so a DM asks both and takes the
 * card that belongs to this thread. In a channel the thread root is the
 * conversation key and one read settles it.
 *
 * A store error reads as "no card", which settles the session `active`. That is
 * the safe direction here for a reason particular to this control: the person
 * is looking at the thread, having just pressed a button, and an indicator that
 * stays up is the one failure this whole ticket exists to remove.
 */
async function cardLiveInThread(state: ThreadState, signal: StopSignal): Promise<boolean> {
  const keys = isDm(signal.channel) ? [DM_CONVERSATION, signal.threadTs] : [signal.threadTs];
  for (const thread of keys) {
    const ref: ThreadRef = { channel: signal.channel, thread };
    const pending = await state.getProposalByThread(ref).catch(() => null);
    if (pending && proposalReplyThread(pending) === signal.threadTs) return true;
  }
  return false;
}

/**
 * Raise the cancel flag, on the key the running loop is actually reading.
 *
 * ONE MECHANISM, TWO WAYS IN, and the split is about which end knows the key
 * exactly — the same question that made `/stop` resolve by person after it
 * spent a while writing `cancel:<channel>:<channel>` for channel runs and
 * cancelling nothing.
 *
 *   - IN A CHANNEL, `thread_ts` IS the conversation key the loop reads
 *     (`run-agent.ts` `cancelThread`), so the thread ref is exact. Resolving by
 *     person would be wrong twice over here: the presser may be a bystander
 *     with no run of their own, and if they do have one it is somewhere else,
 *     which is the run that would stop.
 *   - IN A DM, the key is `"dm"` for a loose ask and the thread ts for a
 *     threaded one, and the event cannot tell them apart. The presser is
 *     provably the session's owner on this surface, and their active-run
 *     pointer knows the conversation exactly — so `cancelForUser` is the exact
 *     answer, and it is the same one-hop call the Home-tab button makes.
 *     When the pointer has aged out it reports `cancelled: false`, and the
 *     thread ref is the remaining candidate: it is right for a hand-threaded
 *     DM, and in a loose DM it writes a flag on a key nothing reads, which the
 *     cancel TTL clears.
 *
 * Best-effort throughout: a cancel that fails to land leaves the turn to finish
 * on its own, which is slower than asked and still correct.
 */
async function raiseCancel(state: ThreadState, signal: StopSignal): Promise<void> {
  const ref: ThreadRef = { channel: signal.channel, thread: signal.threadTs };
  if (!isDm(signal.channel)) {
    await state.requestCancel(ref).catch(() => {});
    return;
  }
  const byPerson = await state
    .cancelForUser(signal.userId)
    .catch(() => ({ cancelled: false }) as { cancelled: boolean });
  if (byPerson.cancelled) return;
  await state.requestCancel(ref).catch(() => {});
}

/**
 * The line the thread gets, which says three true things and stops.
 *
 * It names the presser, because on a channel thread the person who stopped the
 * run and the person who asked for it are two people, and the other one needs
 * to know where their answer went. It is honest that cancellation is
 * cooperative — the loop reads the flag between iterations, so the step in
 * flight finishes — which is the same promise `/stop` and the Home-tab button
 * make, in the same words, so three doors sound like one control.
 *
 * And when a card is still live it says so, because the session is about to be
 * left `suspended` rather than idle and the reason for that should be readable
 * in the thread rather than only in the status.
 */
function stopText(userId: string, cardLive: boolean): string {
  const base =
    `:octagonal_sign: Stopped by <@${userId}> — I'll finish the step I'm on and stop there. ` +
    "Anything already confirmed stays done.";
  return cardLive
    ? `${base} The card above is still waiting on a :white_check_mark: or :no_entry:.`
    : base;
}

/**
 * One press of Slack's stop button, resolved.
 *
 * THE ORDERING DECISION, and it is the one this control forced (#576). The
 * handler settles the session immediately rather than waiting for the turn to
 * unwind, and the in-flight turn settles again when it reaches its own exit —
 * two writers on one value. The obvious hazard is the LATE one: a turn that
 * stages a card settles `suspended`, and a handler that had written the literal
 * `active` a moment earlier is fine, while the reverse order leaves a thread
 * holding a live card claiming to be idle. Racing them is the same problem
 * whichever way it falls.
 *
 * So they are not raced. The handler settles by the SAME RULE the turn settles
 * by — `settledStatus` over whether this reply thread holds a live card, which
 * is `settlementOf`'s own test (`turn/turn.ts`) — and two writers computing one
 * function of one piece of state agree by construction, whichever lands last.
 * The remaining divergence is a real state change between the two reads: a turn
 * that stages a card AFTER this handler looked settles `suspended` over our
 * `active`, and that is the turn's fact and the later one, so it should win.
 *
 * @param signal - The press, as the event delivered it
 * @param state - The thread's memory, for the cancel flag and the live card
 */
export async function resolveStop(signal: StopSignal, state: ThreadState): Promise<StopVerdict> {
  // Slack's order: stop the work first. The read and the post that follow are
  // both slower than the flag, and the flag is the only part with a deadline —
  // the loop checks it at every tool boundary.
  await raiseCancel(state, signal);
  const cardLive = await cardLiveInThread(state, signal);
  return {
    settleTo: settledStatus(cardLive ? "waiting-on-person" : "idle"),
    text: stopText(signal.userId, cardLive),
  };
}
