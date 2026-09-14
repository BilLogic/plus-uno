// Gemini's turn: the wiring between the Worker's `AgentInput` contract and the
// one agent loop (loop.ts) behind the Gemini adapter (providers/gemini.ts).
//
// There is no loop in this file any more. Everything that used to be here —
// the budget gate, the `/stop` check, `proposal_resolve` validation, the
// side-effect-to-proposal rule, the lookup ceiling, the partial-lookup mark,
// the synthesis pass, the model failover, the narration rule — existed twice,
// once per provider, and now exists once (#495). What is left is the job this
// file is actually for: turn `Env` into the loop's named ports, route the tier,
// compose the system prompt and the tool roster, and hand them over.
//
// `Env` stops here. The loop takes a tool executor, a `/stop` reader and a
// subrequest meter, which is what lets it be compiled and driven by
// `tests/agent-loop.test.ts` without a Cloudflare runtime.

import { TOOLS } from "./tool-definitions";
import { buildSystemBlocks } from "./skills";
import { routeRequest } from "./routing";
import { threadStateFor } from "../thread-state/production";
import {
  isSubrequestBudgetError,
  meterBreakdown,
  subrequestBudgetTrips,
  subrequestsUsed,
  withSubrequestLimit,
} from "../net";
import { runLoop, type LoopBudget } from "./loop";
import { geminiProvider } from "./providers/gemini";
import { executeReadOnlyTool, type AgentInput, type AgentResult } from "./loop-shared";
import { buildProviderConversation } from "./provider-conversation";
import type { SystemBlock, ToolSpec } from "./model-provider";

/** The loop's budget port over the real per-invocation meter (net.ts, ADR-022). */
const liveBudget: LoopBudget = {
  used: subrequestsUsed,
  trips: subrequestBudgetTrips,
  withLookupLimit: withSubrequestLimit,
  isBudgetError: isSubrequestBudgetError,
  breakdown: meterBreakdown,
};

export async function runGeminiAgent(input: AgentInput): Promise<AgentResult> {
  const { env, userText, history, currentSender, pending, images, slack, assistantContext } = input;
  const conversation = input.conversation ?? buildProviderConversation(history, userText, images);

  // Routing reads turn knowledge (the words, whether a proposal is pending) and
  // produces an opaque tier NAME. The adapter maps that name to a model and a
  // thinking level (ADR-028); nothing between the two knows either.
  const { tier, reason: routeReason } = routeRequest({
    userText,
    hasPending: pending !== null,
    override: input.tierOverride,
  });

  const pendingForSystem = pending
    ? { toolName: pending.toolName, input: pending.input, requesterUserId: pending.requesterUserId }
    : null;
  const blocks = await buildSystemBlocks(env, pendingForSystem, currentSender, assistantContext);
  // Block 0 is the harness: identical for every request on this build, and so
  // the only block a provider cache can hold. Everything after it is
  // per-request — who sent this, what proposal is pending.
  const system: SystemBlock[] = blocks.map((b, i) => ({ text: b.text, stable: i === 0 }));

  const tools: ToolSpec[] = TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  // Keyed like the CONVERSATION, not the thread. `/stop` arrives carrying only
  // a channel, so the key it can compute is the one this must read: a DM
  // collapses to the single "dm" conversation (mirroring conversationTs in
  // events.ts), a channel uses its thread.
  //
  // PASSED IN (slack.conversationTs) rather than re-derived, because
  // re-deriving it is exactly how the two ends drifted: an explicitly threaded
  // DM resolves to the thread, not to "dm", and the expression below cannot
  // know that. The fallback keeps the old behaviour for any caller that has not
  // supplied it.
  const cancelThread =
    slack?.conversationTs ?? (slack?.channel?.startsWith("D") ? "dm" : (slack?.threadTs ?? "dm"));

  return runLoop({
    provider: geminiProvider(env),
    deps: {
      executeReadOnlyTool: (name, args) => executeReadOnlyTool(env, name, args, slack),
      threadState: threadStateFor(env),
      budget: liveBudget,
    },
    tier,
    routeReason,
    conversation,
    system,
    tools,
    pending,
    currentSenderId: currentSender.userId,
    cancelKey: slack?.channel ? { channel: slack.channel, thread: cancelThread } : null,
    onInterim: input.onInterim,
    onDials: input.onDials,
    onToolCall: input.onToolCall,
    onToolResult: input.onToolResult,
  });
}
