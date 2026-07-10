// One agentic Claude call against the user's current message.
//
// Inputs include the slack context, the current sender's identity, and any
// pending proposal in this thread. When a proposal is pending, Claude is told
// about it in the system prompt and can resolve it via the
// `resolve_pending_proposal` tool — that's how text confirmations like
// "go ahead" or "cancel" get processed.
//
// The loop:
//   1. Build messages = thread history + the current user turn.
//   2. Call Claude with system blocks + tools + messages.
//   3. Inspect stop_reason:
//      - end_turn → return the text.
//      - tool_use → check for:
//          (a) resolve_pending_proposal: validate, return as `resolved` if OK,
//              else loop with a tool_result error so Claude can apologize.
//          (b) a side-effect tool: return as `proposal` for staging.
//          (c) read-only tools: execute, feed results back, loop.
// A hard iteration cap prevents runaway loops.

import type Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../types";
import type { HistoryTurn, PendingProposal } from "../thread-state-client";
import { TOOLS } from "./tool-definitions";
import { SIDE_EFFECT_TOOLS } from "./types";
import { buildSystemBlocks } from "./skills";
import { makeAnthropicClient, pickModel } from "./anthropic-client";
import { buildMcp, MCP_BETA } from "./mcp";
import { executeNotionSearch } from "../tools/notion-search";
import { executeBlueprintSearch } from "../tools/blueprint-search";
import { executeReadSource } from "../tools/read-source";
import { executeGithubRead } from "../tools/github-read";
import { executeSlackThreadRead } from "../tools/slack-thread-read";
import { addReaction } from "../slack/api";
import type { SlackContext } from "../tools/dispatcher";
import { BUILD } from "../version";

export type { HistoryTurn };

/** A base64-encoded image attached to the CURRENT user turn (Slack paste or a
 *  rendered Figma frame). Never persisted to history — the Durable Object
 *  stores a text marker instead (see events.ts). */
export interface AgentImage {
  /** One of the Anthropic-supported image media types (jpeg/png/gif/webp). */
  media_type: string;
  /** Raw base64 (no data: prefix). */
  data: string;
}

export interface AgentInput {
  env: Env;
  userText: string;
  history: HistoryTurn[];
  slack: SlackContext;
  currentSender: { userId: string };
  pending: PendingProposal | null;
  /** Vision input for the current turn only. History turns stay plain text. */
  images?: AgentImage[];
}

export type AgentResult =
  | { kind: "text"; text: string }
  | {
      kind: "proposal";
      toolName: string;
      input: Record<string, unknown>;
      toolUseId: string;
      assistantContent: Anthropic.ContentBlock[];
      /** Brief structural preview Claude wrote alongside the tool_use, if any.
       *  The Worker combines this with its standardized proposal footer. */
      previewText?: string;
    }
  | {
      kind: "resolved";
      decision: "confirm" | "cancel";
      pending: PendingProposal;
      messageToUser?: string;
    };

// Raised from 5: grounding questions legitimately chain several read-only
// searches (e.g. blueprint_search across a multi-step flow) before the model
// has enough to answer. If this is still exhausted, we fall back to a final
// tools-disabled synthesis pass (below) rather than erroring out.
// dial raised 2026-07-09 — team prefers thorough over fast (user decision)
const MAX_ITERATIONS = 16;
// dial raised 2026-07-09 — team prefers thorough over fast (user decision):
// users prefer complete+right over fast; Slack's hard cap is 40k chars, and
// readability guidance (summary-first, thread the detail) still applies.
const MAX_TOKENS = 8192;
// Cap on individual read-only tool executions per request. Each execution costs
// Workers subrequests (a blueprint fallback search alone is ~4 fetches), and the
// free plan allows 50 per request — blowing it kills the request mid-flight so
// hard that even the error post fails ("reacted :eyes: then silence"). Past
// the cap the model is told to answer with what it has (and the iteration
// cap's tool_choice-none fallback backstops that).
// dial raised 2026-07-09 — team prefers thorough over fast (user decision).
// NOTE: 12 sits closer to the subrequest cliff than the old 6 (worst case
// ~4 fetches per blueprint fallback) — if "eyes then silence" recurs on
// search-heavy turns, this is the first dial to look at.
const READONLY_TOOL_BUDGET = 12;

