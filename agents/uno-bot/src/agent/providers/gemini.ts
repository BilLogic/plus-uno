// The Gemini adapter — production's ModelProvider (ADR-018: Vertex only).
//
// Everything Gemini-shaped stops here. The loop hands in a neutral conversation,
// a tool roster, an opaque tier name and a `toolsEnabled` flag; what goes back is
// text, tool calls, usage and a stop kind. In between this module owns:
//
//   • the tier → model → thinking level resolution (ADR-028, gemini-tiers.ts),
//     re-derived after a fallback so the tier stays and the model changes under it;
//   • the `contents` array, appended to VERBATIM so Gemini 3's thoughtSignature
//     parts survive a tool round (they must be echoed back or the next call
//     rejects the turn);
//   • the explicit context cache for the harness, warmed on the turn's first
//     use — which is why the Worker entry no longer has to know a cache exists;
//   • the backup model from `GEMINI_FALLBACK_MODEL`, and the fact that the
//     cached-prompt name cannot travel to it;
//   • the OpenAPI-subset tool schema, which rejects JSON Schema keys;
//   • token accounting, including the thinking and cached-prefix counts.
//
// NO server-side MCP: Gemini plain models have none, so the bot runs on its own
// local tools and every call costs Worker subrequests — which is why the loop's
// lookup ceiling matters more here than anywhere. Built-in googleSearch and
// urlContext run on Google's infra at zero subrequests and mix with function
// declarations only on Gemini 3 (see gemini-tiers.ts).

import type { Env } from "../../types";
import { geminiDials, resolveGeminiModel, type ThinkingLevel } from "../gemini-tiers";
import { geminiGenerateRaw } from "../../gemini/client";
import { ensureHarnessCache } from "../../gemini/cache";
import { MAX_TOKENS } from "../loop-policy";
import type {
  ModelProvider,
  ModelReply,
  ModelToolCall,
  ModelToolResult,
  ModelTurn,
  ModelUsage,
  ProviderDials,
} from "../model-provider";

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

// Capacity/availability statuses a backup model is worth trying on. The
// 2026-07-16 quota incident was every turn 429ing with the bot down in Slack
// for an afternoon; degraded (pricier/slower) beats down.
const FALLBACK_STATUSES = new Set([404, 429, 500, 503]);

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

