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
// hands back the status to settle to and the line to post. What is then DONE
// with that verdict — the settle, the post — is the door's
// (`stop-doors.ts` `runSessionStopDoor`), and the Slack calls behind it are the
// envelope's (`assistant.ts` `handleSessionStopped`). All three layers are
// asserted in a Node test against the in-memory ThreadState and the recording
// Delivery (`tests/session-stop.test.ts`).
//
// PURE by design: no `Env`, no Workers global, no fetch — which is what lets the
// Node suite DRIVE it rather than read it. (Not a compile property: the test
// compile is a glob over `src/**` and types the Workers globals beside the Node
// ones, so it would compile this file either way — `tsconfig.test.json`.)

import type { ThreadRef, ThreadState } from "../thread-state/index";
import { settledStatus, type SessionStatus } from "./session-status";
import { turnSurfaceOf } from "../turn/request";

// ── The words the three doors share ─────────────────────────────────────────
//
// One control with three ways in should say one thing, and saying it three
// times in three files is how "Anything already confirmed stays done" shipped
// beside two copies of "Nothing already confirmed gets undone" — a difference
// nobody chose, in the one sentence whose job is to be reassuring. So the
// clauses live here and all three doors (`stop-doors.ts`) read them.
//
// Each door still composes its own line, because they answer different
// questions: `/stop` adds what happens when nothing was running, the Home-tab
// button picks between two whole messages, and the in-thread control names who
// pressed. What is shared is the promise, which is the part that has to match.

/** The honest promise, and the reason all three make it: cancellation is
 *  COOPERATIVE. The loop reads the flag at a tool boundary, so the step in
 *  flight finishes — nothing here can interrupt a tool mid-call, which is what
 *  keeps a half-executed proposal impossible. What a press does reach in time
 *  is the delivery of the answer, which is suppressed (#589). */
export const STOPPING_PROMISE = "Stopping — I'll finish the step I'm on and stop there.";

/** The reassurance that follows it: a stop is not an undo. Anything the gate
 *  already executed has already happened. */
export const NOTHING_UNDONE = "Nothing already confirmed gets undone.";

/** The conversation key of an unthreaded DM — the same constant `events.ts`
 *  resolves every loose DM line to, restated here because a stop event carries
 *  a `thread_ts` and the keys it has to be read against include this one. */
const DM_CONVERSATION = "dm";

/** Assistant/agent DMs are IM channels. The surface decides both halves below:
 *  which conversation keys can hold the run, and which can hold the card.
 *
 *  Read from `turn/request.ts` § `turnSurfaceOf` rather than restated: the rule
 *  had five copies of `channel.startsWith("D")` across the Worker and one
 *  statement of itself, and a surface read one way when the request is built
 *  and another way here is a bug nothing would catch (#595). */
function isDm(channel: string): boolean {
  return turnSurfaceOf(channel) === "assistant";
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
 * The grain is the REPLY THREAD, which is the key the store holds a card on
 * (`getProposalByThread`), so this is one read of the event's own thread — no
 * matter which of a DM's two conversation keys the run was filed under.
 *
 * A store error reads as "no card", which settles the session `active`. That is
 * the safe direction here for a reason particular to this control: the person
 * is looking at the thread, having just pressed a button, and an indicator that
 * stays up is the one failure this whole ticket exists to remove.
 */
async function cardLiveInThread(state: ThreadState, signal: StopSignal): Promise<boolean> {
  const ref: ThreadRef = { channel: signal.channel, thread: signal.threadTs };
  return (await state.getProposalByThread(ref).catch(() => null)) !== null;
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
 * WHAT THE WRITTEN FLAG IS NOW WORTH, since it once bought less than this
 * comment claimed. A control inside the thread is one tap on something already
 * on screen, so a press lands in the first seconds of a turn — and the loop
 * used to skip the flag check on iterations 0 and 1, to save two Durable
 * Object reads, on the premise that a stop had to be typed. A short turn
 * therefore had its flag written and never read, and the person got a full
 * answer (possibly a new card) under the line that had just promised the work
 * would stop; seen in production on r336, twice in one thread (#589). The loop
 * now reads the flag on every iteration and once more after the last model
 * reply, before an answer is delivered, so a press that reaches this function
 * reaches the turn as well. The step in flight still finishes — that part of
 * the promise is the cooperative one, and it is unchanged.
 *
 * WHICH IS ALSO WHY THE LINE BELOW IS THE ONLY ONE THE THREAD GETS. The turn
 * it stops posts nothing of its own (`agent/loop.ts` returns `stopped`,
 * `turn/turn.ts` delivers no answer for it), so one press earns one stop
 * message. The other two doors post the same line into the run's thread for the
 * same reason — see `inThreadStopLine`.
 *
 * AND WHY THE DOUBLE WRITE NO LONGER OUTLIVES THE TURN. Raising both DM keys
 * leaves one standing for `CANCEL_TTL_MS`, which once the loop reads from
 * iteration 0 would silently swallow a LATER, unrelated question's answer. The
 * consume is scoped to the reading turn's start, so a flag older than the turn
 * reports false and is cleared (`thread-state/store.ts` `consumeCancel`).
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
  const base = inThreadStopLine(userId);
  return cardLive
    ? `${base} The card above is still waiting on a :white_check_mark: or :no_entry:.`
    : base;
}

/**
 * The line a stopped run's own thread gets, shared with the other two doors.
 *
 * All three doors put this in the run's thread, and it has to be the same
 * sentence from each: the thread is where the answer was due, and it is the one
 * place the ASKER is looking — who in a channel need not be the person who
 * pressed, which is why the line names the presser. Before #589 the loop posted
 * a stop line here; the loop is silent now, so the doors owe it.
 *
 * WITHOUT THE CARD CLAUSE that `stopText` adds. Only this door can say it for
 * free: it already reads the live card to compute the status it must settle, so
 * the other two would be buying a Durable Object hop inside a three-second ack
 * to add a sentence about a card the person can see above them anyway.
 */
export function inThreadStopLine(userId: string): string {
  return `:octagonal_sign: <@${userId}> pressed stop. ${STOPPING_PROMISE} ${NOTHING_UNDONE}`;
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
 * `waiting-on-person` outright.
 *
 *   - `staged` agrees once the card is up, since the read then finds it. It
 *     has one window where it does not, and #583 widened it: a turn revising
 *     an earlier card now RETIRES that card the moment it commits to writing
 *     the revision, ahead of the new one posting, precisely so the old card
 *     stops being executable while the replacement is written
 *     (`turn.ts`). A press inside those seconds reads no live card —
 *     `getProposalByThread` skips retired and superseded records — and
 *     computes `active`.
 *   - `asked` diverges outright: a clarifying question leaves no card at all,
 *     so the turn settles `suspended` where this handler computes `active`.
 *
 * Both are held by ORDERING rather than by agreement — the handler writes
 * within this event, the turn writes at its exit afterwards, so the turn's
 * `suspended` is the later write and wins — and the residue is a thread
 * reading idle for the moment between them. `resolved` returns `idle`, and is
 * also the ending that consumed the card, so it agrees.
 *
 * THE READ AND THE WRITE HAVE TO STAY ADJACENT, which is why the write is not
 * here: a Slack round trip between them is wide enough for the turn to stage a
 * card and settle `suspended` inside it, after which this verdict's `active`
 * lands last and is wrong. The door settles straight off the verdict and posts
 * afterwards, and states its own case for that order
 * (`stop-doors.ts` `runSessionStopDoor`).
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
