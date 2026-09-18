// The Slack envelope for the in-thread stop control: an `agent_session_stopped`
// event becomes a stop request, `Env` becomes the door's named dependencies,
// and `runSessionStopDoor` does the rest.
//
// Everything the press DECIDES is `session-stop.ts` — which conversation keys
// the cancel lands on, whether a card is live, therefore which status settles
// the session and what the line says. Everything it then DOES with that
// verdict — the settle, the post, the order they go in — is
// `stop-doors.ts`, which takes ThreadState, the settle and the Delivery port by
// name. That is what lets the Node suite DRIVE the door: a door whose one
// argument was an `Env` could only be read with a regex
// (`tests/session-stop.test.ts`, #593).
//
// What is left here is what genuinely belongs to the envelope: the Slack event
// shape, the Slack client, and the bindings.
//
// IT IS ITS OWN FILE rather than assistant.ts's, where it used to live, for one
// mechanical reason: the door speaks through `slack-delivery.ts`, and that
// envelope reads `assistant.ts` for the session methods. An envelope inside
// `assistant.ts` would close that into an import cycle.
//
// `Env` enters here and stops here.

import type { Env } from "../types";
import { setSessionStatus } from "./assistant";
import { slackDelivery } from "./slack-delivery";
import { threadStateFor } from "../thread-state/production";
import { runSessionStopDoor, type SessionStopDoorDeps } from "./stop-doors";
import type { SlackAgentSessionStoppedEvent } from "./types";

/**
 * Slack's stop control, pressed (#576).
 *
 * The three jobs come from Slack's own reference: stop the in-progress work for
 * the channel and thread, confirm to the person that work has stopped, and move
 * the session out of `processing` — "The session status does not update
 * automatically when the user clicks stop."
 */
export async function handleSessionStopped(
  env: Env,
  event: SlackAgentSessionStoppedEvent,
): Promise<void> {
  await runSessionStopDoor(
    { channel: event.channel, threadTs: event.thread_ts, userId: event.user },
    sessionStopDeps(env),
  );
}

/**
 * `Env`, once, as the dependencies the door actually reads.
 *
 * `userMsgTs` is empty because this door has no message to react on: it only
 * ever calls `postNote`, and the field exists for `react`.
 */
function sessionStopDeps(env: Env): SessionStopDoorDeps {
  return {
    threadState: threadStateFor(env),
    settleSession: (channel, threadTs, status) => setSessionStatus(env, channel, threadTs, status),
    delivery: (target) => slackDelivery(env, { ...target, userMsgTs: "" }),
  };
}