export async function runAgent(input: AgentInput): Promise<AgentResult> {
  const { env, userText, history, currentSender, pending, images, slack } = input;
  const client = makeAnthropicClient(env);

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
  // MCP is closed to us). Basic 20250305 variant: works across all three model
  // tiers (haiku/sonnet/opus). ~$10 per 1k searches — max_uses caps per turn.
  const WEB_SEARCH_TOOL = {
    type: "web_search_20250305",
    name: "web_search",
    max_uses: 3,
  } as unknown as Anthropic.Tool;

  const toolsWithMcp = [
    ...(TOOLS as Anthropic.Tool[]),
    WEB_SEARCH_TOOL,
    ...(mcpToolsets as unknown as Anthropic.Tool[]),
  ];
  // Fallback tool set: everything EXCEPT the MCP toolsets (web_search is an
  // Anthropic server tool, independent of MCP — it stays).
  const toolsPlain = [...(TOOLS as Anthropic.Tool[]), WEB_SEARCH_TOOL];

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
  const callClaude = async (
    params: Record<string, unknown>,
  ): Promise<Anthropic.Message> => {
    if (mcpActive) {
      try {
        return await client.messages
          .stream(
            {
              ...params,
              tools: toolsWithMcp,
              mcp_servers: mcpServers,
            } as unknown as Anthropic.MessageStreamParams,
            { headers: { "anthropic-beta": MCP_BETA } },
          )
          .finalMessage();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!/MCP server/i.test(msg)) throw err;
        mcpActive = false;
        console.error(
          `[agent] MCP attachment failed (servers: ${mcpServerNames.join(",")}) — retrying without MCP: ${msg.slice(0, 300)}`,
        );
      }
    }
    return client.messages
      .stream({
        ...params,
        tools: toolsPlain,
      } as Anthropic.MessageStreamParams)
      .finalMessage();
  };

  // D2: pick the model tier from the message intent once per request.
  const { tier, model } = pickModel({ userText, hasPending: pending !== null });

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
      `[uno-bot] request done build=${BUILD} tier=${tier} model=${model} iterations=${iterations} ` +
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
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return finish({ kind: "text", text: text || "(empty response)" });
    }

    if (response.stop_reason === "tool_use") {
      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      // (a) Resolve a pending proposal. Worker enforces requester authorization
      // here even though the system prompt already tells Claude — defense in depth.
      const resolveCall = toolUses.find((tu) => tu.name === "proposal_resolve");
      if (resolveCall) {
        if (!pending) {
          messages.push({ role: "assistant", content: response.content });
          messages.push({
            role: "user",
            content: [{
              type: "tool_result",
              tool_use_id: resolveCall.id,
              content: JSON.stringify({
                ok: false,
                error: "no pending proposal in this thread — reply conversationally instead",
              }),
              is_error: true,
            }],
          });
          continue;
        }
        if (currentSender.userId !== pending.requesterUserId) {
          messages.push({ role: "assistant", content: response.content });
          messages.push({
            role: "user",
            content: [{
              type: "tool_result",
              tool_use_id: resolveCall.id,
              content: JSON.stringify({
                ok: false,
                error: `not authorized — only <@${pending.requesterUserId}> can resolve this proposal`,
              }),
              is_error: true,
            }],
          });
          continue;
        }
        const inp = (resolveCall.input ?? {}) as { decision?: "confirm" | "cancel"; message_to_user?: string };
        if (inp.decision !== "confirm" && inp.decision !== "cancel") {
          messages.push({ role: "assistant", content: response.content });
          messages.push({
            role: "user",
            content: [{
              type: "tool_result",
              tool_use_id: resolveCall.id,
              content: JSON.stringify({ ok: false, error: "decision must be 'confirm' or 'cancel'" }),
              is_error: true,
            }],
          });
          continue;
        }
        return finish({
          kind: "resolved",
          decision: inp.decision,
          pending,
          messageToUser: inp.message_to_user,
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
          toolUseId: sideEffect.id,
          assistantContent: response.content,
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
              error: "tool budget exhausted for this request",
              note: "Answer NOW from the tool results you already have. If they're insufficient, say exactly what's missing — do not fabricate.",
            }),
          });
          continue;
        }
        toolCallsUsed++;
        const resultText = await executeReadOnlyTool(env, tu.name, tu.input as Record<string, unknown>, slack);
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
  messages.push({
    role: "user",
    content:
      "(system: tool budget exhausted — answer the original question NOW from the tool results above; do not request more tools. If the results are insufficient, say what's missing.)",
  });
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
  const finalText = finalResponse.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return finish({
    kind: "text",
    text:
      finalText ||
      "I pulled up a lot of context but couldn't wrap it into a clean answer — can you narrow the question a little?",
  });
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

async function executeReadOnlyTool(
  env: Env,
  name: string,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  if (name === "notion_search") return executeNotionSearch(env, input);
  if (name === "blueprint_search") return executeBlueprintSearch(env, input);
  if (name === "source_read") return executeReadSource(env, input);
  if (name === "github_read") return executeGithubRead(env, input);
  if (name === "slack_thread_read") return executeSlackThreadRead(env, input);
  if (name === "slack_react") return executeSlackReact(env, input, slack);
  return JSON.stringify({ ok: false, error: `tool '${name}' is not read-only or not implemented` });
}

// Reactions post AS UNO-BOT via the bot token — the Slack MCP was demoted to
// reads-only because its user-token writes carried the consenting human's
// identity (team decision 2026-07-10: everything visible is uno-bot). Ungated:
// reactions are reversible, the same class as the bot's own replies.
async function executeSlackReact(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const emoji = typeof input.emoji === "string" ? input.emoji.replace(/:/g, "").trim() : "";
  if (!emoji) return JSON.stringify({ ok: false, error: "missing emoji name" });
  if (emoji === "white_check_mark" || emoji === "x") {
    return JSON.stringify({
      ok: false,
      error: "white_check_mark and x are reserved for the requester's confirm/cancel on proposal cards",
    });
  }
  const ts = typeof input.message_ts === "string" && input.message_ts ? input.message_ts : slack.userMsgTs;
  try {
    await addReaction(env, slack.channel, ts, emoji);
    return JSON.stringify({ ok: true, reacted: emoji, message_ts: ts });
  } catch (err) {
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
