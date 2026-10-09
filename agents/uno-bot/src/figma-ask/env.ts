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
//     executes. It runs in #plus-design with the `figma` origin, so Slack is
//     read at public visibility only (`turn/env-deps.ts`).
//   • #plus-design (`PLUS_DESIGN_CHANNEL_ID`): the lead is `chat.postMessage`,
//     its link `chat.getPermalink`, and the card the Slack Delivery's own,
//     posted in the lead's thread with Review. Who the lead asks is the
//     night's design-owner rule (`figma-comments/read.ts`), on the night's
//     reads: the Roadmap card, its Contributors, the Slack directory, the roles.
//
// Every KV call is charged to the invocation's internal bucket.

import type { Env } from "../types";
import { charge, rethrowIfBudget } from "../net";
import { designOwnerOfFile, type DesignOwnerReads } from "../figma-comments/read";
import { queryRoadmapCards } from "../integrations/notion";
import { readSource } from "../sweep/env";
import { findSlackUsers, slackDirectoryFor } from "../tools/slack-people";
import { runVerdict } from "../agent/resolve-proposal";
import { figmaClientFor } from "../figma/production";
import { getPermalink, postMessage } from "../slack/api";
import { slackDelivery } from "../slack/slack-delivery";
import { threadStateFor } from "../thread-state/production";
import { buildTurnDeps } from "../turn/env-deps";
import { runTurn } from "../turn/index";
import { figmaPeopleFor, teamRolesFor } from "../usage/production";
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
          // No `toolThreadTs`: the ask is in Figma, so a tool has no Slack
          // message to thread its own post off. A card's lead is the thread
          // its ✅ runs in, from the moved record (`./job.ts`).
          // Public visibility only, and recorded as a Figma ask.
          origin: "figma",
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
            designOwner: (title) => designOwnerOfFile(designOwnerReads(env), title),
          },
        }
      : {}),
    now: () => Date.now(),
  };
}

/**
 * What finding a file's design owner reads, on `Env` — the night's reads
 * (`figma-comments/env.ts`, `sweep/env.ts`): the card by number from the
 * Roadmap, its page's Contributors by name, each name looked up in the Slack
 * directory, and the team's roles.
 */
function designOwnerReads(env: Env): DesignOwnerReads {
  const directory = slackDirectoryFor(env);
  return {
    async card(number) {
      const { rows } = await queryRoadmapCards(env, { cardNumber: number });
      const card = rows.find((r) => r.card_number === number);
      return card ? { url: card.url } : null;
    },
    async contributors(url) {
      const page = await readSource(env, url, "notion");
      const ids: string[] = [];
      for (const name of page?.contributors ?? []) {
        try {
          const r = JSON.parse(await findSlackUsers(directory, name)) as { ok?: boolean; matches?: { id?: string }[] };
          const id = r.ok && r.matches?.length === 1 ? r.matches[0]!.id : undefined;
          if (id) ids.push(id);
        } catch (err) {
          rethrowIfBudget(err);
        }
      }
      return ids;
    },
    roles: () => teamRolesFor(env),
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
