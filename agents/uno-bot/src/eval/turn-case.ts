// One eval case, as a Turn request — and one `TurnOutcome`, as the response the
// eval runner reads (#499).
//
// The eval route used to run a pipeline OF ITS OWN: it called `runAgent`
// directly, mirrored production's clarify gate by calling `preflight` beside
// it, and stopped there — no draft judge, no confidence pre-check, no absence
// check, no history write. So the suite measured a turn production does not
// take, and every guard added above the loop was invisible to it. The route is
// an ADAPTER now: same `runTurn` the Slack envelope calls, with a recording
// Delivery instead of a posting one, and the outcome mapped onto the wire shape
// the runner already speaks.
//
// TWO HALVES, and this is the pure one: the eval case becomes a `TurnRequest`
// here, and a `TurnOutcome` becomes the response here. The `Env` half — the
// deps, the model, the meter — is `eval/turn-adapter.ts`, which this file knows
// nothing about. That split is what lets `tests/eval-adapter.test.ts` drive an
// eval case and a Slack message through the same `runTurn` on the same fakes
// and compare the two outcomes, in the Workers-global-free compile
// (`tsconfig.test.json`).
//
// THE RESPONSE SHAPE IS A CONTRACT. `scripts/run-evals.mjs`,
// `scripts/eval-history.mjs` and `docs/evals/README.md` all name fields on it;
// every one of them still means what it meant (see `evalTurnResponse`).

import type { AgentResult } from "../agent/loop";
import type { ToolCall } from "../agent/tool-transcript";
import type { HistoryTurn, PendingProposal } from "../thread-state/index";
import type { DeliveryCall, TurnOutcome, TurnRequest } from "../turn/index";

/** The synthetic surface an eval turn arrives on. `C_EVAL` never starts with
 *  "D", so own-visibility search is unreachable and any assertion about the
 *  ADR-020 surface gate would pass for the wrong reason — a case that means to
 *  exercise the gate names a `D…` channel explicitly. */
export const EVAL_CHANNEL = "C_EVAL";
export const EVAL_USER = "U_EVAL";

/** The one ts an eval conversation has. The runner threads history itself, so
 *  there is no Slack thread to key on and no message to react to. */
const EVAL_TS = "0";

/** POST /debug/eval body: one turn of a (possibly multi-turn) eval conversation. */
export interface EvalTurnBody {
  prompt?: string;
  history?: HistoryTurn[];
  /** Minimal pending-proposal shape; the synthetic fields are filled in here. */
  pending?: { toolName: string; input?: Record<string, unknown> } | null;
  /** Surface the turn arrives on. Defaults to `C_EVAL` / `U_EVAL`. */
  channel?: string;
  requestedBy?: string;
}

// Slack ids only — the eval route must not become a way to name arbitrary
// surfaces. Anything malformed falls back to the synthetic defaults.
const CHANNEL_ID = /^[CDG][A-Z0-9]{2,20}$/;
const USER_ID = /^[UW][A-Z0-9]{2,20}$/;

/**
 * One eval case body, as the request a turn takes.
 *
 * The envelope facts the Slack adapter resolves from a real event — the two ts
 * values, the history, the pending proposal — the eval case carries or defaults,
 * and nothing here fetches: an eval turn has no files, so `images` is empty and
 * the vision pass (which is the envelope's, not the turn's) never runs.
 */
