// One dependency builder, for every caller of Turn.
//
// `Env`, once, as the dependencies a turn actually reads. Both adapters — the
// Slack envelope one (`slack/turn-adapter.ts`) and the eval one
// (`eval/turn-adapter.ts`) — build their `TurnDeps` here and supply only what
// genuinely differs: their thread store, their Delivery, what a won verdict
// does, the ts a tool's own posts thread off, and (the eval side only) the
// reporters an artifact is collected through. Everything else — the agent run,
// the draft judge, preflight, the three cards, the antecedent read, the panel
// context line and the context-state flag — is the same wiring for both, and
// was hand-copied in two files until it drifted.
//
// WHY THIS FILE TAKES `Env` when the rest of the module refuses to. It is the
// boundary itself: `Env` enters here and stops here, the way it stops in
// `thread-state/production.ts` for that module. Which is also why it is NOT
// re-exported from `turn/index.ts` — the front door is compiled by
// `tsconfig.test.json` and stays runtime-free; a caller that has an `Env`
// already pays the import path.
//
// The turn never sees the 58-field `Env`, which is what lets `tests/turn.test.ts`
// build a recording Delivery, an in-memory store and a fake model and nothing
// else.

import { buildProviderConversation } from "../agent/provider-conversation";
import { preflight } from "../agent/preflight";
import { reviewDraft } from "../agent/draft-judge";
import { runAgent, withTurnScope, type AgentResult, type TurnDials } from "../agent/run-agent";
import type { ToolCall, ToolResultNote } from "../agent/tool-transcript";
import type { GateVerdict } from "../gate/index";
import { conversationsHistoryBefore } from "../slack/api";
import { formatAssistantContext } from "../slack/assistant";
import { buildNotionArchiveTargetNote, buildNotionUpdateBody } from "../slack/notion-card";
import { buildImplementDesignProposal } from "../slack/proposal-figma";
import type { ThreadState } from "../thread-state/index";
import type { Env } from "../types";
import type { Delivery } from "./delivery";
import type { TurnDeps, TurnRequest } from "./turn";

/**
 * What a caller reports the run through, beside the outcome.
 *
 * Production passes none of these — it reads its log lines. The eval adapter
 * passes all of them, because an artifact a case is scored from has to carry
 * what the log would have said.
 */
export interface TurnReporters {
  /** The dials the last model call was sent with. */
  onDials?(dials: TurnDials): void;
  /** Every tool call the model made, in order, with its arguments. */
  onToolCall?(call: ToolCall): void;
  /** What each tool result said about itself. */
  onToolResult?(note: ToolResultNote): void;
  /** What the clarify gate asked, or null when it did not ask. */
  onGateAsk?(ask: string | null): void;
  /** What the loop itself returned, which the outcome does not carry. */
  onAgentResult?(result: AgentResult): void;
}

/** The entries that genuinely differ between Turn's callers — and nothing else. */
export interface TurnWiring {
  /** Per-thread memory: the Durable Object in production, in-memory for an eval
   *  conversation that has none. */
  threadState: ThreadState;
  /** Where what a person sees goes: Slack, or a recording. */
  delivery: Delivery;
  /** What a verdict Gate has already won does — execute the confirmed tool, or
   *  record the decision. The one dependency that performs the irreversible
   *  thing behind the ✅. */
  applyVerdict(verdict: GateVerdict): Promise<void>;
  /** The REAL ts a tool's own posts thread off: the person's message in Slack,
   *  the eval conversation's one ts otherwise. Not the conversation key, which
   *  the request already carries and cancel reads. */
  toolThreadTs: string;
  reporters?: TurnReporters;
}

