// Claude-on-Vertex agent loop — the provider adapter's Claude execution path,
// activated by MODEL_PROVIDER="vertex-claude". Same AgentInput/AgentResult
// contract as the Gemini loop (gemini-agent.ts), so events.ts and the proposal
// gate stay provider-blind.
//
// Structurally this is the Gemini loop in Anthropic Messages format: a
// CLIENT-SIDE tool loop where every round is one short rawPredict call
// (vertex/claude.ts). It deliberately drops the direct-Anthropic-only features
// that Vertex does not host — hosted MCP connector, the `advisor` tool, and
// `delegate` (which fanned out THROUGH MCP). Web search IS kept: Vertex hosts
// Claude's server-side web_search tool (needs the GCP org policy
// `constraints/vertexai.allowedPartnerModelFeatures` enabled; Gemini's
// googleSearch is the equivalent on the other lane).
//
// Prompt caching: the system blocks carry cache_control (skills.ts) and Vertex
// honours it for Claude, so the cached prefix pays off on this lane.

import type { Env } from "../types";
import { TOOLS } from "./tool-definitions";
import { SIDE_EFFECT_TOOLS } from "./types";
import { buildSystemBlocks } from "./skills";
import { routeRequest, MODELS } from "./routing";
import { claudeVertexRaw } from "../vertex/claude";
import { BUILD } from "../version";
import {
  MAX_ITERATIONS,
  MAX_TOKENS,
  READONLY_TOOL_BUDGET,
  GROUNDING_BUDGET,
  readOnlyToolCost,
  BUDGET_EXHAUSTED_LOOKUP_NOTE,
  BUDGET_EXHAUSTED_SYNTHESIS,
  CLARIFY_FALLBACK,
  makeInterimFilter,
  validateProposalResolve,
  executeReadOnlyTool,
  type AgentInput,
  type AgentResult,
  type AgentImage,
} from "./loop-shared";
import type { HistoryTurn } from "../thread-state-client";

// ── Anthropic Messages wire types (the subset we touch) ──────────────────────

interface TextBlock { type: "text"; text: string; }
interface ToolUseBlock { type: "tool_use"; id: string; name: string; input: Record<string, unknown>; }
type ContentBlock = TextBlock | ToolUseBlock | { type: string; [k: string]: unknown };

interface ImageBlockParam {
  type: "image";
  source: { type: "base64"; media_type: string; data: string };
}
interface ToolResultBlockParam {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}
interface MessageParam {
  role: "user" | "assistant";
  content: string | Array<ContentBlock | ImageBlockParam | ToolResultBlockParam>;
}
interface ClaudeMessage {
  content: ContentBlock[];
  stop_reason: string | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
}

// Web search is a server-side tool executed on Google/Anthropic infra during
// the single rawPredict call (zero Worker subrequests). Kept per user decision.
const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search", max_uses: 3 };

