// @uno in Figma on `Env` — the one file in the folder that names it (#903).
//
// What each dependency becomes:
//   • Figma: the Worker's one client (`figmaClientFor`), paced and retried,
//     posting as the token's owner.
//   • The people map: the Figma user id → Slack id map the daily role sync
//     keeps (`figmaPeopleFor`), one KV read.
//   • The marks: HARNESS_KV under `figma-ask:<comment id>`, with an expiry. A
//     drafted mark holds the reply's words until it is posted, so never D1
//     (ADR-030).
//   • The turn: `runTurn` on the shared dependency builder, as Slack's and the
//     eval's turns are, with the ThreadState Durable Object and a verdict that
//     executes. It runs as a person in #plus-design.
//   • #plus-design (`PLUS_DESIGN_CHANNEL_ID`): the lead is `chat.postMessage`,
//     its link `chat.getPermalink`, and the card the Slack Delivery's own,
//     posted in the lead's thread with Review.
//
// Every KV call is charged to the invocation's internal bucket.

import type { Env } from "../types";
import { charge } from "../net";
import { runVerdict } from "../agent/resolve-proposal";
import { figmaClientFor } from "../figma/production";
import { getPermalink, postMessage } from "../slack/api";
import { slackDelivery } from "../slack/slack-delivery";
import { threadStateFor } from "../thread-state/production";
import { buildTurnDeps } from "../turn/env-deps";
import { runTurn } from "../turn/index";
import { figmaPeopleFor } from "../usage/production";
import { answerFigmaAsk, ASK_MARK_TTL_S, type AskMark, type FigmaAskDeps, type FigmaAskResult } from "./job";

/** One key per comment asked about. */
export const ASK_MARK_PREFIX = "figma-ask:";

/**
 * The ask's dependencies on `Env`, or undefined when the Worker has no Figma
 * token or no HARNESS_KV — without the marks, a retry could answer twice.
 *
 * @param env - Worker bindings
 */
export function figmaAskDepsFor(env: Env): FigmaAskDeps | undefined {
  const figma = figmaClientFor(env);
  const kv = env.HARNESS_KV;
  if (!figma || !kv) return undefined;
  const threadState = threadStateFor(env);
  const channel = env.PLUS_DESIGN_CHANNEL_ID?.trim();
  return {
    figma,
    people: () => figmaPeopleFor(env),
    marks: {
      async get(commentId) {
        charge(1, "kv");
        return kv.get<AskMark>(`${ASK_MARK_PREFIX}${commentId}`, "json");
      },
      async put(commentId, mark) {
        charge(1, "kv");
        await kv.put(`${ASK_MARK_PREFIX}${commentId}`, JSON.stringify(mark), { expirationTtl: ASK_MARK_TTL_S });
      },
    },
    threadState,
    answer: (request, delivery) =>
      runTurn(
        request,
        buildTurnDeps(env, request, {
          threadState,
          delivery,
          applyVerdict: (verdict) => runVerdict(env, verdict),
          // No Slack message to thread a tool's own post off: the ask is in Figma.
          toolThreadTs: request.conversationTs,
          // A person asked, in a file the team works in; recorded as #plus-design.
          origin: "slack",
        }),
      ),
    ...(channel
      ? {
          design: {
            channel,
            async post(text) {
              const res = await postMessage(env, { channel, text });
              return res.ok && res.ts ? { ts: res.ts } : null;
            },
            permalink: (ts) => getPermalink(env, channel, ts).catch(() => null),
            cardDelivery: (leadTs, slackId) => slackDelivery(env, { channel, replyTs: leadTs, userMsgTs: leadTs, userId: slackId }),
          },
        }
      : {}),
    now: () => Date.now(),
  };
}

/**
 * One ask on `Env`.
 *
 * @param env - Worker bindings
 * @param ask - The file and the comment
 */
export async function answerFigmaAskOnEnv(env: Env, ask: { fileKey: string; commentId: string }): Promise<FigmaAskResult> {
  const deps = figmaAskDepsFor(env);
  if (!deps) return { outcome: "handled", said: "no Figma token or no HARNESS_KV, so no answer" };
  return answerFigmaAsk(ask, deps);
}