/** `Env` plus a caller's differences, as the dependencies a turn reads. */
export function buildTurnDeps(env: Env, request: TurnRequest, wiring: TurnWiring): TurnDeps {
  const reporters = wiring.reporters ?? {};

  // The tool-side Slack context: where a tool's own posts go, which
  // conversation `/stop` is keyed on, and the per-event facts a tool may use.
  const slack = {
    channel: request.channel,
    threadTs: wiring.toolThreadTs,
    // …and the conversation key separately, because that is what cancel reads.
    conversationTs: request.conversationTs,
    userMsgTs: request.userMsgTs,
    requestedBy: request.userId,
    // Bot-token search needs the triggering event's action_token; it exists
    // only for this turn, so it rides the context rather than any store.
    ...(request.actionToken ? { actionToken: request.actionToken } : {}),
    sharedCanvasIds: request.sharedCanvasIds ?? [],
    ...(request.prd?.id ? { notionPrdId: request.prd.id } : {}),
    ...(request.prd?.url ? { notionPrdUrl: request.prd.url } : {}),
  };

  return {
    threadState: wiring.threadState,
    delivery: wiring.delivery,

    async runAgent(req) {
      // The per-turn scope the tool ledger, the retrieval receipt and the
      // absence signal cross on — read several frames above the loop, which is
      // why it is a scope rather than a return value (`agent/run-agent.ts`).
      const run = await withTurnScope({ correction: req.correction }, () =>
        runAgent({
          env,
          // Routing already happened, in Turn: the tier travels as an opaque
          // name so nothing routes a second time on a different string.
          tier: req.tier,
          routeReason: req.routeReason,
          userText: req.userText,
          ...(request.tierOverride ? { tierOverride: request.tierOverride } : {}),
          ...(req.images?.length ? { images: req.images } : {}),
          history: req.history,
          conversation: buildProviderConversation(
            req.history,
            req.userText,
            req.images ?? [],
            req.historicalImages,
          ),
          slack,
          currentSender: req.currentSender,
          pending: req.pending,
          ...(req.assistantContext ? { assistantContext: req.assistantContext } : {}),
          ...(req.preflight ? { preflight: req.preflight } : {}),
          onInterim: req.onInterim,
          ...(reporters.onDials ? { onDials: reporters.onDials } : {}),
          ...(reporters.onToolCall ? { onToolCall: reporters.onToolCall } : {}),
          ...(reporters.onToolResult ? { onToolResult: reporters.onToolResult } : {}),
        }),
      );
      reporters.onAgentResult?.(run.result);
      return {
        result: run.result,
        tools: run.tools,
        references: run.references,
        ...(run.receipt ? { receipt: run.receipt } : {}),
        ...(run.absence ? { absence: run.absence } : {}),
      };
    },

    reviewDraft: (args) => reviewDraft(env, args),

    async preflight(toolName, input, ctx) {
      const ask = await preflight(toolName, input, {
        env,
        prd: ctx.prd,
        ...(ctx.implementPrdUrl ? { implementPrdUrl: ctx.implementPrdUrl } : {}),
      });
      reporters.onGateAsk?.(ask?.ask ?? null);
      return ask;
    },

    applyVerdict: (verdict) => wiring.applyVerdict(verdict),

    cards: {
      notionUpdateBody: (input) => buildNotionUpdateBody(env, input),
      notionArchiveTargetNote: (input) => buildNotionArchiveTargetNote(env, input),
      implementDesignCard: (input, requesterUserId, previewText) =>
        buildImplementDesignProposal(env, input, requesterUserId, previewText),
    },

    async readAntecedent(channel, beforeTs, limit) {
      const before = await conversationsHistoryBefore(env, channel, beforeTs, limit);
      return before
        .filter((m) => !m.subtype && (m.text ?? "").trim())
        .map((m) => ({ author: m.user ? `<@${m.user}>` : "someone", text: m.text ?? "" }));
    },

    describeAssistantContext: (context) => formatAssistantContext(context),

    // Phase 5 — structured state, drift detection and progressive
    // summarisation. FLAGGED OFF by default; see the header of
    // `agent/context-state.ts` for why this one does not get to ship on.
    contextState: env.CONTEXT_STATE === "on",
  };
}
