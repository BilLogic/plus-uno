// What the working signal leaves behind in the logs.
//
// THE GAP THIS CLOSES, stated accurately. A Slack refusal was never the untraced
// case: `parseSlackResponse` in api.ts has logged `[slack] <method> failed:
// <error>` on every `ok: false` since long before this module existed. What was
// silence is the pair either side of it — a clear that SUCCEEDED, and a clear
// that never left the Worker because the invocation died on the free plan's
// external-subrequest cap (SUBREQUEST_CAP) or was hard-killed mid-turn. Neither
// produces a Slack response, so neither produced a line, and a stuck "Working…"
// therefore had three possible causes and one symptom. That is why the same
// artefact kept being diagnosed from screenshots.
//
// So the pairing reports itself EVERY time, success included, carrying the
// turn's external spend. The instrument is not any one line: it is that a `set`
// line with no `clear` line after it means the invocation died before delivery,
// which no amount of failure logging could ever have shown.
//
// ON THE DOUBLE LINE. A refusal now logs twice — api.ts's `[slack]` line owns
// Slack's error, this one owns the phase and the spend — and that is deliberate:
// #571 asks for one line naming WHICH half was refused and its code, and the
// api.ts line knows the method but not whether it was the set or the clear, nor
// what the turn had spent by then.
//
// PURE by design — no `Env`, no Slack client, no `net.ts` — so the formatter AND
// the classification are compiled and asserted by `tsconfig.test.json`, while
// the adapter that calls them (`slack-delivery.ts`) stays out of reach of the
// Node test build.

import { SUBREQUEST_CAP } from "../agent/loop-policy";
import type { TurnSettlement } from "../turn/index";

/** Which half of the pairing spoke: the set that raises the indicator, or the
 *  clear that takes it down. Named in the line because the whole diagnostic is
 *  reading one against the other. */
export type WorkingSignalPhase = "set" | "clear";

/**
 * What a status call came back as.
 *
 * Four kinds because there are four genuinely different things to do about it,
 * and exactly one of them is Slack saying no. Collapsing the rest into
 * "declined" is the misdirection this whole ticket exists to end.
 */
export type WorkingSignalOutcome =
  /** The indicator moved. */
  | { kind: "ok" }
  /** Slack answered, and said no. `error` is its own code — the only kind
   *  entitled to the word "Slack" in its line. */
  | { kind: "declined"; error: string }
  /** The call left the Worker and nothing came back that could be read: a
   *  transport failure or an unparseable body, which api.ts degrades into the
   *  same `{ ok: false, error }` shape a refusal arrives in. Slack may never
   *  have seen it, so the line must not claim Slack refused anything. */
  | { kind: "unanswered"; error: string }
  /** The call never left the Worker: the subrequest budget stopped it. NOT a
   *  Slack failure — the fix is a cheaper turn, not a Slack scope. */
  | { kind: "budget-stop" }
  /** There was no thread to decorate, so nothing was sent. Also not Slack's
   *  word; see `setSessionStatus`, whose guard this comes from. */
  | { kind: "no-thread" };

/**
 * Slack's agent-session lifecycle, whole.
 *
 * All four are named even though this bot sends two, because the two it sends
 * only make sense against the two it doesn't: `active` is not "off", it is
 * "the session is open and idle", and reading it as a clear is how a settle
 * gets written as a literal in three places and then diverges.
 *
 * Why sessions at all: the `assistant.threads.*` methods now run over a
 * compatibility bridge, and Slack's migration guide is explicit that "Unlike
 * `assistant.threads.setStatus`, the loading UX no longer disappears
 * automatically when your app posts a message to the thread." Posting the
 * answer used to take the indicator down for free. It does not any more — the
 * explicit settle is the only thing that clears it, and a session left in
 * `processing` stays that way for the hour Slack takes to time it out (#574).
 */
export type SessionStatus = "active" | "processing" | "suspended" | "closed";