export async function runClaudeAgent(input: AgentInput): Promise<AgentResult> {
  const { env, userText, history, currentSender, pending, images, slack } = input;

  const { tier, reason: routeReason } = routeRequest({ userText, hasPending: pending !== null });
  // Tier → Vertex model ID. The sonnet default is overridable via CLAUDE_MODEL
  // (e.g. pin an exact @-versioned id); haiku/opus stay fixed.
  const model =
    tier === "sonnet" ? (env.CLAUDE_MODEL ?? MODELS.sonnet) : MODELS[tier];

  // Standard extended thinking for the reasoning lanes (Vertex-supported).
  // haiku turns are trivial confirms and skip it. Preserved across tool rounds
  // automatically because we echo the assistant content verbatim below. Tunable
  // dial — drop to undefined if a model/region rejects the shape.
  const thinking = tier === "haiku" ? undefined : { type: "enabled", budget_tokens: 6000 };

  const tools = [
    ...TOOLS.filter((t) => t.name !== "delegate"), // delegate was MCP-backed; gone on Vertex
    WEB_SEARCH_TOOL,
  ];

  // ── telemetry (mirror the Gemini lane's single [uno-bot] line) ─────────────
  const startedAt = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let cacheWriteTokens = 0;
  let iterations = 0;
  let toolCallsUsed = 0;
  let groundingCostUsed = 0;
  const toolNamesUsed: string[] = [];

  const addUsage = (u: ClaudeMessage["usage"]): void => {
    inputTokens += u?.input_tokens ?? 0;
    outputTokens += u?.output_tokens ?? 0;
    cacheReadTokens += u?.cache_read_input_tokens ?? 0;
    cacheWriteTokens += u?.cache_creation_input_tokens ?? 0;
  };
  const recordToolUses = (content: ContentBlock[]): void => {
    for (const b of content) {
      if (b.type === "tool_use" || b.type === "server_tool_use") {
        toolNamesUsed.push((b as ToolUseBlock).name ?? "(server)");
      }
    }
  };
  const finish = (result: AgentResult): AgentResult => {
    console.log(`[budget] grounding est: ${groundingCostUsed}/${GROUNDING_BUDGET} subrequests, ${toolCallsUsed} tools`);
    console.log(
      `[uno-bot] request done build=${BUILD} provider=vertex-claude tier=${tier} route=${routeReason} model=${model} ` +
        `iterations=${iterations} tokens_in=${inputTokens} tokens_out=${outputTokens} ` +
        `cache_read=${cacheReadTokens} cache_write=${cacheWriteTokens} ms=${Date.now() - startedAt} ` +
        `tools=[${toolNamesUsed.join(",")}] mcp=off outcome=${result.kind}`,
    );
    return result;
  };

  const emitInterim = makeInterimFilter(input.onInterim);

  const pendingForSystem = pending
    ? { toolName: pending.toolName, input: pending.input, requesterUserId: pending.requesterUserId }
    : null;
  const systemBlocks = await buildSystemBlocks(env, pendingForSystem, currentSender);

  const messages = buildMessages(history, userText, images);

  const callClaude = async (disableTools: boolean): Promise<ClaudeMessage> => {
    const body: Record<string, unknown> = {
      max_tokens: MAX_TOKENS,
      system: systemBlocks,
      messages,
      tools,
      ...(thinking ? { thinking } : {}),
      ...(disableTools ? { tool_choice: { type: "none" } } : {}),
    };
    const { status, data } = await claudeVertexRaw(env, model, body);
    if (status !== 200) {
      const err = data as { error?: { message?: string } };
      throw new Error(`Vertex-Claude ${status}: ${err?.error?.message ?? "rawPredict failed"}`.slice(0, 400));
    }
    return data as ClaudeMessage;
  };

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const response = await callClaude(false);
    iterations++;
    addUsage(response.usage);
    recordToolUses(response.content);

    if (response.stop_reason === "end_turn" || response.stop_reason === "stop_sequence") {
      return finish({ kind: "text", text: extractFinalText(response.content) || "(empty response)" });
    }

    // Server-side tool work (web_search) can pause a long turn: resume by
    // echoing the paused assistant content and calling again. Without this the
    // loop would surface "(internal: unexpected stop_reason: pause_turn)".
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    if (response.stop_reason === "tool_use") {
      const toolUses = response.content.filter((b): b is ToolUseBlock => b.type === "tool_use");

      // (a) Resolve a pending proposal — Worker-side authorization, defense in depth.
      const resolveCall = toolUses.find((tu) => tu.name === "proposal_resolve");
      if (resolveCall) {
        const verdict = validateProposalResolve(
          resolveCall.input as { decision?: unknown; message_to_user?: unknown },
          pending,
          currentSender.userId,
        );
        if (!verdict.ok) {
          // Satisfy EVERY tool_use in the turn or the next call 400s on an
          // orphaned tool_use (same discipline as the Gemini lane).
          messages.push({ role: "assistant", content: response.content });
          messages.push({
            role: "user",
            content: toolUses.map((tu): ToolResultBlockParam =>
              tu.id === resolveCall.id
                ? { type: "tool_result", tool_use_id: tu.id, content: JSON.stringify({ ok: false, error: verdict.error }), is_error: true }
                : { type: "tool_result", tool_use_id: tu.id, content: JSON.stringify({ ok: false, error: "deferred — resolve the pending proposal first" }) },
            ),
          });
          continue;
        }
        return finish({ kind: "resolved", decision: verdict.decision, pending: pending!, messageToUser: verdict.messageToUser });
      }

      // (b) Side-effect tool → stage as a ✅-gated proposal.
      const sideEffect = toolUses.find((tu) => SIDE_EFFECT_TOOLS.has(tu.name as never));
      if (sideEffect) {
        const previewText = response.content
          .filter((b): b is TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return finish({
          kind: "proposal",
          toolName: sideEffect.name,
          input: sideEffect.input ?? {},
          previewText: previewText || undefined,
        });
      }

      // (c) Read-only tools: execute within budget, feed results back, loop.
      const narration = response.content
        .filter((b): b is TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (narration) emitInterim(narration);

      messages.push({ role: "assistant", content: response.content });
      const toolResults: ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        if (
          toolCallsUsed >= READONLY_TOOL_BUDGET ||
          groundingCostUsed + readOnlyToolCost(tu.name) > GROUNDING_BUDGET
        ) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify({ ok: false, error: "no more lookups available this turn", note: BUDGET_EXHAUSTED_LOOKUP_NOTE }),
          });
          continue;
        }
        toolCallsUsed++;
        groundingCostUsed += readOnlyToolCost(tu.name);
        const resultText = await executeReadOnlyTool(env, tu.name, tu.input, slack);
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: resultText });
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    return finish({ kind: "text", text: `(internal: unexpected stop_reason: ${response.stop_reason})` });
  }

  // Iteration budget exhausted — force a tools-disabled synthesis pass so the
  // model answers from what it already gathered. `tools` stays passed (the API
  // rejects tool_result-bearing histories with no tools defined).
  messages.push({ role: "user", content: BUDGET_EXHAUSTED_SYNTHESIS });
  const finalResponse = await callClaude(true);
  iterations++;
  addUsage(finalResponse.usage);
  recordToolUses(finalResponse.content);
  return finish({ kind: "text", text: extractFinalText(finalResponse.content) || CLARIFY_FALLBACK });
}

