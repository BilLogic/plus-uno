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
import { ensureHarnessCache } from "../gemini/cache";
import { BUILD } from "../version";
import { subrequestsUsed, meterBreakdown, withSubrequestLimit, isSubrequestBudgetError, subrequestBudgetTrips } from "../net";
import {
  MAX_ITERATIONS,
  MAX_TOKENS,
  READONLY_TOOL_BUDGET,
  LOOKUP_CEILING,
  SUBREQUEST_CAP,
  outOfIterationBudget,
  BUDGET_EXHAUSTED_LOOKUP_NOTE,
  markPartialLookup,
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
    /** Prefix served from Gemini implicit caching, when it applies. */
    cachedContentTokenCount?: number;
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
  const { env, userText, history, currentSender, pending, images, slack, assistantContext } = input;

  // Same three lanes as the Anthropic path; Gemini expresses the lane through
  // thinkingLevel on ONE model rather than a model swap (the 2.5-lite tier
  // predates thinkingLevel, so a cheaper fast-lane model would need different
  // dials — one model keeps this simple and cache-friendly).
  const { tier, reason: routeReason } = routeRequest({ userText, hasPending: pending !== null });

  // All model-generation-specific dials, derived together so a mid-turn model
  // fallback (below) recomputes them consistently:
  //   • thinkingLevel — flash-lite is the minimal-thinking tier; it doesn't
  //     take the higher thinking_level dials the full flash/pro models do.
  //   • supportsThinkingLevel — thinking_level is a Gemini 3.x dial; 2.5-gen
  //     models 400 on it ("not supported by this model", probed live 2026-07-16
  //     during the quota incident on the gemini-2.5-pro bridge).
  //   • builtinSearchTools — Gemini 2.x REJECTS mixing local function
  //     declarations with built-in search tools ("Multiple tools are supported
  //     only when they are all search tools", 400, probed live 2026-07-16).
  //     The bot's LOCAL tools are load-bearing (all grounding runs through
  //     them); googleSearch/urlContext are a nice-to-have, so on 2.x we keep
  //     the function tools and drop the built-ins.
  const modelDials = (m: string) => {
    const isGemini3 = /^gemini-3/.test(m);
    return {
      thinkingLevel: (m.includes("flash-lite") || tier === "haiku" ? "minimal" : "high") as string,
      supportsThinkingLevel: isGemini3,
      builtinSearchTools: isGemini3 ? [{ googleSearch: {} }, { urlContext: {} }] : [],
    };
  };
  let model = env.GEMINI_MODEL ?? "gemini-3.6-flash";
  let { thinkingLevel, supportsThinkingLevel, builtinSearchTools } = modelDials(model);

  // Backup-model failover (2026-07-16 quota incident — flash quota exhausted,
  // every turn 429'd, bot down in Slack for an afternoon). When the active
  // model fails with a capacity/availability status, the turn switches to
  // GEMINI_FALLBACK_MODEL once and continues there — degraded (pricier/slower)
  // beats down. If the backup also fails, the error propagates and the
  // capacity alerting in slack/delivery.ts takes over as before.
  const FALLBACK_STATUSES = new Set([404, 429, 500, 503]);
  const fallbackModel = env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-pro";
  let fellBack = false;

  const startedAt = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let thinkingTokens = 0;
  // Gemini has no cache_control: buildSystemBlocks sets a 1h cache directive that
  // only the Anthropic lane honours, and this lane flattens the blocks to a
  // string. The ~40k-token harness therefore rides on every iteration of every
  // turn. Google MAY discount it via implicit caching (the harness is the stable
  // leading prefix), so measure rather than assume: this counter is what says
  // whether an explicit cachedContent is worth building.
  let cachedTokens = 0;
  let iterations = 0;
  let toolCallsUsed = 0;
  const toolNamesUsed: string[] = [];

  const finish = (result: AgentResult): AgentResult => {
    // Measured spend, per host — how close the turn came to the cap, instead of
    // finding out by way of a silent mid-turn death.
    console.log(
      `[budget] ${subrequestsUsed()}/${SUBREQUEST_CAP} subrequests spent (lookup ceiling ${LOOKUP_CEILING}), ` +
        `${toolCallsUsed} tools, ${subrequestBudgetTrips()} budget stops | ${meterBreakdown()}`,
    );
    console.log(
      `[uno-bot] request done build=${BUILD} provider=gemini tier=${tier} route=${routeReason} model=${model} ` +
        `fallback=${fellBack ? "yes" : "no"} ` +
        `iterations=${iterations} tokens_in=${inputTokens} tokens_out=${outputTokens} thinking=${thinkingTokens} ` +
        `cached_in=${cachedTokens} ` +
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
  const systemBlocks = (await buildSystemBlocks(
    env,
    pendingForSystem,
    currentSender,
    assistantContext,
  )) as Array<{ text?: string }>;
  // Block 0 is the harness — identical for every request on this build, which is
  // exactly what a cache wants. Blocks 1+ are per-request (who sent this, what
  // proposal is pending) and change every turn, so they must stay OUT of the
  // cached bytes or nothing would ever hit.
  const stableSystem = systemBlocks[0]?.text ?? "";
  const perRequestSystem = systemBlocks
    .slice(1)
    .map((b) => b.text ?? "")
    .filter(Boolean)
    .join("\n\n");

  // Vertex serves the harness from a cachedContents resource when the
  // deployment is on a regional endpoint; otherwise this is null and the prompt
  // goes inline exactly as before (see gemini/cache.ts for every fallback).
  const harnessCache = await ensureHarnessCache(env, model, stableSystem);
  if (harnessCache.name === null && harnessCache.reason) {
    console.log(`[gemini-cache] inline system prompt — ${harnessCache.reason}`);
  }

  const functionDeclarations = geminiFunctionDeclarations();
  const contents = buildContents(history, userText, images);
  // A request that references cachedContent may NOT also set systemInstruction —
  // Vertex rejects the pair. The per-request context therefore rides as a
  // leading user turn instead; it is the same text, one role over.
  if (harnessCache.name && perRequestSystem) {
    contents.unshift({ role: "user", parts: [{ text: perRequestSystem }] });
  }

  const callGemini = async (disableTools: boolean): Promise<GeminiPart[]> => {
    const body: Record<string, unknown> = {
      contents,
      ...(harnessCache.name
        ? { cachedContent: harnessCache.name }
        : { systemInstruction: { parts: [{ text: [stableSystem, perRequestSystem].filter(Boolean).join("\n\n") }] } }),
      // Built-in tools (googleSearch web grounding + urlContext server-side URL
      // fetch) run on Google's infra at zero Worker subrequests and mix with
      // function declarations ONLY on Gemini 3 — see builtinSearchTools above;
      // on 2.x they're dropped so the request doesn't 400.
      tools: [{ functionDeclarations }, ...builtinSearchTools],
      ...(disableTools
        ? { toolConfig: { functionCallingConfig: { mode: "NONE" } } }
        : {}),
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        ...(supportsThinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
      },
    };
    const { status, data } = await geminiGenerateRaw(env, model, body);
    const parsed = data as GeminiResponseData;
    if (status !== 200) {
      // One-shot failover to the backup model on capacity/availability
      // failures — mid-turn is fine, the conversation contents are
      // model-agnostic. Dials recompute for the new model's generation.
      if (!fellBack && FALLBACK_STATUSES.has(status) && fallbackModel && fallbackModel !== model) {
        fellBack = true;
        console.warn(
          `[gemini] ${model} failed (${status}: ${parsed.error?.message ?? "?"}) — ` +
            `falling back to ${fallbackModel} for the rest of this turn`,
        );
        model = fallbackModel;
        ({ thinkingLevel, supportsThinkingLevel, builtinSearchTools } = modelDials(model));
        // A cachedContents resource is bound to the model that created it, so
        // the backup model cannot reference it — carrying the name over would
        // turn a recoverable capacity failure into a hard 400. Inline for the
        // rest of the turn; the next turn re-caches under the model in use.
        if (harnessCache.name) {
          console.log(`[gemini-cache] dropped for the fallback model — inlining the system prompt`);
          // Self-describing removal: only shift if index 0 IS the prepended
          // per-request turn. A future leading-turn insertion must not cause
          // this to silently delete the oldest history turn (ce:review 067).
          if (perRequestSystem && contents[0]?.parts?.[0]?.text === perRequestSystem) contents.shift();
          harnessCache.name = null;
        }
        return callGemini(disableTools);
      }
      throw new Error(`Gemini ${status}: ${parsed.error?.message ?? "generateContent failed"}`.slice(0, 400));
    }
    iterations++;
    inputTokens += parsed.usageMetadata?.promptTokenCount ?? 0;
    outputTokens += parsed.usageMetadata?.candidatesTokenCount ?? 0;
    thinkingTokens += parsed.usageMetadata?.thoughtsTokenCount ?? 0;
    cachedTokens += parsed.usageMetadata?.cachedContentTokenCount ?? 0;
    return parsed.candidates?.[0]?.content?.parts ?? [];
  };

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // The model round-trip is the one subrequest EVERY iteration spends, and it
    // used to be the only one nothing gated: refusing lookups still let the loop
    // spin, burning the delivery reserve until the post itself failed. Break to
    // the tools-disabled synthesis pass below instead.
    if (outOfIterationBudget(subrequestsUsed())) break;
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
      // Fire when the lookup ceiling is already reached, or the tool-count
      // backstop is hit. Gate applies to LOOKUPS only — side-effect tools were
      // already peeled off above and stay allowed even when the lookup budget
      // is spent.
      if (
        toolCallsUsed >= READONLY_TOOL_BUDGET ||
        subrequestsUsed() >= LOOKUP_CEILING
      ) {
        resultText = JSON.stringify({
          ok: false,
          error: "no more lookups available this turn",
          note: BUDGET_EXHAUSTED_LOOKUP_NOTE,
        });
      } else {
        toolCallsUsed++;
        // Enforced, not forecast — see the claude lane for the full note.
        const tripsBefore = subrequestBudgetTrips();
        try {
          resultText = await withSubrequestLimit(LOOKUP_CEILING, () =>
            executeReadOnlyTool(env, name, args, slack));
          // Cut short but returned normally (clean paging stop, or a catch that
          // ate the throw) — the counter sees it either way.
          if (subrequestBudgetTrips() > tripsBefore) resultText = markPartialLookup(resultText);
        } catch (err) {
          if (!isSubrequestBudgetError(err)) throw err;
          resultText = JSON.stringify({ ok: false, error: "no more lookups available this turn", note: BUDGET_EXHAUSTED_LOOKUP_NOTE });
        }
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
