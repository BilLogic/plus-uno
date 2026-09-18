// THE agent loop. One module, every provider.
//
// What lives here is everything a turn DECIDES, and each of these used to exist
// twice — once per provider — which is how `/stop` and backup-model failover
// came to work on one provider and not the other:
//
//   • the iteration budget gate, so the round-trip that carries a refusal is
//     paid for before it is spent (ADR-022, `outOfIterationBudget`);
//   • the stop check, cooperative and at a tool boundary, on every iteration
//     and once more before an answer is delivered;
//   • authorization of the model's own `proposal_resolve` call, and answering
//     every other call in that turn so none is left orphaned;
//   • EVERY side-effect call of one reply becoming ONE ✅-gated proposal — a
//     batch — instead of an execution, with that reply's lookups still answered,
//     and a preflight refusal going back to the MODEL once before it ever goes
//     to the person;
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
// `Env` once, in `run-agent.ts`.

import { SIDE_EFFECT_TOOLS } from "./types";
import { BUILD } from "../version";
import type { ModelTier } from "./tiers";
import type { PendingProposal, ProposalOperation, ThreadRef } from "../thread-state/index";
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
  /**
   * The turn was stopped, and the answer goes undelivered.
   *
   * It carries NO TEXT on purpose. Every stop door confirms the press itself,
   * so a line from here would be the second stop message for one press (#589).
   * What the loop reports is the fact; what the person reads was already said.
   *
   * ALL THREE SAY IT IN THE RUN'S OWN THREAD, which is what makes silence here
   * correct rather than merely quiet. Slack's in-thread control posts there
   * directly (`slack/session-stop.ts`); `/stop` and the Home-tab button each
   * post there too, off the conversation `cancelForUser` reports, and keep
   * their ephemeral and their DM as the presser's private receipt
   * (`slack/commands.ts`, `slack/interactive.ts`). One shared sentence, naming
   * the presser, because on a channel run the person who asked and the person
   * who pressed are two people and it is the ASKER who is watching that thread
   * for an answer.
   */
  | { kind: "stopped" }
  | {
      kind: "proposal";
      /**
       * EVERY side-effect call in the reply, in the order the model made them
       * — one Proposal, one ✅, one batch. The loop used to return the first
       * and drop the rest, which is how an approved four-document plan became
       * one append: a second write vanished with no log and nothing the model
       * or the person could see.
       */
      operations: ProposalOperation[];
      /** The FIRST operation, kept populated for one release so readers that
       *  have not moved to `operations` yet — the card's tool routing, the
       *  preflight, the eval scripts — keep working unchanged. */
      toolName: string;
      input: Record<string, unknown>;
      /** Brief structural preview the model wrote alongside the tool call, if
       *  any. The Worker combines this with its standardized proposal footer.
       *  Carried by BOTH adapters now (#496): it is the neutral
       *  `ModelReply.text` from a turn that also announced a side-effect call,
       *  which is the same field Gemini's narration arrives in — there is no
       *  Claude-specific preview any more.
       *  TODO(#498): this is delivery's business, not the loop's — it
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
   * The stop flag, consumed once.
   *
   * Only the one method the loop needs, so a test builds a boolean and nothing
   * else. Production passes `threadStateFor(env)`, which satisfies this
   * structurally — see `run-agent.ts`.
   */
  threadState: { consumeCancel(ref: ThreadRef, since?: number): Promise<boolean> };
  budget: LoopBudget;
  /**
   * Clarify-vs-act, asked BEFORE a side-effect call is staged: what does this
   * call still need, or null when it is actionable.
   *
   * The check itself has always run — in Turn, after the loop returned — which
   * meant the refusal reached the person and never the model, and a model that
   * cannot see why it was refused re-posts the same proposal (2026-09-15).
   * Asking here lets the refusal come back as that call's tool RESULT, so the
   * model corrects it within the turn. Every side-effect call is checked, but
   * exactly one refusal is handed back: a call refused a second time is
   * returned as the proposal, and the check Turn runs on it is the ask the
   * person sees. Optional — a caller with no preflight stages as before.
   */
  preflight?(name: string, args: Record<string, unknown>): Promise<{ ask: string } | null>;
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

  /**
   * When this turn began, so a stop flag raised before it cannot claim it.
   *
   * Anchored at the START of the turn rather than here, because the gather that
   * runs before the loop takes real time and a press during it is a real press
   * (`turn/turn.ts` passes its own clock through `run-agent.ts`). Omitted, every
   * flag counts, which is the old behaviour and what the eval path wants.
   */
  cancelSince?: number;

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
  /** The turn's one preflight correction, once it has been handed to the model. */
  let preflightSpent = false;
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
   * Read-only calls, executed under the ceiling — the loop's one lookup path.
   *
   * Shared by the two branches that reach lookups: a reply that is only
   * lookups, and a reply that also stages a proposal. One copy is what makes
   * "no announced call goes unanswered" one rule rather than two that drift.
   */
  const runLookups = async (calls: ModelToolCall[]): Promise<ModelToolResult[]> => {
    const results: ModelToolResult[] = [];
    for (const call of calls) {
      let text: string;
      // Fires when the lookup ceiling is already reached, or the tool-count
      // backstop is hit. LOOKUPS only — side-effect tools are peeled off by the
      // caller and stay allowed even when the lookup budget is spent.
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
    return results;
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

  /**
   * Has stop been pressed? Read at the top of every iteration, and once more
   * after the last model reply, before an answer is delivered.
   *
   * COOPERATIVE, and that has not changed: the Worker cannot interrupt a
   * running alarm, so a stop lands at a tool boundary rather than mid-write, a
   * tool call already in flight completes, and a proposal is never left half
   * executed. A stop is not an undo either — anything the gate already ran has
   * happened. What a press buys is that the ANSWER is not delivered.
   *
   * ON EVERY ITERATION, the first included. The earlier rule skipped iterations
   * 0 and 1, reasoning that nobody types `/stop` inside the first few seconds.
   * That was true of a typed command and false of a button: Slack's stop
   * control and the Home-tab button are one click on something already on
   * screen, so the first two iterations are precisely when a press arrives —
   * and a short turn answers on iteration 0, where the flag was never read at
   * all. Seen in production on r336 (2026-09-17), twice in one thread: the stop
   * line posted and the answer followed it (#589).
   *
   * AND ONCE AFTER THE LAST REPLY, which no iteration count could cover. A
   * press arriving during the final model call is invisible to the read at the
   * top of that iteration, because the flag was not there yet; the loop then
   * returns through `finish` and delivers. So every exit that delivers TEXT
   * reads the flag immediately before it: the ordinary answer, the preview a
   * reply with nothing stageable leaves behind, and the budget-exhausted
   * synthesis pass.
   *
   * A STAGED CARD COUNTS AS DELIVERY, and reads the flag too. Nothing in a
   * staged batch has run — it is waiting on a ✅ — so dropping it takes nothing
   * back, and a card arriving under the stop line is what the incident looked
   * like from the thread.
   *
   * ONE EXIT DELIBERATELY DOES NOT, worth naming so that the next reader
   * tidying "every delivering exit" does not add a read to it. `proposal_resolve`
   * is the person's own ✅ or 🚫 being carried out: dropping it would leave a
   * decision they already made unacted, and for a confirm it would contradict
   * the promise that a stop is not an undo.
   *
   * WHAT THE READS COST, since the rule they replace made its own cost
   * argument. Each read is one Durable Object hop, and a hop is an INTERNAL
   * subrequest: Cloudflare allows 1,000 of those to its own services per
   * invocation, counted apart from the 50 EXTERNAL subrequests that kill a
   * Worker when they run out (ADR-022's 2026-07-30 correction; `src/net.ts`
   * meters the two separately and the lookup gate reads only the external
   * one). A short turn now spends two hops where it spent none, a long one a
   * hop per iteration plus one — and the external cap that the delivery
   * reserve protects is untouched by every one of them.
   *
   * CONSUMED, which is what makes one press one stop: the flag is taken by the
   * first read that sees it, leaving nothing for the next turn in the thread to
   * stop itself on.
   *
   * AND SCOPED TO THIS TURN, which is what stops a flag consuming the WRONG
   * one. Slack's in-thread control cannot tell which of a DM's two conversation
   * keys holds the run, so it raises the flag on both (`slack/session-stop.ts`
   * `conversationKeys`); the running turn takes one and the other stands for
   * the five minutes of `CANCEL_TTL_MS`. Once the loop reads from iteration 0
   * and a stopped turn posts nothing, that leftover is a later, unrelated
   * question silently going unanswered — so `cancelSince` makes a flag raised
   * before this turn began report false. It is still CLEARED: a stale flag must
   * not survive to claim the turn after this one either.
   *
   * Best-effort, as it has always been: a failed read lets the turn continue,
   * which is the same annoyance as a press that missed and never worth failing
   * a turn over.
   */
  const stopPressed = async (): Promise<boolean> => {
    if (!input.cancelKey) return false;
    return deps.threadState
      .consumeCancel(input.cancelKey, input.cancelSince)
      .catch(() => false);
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

    if (await stopPressed()) {
      console.log(`[stop] stopped at iteration ${iter}, before the model was called`);
      return finish({ kind: "stopped" });
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
      // The turn has its answer and is about to hand it over — the last moment
      // a press can still be honoured.
      if (await stopPressed()) {
        console.log(`[stop] stopped at iteration ${iter}, answer undelivered`);
        return finish({ kind: "stopped" });
      }
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

    // (b) Side-effect tools → staged as ONE ✅-gated proposal, never executed
    // here. Every one of them: the reply is the model's whole plan, and the
    // batch is what the person approves with a single ✅.
    const sideEffects = reply.toolCalls.filter((c) => SIDE_EFFECT_TOOLS.has(c.name as never));
    if (sideEffects.length) {
      // …unless preflight refuses one of them, and the turn still has its one
      // correction in hand: hand each reason back as that call's result and
      // let the model fix the plan itself. A second refusal is Turn's to put to
      // the person. Every call in the reply is answered, so no slot is orphaned.
      if (deps.preflight) {
        const refusals = new Map<string, string>();
        for (const call of sideEffects) {
          const refusal = await deps.preflight(call.name, call.args);
          if (refusal) refusals.set(call.id, refusal.ask);
        }
        // Checked every time, acted on once: a second refusal is staged as it
        // stands, and Turn's own preflight is what the person then hears.
        if (refusals.size && !preflightSpent) {
          preflightSpent = true;
          provider.recordToolResults(
            reply.toolCalls.map((c): ModelToolResult => {
              const text = JSON.stringify(
                refusals.has(c.id)
                  ? { ok: false, error: refusals.get(c.id) }
                  : { ok: false, error: "deferred — a proposed write in this batch needs fixing first" },
              );
              input.onToolResult?.(toolResultDigest(c.name, text));
              return { id: c.id, name: c.name, text, isError: true };
            }),
          );
          continue;
        }
      }
      const operations: ProposalOperation[] = [];
      const unstageable: string[] = [];
      for (const call of sideEffects) {
        // An operation is a tool name and an argument OBJECT. A call whose
        // arguments are not one cannot be staged — so it is said, in the
        // proposal's preview, rather than quietly left out of the batch.
        if (call.args && typeof call.args === "object" && !Array.isArray(call.args)) {
          operations.push({ toolName: call.name, input: call.args });
        } else {
          unstageable.push(call.name);
        }
      }

      // The read-only calls of the SAME reply still run. This reply ended the
      // turn — a staged proposal is the outcome — so their results feed the
      // transcript and the turn's history rather than a further model step;
      // `recordToolResults` is where they belong either way. What makes running
      // them right is that each was already ANNOUNCED (`onToolCall` fired, the
      // turn's telemetry lists it): a reported call with no result is exactly
      // the silent drop this branch exists to end.
      const lookups = reply.toolCalls.filter(
        (c) => !SIDE_EFFECT_TOOLS.has(c.name as never) && c.name !== "proposal_resolve",
      );
      if (lookups.length) provider.recordToolResults(await runLookups(lookups));

      const preview = [
        reply.text || "",
        unstageable.length
          ? `I could not stage ${unstageable.join(", ")} with the rest of this batch — tell me what you want there and I'll redo it.`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      // Nothing stageable at all: the person hears what happened instead of
      // watching a proposal card that would have been empty.
      if (!operations.length) {
        // A preview IS an answer by the measure that matters — the person
        // reads it — so it reads the flag on the same rule as the exits above.
        if (await stopPressed()) {
          console.log(`[stop] stopped at iteration ${iter}, preview undelivered`);
          return finish({ kind: "stopped" });
        }
        return finish({ kind: "text", text: preview || CLARIFY_FALLBACK });
      }
      // A CARD IS DELIVERY TOO, so it reads the flag like the answers above.
      // Nothing here has been executed — the batch is staged, waiting on a ✅ —
      // so suppressing it takes nothing back and is not an undo. What it spares
      // the person is the thing the incident actually looked like: a fresh card
      // arriving under the line that had just told them work would stop.
      if (await stopPressed()) {
        console.log(`[stop] stopped at iteration ${iter}, proposal unstaged`);
        return finish({ kind: "stopped" });
      }
      return finish({
        kind: "proposal",
        operations,
        toolName: operations[0]!.toolName,
        input: operations[0]!.input,
        previewText: preview || undefined,
      });
    }

    // (c) Read-only tools: execute under the ceiling, hand the results back.
    provider.recordToolResults(await runLookups(reply.toolCalls));
  }

  // Iteration budget exhausted — force a synthesis pass with tool calling
  // disabled, so the model answers from what it already gathered.
  provider.recordUserText(BUDGET_EXHAUSTED_SYNTHESIS);
  const final = await send(false);
  // This pass delivers an answer too, so it reads the flag on the same rule as
  // the exit above.
  if (await stopPressed()) {
    console.log("[stop] stopped after the synthesis pass, answer undelivered");
    return finish({ kind: "stopped" });
  }
  return finish({ kind: "text", text: final.text || CLARIFY_FALLBACK });
}
