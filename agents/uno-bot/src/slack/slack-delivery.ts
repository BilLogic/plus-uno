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
  appendStream,
  appendTask,
  postMessage,
  slackCall,
  startStream,
  stopStream,
} from "./api";
import { renameSession, setSessionStatus } from "./assistant";
import {
  DEFAULT_ALERT_CHANNEL,
  postTextVerified,
  postVisibleFailure,
  type PostingClient,
  type PostingDeps,
} from "./delivery";
import {
  consoleWorkingLog,
  deliveryAdapter,
  type SlackDeliveryClient,
  type SlackDeliveryTarget,
} from "./delivery-adapter";
import type { Delivery } from "../turn/index";

export type { SlackDeliveryTarget } from "./delivery-adapter";

/**
 * Whether a streaming flag is on — which takes the flag AND a recorded PASS of
 * the markup probe: `SLACK_STREAM_MARKUP_PROBE = "pass:YYYY-MM-DD"`, optionally
 * followed by a note (`"pass:2026-10-01 fence shows &lt;"`).
 *
 * Streamed text passes the same markup pass as posted text (`api.ts` § The
 * stream's markup pass), but whether Slack's `markdown_text` blanks on markup
 * it cannot parse, as `text` does, has not been seen live. The probe that
 * settles it is in docs/connectors/slack.md. A flag set without a recorded
 * pass — unset, a failure, anything else — stays off, and says so once per
 * isolate rather than on every turn.
 */
export function streamFlagOn(
  env: Pick<Env, "SLACK_STREAMING" | "SLACK_STREAM_PLAN" | "SLACK_STREAM_MARKUP_PROBE">,
  flag: "SLACK_STREAMING" | "SLACK_STREAM_PLAN",
): boolean {
  if (env[flag] !== "on") return false;
  if (PROBE_PASS.test(env.SLACK_STREAM_MARKUP_PROBE?.trim() ?? "")) return true;
  if (!refusalLogged.has(flag)) {
    refusalLogged.add(flag);
    console.warn(
      `[slack] ${flag} is "on" but SLACK_STREAM_MARKUP_PROBE records no pass` +
        ` (want "pass:YYYY-MM-DD", have ${JSON.stringify(env.SLACK_STREAM_MARKUP_PROBE ?? null)})` +
        " — streaming stays off until the markup probe in docs/connectors/slack.md has passed",
    );
  }
  return false;
}

/** A recorded probe pass: `pass:` and an ISO date, then anything. */
const PROBE_PASS = /^pass:\d{4}-\d{2}-\d{2}(?:\s|$)/;

/** Flags whose refusal this isolate has already logged. */
const refusalLogged = new Set<string>();

export function slackDelivery(env: Env, target: SlackDeliveryTarget): Delivery {
  return deliveryAdapter(
    {
      slack: slackClientFor(env),
      planStream: streamFlagOn(env, "SLACK_STREAM_PLAN"),
      logWorking: consoleWorkingLog,
    },
    target,
  );
}

/**
 * `Env`, once, as the posting functions actually read it.
 *
 * The answer path (`postTextVerified`) and the failure path
 * (`postVisibleFailure`) take this record by name — they never see `Env`.
 * The adapter's `postAnswer` / `postFailure` and the one failure site in
 * `events.ts` are the envelopes.
 */
export function postingDeps(env: Env): PostingDeps {
  return {
    slack: postingClientFor(env),
    streamingOn: streamFlagOn(env, "SLACK_STREAMING"),
    alertChannel: env.UNO_BOT_ALERT_CHANNEL || DEFAULT_ALERT_CHANNEL,
    throttle: env.HARNESS_KV ?? null,
  };
}

/**
 * `Env`, once, as the Slack calls the adapter actually makes.
 *
 * Each method is a thin currying of the module-level function the Worker has
 * always used — nothing is decided here, which is the point: a line of
 * judgement in this file is a line the Node suite cannot reach.
 */
function slackClientFor(env: Env): SlackDeliveryClient {
  const posting = postingDeps(env);
  return {
    async addReaction(channel, ts, name) {
      await addReaction(env, channel, ts, name);
    },
    async removeReaction(channel, ts, name) {
      await slackCall(env, "reactions.remove", { channel, timestamp: ts, name });
    },
    postMessage: (input) => postMessage(env, input),
    postAnswer: ({ channel, threadTs, text, recipient, footerHint, openStreamTs }) =>
      postTextVerified(posting, channel, threadTs, text, recipient, footerHint, openStreamTs),
    postFailure: ({ channel, threadTs, userMsgTs, stage, err }) =>
      postVisibleFailure(posting, channel, threadTs, userMsgTs, err, stage),
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

/**
 * The posting functions' Slack client: answer streams, not plan streams.
 *
 * `startStream` here is the answer-path call — no `task_display_mode: "plan"`.
 * Plan mode is the adapter's `startStream`, gated on `SLACK_STREAM_PLAN`.
 */
function postingClientFor(env: Env): PostingClient {
  return {
    addReaction: (channel, ts, name) => addReaction(env, channel, ts, name),
    postMessage: (input) => postMessage(env, input),
    startStream: (channel, threadTs, userId, team) =>
      startStream(env, channel, threadTs, userId, team),
    appendStream: (channel, ts, text) => appendStream(env, channel, ts, text),
    stopStream: (channel, ts, blocks) => stopStream(env, channel, ts, blocks),
  };
}