/**
 * The user-facing reply is the text AFTER the last non-text block (tool /
 * server-tool / thinking). Joining every text block would leak the working
 * monologue; falls back to all-text when there are no non-text blocks.
 */
function extractFinalText(content: ContentBlock[]): string {
  let lastNonText = -1;
  content.forEach((b, i) => {
    if (b.type !== "text") lastNonText = i;
  });
  const after = content
    .slice(lastNonText + 1)
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (after) return after;
  return content
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/**
 * Build the Claude messages array from stored history + the current turn.
 * Merges consecutive same-role turns (the API rejects them) and drops leading
 * assistant turns (first message must be user). Current-turn images become
 * image blocks ahead of the text block; history stays plain text.
 */
function buildMessages(history: HistoryTurn[], userText: string, images?: AgentImage[]): MessageParam[] {
  const raw: { role: "user" | "assistant"; content: string }[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userText },
  ];
  const merged: { role: "user" | "assistant"; content: string }[] = [];
  for (const turn of raw) {
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role) last.content = `${last.content}\n\n${turn.content}`;
    else merged.push({ role: turn.role, content: turn.content });
  }
  while (merged.length > 0 && merged[0]!.role !== "user") merged.shift();
  const result: MessageParam[] = merged.map((m) => ({ role: m.role, content: m.content }));

  if (images && images.length > 0 && result.length > 0) {
    const lastTurn = result[result.length - 1]!;
    if (lastTurn.role === "user" && typeof lastTurn.content === "string") {
      lastTurn.content = [
        ...images.map((img): ImageBlockParam => ({
          type: "image",
          source: { type: "base64", media_type: img.media_type, data: img.data },
        })),
        { type: "text", text: lastTurn.content },
      ];
    }
  }
  return result;
}
