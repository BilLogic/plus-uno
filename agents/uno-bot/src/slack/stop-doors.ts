// The three stop doors — `/stop`, the Home-tab Stop button, and Slack's
// in-thread stop control — each resolved, none of them holding `Env`.
//
// One control, three ways in. `session-stop.ts` owns what they SAY (the two
// shared promises) and what the in-thread press DECIDES (`resolveStop`); this
// file owns what each door then DOES with it: raise the cancel, tell the run's
// own thread, and — for the Home-tab button — send the presser their receipt.
//
// EACH DOOR TAKES NAMED DEPENDENCIES, the way the reaction door does
// (`gate/reaction-door.ts`, #592) and the way Turn does (`turn/turn.ts`): the
// Delivery port as a factory, the cancel-by-person call, the DM lookup, the
// thread store, the session settle. `Env` never enters — it is turned into
// these records once, in each door's Slack envelope (`commands.ts`,
// `interactive.ts`, `assistant.ts`). What is left there is the envelope: the
// Slack payload shape, the Slack client, and the bindings.
//
// So all three doors are DRIVEN in `tests/session-stop.test.ts` on the
// recording Delivery and the in-memory ThreadState. They used to be READ there
// instead — `readFileSync` and a regex over these three adapters' source,
// checking that each mentioned `inThreadStopLine(`, `threadArg(`,
// `cancelForUser(` and the two `console.error` lines — because a door that
// named `Env` was a door the Node compile could not reach. A regex could only
// ask whether the call appeared in the file; the suite now asks what the
// person gets, in which conversation, and in what order.
//
// THE POST GOES THROUGH DELIVERY, not through `api.ts`. What these doors send
// is a note — no footer, no confidence pre-check, no stream — which is exactly
// `postNote`, and routing it through the port is what makes the recording
// adapter able to stand in for Slack. One thing is deliberately given up: the
// port reports `ok`, not Slack's error code, so the logs below say a line did
// not land rather than why. `slack/api.ts` already logs Slack's own refusal
// reason on the way past, so the reason is not lost — only the second copy of
// it is.
//
// PURE by design: no `Env`, no Workers global, no fetch, so
// `tsconfig.test.json` compiles it.

import type { Delivery } from "../turn/index";
import type { ThreadState } from "../thread-state/index";
import {
  NOTHING_UNDONE,
  STOPPING_PROMISE,
  inThreadStopLine,
  resolveStop,
} from "./session-stop";
import type { SessionStatus, StatusResult } from "./working-signal";

/** Where a stop door speaks: the stopped run's own conversation, or — for the
 *  Home-tab button, which is pressed somewhere that is not a conversation at
 *  all — the presser's DM with the bot. */
export interface StopDoorTarget {
  channel: string;
  /** A real ts to reply under, or undefined for a top-level message. */
  replyTs?: string;
  /** Who pressed. */
  userId: string;
}

/**
 * The target to post a stop line to, for a conversation key.
 *
 * A conversation key is NOT always a timestamp: every loose DM line resolves to
 * the constant `"dm"` (`events.ts`), and posting that as a `thread_ts` is a
 * Slack error rather than a thread. An unthreaded DM wants a top-level message
 * in that DM, which is what leaving `replyTs` unset gives — the same rule the
 * Delivery target has always carried for an `agent_view` DM.
 */
export function stopPostTarget(channel: string, thread: string, userId: string): StopDoorTarget {
  return thread.includes(".") ? { channel, replyTs: thread, userId } : { channel, userId };
}

/** What `cancelForUser` reports: whether anything was running, and where. */
export interface CancelledRun {
  cancelled: boolean;
  channel?: string;
  thread?: string;
}

const NOTHING_TO_CANCEL: CancelledRun = { cancelled: false };

/** What every door needs: somewhere to speak. A factory rather than an
 *  instance because where a door speaks is the STOPPED RUN's conversation,
 *  which none of the three payloads carries — two learn it from the cancel and
 *  the third from the event. */
export interface StopDoorDeps {
  delivery(target: StopDoorTarget): Delivery;
}

/** The two doors that resolve the run by PERSON, because their payload cannot
 *  name a conversation: a slash command arrives with the channel it was typed
 *  in (not the thread the run lives in) and a Home-tab press arrives from
 *  nowhere at all. */
