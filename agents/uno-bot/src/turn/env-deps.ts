// One dependency builder, for every caller of Turn (#603).
//
// `Env`, once, as the dependencies a turn actually reads. Both adapters — the
// Slack envelope one (`slack/turn-adapter.ts`) and the eval one
// (`eval/turn-adapter.ts`) — build their `TurnDeps` here and supply only what
// genuinely differs: their thread store, their Delivery, what a won verdict
// does, the ts a tool's own posts thread off, and (the eval side only) the
// reporters an artifact is collected through. Everything else — the agent run,
// the draft judge, preflight, the three card reads, the antecedent read, the
// panel context line and the context-state flag — is the same wiring for both,
// and was hand-copied in two files until it drifted.
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
import { runAgent, selectProvider, type AgentResult, type TurnDials } from "../agent/run-agent";
import type { ToolCall, ToolResultNote } from "../agent/tool-transcript";
import type { GateVerdict } from "../gate/index";
import { conversationsHistoryBefore } from "../slack/api";
import { formatAssistantContext } from "../slack/assistant";
import { buildNotionRevision, buildNotionTarget } from "../slack/notion-card";
import { renderDeliveredBody } from "../slack/render";
import { fetchFigmaImagePngUrl, parseFigmaUrl } from "../integrations/figma";
import { githubRepoVisibility, resolveRepoFor } from "../integrations/github";
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
  /** The dials the last model call was sent with (#421). */
  onDials?(dials: TurnDials): void;
  /** Every tool call the model made, in order, with its arguments (#423). */
  onToolCall?(call: ToolCall): void;
  /** What each tool result said about itself (#452). */
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

  // The tool-side Slack context: where a tool's own posts go and the per-event
  // facts a tool may use. NOT the conversation key — that is the agent run's own
  // required argument, below, because the cancel check is its only reader.
  const slack = {
    channel: request.channel,
    threadTs: wiring.toolThreadTs,
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
      // The tool ledger, the retrieval receipt, the reference names and the
      // absence signal arrive IN THE RETURN VALUE (#625). This builder used to
      // wrap the call in `withTurnScope` to collect them — an ambient scope
      // every adapter had to remember, where forgetting bought empty tools, a
      // false "nothing was fetched" and a different confidence verdict with
      // nothing failing. There is nothing to remember now: the entry opens its
      // own scope, and what it collected is part of what it answers with.
      const run = await runAgent({
        env,
        // Routing already happened, in Turn: the tier travels as an opaque
        // name, and the agent run has no way left to route a second time on
        // a different string (#624).
        tier: req.tier,
        routeReason: req.routeReason,
        // The conversation, assembled ONCE. The raw text, the history rows
        // and the images reach the agent only through it.
        conversation: buildProviderConversation(
          req.history,
          req.userText,
          req.images ?? [],
          req.historicalImages,
        ),
        slack,
        // What the turn classified, travelling down rather than being guessed
        // at: the blueprint cache must not answer a pushback.
        correction: req.correction,
        // The conversation key, beside the tool-side context, because cancel
        // is what reads it and it is not derivable downstream.
        conversationTs: request.conversationTs,
        currentSender: req.currentSender,
        pending: req.pending,
        ...(req.assistantContext ? { assistantContext: req.assistantContext } : {}),
        ...(req.preflight ? { preflight: req.preflight } : {}),
        onInterim: req.onInterim,
        ...(reporters.onDials ? { onDials: reporters.onDials } : {}),
        ...(reporters.onToolCall ? { onToolCall: reporters.onToolCall } : {}),
        ...(reporters.onToolResult ? { onToolResult: reporters.onToolResult } : {}),
      });
      reporters.onAgentResult?.(run.result);
      return run;
    },

    // The judge takes the same adapter the turn runs on, selected once (#605):
    // `MODEL_PROVIDER` is `selectProvider`'s to read, not the judge's.
    reviewDraft: (args) => reviewDraft(selectProvider(env), args),

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

    // The three reads a card needs and Turn may not make itself. Each answers
    // with a STRUCTURE the turn puts on the card; the words are the Slack
    // adapter's (#623).
    cards: {
      notionRevision: (input) => buildNotionRevision(env, input),
      notionTarget: (input) => buildNotionTarget(env, input),
      // The Figma render behind a `prototype_scaffold` card. Best-effort by
      // contract: no url, an unparseable one or a failed render all mean no
      // preview, and the card posts as every other card does. It used to build
      // the whole card — text, image block, footer and buttons — in
      // `slack/proposal-figma.ts`, which is a module this one line replaced.
      async designPreviewImage(input) {
        const figmaUrl = typeof input.figma_url === "string" ? input.figma_url : "";
        const parts = figmaUrl ? parseFigmaUrl(figmaUrl) : null;
        return parts ? await fetchFigmaImagePngUrl(env, parts.fileKey, parts.nodeId, 1) : null;
      },
      // The repo a GitHub intake lands in, resolved from its `repo` input as
      // the executor resolves it, and whether that repo is public — asked of
      // GitHub once per isolate. Preflight has already turned every refusal —
      // an unlisted repo, or a misconfigured list that reaches none — into an
      // ask or a plain refusal before staging (`tests/github-intake.test.ts`),
      // so this fallback, which names `GITHUB_REPO`, is never a card anyone
      // sees; and the executor would refuse that filing anyway.
      async issueTarget(input) {
        const target = resolveRepoFor(env, input.repo);
        if (!target.ok) return { repo: env.GITHUB_REPO, visibility: "unknown" };
        return { repo: target.entry.repo, visibility: await githubRepoVisibility(env, target.entry) };
      },
    },

    async readAntecedent(channel, beforeTs, limit) {
      const before = await conversationsHistoryBefore(env, channel, beforeTs, limit);
      return before
        .filter((m) => !m.subtype && (m.text ?? "").trim())
        .map((m) => ({ author: m.user ? `<@${m.user}>` : "someone", text: m.text ?? "" }));
    },

    describeAssistantContext: (context) => formatAssistantContext(context),

    deliveredBody: (text) => renderDeliveredBody(text),

    // Phase 5 — structured state, drift detection and progressive
    // summarisation. FLAGGED OFF by default; see the header of
    // `agent/context-state.ts` for why this one does not get to ship on.
    contextState: env.CONTEXT_STATE === "on",
  };
}
