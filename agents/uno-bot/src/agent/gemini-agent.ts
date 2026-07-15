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

import type { Env } from "../types";
import { TOOLS } from "./tool-definitions";
import { SIDE_EFFECT_TOOLS } from "./types";
import { buildSystemBlocks } from "./skills";
import { routeRequest } from "./routing";
import { geminiGenerateRaw } from "../gemini/client";
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
  // flash-lite is the minimal-thinking tier — it doesn't take the higher
  // thinking_level dials the full flash/pro models do.
  const isLite = model.includes("flash-lite");
  const thinkingLevel = isLite || tier === "haiku" ? "minimal" : "high";

  const startedAt = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let thinkingTokens = 0;
  let iterations = 0;
  let toolCallsUsed = 0;
  // Weighted grounding cost (estimated subrequests spent on lookups this turn).
  // The real guard behind the READONLY_TOOL_BUDGET count backstop — see
  // GROUNDING_BUDGET (free-tier 50-subrequest cap; live incident 2026-07-13).
  let groundingCostUsed = 0;
  const toolNamesUsed: string[] = [];

  const finish = (result: AgentResult): AgentResult => {
    // Weighted-budget telemetry for later calibration of the estimates/reserve.
    console.log(
      `[budget] grounding est: ${groundingCostUsed}/${GROUNDING_BUDGET} subrequests, ${toolCallsUsed} tools`,
    );
    console.log(
      `[uno-bot] request done build=${BUILD} provider=gemini tier=${tier} route=${routeReason} model=${model} ` +
        `iterations=${iterations} tokens_in=${inputTokens} tokens_out=${outputTokens} thinking=${thinkingTokens} ` +
        `ms=${Date.now() - startedAt} tools=[${toolNamesUsed.join(",")}] mcp=off outcome=${result.kind}`,
    );
    return result;
  };

  // Interim narration: text emitted in the same response as function calls is
  // the model narrating upcoming work — same caps/filters as the Anthropic path.
  const emitInterim = makeInterimFilter(input.onInterim);

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
      // Built-in tools run on Google's infra (zero Worker subrequests) and mix
      // with function declarations on Gemini 3:
      //   googleSearch — web grounding (the web_search replacement here;
      //     user directive 2026-07-10: "we definitely must incorporate").
      //   urlContext  — server-side URL fetching, complements source_read
      //     for public web links at zero subrequest cost.
      tools: [{ functionDeclarations }, { googleSearch: {} }, { urlContext: {} }],
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
      const verdict = validateProposalResolve(
        resolveCall.functionCall!.args as { decision?: unknown; message_to_user?: unknown },
        pending,
        currentSender.userId,
      );
      if (!verdict.ok) {
        // Reject: answer the resolve call AND every other function call in this
        // turn, so no call is left without a response (same discipline as the
        // Anthropic path; review 2026-07-12).
        contents.push({ role: "model", parts });
        contents.push({
          role: "user",
          parts: functionCalls.map((fc): GeminiPart => {
            const name = fc.functionCall!.name!;
            return name === "proposal_resolve"
              ? { functionResponse: { name, response: { ok: false, error: verdict.error } } }
              : { functionResponse: { name, response: { ok: false, error: "deferred — resolve the pending proposal first" } } };
          }),
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

    // (b) Side-effect tool → stage as a ✅-gated proposal.
    const sideEffect = functionCalls.find((fc) => SIDE_EFFECT_TOOLS.has(fc.functionCall!.name! as never));
    if (sideEffect) {
      return finish({
        kind: "proposal",
        toolName: sideEffect.functionCall!.name!,
        input: (sideEffect.functionCall!.args ?? {}) as Record<string, unknown>,
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
      // Fire when EITHER the weighted subrequest budget (checked BEFORE the
      // call, using its projected cost) or the count backstop is hit. Gate
      // applies to LOOKUPS only — side-effect tools were already peeled off
      // above and stay allowed even when the lookup budget is spent.
      if (
        toolCallsUsed >= READONLY_TOOL_BUDGET ||
        groundingCostUsed + readOnlyToolCost(name) > GROUNDING_BUDGET
      ) {
        resultText = JSON.stringify({
          ok: false,
          error: "no more lookups available this turn",
          note: BUDGET_EXHAUSTED_LOOKUP_NOTE,
        });
      } else {
        toolCallsUsed++;
        groundingCostUsed += readOnlyToolCost(name);
        resultText = await executeReadOnlyTool(env, name, args, slack);
      }
      responseParts.push({ functionResponse: { name, response: { result: resultText } } });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  // Iteration budget exhausted — force a synthesis pass with function calling
  // disabled (toolConfig NONE keeps the declarations, which Gemini requires
  // when the history contains function turns).
  contents.push({ role: "user", parts: [{ text: BUDGET_EXHAUSTED_SYNTHESIS }] });
  const finalParts = await callGemini(true);
  return finish({ kind: "text", text: textOf(finalParts) || CLARIFY_FALLBACK });
}
