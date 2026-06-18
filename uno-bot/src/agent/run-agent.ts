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
import { makeAnthropicClient, MODEL } from "./anthropic-client";
import { executeMarketplaceSearch } from "../tools/marketplace-search";
import { executeFindExperts } from "../tools/find-experts";
import type { SlackContext } from "../tools/dispatcher";

export type { HistoryTurn };

export interface AgentInput {
  env: Env;
  userText: string;
  history: HistoryTurn[];
  slack: SlackContext;
  currentSender: { userId: string };
  pending: PendingProposal | null;
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

const MAX_ITERATIONS = 5;
const MAX_TOKENS = 2048;

export async function runAgent(input: AgentInput): Promise<AgentResult> {
  const { env, userText, history, currentSender, pending } = input;
  const client = makeAnthropicClient(env);

  const pendingForSystem = pending
    ? { toolName: pending.toolName, input: pending.input, requesterUserId: pending.requesterUserId }
    : null;
  const systemBlocks = await buildSystemBlocks(env, pendingForSystem, currentSender);

  const messages = buildMessages(history, userText);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemBlocks as Anthropic.TextBlockParam[],
      tools: TOOLS as Anthropic.Tool[],
      messages,
    });

    if (response.stop_reason === "end_turn" || response.stop_reason === "stop_sequence") {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { kind: "text", text: text || "(empty response)" };
    }

    if (response.stop_reason === "tool_use") {
      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      // (a) Resolve a pending proposal. Worker enforces requester authorization
      // here even though the system prompt already tells Claude — defense in depth.
      const resolveCall = toolUses.find((tu) => tu.name === "resolve_pending_proposal");
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
        return {
          kind: "resolved",
          decision: inp.decision,
          pending,
          messageToUser: inp.message_to_user,
        };
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
        return {
          kind: "proposal",
          toolName: sideEffect.name,
          input: (sideEffect.input as Record<string, unknown>) ?? {},
          toolUseId: sideEffect.id,
          assistantContent: response.content,
          previewText: previewText || undefined,
        };
      }

      // (c) Read-only tools only: execute and feed results back.
      messages.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        const resultText = await executeReadOnlyTool(env, tu.name, tu.input as Record<string, unknown>);
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: resultText });
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    return { kind: "text", text: `(internal: unexpected stop_reason: ${response.stop_reason})` };
  }

  return { kind: "text", text: "(internal: agent loop exceeded max iterations)" };
}

/**
 * Build the Claude messages array from stored history + the current turn.
 * History appends (e.g. tool outcomes recorded by resolveProposal) can produce
 * consecutive same-role turns, which the Anthropic API rejects — so merge
 * consecutive same-role turns and drop any leading assistant turns (the first
 * message must be from the user).
 */
function buildMessages(history: HistoryTurn[], userText: string): Anthropic.MessageParam[] {
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
  return merged as Anthropic.MessageParam[];
}

async function executeReadOnlyTool(
  env: Env,
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  if (name === "marketplace_search") return executeMarketplaceSearch(env, input);
  if (name === "find_experts") return executeFindExperts(env, input);
  return JSON.stringify({ ok: false, error: `tool '${name}' is not read-only or not implemented` });
}
