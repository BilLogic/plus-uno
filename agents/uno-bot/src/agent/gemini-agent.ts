// Gemini-mode agent loop — the provider adapter's phase-2 execution path,
// activated by MODEL_PROVIDER="gemini" (switched when the Anthropic budget ran
// out, 2026-07-10). Same AgentInput/AgentResult contract as the Anthropic loop
// in run-agent.ts, so events.ts and the proposal gate are provider-blind.
//
// Differences from the Anthropic loop, by design:
//   - NO server-side MCP (Gemini plain models have none) — the bot runs on its
//     LOCAL tools (roadmap_query, blueprint_search, notion_search, source_read,
//     github_read, slack_*). Each call costs Worker subrequests, which is why
//     roadmap_query (1-2 subrequests, complete answers) matters here.
//   - Client-side function-calling loop: every tool round is its own SHORT
//     HTTP call, so non-streaming generateContent is safe (the 524 edge-kill
//     only bit long single requests with server-side rounds inside).
//   - Thought signatures: Gemini 3 attaches thoughtSignature to parts in
//     function-calling turns and requires them echoed back — we append the
//     model's parts VERBATIM to the running contents, which preserves them.
//   - No advisor / delegate / Anthropic web_search in this mode.

import type Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../types";
import { TOOLS } from "./tool-definitions";
import { SIDE_EFFECT_TOOLS } from "./types";
import { buildSystemBlocks } from "./skills";
import { routeRequest } from "./anthropic-client";
import { geminiGenerateRaw } from "../gemini/client";
import { BUILD } from "../version";
import {
  executeReadOnlyTool,
  type AgentInput,
  type AgentResult,
  type AgentImage,
} from "./run-agent";
import type { HistoryTurn } from "../thread-state-client";

const MAX_ITERATIONS = 16;
const MAX_TOKENS = 16384;
const READONLY_TOOL_BUDGET = 12;

// ── Gemini wire types (the subset we touch) ─────────────────────────────────

interface GeminiPart {
  text?: string;
  thought?: boolean;
  thoughtSignature?: string;
  functionCall?: { name?: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
  inlineData?: { mimeType: string; data: string };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponseData {
  candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: string }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  error?: { code?: number; message?: string };
}

// ── Tool schema conversion ───────────────────────────────────────────────────

// Gemini's function-declaration schema is an OpenAPI subset — it rejects JSON
// Schema keys like additionalProperties/$schema. Strip them recursively.
function cleanSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(cleanSchema);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === "additionalProperties" || k === "$schema") continue;
      out[k] = cleanSchema(v);
    }
    return out;
  }
  return node;
}

function geminiFunctionDeclarations(): Array<Record<string, unknown>> {
  return (TOOLS as Array<{ name: string; description: string; input_schema: unknown }>)
    .filter((t) => t.name !== "delegate") // Anthropic-subagent tool; no Gemini analog yet
    .map((t) => ({
      name: t.name,
      description: t.description,
      parameters: cleanSchema(t.input_schema),
    }));
}

// ── Content building ─────────────────────────────────────────────────────────

function buildContents(
  history: HistoryTurn[],
  userText: string,
  images?: AgentImage[],
): GeminiContent[] {
  const contents: GeminiContent[] = history.map((t) => ({
    role: t.role === "assistant" ? "model" : "user",
    parts: [{ text: t.content }],
  }));
  const currentParts: GeminiPart[] = [
    ...(images ?? []).map((img) => ({
      inlineData: { mimeType: img.media_type, data: img.data },
    })),
    { text: userText },
  ];
  contents.push({ role: "user", parts: currentParts });
  return contents;
}