/** Raising the working signal is one status, and there is no second candidate:
 *  `processing` is the only one that renders as work in flight. */
export const WORKING_STATUS: SessionStatus = "processing";

/**
 * The status a finished turn settles to, from what the turn left behind.
 *
 * TWO LAYERS, ON PURPOSE. Whether a person is being waited on is the TURN's
 * fact, decided once from its disposition and its thread (`turn.ts`
 * `settlementOf`), and it reaches the adapter as a `TurnSettlement`. Which of
 * Slack's lifecycle words says that fact is the ADAPTER's, and it is this
 * function — so the Delivery port carries neither Slack's enum nor a literal
 * at each exit, and there is exactly one line to change if Slack's vocabulary
 * moves again.
 *
 * `suspended` is Slack's own word for it. The Agent sessions guide, § Session
 * lifecycle: "If the agent needs user input to continue, it sets
 * `status: "suspended"`." The same guide describes the `processing` indicator
 * and says nothing about how `suspended` renders, so nothing here claims it
 * does.
 *
 * `closed` is reachable from nothing — "the conversation is complete" is a
 * claim no turn of ours can make.
 *
 * @param settlement - What the finished work left behind (#575)
 */
export function settledStatus(settlement: TurnSettlement): SessionStatus {
  switch (settlement) {
    case "waiting-on-person":
      return "suspended";
    case "idle":
      return "active";
  }
}

/** What `agents.sessions.setStatus` answered, as its callers need it: Slack's
 *  own `ok`, and the code behind anything else. */
export interface StatusResult {
  ok: boolean;
  error?: string;
}

/**
 * The codes in `error` that did NOT come from Slack.
 *
 * `slackCall` degrades a fetch throw to `network_error` and an unreadable body
 * to `http_<status>` (api.ts), precisely so that every caller can handle one
 * shape. The cost of that kindness is that the shape lies about its origin, and
 * a 502 or a dropped socket reported as "Slack declined: network_error" sends
 * the next person to check app scopes for a problem in the network.
 */
function neverReachedSlack(error: string): boolean {
  return error === "network_error" || error.startsWith("http_");
}

/**
 * Slack's answer as an outcome — the classification, kept here rather than in
 * the adapter so it can be tested without a Worker.
 *
 * @param result - What `setSessionStatus` reported
 */
export function outcomeOf(result: StatusResult): WorkingSignalOutcome {
  if (result.ok) return { kind: "ok" };
  const error = result.error || "unknown";
  if (error === "no_thread") return { kind: "no-thread" };
  if (neverReachedSlack(error)) return { kind: "unanswered", error };
  return { kind: "declined", error };
}

/**
 * The one line a set or a clear leaves behind.
 *
 * `spent` is the turn's EXTERNAL subrequest count at the moment the call was
 * made, against the free plan's cap. It is on every line, including the happy
 * one, because the number is only useful as a series: a clear logged at two
 * short of SUBREQUEST_CAP says the next turn of the same shape will die before
 * it gets here, which is exactly the reading no screenshot could give.
 *
 * @param phase - Which half of the pairing spoke
 * @param outcome - What came back
 * @param spent - External subrequests spent this invocation so far
 */
export function workingSignalLine(
  phase: WorkingSignalPhase,
  outcome: WorkingSignalOutcome,
  spent: number,
): string {
  const budget = `spent=${spent}/${SUBREQUEST_CAP}`;
  switch (outcome.kind) {
    case "ok":
      return `[working] ${phase} ok ${budget}`;
    case "declined":
      return `[working] ${phase} declined by Slack: error=${outcome.error} ${budget}`;
    case "unanswered":
      return `[working] ${phase} got no answer: error=${outcome.error} ${budget}`;
    case "budget-stop":
      return `[working] ${phase} never sent — subrequest budget stopped it ${budget}`;
    case "no-thread":
      return `[working] ${phase} never sent — no thread to decorate ${budget}`;
  }
}
