// Claude's turn: the wiring between the Worker's `AgentInput` contract and the
// one agent loop (loop.ts) behind the Claude adapter (providers/claude.ts).
//
// There is no loop in this file any more. This file WAS the second loop — 359
// lines of iteration budget, `proposal_resolve` validation, side-effect staging,
// lookup ceiling, synthesis pass and narration, all written a second time — and
// the cost of that was exactly what #496 exists to fix: `/stop` was implemented
// on the Gemini path and simply absent here, so a Claude turn could not be
// cancelled. Deleting the copy is what makes it work, not a third implementation.
//
// What is left is the job the file is actually for, and it is deliberately the
// same shape as `gemini-agent.ts`: turn `Env` into the loop's named ports, route
// the tier, compose the system prompt and the tool roster, hand them over. The
// only line that differs is which adapter is constructed.
//
// `Env` stops here. The adapter takes a transport port rather than an `Env`, so
// it compiles in the Node test build and `tests/claude-provider.test.ts` drives
// a whole Claude-shaped turn with a stubbed rawPredict and no network.

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
import { claudeVertexRaw } from "../vertex/claude";
import { runLoop, type LoopBudget } from "./loop";
import { claudeProvider } from "./providers/claude";
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

export async function runClaudeAgent(input: AgentInput): Promise<AgentResult> {
  const { env, userText, history, currentSender, pending, images, slack, assistantContext } = input;
  const conversation = input.conversation ?? buildProviderConversation(history, userText, images);

  // Routing reads turn knowledge (the words, whether a proposal is pending) and
  // produces an opaque tier NAME. The adapter maps that name to a Claude model
  // and its thinking budget; nothing between the two knows either.
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

  // Keyed like the CONVERSATION, not the thread — and PASSED IN
  // (slack.conversationTs) rather than re-derived, because re-deriving it is
  // how the two ends drifted: an explicitly threaded DM resolves to the thread,
  // not to "dm". The fallback keeps the old behaviour for any caller that has
  // not supplied it. Identical to the Gemini side on purpose: `/stop` is now
  // one mechanism, read in one place.
  const cancelThread =
    slack?.conversationTs ?? (slack?.channel?.startsWith("D") ? "dm" : (slack?.threadTs ?? "dm"));

  return runLoop({
    provider: claudeProvider({
      transport: (model, body) => claudeVertexRaw(env, model, body),
      defaultModel: env.CLAUDE_MODEL,
    }),
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