function textOf(parts: GeminiPart[]): string {
  return parts
    .filter((p) => typeof p.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("\n")
    .trim();
}

export function geminiProvider(env: Env): ModelProvider {
  let model = "";
  let thinkingLevel: ThinkingLevel | null = null;
  let builtinSearchTools: Array<Record<string, unknown>> = [];
  let tier: ModelTierName = "default";
  let fellBack = false;

  let contents: GeminiContent[] = [];
  let functionDeclarations: Array<Record<string, unknown>> = [];
  /** The stable harness block. Sent as `cachedContent` when a cache exists. */
  let stableSystem = "";
  /** Per-request system blocks — who sent this, what proposal is pending. */
  let perRequestSystem = "";
  let cacheName: string | null = null;
  /** The model's last reply, held so `recordToolResults` can echo it verbatim. */
  let lastParts: GeminiPart[] = [];

  const usage: ModelUsage = {
    inputTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    cachedInputTokens: 0,
  };

  /** Drop the cached-prompt reference and put the per-request context back into
   *  the system instruction. A cachedContents resource is bound to the model
   *  that created it, so a backup model cannot reference it — carrying the name
   *  over would turn a recoverable capacity failure into a hard 400. */
  const inlineTheSystemPrompt = (why: string): void => {
    if (!cacheName) return;
    console.log(`[gemini-cache] ${why} — inlining the system prompt`);
    // Self-describing removal: only shift if index 0 IS the prepended
    // per-request turn. A future leading-turn insertion must not cause this to
    // silently delete the oldest history turn (ce:review 067).
    if (perRequestSystem && contents[0]?.parts?.[0]?.text === perRequestSystem) contents.shift();
    cacheName = null;
  };

  return {
    name: "gemini",

    async start(turn: ModelTurn): Promise<void> {
      tier = turn.tier;
      model = resolveGeminiModel(turn.tier, env);
      ({ thinkingLevel, builtinSearchTools } = geminiDials(turn.tier, model));

      // The roster arrives already decided; this only translates it.
      functionDeclarations = turn.tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: cleanSchema(t.input_schema),
      }));

      // Block 0 is the harness — identical for every request on this build,
      // which is exactly what a cache wants. Blocks 1+ are per-request and
      // change every turn, so they must stay OUT of the cached bytes or nothing
      // would ever hit.
      stableSystem = turn.system.find((b) => b.stable)?.text ?? "";
      perRequestSystem = turn.system
        .filter((b) => !b.stable)
        .map((b) => b.text)
        .filter(Boolean)
        .join("\n\n");

      // Vertex serves the harness from a cachedContents resource when the
      // deployment is on a regional endpoint; otherwise this is null and the
      // prompt goes inline exactly as before (see gemini/cache.ts for every
      // fallback). WARMED HERE, on the turn's first use — the Worker entry used
      // to have to do it, and a cache is not the entry's business.
      const harnessCache = await ensureHarnessCache(env, model, stableSystem);
      cacheName = harnessCache.name;
      if (cacheName === null && harnessCache.reason) {
        console.log(`[gemini-cache] inline system prompt — ${harnessCache.reason}`);
      }

      contents = turn.conversation.map((t) => ({
        role: t.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [
          ...(t.images ?? []).map((img) => ({
            inlineData: { mimeType: img.media_type, data: img.data },
          })),
          { text: t.text },
        ],
      }));
      // A request that references cachedContent may NOT also set
      // systemInstruction — Vertex rejects the pair. The per-request context
      // therefore rides as a leading user turn instead; same text, one role over.
      if (cacheName && perRequestSystem) {
        contents.unshift({ role: "user", parts: [{ text: perRequestSystem }] });
      }
    },

    async send({ toolsEnabled }): Promise<ModelReply> {
      const body: Record<string, unknown> = {
        contents,
        ...(cacheName
          ? { cachedContent: cacheName }
          : {
              systemInstruction: {
                parts: [{ text: [stableSystem, perRequestSystem].filter(Boolean).join("\n\n") }],
              },
            }),
        // Built-in tools run on Google's infra at zero Worker subrequests and
        // mix with function declarations ONLY on Gemini 3; on 2.x they're
        // dropped so the request doesn't 400.
        tools: [{ functionDeclarations }, ...builtinSearchTools],
        // toolConfig NONE keeps the declarations, which Gemini requires when the
        // history already contains function turns.
        ...(toolsEnabled ? {} : { toolConfig: { functionCallingConfig: { mode: "NONE" } } }),
        generationConfig: {
          maxOutputTokens: MAX_TOKENS,
          ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
        },
      };

      const { status, data } = await geminiGenerateRaw(env, model, body);
      const parsed = data as GeminiResponseData;
      if (status !== 200) {
        return {
          ok: false,
          status,
          message: parsed.error?.message ?? "generateContent failed",
        };
      }

      usage.inputTokens += parsed.usageMetadata?.promptTokenCount ?? 0;
      usage.outputTokens += parsed.usageMetadata?.candidatesTokenCount ?? 0;
      usage.thinkingTokens += parsed.usageMetadata?.thoughtsTokenCount ?? 0;
      usage.cachedInputTokens += parsed.usageMetadata?.cachedContentTokenCount ?? 0;

      lastParts = parsed.candidates?.[0]?.content?.parts ?? [];
      const toolCalls: ModelToolCall[] = lastParts
        .filter((p) => p.functionCall?.name)
        // Gemini has no per-call id: the functionResponse is paired by NAME and
        // by position within the turn. The index is that position, minted here
        // so the loop can carry an opaque handle like every other provider's.
        .map((p, i) => ({
          id: `${i}`,
          name: p.functionCall!.name!,
          args: (p.functionCall!.args ?? {}) as Record<string, unknown>,
        }));

      return {
        ok: true,
        text: textOf(lastParts),
        toolCalls,
        stop: toolCalls.length > 0 ? "tool" : "end",
      };
    },

    recordToolResults(results: ModelToolResult[]): void {
      // The model turn goes back VERBATIM — that is what preserves
      // thoughtSignature on a function-calling turn.
      contents.push({ role: "model", parts: lastParts });
      if (results.length === 0) return;
      contents.push({
        role: "user",
        parts: results.map(
          (r): GeminiPart => ({
            functionResponse: { name: r.name, response: { result: r.text } },
          }),
        ),
      });
    },

    recordUserText(text: string): void {
      contents.push({ role: "user", parts: [{ text }] });
    },

    fallback(status: number): boolean {
      const backup = env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-pro";
      if (fellBack || !FALLBACK_STATUSES.has(status) || !backup || backup === model) return false;
      fellBack = true;
      console.warn(`[gemini] ${model} failed (${status}) — falling back to ${backup} for the rest of this turn`);
      model = backup;
      // Dials recompute for the new model: the tier (and so its level) stays,
      // the model under it changes, and the level is re-derived against it —
      // a 2.x backup takes no thinking dial at all.
      ({ thinkingLevel, builtinSearchTools } = geminiDials(tier, model));
      inlineTheSystemPrompt("dropped for the fallback model");
      return true;
    },

    dials(): ProviderDials {
      // `level` is what the LAST call was sent with: the tier's level, or "none"
      // when the model in use (a 2.x fallback) takes no dial.
      return { model, detail: { level: thinkingLevel ?? "none" } };
    },

    usage(): ModelUsage {
      return { ...usage };
    },
  };
}

// The tier union, named locally so this file's signature does not have to
// re-export it.
type ModelTierName = ModelTurn["tier"];
