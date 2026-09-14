// THE agent loop. One module, every provider.
//
// What lives here is everything a turn DECIDES, and each of these used to exist
// twice — once per provider — which is how `/stop` and backup-model failover
// came to work on one provider and not the other:
//
//   • the iteration budget gate, so the round-trip that carries a refusal is
//     paid for before it is spent (ADR-022, `outOfIterationBudget`);
//   • the `/stop` check, cooperative and at a tool boundary, from iteration 2;
//   • authorization of the model's own `proposal_resolve` call, and answering
//     every other call in that turn so none is left orphaned;
//   • a side-effect call becoming a ✅-gated proposal instead of an execution;
//   • read-only calls executed under the lookup ceiling, with a budget trip
//     stamping the result partial rather than letting a short read pass as whole;
//   • the tools-disabled synthesis pass when the ceiling is reached;
//   • retry on a backup model when the provider says it has one;
//   • the ONE interim-narration rule: narrate only ahead of read-only work.
//
// What does NOT live here is any model's wire format. The loop speaks
// `ModelProvider` (model-provider.ts): a neutral conversation and tool roster
// in, neutral text plus tool calls plus a stop kind out. The adapter owns its
// message list and the echo discipline that keeps it valid.
//
// PURE by design: every dependency that touches the runtime — the tool
// executor, ThreadState, the subrequest meter — arrives as a named port, so
// `tsconfig.test.json` compiles this file and `tests/agent-loop.test.ts` drives
// it with a fake adapter and no network. Production builds those ports from
// `Env` once, in `gemini-agent.ts`.

import { SIDE_EFFECT_TOOLS } from "./types";
import { BUILD } from "../version";
import type { ModelTier } from "./tiers";
import type { PendingProposal, ThreadRef } from "../thread-state/index";
import type { ProviderConversationTurn } from "./provider-conversation";
import { toolResultDigest, type ToolCall, type ToolResultNote } from "./tool-transcript";
import type {
  ModelProvider,
  ModelStop,
  ModelToolCall,
  ModelToolResult,
  SystemBlock,
  ToolSpec,
} from "./model-provider";
import {
  BUDGET_EXHAUSTED_SYNTHESIS,
  CLARIFY_FALLBACK,
  LOOKUP_CEILING,
  MAX_ITERATIONS,
  READONLY_TOOL_BUDGET,
  STOPPED_MESSAGE,
  SUBREQUEST_CAP,
  budgetRefusedResult,
  makeInterimFilter,
  markPartialLookup,
  outOfIterationBudget,
  validateProposalResolve,
} from "./loop-policy";

// ── What one turn actually ran on ────────────────────────────────────────────

/**
 * The tier the turn routed to and what the last model call ran on.
 *
 * `detail` is the provider's own dials, whatever they are. It used to be a
 * `level: string | null` field in this shared shape, which meant every provider
 * without a thinking level had to report null into a field named for one
 * provider's dial — exactly the Gemini-specific leak the seam exists to stop.
 */
export interface TurnDials {
  tier: ModelTier;
  route: string;
  model: string;
  detail: Record<string, string>;
}

export type AgentResult =
  | { kind: "text"; text: string }
  | {
      kind: "proposal";
      toolName: string;
      input: Record<string, unknown>;
      /** Brief structural preview the model wrote alongside the tool call, if
       *  any. The Worker combines this with its standardized proposal footer.
       *  TODO(#496/#498): this is delivery's business, not the loop's — it
       *  leaves the contract when mid-turn effects move behind the Delivery
       *  port and `slack/events.ts` stops reading the result's fields directly. */
      previewText?: string;
    }
  | {
      kind: "resolved";
      decision: "confirm" | "cancel";
      pending: PendingProposal;
      messageToUser?: string;
    };

// ── The loop's ports ─────────────────────────────────────────────────────────

/**
 * The subrequest meter, as the loop uses it.
 *
 * A port rather than a direct `net.ts` import for two reasons: `net.ts` names
 * runtime fetch types this file's test compile does not have, and a budget trip
 * is one of the behaviours most worth testing — a test that has to spend 38 real
 * subrequests to prove a lookup gets marked partial is a test nobody writes.
 */
export interface LoopBudget {
  /** External subrequests spent so far this invocation. */
  used(): number;
  /** Monotonic count of budget stops — read either side of a lookup. */
  trips(): number;
  /** Run `fn` with outbound calls capped at `limit` for this invocation. */
  withLookupLimit<T>(limit: number, fn: () => Promise<T>): Promise<T>;
  /** True when `err` is the budget stop rather than an upstream failure. */
  isBudgetError(err: unknown): boolean;
  /** Per-host spend, for the `[budget]` telemetry line. */
  breakdown(): string;
}

export interface LoopDeps {
  /** Execute one read-only tool and return its result text. Bound to the
   *  environment and the Slack context by the caller. */
  executeReadOnlyTool(name: string, args: Record<string, unknown>): Promise<string>;
  /**
   * The `/stop` flag, consumed once.
   *
   * Only the one method the loop needs, so a test builds a boolean and nothing
   * else. Production passes `threadStateFor(env)`, which satisfies this
   * structurally — see `gemini-agent.ts`.
   */
  threadState: { consumeCancel(ref: ThreadRef): Promise<boolean> };
  budget: LoopBudget;
}

