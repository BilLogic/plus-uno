// The Slack envelope for the Delivery adapter: `Env` becomes the adapter's
// named dependencies, and `delivery-adapter.ts` does the rest.
//
// Everything Delivery DECIDES — which surface gets a 👀, whether narration is a
// task card or a loose ⏳ message, which lifecycle status a settlement
// produces, that the answer closes the checklist's stream rather than opening a
// second one — is `delivery-adapter.ts`, which takes the Slack client, the
// plan-stream switch and the `[working]` log by name. That is what puts the
// adapter on the Node test compile: an adapter that named `Env` could only be
// read with a regex (`tests/working-signal.test.ts`, #594).
//
// What is left here is what genuinely belongs to the envelope: the Slack client
// itself (`api.ts`, `assistant.ts`, `delivery.ts`), the 58-field binding
// record, and the one binding Delivery reads.
//
// `Env` enters here and stops here.

import type { Env } from "../types";
import {
  addReaction,
  appendTask,
  postMessage,
  slackCall,
  startStream,
  stopStream,
} from "./api";
import { renameSession, setSessionStatus } from "./assistant";
import { postTextVerified, postVisibleFailure } from "./delivery";
import {
  consoleWorkingLog,
  deliveryAdapter,
  type SlackDeliveryClient,
  type SlackDeliveryTarget,
} from "./delivery-adapter";
import type { Delivery } from "../turn/index";

export type { SlackDeliveryTarget } from "./delivery-adapter";

export function slackDelivery(env: Env, target: SlackDeliveryTarget): Delivery {
  return deliveryAdapter(
    {
      slack: slackClientFor(env),
      planStream: env.SLACK_STREAM_PLAN === "on",
      logWorking: consoleWorkingLog,
    },
    target,
  );
}

/**
 * `Env`, once, as the Slack calls the adapter actually makes.
 *
 * Each method is a thin currying of the module-level function the Worker has
 * always used — nothing is decided here, which is the point: a line of
 * judgement in this file is a line the Node suite cannot reach.
 */
function slackClientFor(env: Env): SlackDeliveryClient {
  return {
    async addReaction(channel, ts, name) {
      await addReaction(env, channel, ts, name);
    },
    async removeReaction(channel, ts, name) {
      await slackCall(env, "reactions.remove", { channel, timestamp: ts, name });
    },
    postMessage: (input) => postMessage(env, input),
    postAnswer: ({ channel, threadTs, text, recipient, footerHint, openStreamTs }) =>
      postTextVerified(env, channel, threadTs, text, recipient, footerHint, openStreamTs),
    postFailure: ({ channel, threadTs, userMsgTs, stage, err }) =>
      postVisibleFailure(env, channel, threadTs, userMsgTs, err, stage),
    startStream: (channel, threadTs, userId, team) =>
      startStream(env, channel, threadTs, userId, team, "plan"),
    async appendTask(channel, ts, task) {
      await appendTask(env, channel, ts, task);
    },
    async stopStream(channel, ts) {
      await stopStream(env, channel, ts);
    },
    setSessionStatus: (channel, threadTs, status) =>
      setSessionStatus(env, channel, threadTs, status),
    renameSession: (channel, threadTs, title) => renameSession(env, channel, threadTs, title),
  };
}