export function evalTurnRequest(
  body: EvalTurnBody,
): { ok: true; request: TurnRequest } | { ok: false; error: string } {
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return { ok: false, error: "missing prompt" };

  const channel = CHANNEL_ID.test(body.channel ?? "") ? body.channel! : EVAL_CHANNEL;
  const userId = USER_ID.test(body.requestedBy ?? "") ? body.requestedBy! : EVAL_USER;

  const history: HistoryTurn[] = Array.isArray(body.history)
    ? body.history.filter(
        (t): t is HistoryTurn =>
          !!t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string",
      )
    : [];

  const pending: PendingProposal | null = body.pending?.toolName
    ? {
        toolName: body.pending.toolName,
        input: body.pending.input ?? {},
        channel,
        threadTs: EVAL_TS,
        userMsgTs: EVAL_TS,
        proposalTs: EVAL_TS,
        proposalText: "(eval)",
        requesterUserId: userId,
      }
    : null;

  return {
    ok: true,
    request: {
      userId,
      channel,
      conversationTs: EVAL_TS,
      userMsgTs: EVAL_TS,
      // The same rule the Slack adapter applies: an app DM and the assistant
      // panel are one conversation, and a `D…` channel is that surface.
      surface: channel.startsWith("D") ? "assistant" : "channel",
      // An eval conversation is a thread the runner is continuing, which is
      // also what keeps the antecedent window — a read of a Slack channel the
      // eval surface does not have — out of the measurement.
      threaded: true,
      text: prompt,
      images: [],
      history,
      pending,
      prd: null,
    },
  };
}

/** The meter numbers for this invocation, read from `net.ts` by the caller
 *  (which has the Workers runtime this file deliberately does not). */
export interface EvalMeter {
  subrequests: number;
  hosts: string;
  internal: number;
  trips: number;
}

export interface EvalTurnReport {
  outcome: TurnOutcome;
  /** What the loop itself returned, captured on the way through the `runAgent`
   *  dependency — the outcome names what the turn DID, not what the model said,
   *  and `result` on the wire has always been the model's own answer shape. */
  agentResult?: AgentResult;
  /** Every resolution the turn asked for, in order (see the recording resolver
   *  in `eval/turn-adapter.ts`). The decision is read from here because the
   *  typed-gate path never reaches the loop. */
  resolutions: Array<{ toolName: string; decision: "confirm" | "cancel"; narrative?: string }>;
  /** What the clarify gate asked, when it asked. */
  gateAsk: string | null;
  /** The model's tool calls with their arguments and what each result said
   *  about itself (`agent/tool-transcript.ts`). */
  tools: ToolCall[];
  /** Everything the turn asked the recording Delivery to do, in order. */
  calls: DeliveryCall[];
  /** Flattened dials for the last model call this turn. */
  dials: Record<string, string> | null;
  meter: EvalMeter;
  build: string;
  ms: number;
}

/** What the model's answer looked like, in the `result` shape the runner and
 *  `scripts/eval-history.mjs` read. */
export type EvalResult =
  | { kind: "text"; text: string }
  | {
      kind: "proposal";
      /** The whole batch, so a results file shows what ONE ✅ would have run. */
      operations?: Array<{ toolName: string; input: Record<string, unknown> }>;
      toolName: string;
      input: Record<string, unknown>;
      previewText?: string;
    }
  | { kind: "resolved"; decision: "confirm" | "cancel"; messageToUser?: string };

/**
 * The turn's answer, as `result`.
 *
 * Read off the DISPOSITION — what the turn actually did — with the loop's own
 * result filling in the detail. Two places where that differs from the old
 * driver, and both are the point of the ticket:
 *
 *   * `answered` reports what was POSTED, which is the draft after the
 *     confidence pre-check, the absence check and the judge. The old route
 *     reported the raw draft, so a `textRegex` assertion scored a body no
 *     designer would ever have read.
 *   * `asked` with no gate ask is the deterministic cancel bounce (Turn reads
 *     the "(Cancelled the proposed …)" marker and answers instead of
 *     re-carding). Nothing was staged, so it reports as the TEXT it is — R5's
 *     turn 3 asserts exactly that. Where the gate DID ask, the old shape is
 *     kept verbatim — the gated proposal plus `gateAsk` — because that pair is
 *     what the fixtures' `allowProposalIfGateAsk` escape hatch reads.
 */
