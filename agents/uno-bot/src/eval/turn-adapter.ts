// The eval envelope adapter: a /debug/eval body becomes a `TurnRequest`, `Env`
// becomes `TurnDeps`, and `runTurn` does the rest (#499).
//
// This is the SECOND caller of the Turn module: an eval case and a Slack
// message take the same turn. Preflight, the confidence pre-check, the absence
// check, the draft judge, the gate's idempotency rules and the history write
// all run here exactly as they run in production, because they are Turn's
// implementation and there is no second pipeline left to drift from it.
//
// AND NO SECOND WIRING EITHER (#603). The dependencies are built by the shared
// builder both callers use (`turn/env-deps.ts`); this file names only what genuinely
// differs, which is the point the header used to make in prose and the wiring
// then quietly stopped keeping:
//
//   * DELIVERY RECORDS instead of posting (`recordingDelivery`). An eval turn
//     must not put a 👀, a working signal, a narration or a proposal card into a
//     real Slack conversation — and the recording adapter answers the way the
//     Slack one answers (a post reports what it posted, a staged card reports a
//     ts), so the turn takes the same paths. SPELLED BY SLACK'S OWN RENDERERS
//     (#623): a card and a gate verdict now cross the port as data, and what the
//     recording reports posting is what the turn stores and remembers — which
//     the model reads back on the next turn of the case. A measurement taken
//     against the port's own flat description would be a measurement of a
//     transcript no person ever sees, so the two renderers are handed in.
//   * RESOLUTION RECORDS instead of executing. `applyVerdict` is the one dep
//     that performs the irreversible thing behind the ✅ gate — a Notion card, a
//     PR, a share-out post. The old driver never executed one either (it
//     returned the model's decision as data), and a suite that files a card per
//     sample is a suite nobody can run three times. So the decision is
//     captured, reported, and remembered by the turn exactly as a real one
//     would be; only the write is absent.
//   * THREAD STATE IS IN-MEMORY, seeded with the history the runner sent. The
//     eval conversation has no Durable Object, and the runner already threads
//     each turn's outcome forward the way production records it
//     (`scripts/eval-history.mjs`). Seeding the store from that history is what
//     makes the store-backed rules — the "(Cancelled the proposed …)" bounce,
//     the compaction trigger — read the same conversation production would.
//   * THE REPORTERS production does not pass: the dials the last model call was
//     sent with, every tool call with its arguments, what each result said
//     about itself, what the gate asked and what the loop returned. Production
//     reads its log lines; a case scored from an artifact cannot.

import { markUnanswered, attachToolResult } from "../agent/tool-transcript";
import type { AgentResult, TurnDials } from "../agent/run-agent";
import {
  internalSubrequestsUsed,
  meterBreakdown,
  subrequestBudgetTrips,
  subrequestsUsed,
} from "../net";
import { createInMemoryThreadState } from "../thread-state/index";
import type { Env } from "../types";
import { buildTurnDeps, type TurnWiring } from "../turn/env-deps";
import { renderGateNote } from "../slack/gate-note";
import { renderProposalCard } from "../slack/proposal-render";
import { recordingDelivery, runTurn, type TurnRequest } from "../turn/index";
import { BUILD } from "../version";
import {
  evalTurnRequest,
  evalTurnResponse,
  type EvalTurnBody,
  type EvalTurnReport,
} from "./turn-case";

/**
 * How an eval recording spells a card and a verdict: exactly as Slack does.
 *
 * The transcript is the measurement — the card's words reach the model on the
 * case's next turn through the thread's history — so an eval that scored the
 * port's own description would be scoring a conversation production never has.
 */
const EVAL_SPELLING = {
  card: renderProposalCard,
  gateNote: renderGateNote,
};

/** What the route collects on the way through the dependencies that see it. */
type EvalCollected = Omit<EvalTurnReport, "outcome" | "meter" | "build" | "ms">;

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
  const delivery = recordingDelivery({ spelling: EVAL_SPELLING });
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

  const report: EvalCollected = {
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
      buildTurnDeps(
        env,
        turnRequest,
        evalTurnWiring(turnRequest, {
          delivery,
          threadState,
          report,
          filled,
          onResult: (r) => {
            agentResult = r;
          },
        }),
      ),
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

/** Where an eval run collects what the artifact carries and the log cannot. */
export interface EvalCollectors {
  delivery: ReturnType<typeof recordingDelivery>;
  threadState: ReturnType<typeof createInMemoryThreadState>;
  report: EvalCollected;
  /** Which reported calls already have a result attached. */
  filled: Set<number>;
  onResult(result: AgentResult): void;
}

/**
 * The eval suite's four differences, and nothing else.
 *
 * Exported so the parity test can build the real wiring on both sides: a
 * dependency added to `turn/env-deps.ts` reaches both callers or neither, and
 * that test is what says so.
 */
export function evalTurnWiring(request: TurnRequest, collectors: EvalCollectors): TurnWiring {
  const { delivery, threadState, report, filled } = collectors;

  return {
    threadState,
    delivery,

    // RECORDED, never executed — see the header. The Gate has already claimed
    // the proposal and decided; production would hand the verdict to the
    // executor, and an eval run writes it to the report instead.
    async applyVerdict(verdict) {
      if (!verdict.execute) return;
      // EVERY operation of the approved batch, in order — a suite that recorded
      // only the first would pass the exact regression that batch exists to stop.
      for (const operation of verdict.execute.operations) {
        report.resolutions.push({
          toolName: operation.toolName,
          decision: verdict.decision ?? "confirm",
        });
      }
    },

    // The synthetic ts the eval conversation has: a tool that posts has nowhere
    // to post, which is the same truth the recording Delivery tells.
    toolThreadTs: request.conversationTs,

    reporters: {
      onDials: (dials) => {
        report.dials = flattenDials(dials);
      },
      onToolCall: (call) => {
        report.tools.push(call);
      },
      onToolResult: (note) => {
        attachToolResult(report.tools, note, filled);
      },
      onGateAsk: (ask) => {
        report.gateAsk = ask;
      },
      onAgentResult: (result) => {
        collectors.onResult(result);
      },
    },
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