function textOf(parts: GeminiPart[]): string {
  return parts
    .filter((p) => typeof p.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("\n")
    .trim();
}

// ── The loop ─────────────────────────────────────────────────────────────────

export async function runGeminiAgent(input: AgentInput): Promise<AgentResult> {
  const { env, userText, history, currentSender, pending, images, slack } = input;

  // Same three lanes as the Anthropic path; Gemini expresses the lane through
  // thinkingLevel on ONE model rather than a model swap (the 2.5-lite tier
  // predates thinkingLevel, so a cheaper fast-lane model would need different
  // dials — one model keeps this simple and cache-friendly).
  const { tier, reason: routeReason } = routeRequest({ userText, hasPending: pending !== null });
  const model = env.GEMINI_MODEL ?? "gemini-3.5-flash";
  const thinkingLevel = tier === "haiku" ? "minimal" : "high";

  const startedAt = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let thinkingTokens = 0;
  let iterations = 0;
  let toolCallsUsed = 0;
  const toolNamesUsed: string[] = [];

  const finish = (result: AgentResult): AgentResult => {
    console.log(
      `[uno-bot] request done build=${BUILD} provider=gemini tier=${tier} route=${routeReason} model=${model} ` +
        `iterations=${iterations} tokens_in=${inputTokens} tokens_out=${outputTokens} thinking=${thinkingTokens} ` +
        `ms=${Date.now() - startedAt} tools=[${toolNamesUsed.join(",")}] mcp=off outcome=${result.kind}`,
    );
    return result;
  };

  // Interim narration: text emitted in the same response as function calls is
  // the model narrating upcoming work — same caps/filters as the Anthropic path.
  let interimSent = 0;
  const emitInterim = (raw: string): void => {
    if (!input.onInterim || interimSent >= 3) return;
    const line = raw.trim().split("\n")[0]?.trim() ?? "";
    if (line.length < 15) return;
    interimSent++;
    input.onInterim(line.length > 280 ? `${line.slice(0, 277)}…` : line);
  };

  const pendingForSystem = pending
    ? { toolName: pending.toolName, input: pending.input, requesterUserId: pending.requesterUserId }
    : null;
  const systemBlocks = await buildSystemBlocks(env, pendingForSystem, currentSender);
  const systemText = (systemBlocks as Array<{ text?: string }>)
    .map((b) => b.text ?? "")
    .join("\n\n");

  const functionDeclarations = geminiFunctionDeclarations();
  const contents = buildContents(history, userText, images);

  const callGemini = async (disableTools: boolean): Promise<GeminiPart[]> => {
    const body: Record<string, unknown> = {
      contents,
      systemInstruction: { parts: [{ text: systemText }] },
      // google_search = Gemini's built-in web grounding, running on Google's
      // infra (zero Worker subrequests) — the web_search replacement in this
      // mode (user directive 2026-07-10: "we definitely must incorporate").
      // Gemini 3 supports mixing built-in tools with function declarations.
      tools: [{ functionDeclarations }, { googleSearch: {} }],
      ...(disableTools
        ? { toolConfig: { functionCallingConfig: { mode: "NONE" } } }
        : {}),
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        thinkingConfig: { thinkingLevel },
      },
    };
    const { status, data } = await geminiGenerateRaw(env, model, body);
    const parsed = data as GeminiResponseData;
    if (status !== 200) {
      throw new Error(`Gemini ${status}: ${parsed.error?.message ?? "generateContent failed"}`.slice(0, 400));
    }
    iterations++;
    inputTokens += parsed.usageMetadata?.promptTokenCount ?? 0;
    outputTokens += parsed.usageMetadata?.candidatesTokenCount ?? 0;
    thinkingTokens += parsed.usageMetadata?.thoughtsTokenCount ?? 0;
    return parsed.candidates?.[0]?.content?.parts ?? [];
  };

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const parts = await callGemini(false);
    const functionCalls = parts.filter((p) => p.functionCall?.name);

    if (functionCalls.length === 0) {
      return finish({ kind: "text", text: textOf(parts) || "(empty response)" });
    }

    for (const fc of functionCalls) toolNamesUsed.push(fc.functionCall!.name!);
    const narration = textOf(parts);
    // Only narrate ahead of read-only work — proposal previews are delivered
    // via the proposal card, and narrating them would duplicate it.
    const anySideEffect = functionCalls.some(
      (fc) => SIDE_EFFECT_TOOLS.has(fc.functionCall!.name! as never) || fc.functionCall!.name === "proposal_resolve",
    );
    if (narration && !anySideEffect) emitInterim(narration);

    // (a) Pending-proposal resolution — same authorization enforcement as the
    // Anthropic path (Worker-side, defense in depth).
    const resolveCall = functionCalls.find((fc) => fc.functionCall!.name === "proposal_resolve");
    if (resolveCall) {
      const args = (resolveCall.functionCall!.args ?? {}) as {
        decision?: "confirm" | "cancel";
        message_to_user?: string;
      };
      let error: string | null = null;
      if (!pending) error = "no pending proposal in this thread — reply conversationally instead";
      else if (currentSender.userId !== pending.requesterUserId) {
        error = `not authorized — only <@${pending.requesterUserId}> can resolve this proposal`;
      } else if (args.decision !== "confirm" && args.decision !== "cancel") {
        error = "decision must be 'confirm' or 'cancel'";
      }
      if (error) {
        contents.push({ role: "model", parts });
        contents.push({
          role: "user",
          parts: [{
            functionResponse: {
              name: "proposal_resolve",
              response: { ok: false, error },
            },
          }],
        });
        continue;
      }
      return finish({
        kind: "resolved",
        decision: args.decision!,
        pending: pending!,
        messageToUser: args.message_to_user,
      });
    }

    // (b) Side-effect tool → stage as a ✅-gated proposal.
    const sideEffect = functionCalls.find((fc) => SIDE_EFFECT_TOOLS.has(fc.functionCall!.name! as never));
    if (sideEffect) {
      return finish({
        kind: "proposal",
        toolName: sideEffect.functionCall!.name!,
        input: (sideEffect.functionCall!.args ?? {}) as Record<string, unknown>,
        toolUseId: `gemini-${startedAt}-${iter}`,
        // The proposal record stores this as unknown[]; Gemini parts serialize
        // fine and nothing Anthropic-specific reads them back in gemini mode.
        assistantContent: parts as unknown as Anthropic.ContentBlock[],
        previewText: narration || undefined,
      });
    }

    // (c) Read-only tools: execute, append the model turn VERBATIM (preserves
    // thoughtSignature) plus one user turn with all function responses.
    contents.push({ role: "model", parts });
    const responseParts: GeminiPart[] = [];
    for (const fc of functionCalls) {
      const name = fc.functionCall!.name!;
      const args = (fc.functionCall!.args ?? {}) as Record<string, unknown>;
      let resultText: string;
      if (toolCallsUsed >= READONLY_TOOL_BUDGET) {
        resultText = JSON.stringify({
          ok: false,
          error: "tool budget exhausted for this request",
          note: "Answer NOW from the tool results you already have. If they're insufficient, say exactly what's missing — do not fabricate.",
        });
      } else {
        toolCallsUsed++;
        resultText = await executeReadOnlyTool(env, name, args, slack);
      }
      responseParts.push({ functionResponse: { name, response: { result: resultText } } });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  // Iteration budget exhausted — force a synthesis pass with function calling
  // disabled (toolConfig NONE keeps the declarations, which Gemini requires
  // when the history contains function turns).
  contents.push({
    role: "user",
    parts: [{
      text: "(system: tool budget exhausted — answer the original question NOW from the tool results above; do not request more tools. If the results are insufficient, say what's missing.)",
    }],
  });
  const finalParts = await callGemini(true);
  return finish({
    kind: "text",
    text:
      textOf(finalParts) ||
      "I pulled up a lot of context but couldn't wrap it into a clean answer — can you narrow the question a little?",
  });
}
