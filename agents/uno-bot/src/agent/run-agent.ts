// One agentic Claude call against the user's current message.
//
// Inputs include the slack context, the current sender's identity, and any
// pending proposal in this thread. When a proposal is pending, Claude is told
// about it in the system prompt and can resolve it via the
// `proposal_resolve` tool — that's how text confirmations like
// "go ahead" or "cancel" get processed.
//
// The loop:
//   1. Build messages = thread history + the current user turn.
//   2. Call Claude with system blocks + tools + messages.
//   3. Inspect stop_reason:
//      - end_turn → return the text.
//      - tool_use → check for:
//          (a) proposal_resolve: validate, return as `resolved` if OK,
//              else loop with a tool_result error so Claude can apologize.
//          (b) a side-effect tool: return as `proposal` for staging.
//          (c) read-only tools: execute, feed results back, loop.
// A hard iteration cap prevents runaway loops.

import type Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../types";
import type { HistoryTurn } from "../thread-state-client";
import { TOOLS } from "./tool-definitions";
import { SIDE_EFFECT_TOOLS } from "./types";
import { buildSystemBlocks } from "./skills";
import { makeAnthropicClient, routeRequest, MODELS } from "./anthropic-client";
import { buildMcp, MCP_BETA } from "./mcp";
import { geminiConfigured } from "../gemini/client";
import { runGeminiAgent } from "./gemini-agent";
import {
  MAX_ITERATIONS,
  MAX_TOKENS,
  READONLY_TOOL_BUDGET,
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
import { BUILD } from "../version";

export type { HistoryTurn, AgentInput, AgentResult, AgentImage } from "./loop-shared";

export async function runAgent(input: AgentInput): Promise<AgentResult> {
  const { env, userText, history, currentSender, pending, images, slack } = input;

  // Provider switch (phase 2): MODEL_PROVIDER="gemini" routes the whole turn
  // through the Gemini loop (agent/gemini-agent.ts) — same AgentResult contract,
  // so everything downstream (gate, delivery, history) is provider-blind.
  if ((env.MODEL_PROVIDER ?? "anthropic").toLowerCase() === "gemini" && geminiConfigured(env)) {
    return runGeminiAgent(input);
  }

  const client = makeAnthropicClient(env);

  // D2 (Phase 3 final): three fixed lanes, no classifier — the dynamic part is
  // native (adaptive thinking + advisor tool below). See routeRequest.
  const { tier, model, reason: routeReason } = routeRequest({
    userText,
    hasPending: pending !== null,
  });

  // Notion hosted-MCP (READS ONLY). Empty until the one-time OAuth consent is
  // done, so the loop is unchanged until then. Current beta shape
  // (mcp-client-2025-11-20): mcp_servers carries connection details, and each
  // server needs a matching `mcp_toolset` in the top-level `tools` array (the
  // read allowlist). Passed as raw body + `anthropic-beta` header because the
  // installed SDK (0.32.x) predates these beta params. Writes are never exposed
  // (see agent/mcp.ts). When no token is stored, all of this is empty and the
  // loop is identical to the pre-MCP behavior.
  const { servers: mcpServers, toolsets: mcpToolsets } = await buildMcp(env);
  const mcpServerNames = mcpServers.map((s) => String((s as Record<string, unknown>).name));
  // Mutable: trips to false when the MCP attachment breaks THIS request (see
  // callClaude below) so the retry + all later iterations run without MCP.
  let mcpActive = mcpServers.length > 0;
  // Anthropic server-side web search (runs on Anthropic's infra, READ-only, no
  // beta header). Gives the bot web grounding — e.g. Figma usage/practice
  // questions and external resources it can't reach any other way (Figma's own
  // MCP is closed to us). Sonnet 5 / Opus 4.8 support the 20260209 variant
  // (dynamic filtering — better, cheaper results); haiku-4-5 predates it and
  // keeps the basic 20250305. ~$10 per 1k searches — max_uses caps per turn.
  const WEB_SEARCH_TOOL = {
    type: tier === "haiku" ? "web_search_20250305" : "web_search_20260209",
    name: "web_search",
    max_uses: 3,
  } as unknown as Anthropic.Tool;

  // Advisor tool (beta, server-side): the sonnet executor can consult opus
  // mid-request for strategy on the hardest moments — native escalation, no
  // rerun, no second cold cache. Sonnet lane only: haiku turns are trivial
  // confirms, and the opus lane IS opus. Advisor model must be ≥ executor
  // (sonnet-4-6 → opus-4-8 is a valid pair).
  const ADVISOR_TOOL =
    tier === "sonnet"
      ? [{ type: "advisor_20260301", name: "advisor", model: MODELS.opus } as unknown as Anthropic.Tool]
      : [];
  const ADVISOR_BETA = tier === "sonnet" ? "advisor-tool-2026-03-01" : null;

  // Adaptive thinking + effort (native dynamic compute): the model decides
  // when/how much to reason per request — this replaced the routing classifier
  // (user decision 2026-07-10). haiku-4-5 predates adaptive thinking; its lane
  // (trivial confirms) doesn't need it.
  const NATIVE_DIALS: Record<string, unknown> =
    tier === "haiku" ? {} : { thinking: { type: "adaptive" }, output_config: { effort: "high" } };

  const toolsWithMcp = [
    ...(TOOLS as Anthropic.Tool[]),
    WEB_SEARCH_TOOL,
    ...ADVISOR_TOOL,
    ...(mcpToolsets as unknown as Anthropic.Tool[]),
  ];
  // Fallback tool set: everything EXCEPT the MCP toolsets (web_search is an
  // Anthropic server tool, independent of MCP — it stays).
  const toolsPlain = [...(TOOLS as Anthropic.Tool[]), WEB_SEARCH_TOOL, ...ADVISOR_TOOL];

  const betaHeaders = (withMcp: boolean): Record<string, string> | undefined => {
    const betas = [...(withMcp ? [MCP_BETA] : []), ...(ADVISOR_BETA ? [ADVISOR_BETA] : [])];
    return betas.length > 0 ? { "anthropic-beta": betas.join(",") } : undefined;
  };

  // Resilient Anthropic call. If ANY attached MCP server fails to connect,
  // the API 400s the WHOLE request ("Connection error while communicating
  // with MCP server…") — one dead server must not take the bot down when the
  // REST fallback tools still work. On that specific error: log which servers
  // were attached, drop the MCP attachment for the REST OF THIS REQUEST, and
  // retry. (Edge: if earlier iterations already produced mcp_tool_use blocks
  // in `messages`, the MCP-less retry may itself be rejected — acceptable;
  // the dominant failure mode is the FIRST call, before any MCP blocks exist.)
  //
  // STREAMING is load-bearing, not cosmetic: with MCP servers attached, every
  // server-side MCP tool round runs INSIDE one HTTP request, and Cloudflare in
  // front of api.anthropic.com kills any request idle past ~100s with a 524
  // (live incident 2026-07-09: a multi-lookup sonnet run died `[agent] failed:
  // 524` after the DO runner had correctly kept it alive). Streaming keeps
  // bytes flowing for the whole run; finalMessage() returns the same
  // accumulated Message the non-streaming call would have.
  // Interim progress: between-tool narration is surfaced to the user as SHORT
  // separate messages (never in the final reply — see extractFinalText). Capped
  // at 3 per request and ~280 chars each; only the first line of a narration
  // block is used. The full monologue is never exposed (user decision
  // 2026-07-10 after a delivered reply included seven paragraphs of it).
  const emitInterim = makeInterimFilter(input.onInterim);
  // Watch the stream: when a tool block completes AFTER a text block, that text
  // was narration — surface it (filtered) while the run continues.
  const attachInterimWatcher = (stream: ReturnType<typeof client.messages.stream>): void => {
    let pendingNarration: string | null = null;
    stream.on("contentBlock", (block: unknown) => {
      const b = block as { type?: string; text?: string };
      if (b.type === "text") {
        pendingNarration = b.text ?? null;
        return;
      }
      // Emit only ahead of SERVER-SIDE work (MCP rounds, web search) — that's
      // when the user actually waits. Narration before a LOCAL tool_use is the
      // proposal preview / loop text and posting it would duplicate the card
      // (edge case from the 2026-07-10 disclosure stress-test). Thinking
      // blocks never carry narration out — only prior text is ever emitted.
      if (b.type === "mcp_tool_use" || b.type === "server_tool_use") {
        if (pendingNarration) emitInterim(pendingNarration);
      }
      pendingNarration = null;
    });
  };

  const callClaude = async (
    params: Record<string, unknown>,
  ): Promise<Anthropic.Message> => {
    if (mcpActive) {
      try {
        const stream = client.messages.stream(
          {
            ...params,
            ...NATIVE_DIALS,
            tools: toolsWithMcp,
            mcp_servers: mcpServers,
          } as unknown as Anthropic.MessageStreamParams,
          { headers: betaHeaders(true) },
        );
        attachInterimWatcher(stream);
        return await stream.finalMessage();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!/MCP server/i.test(msg)) throw err;
        mcpActive = false;
        console.error(
          `[agent] MCP attachment failed (servers: ${mcpServerNames.join(",")}) — retrying without MCP: ${msg.slice(0, 300)}`,
        );
      }
    }
    const stream = client.messages.stream(
      {
        ...params,
        ...NATIVE_DIALS,
        tools: toolsPlain,
      } as unknown as Anthropic.MessageStreamParams,
      { headers: betaHeaders(false) },
    );
    attachInterimWatcher(stream);
    return stream.finalMessage();
  };

  // ── Delegation (Phase 3): the orchestrator model stays on reasoning and
  // synthesis; mechanical lookups fan out to cheap, fast haiku subagents that
  // run IN PARALLEL with the MCP servers attached. Server-side MCP rounds cost
  // zero Worker subrequests, so each subagent is exactly ONE Anthropic call —
  // this is how "smart model delegates to cheaper models" fits the free tier.
  const SUBAGENT_SYSTEM =
    "You are a fast research subagent for the PLUS design team's assistant. Complete the ONE task you're given using the attached read tools (Notion, GitHub, Supabase, Slack). Output: compact bullet facts with links/IDs — no preamble, no narration, no recommendations. Explicitly flag anything you could NOT verify. If the task can't be done, say exactly what's missing in one line.";
  const runDelegateTasks = async (rawInput: Record<string, unknown>): Promise<string> => {
    if (!mcpActive) {
      return JSON.stringify({
        ok: false,
        error: "delegation unavailable right now (no data sources attached) — do the lookups yourself",
      });
    }
    const tasks = (Array.isArray(rawInput.tasks) ? rawInput.tasks : []).slice(0, 3) as Array<{
      goal?: unknown;
      context?: unknown;
    }>;
    if (tasks.length === 0) return JSON.stringify({ ok: false, error: "no tasks given" });
    const results = await Promise.all(
      tasks.map(async (t, i) => {
        const goal = typeof t.goal === "string" ? t.goal.trim() : "";
        const context = typeof t.context === "string" ? t.context.trim() : "";
        if (!goal) return { task: i, ok: false as const, error: "missing goal" };
        try {
          const msg = await client.messages
            .stream(
              {
                model: MODELS.haiku,
                max_tokens: 1200,
                system: SUBAGENT_SYSTEM,
                messages: [{ role: "user", content: context ? `${goal}\n\nContext:\n${context}` : goal }],
                tools: mcpToolsets,
                mcp_servers: mcpServers,
              } as unknown as Anthropic.MessageStreamParams,
              { headers: { "anthropic-beta": MCP_BETA } },
            )
            .finalMessage();
          addUsage(msg.usage);
          recordToolUses(msg.content);
          return { task: i, ok: true as const, result: extractFinalText(msg.content) || "(no result)" };
        } catch (err) {
          return { task: i, ok: false as const, error: err instanceof Error ? err.message.slice(0, 200) : String(err) };
        }
      }),
    );
    return JSON.stringify({ ok: true, results });
  };

  // D7: per-request turn/token telemetry. One structured line per request,
  // visible via `wrangler tail`, so cost + iteration economy is observable.
  const startedAt = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let cacheWriteTokens = 0;
  let iterations = 0;
  let toolCallsUsed = 0;
  // Usage monitoring: which tools people actually exercise per request. Local
  // tool_use + server_tool_use names in call order; MCP inline calls are a
  // simple count (mcp:N) since their names are server-namespaced.
  const toolNamesUsed: string[] = [];
  let mcpCallsUsed = 0;
  const recordToolUses = (content: Anthropic.ContentBlock[]): void => {
    for (const block of content) {
      const b = block as { type: string; name?: string };
      if (b.type === "tool_use" || b.type === "server_tool_use") {
        toolNamesUsed.push(b.name ?? "(unnamed)");
      } else if (b.type === "mcp_tool_use") {
        mcpCallsUsed++;
      }
    }
  };
  // Prompt-cache counters are nullable on the wire and absent from this SDK
  // version's Usage type (0.32 predates them) — cast and guard every read.
  const addUsage = (usage: Anthropic.Usage | undefined): void => {
    inputTokens += usage?.input_tokens ?? 0;
    outputTokens += usage?.output_tokens ?? 0;
    const cache = usage as
      | { cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }
      | undefined;
    cacheReadTokens += cache?.cache_read_input_tokens ?? 0;
    cacheWriteTokens += cache?.cache_creation_input_tokens ?? 0;
  };
  const finish = (result: AgentResult): AgentResult => {
    const toolsList = [...toolNamesUsed, ...(mcpCallsUsed > 0 ? [`mcp:${mcpCallsUsed}`] : [])];
    console.log(
      `[uno-bot] request done build=${BUILD} tier=${tier} route=${routeReason} model=${model} iterations=${iterations} ` +
        `tokens_in=${inputTokens} tokens_out=${outputTokens} ` +
        `cache_read=${cacheReadTokens} cache_write=${cacheWriteTokens} ms=${Date.now() - startedAt} ` +
        `tools=[${toolsList.join(",")}] ` +
        `mcp=${mcpServerNames.length === 0 ? "off" : mcpActive ? mcpServerNames.join("+") : "FELL_BACK"} ` +
        `outcome=${result.kind}`,
    );
    return result;
  };

  const pendingForSystem = pending
    ? { toolName: pending.toolName, input: pending.input, requesterUserId: pending.requesterUserId }
    : null;
  const systemBlocks = await buildSystemBlocks(env, pendingForSystem, currentSender);

  const messages = buildMessages(history, userText, images);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const response = await callClaude({
      model,
      max_tokens: MAX_TOKENS,
      system: systemBlocks as Anthropic.TextBlockParam[],
      messages,
    });

    iterations++;
    addUsage(response.usage);
    recordToolUses(response.content);

    if (response.stop_reason === "end_turn" || response.stop_reason === "stop_sequence") {
      return finish({ kind: "text", text: extractFinalText(response.content) || "(empty response)" });
    }

    if (response.stop_reason === "tool_use") {
      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      // (a) Resolve a pending proposal. Worker enforces requester authorization
      // here even though the system prompt already tells Claude — defense in depth.
      const resolveCall = toolUses.find((tu) => tu.name === "proposal_resolve");
      if (resolveCall) {
        const verdict = validateProposalResolve(
          resolveCall.input as { decision?: unknown; message_to_user?: unknown },
          pending,
          currentSender.userId,
        );
        if (!verdict.ok) {
          // Reject: feed back an error result — but ALSO satisfy every OTHER
          // tool_use in the same assistant turn, or the next call 400s on an
          // orphaned tool_use (review 2026-07-12). The extras get a "deferred"
          // stub since we're not executing them on a rejected resolve.
          messages.push({ role: "assistant", content: response.content });
          messages.push({
            role: "user",
            content: toolUses.map((tu): Anthropic.ToolResultBlockParam =>
              tu.id === resolveCall.id
                ? {
                    type: "tool_result",
                    tool_use_id: tu.id,
                    content: JSON.stringify({ ok: false, error: verdict.error }),
                    is_error: true,
                  }
                : {
                    type: "tool_result",
                    tool_use_id: tu.id,
                    content: JSON.stringify({ ok: false, error: "deferred — resolve the pending proposal first" }),
                  },
            ),
          });
          continue;
        }
        return finish({
          kind: "resolved",
          decision: verdict.decision,
          pending: pending!,
          messageToUser: verdict.messageToUser,
        });
      }

      // (b) Side-effect tool: stage as a proposal.
      //
      // TODO: if Claude emitted read-only tool_use blocks alongside the
      // side-effect, on resume we'd need tool_results for ALL of them. Rare
      // in practice; leaving as TODO until it surfaces.
      const sideEffect = toolUses.find((tu) => SIDE_EFFECT_TOOLS.has(tu.name as never));
      if (sideEffect) {
        const previewText = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return finish({
          kind: "proposal",
          toolName: sideEffect.name,
          input: (sideEffect.input as Record<string, unknown>) ?? {},
          previewText: previewText || undefined,
        });
      }

      // (c) Read-only tools only: execute and feed results back (within budget).
      messages.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        if (toolCallsUsed >= READONLY_TOOL_BUDGET) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify({
              ok: false,
              error: "no more lookups available this turn",
              note: BUDGET_EXHAUSTED_LOOKUP_NOTE,
            }),
          });
          continue;
        }
        toolCallsUsed++;
        const resultText =
          tu.name === "delegate"
            ? await runDelegateTasks(tu.input as Record<string, unknown>)
            : await executeReadOnlyTool(env, tu.name, tu.input as Record<string, unknown>, slack);
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: resultText });
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    return finish({ kind: "text", text: `(internal: unexpected stop_reason: ${response.stop_reason})` });
  }

  // Iteration budget exhausted — the model kept calling read-only tools (usually
  // several grounding searches) without ever synthesizing. Rather than surfacing
  // an internal error, make one final pass with tool_choice "none" so it must
  // answer from the tool results it already gathered. NOTE: `tools` must still
  // be passed — the API rejects messages containing tool_use/tool_result blocks
  // when no tools are defined, so omitting it here would 400 on exactly the
  // multi-search requests this fallback exists for. (The `as` cast is because
  // this SDK version's types predate tool_choice "none"; the API accepts it.)
  messages.push({ role: "user", content: BUDGET_EXHAUSTED_SYNTHESIS });
  const finalResponse = await callClaude({
    model,
    max_tokens: MAX_TOKENS,
    system: systemBlocks as Anthropic.TextBlockParam[],
    tool_choice: { type: "none" } as unknown as Anthropic.MessageCreateParams["tool_choice"],
    messages,
  });
  iterations++;
  addUsage(finalResponse.usage);
  recordToolUses(finalResponse.content);
  const finalText = extractFinalText(finalResponse.content);
  return finish({ kind: "text", text: finalText || CLARIFY_FALLBACK });
}

