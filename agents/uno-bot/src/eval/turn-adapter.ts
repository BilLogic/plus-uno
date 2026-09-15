// The eval envelope adapter: a /debug/eval body becomes a `TurnRequest`, `Env`
// becomes `TurnDeps`, and `runTurn` does the rest (#499).
//
// This is the SECOND caller of the Turn module, and the whole point of the
// ticket: an eval case and a Slack message now take the same turn. Preflight,
// the confidence pre-check, the absence check, the draft judge, the gate's
// idempotency rules and the history write all run here exactly as they run in
// production, because they are Turn's implementation and there is no second
// pipeline left to drift from it. What the route used to be — 127 lines calling
// `runAgent` and `preflight` side by side in `index.ts` — is deleted.
//
// TWO DEPENDENCIES DIFFER FROM `slack/turn-adapter.ts`, both deliberately, and
// nothing else does:
//
//   * DELIVERY RECORDS instead of posting (`recordingDelivery`). An eval turn
//     must not put a 👀, a thinking line, a narration or a proposal card into a
//     real Slack conversation — and the recording adapter answers the way the
//     Slack one answers (a post reports what it posted, a staged card reports a
//     ts), so the turn takes the same paths.
//   * RESOLUTION RECORDS instead of executing. `applyVerdict` is the one dep
//     that performs the irreversible thing behind the ✅ gate — a Notion card, a
//     PR, a share-out post. The old driver never executed one either (it
//     returned the model's decision as data), and a suite that files a card per
//     sample is a suite nobody can run three times. So the decision is
//     captured, reported, and remembered by the turn exactly as a real one
//     would be; only the write is absent.
//
// THREAD STATE IS IN-MEMORY, seeded with the history the runner sent. The eval
// conversation has no Durable Object, and the runner already threads each
// turn's outcome forward the way production records it
// (`scripts/eval-history.mjs`). Seeding the store from that history is what
// makes the store-backed rules — the "(Cancelled the proposed …)" bounce, the
// compaction trigger — read the same conversation production would.

import { preflight } from "../agent/preflight";
import { buildProviderConversation } from "../agent/provider-conversation";
import { runAgent, withTurnScope, type AgentResult, type TurnDials } from "../agent/run-agent";
import { reviewDraft } from "../agent/draft-judge";
import { attachToolResult, markUnanswered, type ToolCall } from "../agent/tool-transcript";
import {
  internalSubrequestsUsed,
  meterBreakdown,
  subrequestBudgetTrips,
  subrequestsUsed,
} from "../net";
import { conversationsHistoryBefore } from "../slack/api";
import { formatAssistantContext } from "../slack/assistant";
import { buildNotionArchiveTargetNote, buildNotionUpdateBody } from "../slack/notion-card";
import { buildImplementDesignProposal } from "../slack/proposal-figma";
import { createInMemoryThreadState } from "../thread-state/index";
import type { Env } from "../types";
import { recordingDelivery, runTurn, type TurnDeps, type TurnRequest } from "../turn/index";
import { BUILD } from "../version";
import {
  evalTurnRequest,
  evalTurnResponse,
  type EvalTurnBody,
  type EvalTurnReport,
} from "./turn-case";

/**
 * One headless turn for the eval suite.
 *
 * Auth is the caller's (`/debug/*` is token-gated in `index.ts`): every call
 * here is a live billable model run.
 */