export interface PersonStopDoorDeps extends StopDoorDeps {
  /**
   * Stop whatever this person has running, and say where it was.
   *
   * Best-effort by contract: the door treats a rejection as "nothing was
   * running", because a failed cancel means the turn finishes on its own,
   * which is slower than asked and still correct.
   */
  cancelForUser(userId: string): Promise<CancelledRun>;
}

export type SlashStopDoorDeps = PersonStopDoorDeps;

export interface HomeStopDoorDeps extends PersonStopDoorDeps {
  /** The presser's DM with the bot, where the Home-tab receipt goes. `null`
   *  when Slack will not open one. */
  dmChannelFor(userId: string): Promise<string | null>;
}

export interface SessionStopDoorDeps extends StopDoorDeps {
  /** Per-thread memory: the cancel flag this door raises, and the live card it
   *  reads to compute the status to settle. */
  threadState: ThreadState;

  /** Write the session's lifecycle status. Slack's reference is explicit that
   *  the app owns this transition — "The session status does not update
   *  automatically when the user clicks stop." */
  settleSession(channel: string, threadTs: string, status: SessionStatus): Promise<StatusResult>;
}

/**
 * Put the stop line in the stopped run's own thread, and never let the attempt
 * die quietly.
 *
 * The thread is where the answer was due and the one place the ASKER is
 * looking — who, on a channel run, need not be the person who pressed. Before
 * #589 the loop posted a stop line here; the loop is silent now, so every door
 * owes it, and a swallowed failure is a press that leaves no trace anywhere.
 * The logging lived in three copies in three adapters, which is how the three
 * doors drifted the first time (#586); it is one copy here.
 */
async function speak(deps: StopDoorDeps, target: StopDoorTarget, text: string): Promise<void> {
  const where = `${target.channel}/${target.replyTs ?? "-"}`;
  const posted = await deps
    .delivery(target)
    .postNote(text)
    .catch((err: unknown) => {
      console.error(`[stop] in-thread line failed for ${target.userId} in ${where}: ${String(err)}`);
      return null;
    });
  if (posted && !posted.ok) {
    console.error(`[stop] in-thread line refused for ${target.userId} in ${where}`);
  }
}

/** The private answer `/stop` gives its caller, the moment it is typed.
 *
 *  The promise and the reassurance are the shared constants, because one
 *  control saying two things is how the doors drifted once already (#586).
 *  What is local to `/stop` is the last clause: this door can be typed when
 *  nothing is running at all, and in that case the in-thread line is correctly
 *  never posted. */
export const SLASH_STOP_RECEIPT = `${STOPPING_PROMISE} (${NOTHING_UNDONE} If nothing of mine was running, this did nothing.)`;

/** The Home-tab button's receipt, which unlike `/stop`'s answers both
 *  outcomes. "Nothing running" is the more common click there and the more
 *  confusing silence: without it, a button that did exactly what it should
 *  reads as a button that is broken. */
export function homeStopReceipt(cancelled: boolean): string {
  return cancelled
    ? `${STOPPING_PROMISE} ${NOTHING_UNDONE}`
    : "Nothing of mine is running right now, so there was nothing to stop. (If you asked me something in the last few minutes and it's still going, ask again here and I'll look.)";
}

/**
 * `/stop`, resolved.
 *
 * Resolved by PERSON, not by channel. The channel-derived key this used to
 * compute was wrong for channel runs: a `/uno-*` run lives in a THREAD under
 * the framing message, so the loop reads `cancel:<channel>:<thread_ts>` while
 * `/stop` was writing `cancel:<channel>:<channel>`. The flag landed on a key
 * nothing looks at and `/stop` silently did nothing there. The person's
 * active-run pointer knows the conversation exactly, and it is the one thing
 * both person-resolving surfaces can read.
 *
 * The caller's own answer is `SLASH_STOP_RECEIPT`, returned by the envelope
 * inside Slack's three seconds rather than from here — this door runs in
 * `ctx.waitUntil` behind that ack.
 */
export async function runSlashStopDoor(
  request: { userId: string },
  deps: SlashStopDoorDeps,
): Promise<void> {
  const run = await deps.cancelForUser(request.userId).catch(() => NOTHING_TO_CANCEL);
  console.log(`[stop] command from ${request.userId} cancelled=${run.cancelled}`);
  if (!run.cancelled || !run.channel || !run.thread) return;
  await speak(
    deps,
    stopPostTarget(run.channel, run.thread, request.userId),
    inThreadStopLine(request.userId),
  );
}

