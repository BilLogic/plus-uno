// The Slack envelope adapter: a Slack message event becomes a `TurnRequest`,
// `Env` becomes `TurnDeps`, and `runTurn` does the rest.
//
// This is what is left of a 716-line `handleUserMessage`. Everything it used to
// decide — routing, the model's context, the judges, the cards, the history —
// is `turn/turn.ts` now; everything it used to reach for directly is a port or
// a named client built by the shared dependency builder (`turn/env-deps.ts`).
// What genuinely belongs to the envelope stays: resolving file uploads to image
// BYTES (Turn is handed inputs and never fetches), reading the Slack thread the
// bot's memory is rebuilt from, and the two ts values a Slack conversation
// carries (`slack/events.ts`).
//
// SO THIS FILE HOLDS ONLY SLACK'S DIFFERENCES. The request is built by
// `slack/turn-request.ts` — pure, and driven by the parity test beside the eval
// builder — and the dependencies by `turn/env-deps.ts`, which both callers
// share. What is named here is the four entries that are Slack's alone: the
// Durable Object store, the posting Delivery, a verdict that actually EXECUTES,
// and the real ts a tool's own posts thread off.
//
// `Env` enters here and stops here.

import { executeVerdict } from "../agent/resolve-proposal";
import { threadStateFor } from "../thread-state/production";
import type { Env } from "../types";
import { buildTurnDeps, type TurnWiring } from "../turn/env-deps";
import { runTurn, type TurnOutcome, type TurnRequest } from "../turn/index";
import { slackDelivery } from "./slack-delivery";
import {
  carriesVision,
  slackMessageText,
  slackTurnRequest,
  type TurnEnvelope,
} from "./turn-request";
import type { SlackMessageEvent } from "./types";
import { collectVisionInputs } from "./vision";
import { selectPreviousVisionReference } from "./vision-reference";

export type { TurnEnvelope } from "./turn-request";

/**
 * One Slack user message, as a turn.
 *
 * The envelope facts it takes (the two ts values, the history, the pending
 * proposal, the PRD) are resolved by the caller, which owns the run lease and
 * the fail-visibly wrapper around all of it.
 */
export async function runSlackTurn(
  env: Env,
  event: SlackMessageEvent,
  envelope: TurnEnvelope,
): Promise<TurnOutcome> {
  const { text, attachmentsText, scoped } = slackMessageText(event, envelope);
  if (scoped) console.log(`[scope] ${scoped.scope.name}`);

  // Vision: pasted images and a linked Figma frame become image BYTES on this
  // turn. Guarded inside — a failure degrades to text-only — and skipped
  // entirely when the message carries nothing visual, which is every turn where
  // the collection would have fetched nothing anyway.
  const vision = carriesVision(
    event,
    text,
    Boolean(selectPreviousVisionReference(envelope.history, false)),
  )
    ? await collectVisionInputs(env, event, attachmentsText, envelope.history)
    : undefined;

  const request = slackTurnRequest(event, envelope, vision);

  return runTurn(request, buildTurnDeps(env, request, slackTurnWiring(env, event, request)));
}

/**
 * Slack's four differences, and nothing else.
 *
 * Exported so the parity test can build production's own wiring rather than a
 * copy of it: a dependency added to `turn/env-deps.ts` reaches both callers or
 * neither, and that test is what says so.
 */
export function slackTurnWiring(
  env: Env,
  event: SlackMessageEvent,
  request: TurnRequest,
): TurnWiring {
  return {
    threadState: threadStateFor(env),

    delivery: slackDelivery(env, {
      channel: request.channel,
      ...(request.replyTs ? { replyTs: request.replyTs } : {}),
      userMsgTs: request.userMsgTs,
      userId: request.userId,
      ...(event.team ? { team: event.team } : {}),
      ...(event.footerHint ? { footerHint: event.footerHint } : {}),
    }),

    // Production is the caller that performs the irreversible thing behind the
    // ✅: the Notion card, the PR, the share-out post.
    applyVerdict: (verdict) => executeVerdict(env, verdict),

    // A real ts, not the conversation key: tool-side posts still thread off the
    // user's message.
    toolThreadTs: event.thread_ts ?? event.ts,
  };
}