function evalResult(report: EvalTurnReport): EvalResult | null {
  const { outcome, agentResult } = report;
  const posted = outcome.posted ?? "";
  const decision = report.resolutions.at(-1)?.decision;

  switch (outcome.disposition) {
    case "answered":
      return { kind: "text", text: posted };

    case "reacted":
      // A reaction and no words is a finished turn (the model answered "thanks"
      // with `slack_react`). It posted nothing, which is the empty text.
      return { kind: "text", text: "" };

    case "asked":
      if (report.gateAsk && agentResult?.kind === "proposal") return agentResult;
      return { kind: "text", text: posted };

    case "resolved":
      return {
        kind: "resolved",
        decision:
          decision ??
          (agentResult?.kind === "resolved" ? agentResult.decision : "confirm"),
        ...(posted ? { messageToUser: posted } : {}),
      };

    case "staged":
      return agentResult?.kind === "proposal"
        ? agentResult
        : { kind: "text", text: posted };

    case "stopped":
      // Stop was pressed and the answer went undelivered. Nothing was posted,
      // which is the empty text — the same shape the reaction-only turn reports
      // for the same reason.
      return { kind: "text", text: "" };

    case "failed":
      // Reported as the loop produced it — except a stop, which carries no text
      // and no tool call for the runner to score, and reaches this arm only if
      // a turn were ever to fail after one was seen.
      return agentResult && agentResult.kind !== "stopped" ? agentResult : null;
  }
}

/** The failure message the turn made visible, when it failed. Carried so a
 *  transient model error still reads as one to the runner's retry (a 429 that
 *  arrives as `ok: true, disposition: failed` is a case marked failed on a
 *  quota, which is how the first live run "failed" all 34). */
function failureError(report: EvalTurnReport): string {
  const failure = [...report.calls].reverse().find((c) => c.kind === "failure");
  const stage = report.outcome.failure?.stage ?? "internal";
  const message = failure && failure.kind === "failure" ? failure.message : undefined;
  return message ? `${stage}: ${message}` : `turn failed at ${stage}`;
}

/**
 * One `TurnOutcome`, as the /debug/eval response.
 *
 * EVERY FIELD THE RUNNER NAMES IS STILL HERE, and means what it meant:
 * `ok` · `error` · `build` · `ms` · `result` · `dials` · `tools` ·
 * `references` · `gateAsk` · `narration` · `subrequests` ·
 * `subrequest_hosts` · `internal_subrequests` · `budget_trips`.
 *
 * Two are now reported from the turn rather than assembled beside it:
 * `references` is the turn's own telemetry (the names `read_reference` served),
 * and `narration` is what the recording Delivery was asked to post as interim
 * lines — the same callback production's Slack adapter posts from.
 */
export function evalTurnResponse(report: EvalTurnReport): Record<string, unknown> {
  const { outcome, meter } = report;
  const failed = outcome.disposition === "failed";
  const result = evalResult(report);

  return {
    ok: !failed,
    build: report.build,
    ms: report.ms,
    ...(failed ? { error: failureError(report) } : {}),
    subrequests: meter.subrequests,
    subrequest_hosts: meter.hosts,
    internal_subrequests: meter.internal,
    budget_trips: meter.trips,
    narration: report.calls.flatMap((c) => (c.kind === "interim" ? [c.text] : [])),
    dials: report.dials,
    tools: report.tools,
    references: outcome.telemetry.references,
    gateAsk: report.gateAsk,
    ...(result ? { result } : {}),
    // What the turn DID, beside what the model said: the disposition, the tier
    // it routed to and the judges' verdicts. Additive — nothing reads it yet —
    // and it is the half the old driver could not report at all.
    turn: {
      disposition: outcome.disposition,
      tier: outcome.telemetry.tier,
      route: outcome.telemetry.route,
      trivial: outcome.telemetry.trivial,
      correction: outcome.telemetry.correction,
      ...(outcome.telemetry.confidence ? { confidence: outcome.telemetry.confidence } : {}),
      ...(outcome.telemetry.judge ? { judge: outcome.telemetry.judge } : {}),
      interim: outcome.telemetry.interim,
      staged: Boolean(outcome.staged),
    },
  };
}