/**
 * The Home-tab Stop button, resolved. See `home.ts` for why it exists beside
 * `/stop`.
 *
 * App Home is not a conversation, so there is nowhere to reply — the presser's
 * receipt goes to their DM with the bot, which is where they would look anyway.
 * The RUN'S OWN THREAD comes first, because that is where the answer was due;
 * the DM is the presser's own receipt, and is the only message when nothing was
 * running.
 */
export async function runHomeStopDoor(
  request: { userId: string },
  deps: HomeStopDoorDeps,
): Promise<void> {
  const run = await deps.cancelForUser(request.userId).catch(() => NOTHING_TO_CANCEL);
  console.log(
    `[stop] home-tab from ${request.userId} cancelled=${run.cancelled} channel=${run.channel ?? "-"}`,
  );

  if (run.cancelled && run.channel && run.thread) {
    await speak(
      deps,
      stopPostTarget(run.channel, run.thread, request.userId),
      inThreadStopLine(request.userId),
    );
  }

  const dm = await deps.dmChannelFor(request.userId).catch(() => null);
  if (!dm) {
    // The flag is already raised, so the turn will stop either way. Worth a
    // line: the press was honoured and this receipt was not delivered.
    console.error(`[stop] home-tab receipt undeliverable for ${request.userId}: no DM channel`);
    return;
  }
  await deps
    .delivery({ channel: dm, userId: request.userId })
    .postNote(homeStopReceipt(run.cancelled))
    .catch((err: unknown) => {
      console.error(`[stop] home-tab receipt failed for ${request.userId}: ${String(err)}`);
      return null;
    });
}

/** One press of Slack's in-thread stop control, as the event delivers it —
 *  with the two fields the payload can omit left optional, because deciding
 *  what a malformed payload comes to is this door's job and not the
 *  envelope's. */
export interface SessionStopRequest {
  channel?: string;
  threadTs?: string;
  userId: string;
}

/**
 * Slack's in-thread stop control, resolved. The third door into the cancel
 * path, and the only one whose payload names the conversation.
 *
 * THE SETTLE COMES BEFORE THE POST, which the first cut got wrong. It read the
 * card, posted the confirmation, and settled after — putting a Slack round
 * trip between the read and the write it justifies, wide enough for the
 * in-flight turn to stage a card and settle `suspended` inside it, after which
 * this door's `active` landed last and was wrong. The settle now runs straight
 * off the verdict, with nothing between the read and the write, and the post
 * follows. That deviates from the reference's listed order (stop, confirm,
 * transition) in one respect, deliberately: the stop still happens first,
 * which is the part with a deadline, and a confirmation arriving a beat after
 * the indicator drops is better than an indicator that outlives it.
 *
 * AND THE SETTLE SURVIVES A REFUSED POST, which is why `speak` swallows: an
 * indicator that outlives the press is the one failure this whole control
 * exists to remove, and a line Slack would not take is no reason to leave it
 * up.
 */
export async function runSessionStopDoor(
  request: SessionStopRequest,
  deps: SessionStopDoorDeps,
): Promise<void> {
  const { channel, threadTs, userId } = request;
  if (!channel || !threadTs) {
    // Logged rather than dropped in silence: a control whose outcome is legible
    // only from a screenshot is the thing #571 set out to fix, and a malformed
    // payload here would otherwise present as a button that does nothing.
    console.log(
      `[stop] session control event with no channel/thread — channel=${channel ?? "-"} thread_ts=${threadTs ?? "-"}`,
    );
    return;
  }

  const verdict = await resolveStop({ channel, threadTs, userId }, deps.threadState);
  const result = await deps.settleSession(channel, threadTs, verdict.settleTo);
  await speak(deps, { channel, replyTs: threadTs, userId }, verdict.text);
  // One line per press, carrying what the run of it actually did. `[stop]` is
  // the prefix `/stop` and the Home-tab button already log under, so the three
  // doors read as one control in `wrangler tail` (#571's standing ask: a
  // control's outcome is legible from the logs rather than from a screenshot).
  console.log(
    `[stop] session control from ${userId} in ${channel}/${threadTs} ` +
      `settled=${verdict.settleTo} ok=${result.ok}${result.error ? ` error=${result.error}` : ""}`,
  );
}