export interface LoopInput {
  provider: ModelProvider;
  deps: LoopDeps;

  /** Routing is the caller's decision; the loop and the provider both take the
   *  tier as an opaque name. */
  tier: ModelTier;
  routeReason: string;

  conversation: ProviderConversationTurn[];
  system: SystemBlock[];
  tools: ToolSpec[];

  pending: PendingProposal | null;
  currentSenderId: string;

  /**
   * Where `/stop` would have been written, or null for a turn that cannot be
   * cancelled (a headless eval run has no Slack conversation).
   *
   * Passed in rather than derived: the writer and this reader drifted once
   * already — an explicitly threaded DM resolves to the thread, not to "dm",
   * and no expression here could know that. See `slack.conversationTs`.
   */
  cancelKey: ThreadRef | null;

  onInterim?: (text: string) => void;
  onDials?: (dials: TurnDials) => void;
  onToolCall?: (call: ToolCall) => void;
  onToolResult?: (result: ToolResultNote) => void;
}

// ── The loop ─────────────────────────────────────────────────────────────────

export async function runLoop(input: LoopInput): Promise<AgentResult> {
  const { provider, deps, pending, tier } = input;

  const startedAt = Date.now();
  let iterations = 0;
  let toolCallsUsed = 0;
  let fellBack = false;
  const toolNamesUsed: string[] = [];

  const finish = (result: AgentResult): AgentResult => {
    // Measured spend, per host — how close the turn came to the cap, instead of
    // finding out by way of a silent mid-turn death.
    console.log(
      `[budget] ${deps.budget.used()}/${SUBREQUEST_CAP} subrequests spent (lookup ceiling ${LOOKUP_CEILING}), ` +
        `${toolCallsUsed} tools, ${deps.budget.trips()} budget stops | ${deps.budget.breakdown()}`,
    );
    const { model, detail } = provider.dials();
    input.onDials?.({ tier, route: input.routeReason, model, detail });
    const usage = provider.usage();
    // One line per turn, per provider, reading as one named configuration: the
    // tier, why it was chosen, and the dials it resolved to.
    const dialLine = Object.entries(detail)
      .map(([k, v]) => `${k}=${v}`)
      .join(" ");
    console.log(
      `[uno-bot] request done build=${BUILD} provider=${provider.name} tier=${tier} route=${input.routeReason} ` +
        `model=${model}${dialLine ? ` ${dialLine}` : ""} fallback=${fellBack ? "yes" : "no"} ` +
        `iterations=${iterations} tokens_in=${usage.inputTokens} tokens_out=${usage.outputTokens} ` +
        `thinking=${usage.thinkingTokens} cached_in=${usage.cachedInputTokens} ` +
        `ms=${Date.now() - startedAt} tools=[${toolNamesUsed.join(",")}] outcome=${result.kind}`,
    );
    return result;
  };

  /**
   * One model round-trip, with the turn's single failover.
   *
   * The decision to retry is the LOOP's; whether a backup exists is the
   * adapter's fact. One switch per turn: a backup that also fails is a real
   * outage, and the capacity alerting in `slack/delivery.ts` is what should
   * hear about it.
   */
  const send = async (
    toolsEnabled: boolean,
  ): Promise<{ text: string; toolCalls: ModelToolCall[]; stop: ModelStop }> => {
    for (let attempt = 0; ; attempt++) {
      const reply = await provider.send({ toolsEnabled });
      if (reply.ok) {
        iterations++;
        return { text: reply.text, toolCalls: reply.toolCalls, stop: reply.stop };
      }
      if (attempt === 0 && !fellBack && provider.fallback(reply.status)) {
        fellBack = true;
        console.warn(
          `[${provider.name}] ${reply.status}: ${reply.message} — retrying this turn on the backup model`,
        );
        continue;
      }
      throw new Error(`${provider.name} ${reply.status}: ${reply.message}`.slice(0, 400));
    }
  };

  const emitInterim = makeInterimFilter(input.onInterim);

  await provider.start({
    tier,
    conversation: input.conversation,
    system: input.system,
    tools: input.tools,
  });

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // The model round-trip is the one subrequest EVERY iteration spends, and it
    // used to be the only one nothing gated: refusing lookups still let the loop
    // spin, burning the delivery reserve until the post itself failed. Break to
    // the tools-disabled synthesis pass below instead.
    if (outOfIterationBudget(deps.budget.used())) break;

    // `/stop`, checked between iterations. The Worker cannot interrupt a running
    // alarm, so cancellation is cooperative: it lands at a tool boundary, never
    // mid-write, which is what keeps a half-executed proposal impossible.
    //
    // NOT checked on the first two iterations. The flag costs an internal
    // Durable Object read per check, and nobody types `/stop` inside the first
    // few seconds — paying for it on every short turn to serve a case that
    // cannot have happened yet is the wrong trade.
    //
    // Best-effort, as it has always been: a failed read lets the turn continue,
    // which is the same annoyance as a `/stop` that missed and never worth
    // failing a turn over.
    if (
      iter >= 2 &&
      input.cancelKey &&
      (await deps.threadState.consumeCancel(input.cancelKey).catch(() => false))
    ) {
      console.log(`[stop] cancelled at iteration ${iter}`);
      return finish({ kind: "text", text: STOPPED_MESSAGE });
    }

    const reply = await send(true);

    // Server-side tool work (a hosted web search) can pause a long turn: the
    // adapter re-records its own paused reply and we call again. Nothing ran in
    // between, so nothing is answered.
    if (reply.stop === "paused") {
      provider.recordToolResults([]);
      continue;
    }

    if (reply.stop === "end" || reply.toolCalls.length === 0) {
      return finish({ kind: "text", text: reply.text || "(empty response)" });
    }

    for (const call of reply.toolCalls) {
      toolNamesUsed.push(call.name);
      input.onToolCall?.({ name: call.name, args: call.args });
    }

    // THE narration rule, in one place. Text arriving alongside tool calls is
    // the model narrating upcoming work — worth posting when that work is a
    // lookup, and never when it is a side effect, because a proposal's preview
    // is delivered on the proposal card and narrating it would duplicate it.
    const anySideEffect = reply.toolCalls.some(
      (c) => SIDE_EFFECT_TOOLS.has(c.name as never) || c.name === "proposal_resolve",
    );
    if (reply.text && !anySideEffect) emitInterim(reply.text);

    // (a) Pending-proposal resolution. Authorized Worker-side even though the
    // system prompt already tells the model — defense in depth.
    const resolveCall = reply.toolCalls.find((c) => c.name === "proposal_resolve");
    if (resolveCall) {
      const verdict = validateProposalResolve(
        resolveCall.args as { decision?: unknown; message_to_user?: unknown },
        pending,
        input.currentSenderId,
      );
      if (!verdict.ok) {
        // Reject, and answer EVERY call in this turn — an announced call left
        // without a result leaves a slot the next turn's call of the same name
        // fills by mistake (and, on some wire formats, 400s outright).
        provider.recordToolResults(
          reply.toolCalls.map((c): ModelToolResult => {
            const isResolve = c.id === resolveCall.id;
            const text = JSON.stringify(
              isResolve
                ? { ok: false, error: verdict.error }
                : { ok: false, error: "deferred — resolve the pending proposal first" },
            );
            input.onToolResult?.(toolResultDigest(c.name, text));
            return { id: c.id, name: c.name, text, isError: true };
          }),
        );
        continue;
      }
      return finish({
        kind: "resolved",
        decision: verdict.decision,
        pending: pending!,
        messageToUser: verdict.messageToUser,
      });
    }

    // (b) Side-effect tool → staged as a ✅-gated proposal, never executed here.
    const sideEffect = reply.toolCalls.find((c) => SIDE_EFFECT_TOOLS.has(c.name as never));
    if (sideEffect) {
      return finish({
        kind: "proposal",
        toolName: sideEffect.name,
        input: sideEffect.args,
        previewText: reply.text || undefined,
      });
    }

    // (c) Read-only tools: execute under the ceiling, hand the results back.
    const results: ModelToolResult[] = [];
    for (const call of reply.toolCalls) {
      let text: string;
      // Fires when the lookup ceiling is already reached, or the tool-count
      // backstop is hit. LOOKUPS only — side-effect tools were peeled off above
      // and stay allowed even when the lookup budget is spent.
      if (toolCallsUsed >= READONLY_TOOL_BUDGET || deps.budget.used() >= LOOKUP_CEILING) {
        text = budgetRefusedResult();
      } else {
        toolCallsUsed++;
        // Enforced, not forecast: the ceiling refuses the call that would cross
        // it, so a tool can start with any headroom and simply return less.
        const tripsBefore = deps.budget.trips();
        try {
          text = await deps.budget.withLookupLimit(LOOKUP_CEILING, () =>
            deps.executeReadOnlyTool(call.name, call.args),
          );
          // Cut short but returned normally — a paging loop stopping cleanly, or
          // a catch that ate the throw. The counter sees it either way, so a
          // short read cannot pass as a whole one.
          if (deps.budget.trips() > tripsBefore) text = markPartialLookup(text);
        } catch (err) {
          if (!deps.budget.isBudgetError(err)) throw err;
          text = budgetRefusedResult();
        }
      }
      // The result's own honesty fields, for the eval transcript. Reported for
      // every outcome including the budget refusal above — "the lookup never
      // ran" is the answer to a whole class of failure (#452).
      input.onToolResult?.(toolResultDigest(call.name, text));
      results.push({ id: call.id, name: call.name, text });
    }
    provider.recordToolResults(results);
  }

  // Iteration budget exhausted — force a synthesis pass with tool calling
  // disabled, so the model answers from what it already gathered.
  provider.recordUserText(BUDGET_EXHAUSTED_SYNTHESIS);
  const final = await send(false);
  return finish({ kind: "text", text: final.text || CLARIFY_FALLBACK });
}
