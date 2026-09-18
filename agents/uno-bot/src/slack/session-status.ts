// Slack's agent-session lifecycle, as a vocabulary: which words exist, which
// one raises the working signal, which one a finished turn settles to, and what
// a status call comes back as.
//
// FOUR READERS, WHICH IS WHY IT IS ITS OWN FILE. `slack/assistant.ts` makes the
// call (`agents.sessions.setStatus`) and holds `Env`; `slack/delivery-adapter.ts`
// names the status on its Slack client and raises and settles it;
// `slack/session-stop.ts` decides which status one press of the stop control
// settles to; `slack/stop-doors.ts` carries that verdict to the settle. A
// vocabulary four modules speak — one of them the Env-facing API layer — is
// not a fold candidate: folding it into any one of them would make the other
// three import that one to reach a union.
//
// It is what is LEFT of `slack/working-signal.ts` (#595). That file also held
// the `[working]` line and the classification behind it, which had exactly one
// caller — the Delivery adapter — and were split out only because the adapter
// named `Env` and so "could not be reached by the Node test build". #594 ended
// that: the adapter takes its Slack client by name, the suite drives it, and
// the line moved in beside `reportStatus`, the one function that calls it.
//
// The instrument those lines are is unchanged and its story is told where they
// now live (`delivery-adapter.ts` § `workingSignalLine`).

import type { TurnSettlement } from "../turn/index";

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
 * Slack's lifecycle words says that fact is SLACK's, and it is this function —
 * so the Delivery port carries neither Slack's enum nor a literal at each exit,
 * and there is exactly one line to change if Slack's vocabulary moves again.
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