export async function handleEvalTurn(request: Request, env: Env): Promise<Response> {
  let body: EvalTurnBody;
  try {
    body = (await request.json()) as EvalTurnBody;
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const built = evalTurnRequest(body);
  if (!built.ok) return Response.json({ ok: false, error: built.error }, { status: 400 });
  const turnRequest = built.request;

  const startedAt = Date.now();
  const delivery = recordingDelivery();
  const threadState = createInMemoryThreadState();
  // The conversation as the runner sent it, in the store the turn reads — so
  // the store-backed rules see what production's Durable Object would hold.
  for (const turn of turnRequest.history) {
    await threadState.appendHistory(
      { channel: turnRequest.channel, thread: turnRequest.conversationTs },
      turn,
    );
  }
  if (turnRequest.pending) await threadState.putProposal(turnRequest.pending);

  // What the route reports beside the outcome, collected on the way through the
  // dependencies that see it.
  const report: Omit<EvalTurnReport, "outcome" | "meter" | "build" | "ms"> = {
    resolutions: [],
    gateAsk: null,
    tools: [],
    calls: delivery.calls,
    dials: null,
  };
  let agentResult: AgentResult | undefined;
  const filled = new Set<number>();

  try {
    const outcome = await runTurn(
      turnRequest,
      evalDeps(env, turnRequest, {
        delivery,
        threadState,
        report,
        filled,
        onResult: (r) => {
          agentResult = r;
        },
      }),
    );

    // Every call that never reported a result says so, rather than reading like
    // a tool that answered with nothing (#452).
    if (agentResult) markUnanswered(report.tools, filled, agentResult.kind);

    return Response.json(
      evalTurnResponse({
        ...report,
        outcome,
        ...(agentResult ? { agentResult } : {}),
        meter: meterNow(),
        build: BUILD,
        ms: Date.now() - startedAt,
      }),
    );
  } catch (err) {
    // Turn makes its own failures visible and returns a `failed` outcome, so
    // reaching here means the adapter itself broke — a malformed request, a dep
    // that threw where the turn does not guard. Reported in the same shape, so
    // the runner reads one error path.
    return Response.json({
      ok: false,
      build: BUILD,
      ms: Date.now() - startedAt,
      narration: report.calls.flatMap((c) => (c.kind === "interim" ? [c.text] : [])),
      tools: report.tools,
      subrequests: subrequestsUsed(),
      subrequest_hosts: meterBreakdown(),
      internal_subrequests: internalSubrequestsUsed(),
      budget_trips: subrequestBudgetTrips(),
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function meterNow() {
  return {
    subrequests: subrequestsUsed(),
    hosts: meterBreakdown(),
    internal: internalSubrequestsUsed(),
    trips: subrequestBudgetTrips(),
  };
}

/**
 * `Env`, once, as the dependencies an eval turn reads — the same list
 * `slack/turn-adapter.ts` builds, with the two recording substitutions named in
 * this file's header.
 */
function evalDeps(
  env: Env,
  request: TurnRequest,
  wiring: {
    delivery: ReturnType<typeof recordingDelivery>;
    threadState: ReturnType<typeof createInMemoryThreadState>;
    report: Omit<EvalTurnReport, "outcome" | "meter" | "build" | "ms">;
    filled: Set<number>;
    onResult(result: AgentResult): void;
  },
): TurnDeps {
  const { delivery, threadState, report, filled } = wiring;

  // The tool-side Slack context. The synthetic ts values are the eval
  // conversation's: a tool that posts has nowhere to post, which is the same
  // truth the recording Delivery tells.
  const slack = {
    channel: request.channel,
    threadTs: request.conversationTs,
    conversationTs: request.conversationTs,
    userMsgTs: request.userMsgTs,
    requestedBy: request.userId,
    sharedCanvasIds: [],
  };

  return {
    threadState,
    delivery,

    async runAgent(req) {
      const run = await withTurnScope({ correction: req.correction }, () =>
        runAgent({
          env,
          tier: req.tier,
          routeReason: req.routeReason,
          userText: req.userText,
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
          // The three reporters production does not pass: the dials the last
          // model call was sent with (#421), every tool call with its
          // arguments (#423), and what each result said about itself (#452).
          onDials: (d: TurnDials) => {
            report.dials = flattenDials(d);
          },
          onToolCall: (c: ToolCall) => {
            report.tools.push(c);
          },
          onToolResult: (r) => {
            attachToolResult(report.tools, r, filled);
          },
        }),
      );
      wiring.onResult(run.result);
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
      report.gateAsk = ask?.ask ?? null;
      return ask;
    },

    // RECORDED, never executed — see the header. The Gate has already claimed
    // the proposal and decided; production would hand the verdict to the
    // executor, and an eval run writes it to the report instead.
    async applyVerdict(verdict) {
      if (!verdict.execute) return;
      report.resolutions.push({
        toolName: verdict.execute.toolName,
        decision: verdict.decision ?? "confirm",
      });
    },

    cards: {
      notionUpdateBody: (input) => buildNotionUpdateBody(env, input),
      notionArchiveTargetNote: (input) => buildNotionArchiveTargetNote(env, input),
      implementDesignCard: (input, requesterUserId, previewText) =>
        buildImplementDesignProposal(env, input, requesterUserId, previewText),
    },

    // Unreachable as the request is built (`threaded: true` closes the
    // antecedent window), and the real read regardless — an eval surface that
    // grew a channel should read it the way production does.
    async readAntecedent(channel, beforeTs, limit) {
      const before = await conversationsHistoryBefore(env, channel, beforeTs, limit);
      return before
        .filter((m) => !m.subtype && (m.text ?? "").trim())
        .map((m) => ({ author: m.user ? `<@${m.user}>` : "someone", text: m.text ?? "" }));
    },

    describeAssistantContext: (context) => formatAssistantContext(context),

    contextState: env.CONTEXT_STATE === "on",
  };
}

/**
 * Flatten the turn's dials for the eval artifact.
 *
 * The shared shape names only `tier`, `route` and `model`; a provider's own
 * dials ride in `detail`, so no provider has to report null into a field named
 * for another provider's dial. On the wire they flatten back out, which is what
 * keeps `dials.level` meaning "the level this turn was sent with" for a Gemini
 * run and simply ABSENT — rather than null — for a provider that has no level.
 */
function flattenDials(dials: TurnDials | null): Record<string, string> | null {
  if (!dials) return null;
  const { detail, ...named } = dials;
  return { ...named, ...detail };
}