/**
 * The user-facing reply is ONLY the text after the last tool block. With MCP
 * attached, one response interleaves narration and server-side tool rounds —
 * `[text, mcp_tool_use, mcp_tool_result, text, …, final text]` — and joining
 * every text block delivered the model's entire working monologue as the reply
 * (live 2026-07-10: seven paragraphs of "Let me try…" before the answer).
 * Narration reaches the user separately, filtered, via the interim watcher.
 * Falls back to the all-text join when there are no tool blocks or nothing
 * follows the last one.
 */
function extractFinalText(content: Anthropic.ContentBlock[]): string {
  let lastToolIdx = -1;
  content.forEach((b, i) => {
    if (b.type !== "text") lastToolIdx = i;
  });
  const afterLastTool = content
    .slice(lastToolIdx + 1)
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (afterLastTool) return afterLastTool;
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/**
 * Build the Claude messages array from stored history + the current turn.
 * History appends (e.g. tool outcomes recorded by resolveProposal) can produce
 * consecutive same-role turns, which the Anthropic API rejects — so merge
 * consecutive same-role turns and drop any leading assistant turns (the first
 * message must be from the user).
 *
 * Vision: when `images` are present, the CURRENT user turn is emitted as
 * content blocks — image blocks first, then the text block — so the model can
 * see pasted screenshots / rendered Figma frames. History turns stay plain
 * text (base64 is never persisted; events.ts stores text markers instead).
 */
function buildMessages(
  history: HistoryTurn[],
  userText: string,
  images?: AgentImage[],
): Anthropic.MessageParam[] {
  const raw: { role: "user" | "assistant"; content: string }[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userText },
  ];
  const merged: { role: "user" | "assistant"; content: string }[] = [];
  for (const turn of raw) {
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role) {
      last.content = `${last.content}\n\n${turn.content}`;
    } else {
      merged.push({ role: turn.role, content: turn.content });
    }
  }
  while (merged.length > 0 && merged[0]!.role !== "user") merged.shift();
  const result = merged as Anthropic.MessageParam[];

  if (images && images.length > 0 && result.length > 0) {
    // The current turn is always the last user message (merging may have
    // folded history text into it — the images still belong to this turn).
    const lastTurn = result[result.length - 1]!;
    if (lastTurn.role === "user" && typeof lastTurn.content === "string") {
      lastTurn.content = [
        ...images.map(
          (img): Anthropic.ImageBlockParam => ({
            type: "image",
            source: {
              type: "base64",
              media_type: img.media_type as Anthropic.Base64ImageSource["media_type"],
              data: img.data,
            },
          }),
        ),
        { type: "text", text: lastTurn.content },
      ];
    }
  }
  return result;
}
