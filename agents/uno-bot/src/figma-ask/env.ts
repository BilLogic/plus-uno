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
//   • The turn: `runTurn` on the shared dependency builder, as Slack's turns
//     are, with the ThreadState Durable Object. It runs as #plus-design
//     (`PLUS_DESIGN_CHANNEL_ID`) with the `figma` origin, so every tool reads
//     at public scope, and an unmapped asker's at public facts alone
//     (`agent/public-scope.ts`). It is answer-only: its Delivery refuses every
//     card (`./delivery.ts`), and a verdict that reaches it runs nothing.
//
// Nothing here posts to Slack: the answer goes up in the Figma thread alone.
// Every KV call is charged to the invocation's internal bucket.

import type { Env } from "../types";
import type { ThreadState } from "../thread-state/index";
import { charge } from "../net";
import { figmaClientFor } from "../figma/production";
import { threadStateFor } from "../thread-state/production";
import { buildTurnDeps, type TurnWiring } from "../turn/env-deps";
import { runTurn, type Delivery } from "../turn/index";
import { figmaPeopleFor, gapNotesFor } from "../usage/production";
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
    gaps: gapNotesFor(env),
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
    answer: (request, delivery, asker) => runTurn(request, buildTurnDeps(env, request, figmaTurnWiring(threadState, delivery, asker))),
    ...(channel ? { channel } : {}),
    now: () => Date.now(),
  };
}

/**
 * How a Figma ask's turn is wired: answer-only, at public scope, and
 * recorded as a Figma ask.
 *
 * @param threadState - The store the turn remembers in
 * @param delivery - The ask's Delivery (`./delivery.ts`)
 * @param asker - Whether Team Members maps the asker, and the file asked on
 */
export function figmaTurnWiring(
  threadState: ThreadState,
  delivery: Delivery,
  asker: { unmappedAsker: boolean; fileKey: string },
): TurnWiring {
  return {
    threadState,
    delivery,
    // Answer-only: the request carries no pending card, and a verdict that
    // reaches a Figma turn anyway runs nothing.
    applyVerdict: async (verdict) => {
      if (verdict.outcome === "won") console.warn("[figma-ask] a verdict reached a Figma turn; nothing ran");
    },
    // No `toolThreadTs`: the ask is in Figma, so a tool has no Slack message
    // to thread its own post off.
    // Public scope, and recorded as a Figma ask.
    origin: "figma",
    unmappedAsker: asker.unmappedAsker,
    figmaFileKey: asker.fileKey,
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
