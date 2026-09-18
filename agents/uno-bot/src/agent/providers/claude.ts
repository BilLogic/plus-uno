// The Claude-on-Vertex adapter — a ModelProvider, not a loop (#496).
//
// This file replaced the second agent loop that `claude-agent.ts` carried (now
// deleted, #497). Everything
// that used to be duplicated there — the iteration budget, `/stop`, the
// `proposal_resolve` authorization, the side-effect-to-proposal rule, the lookup
// ceiling, the synthesis pass, the narration rule — is the loop's (loop.ts), and
// `/stop` therefore works on Claude for the first time by construction rather
// than by a second implementation of it.
//
// What stops HERE is everything Anthropic-shaped:
//
//   • the `messages` array, appended to VERBATIM so a thinking block survives a
//     tool round (the API rejects a turn whose thinking was rewritten);
//   • tool_use ⇄ neutral `ModelToolCall`, and neutral `ModelToolResult` ⇄
//     tool_result blocks — every tool_use in a turn must be satisfied or the
//     next call 400s on an orphan, and the loop hands back a result for every
//     call precisely so this can hold;
//   • `stop_reason`: end_turn/stop_sequence → `end`, tool_use → `tool`, and
//     `pause_turn` → resumed RIGHT HERE by echoing the paused content and
//     calling again, so the loop never learns the word (it would otherwise have
//     to grow a provider stop reason it has no policy for);
//   • the tier → Vertex model id, the extended-thinking budget, `web_search`
//     (server-side on Vertex, zero Worker subrequests), the `cache_control`
//     shape that turns the loop's `stable` system block into a cached prefix;
//   • usage accounting, including the cache read/creation split.
//
// NO BACKUP MODEL, by decision: `fallback` always returns false, so a 429 here
// surfaces through exactly the path a Gemini turn takes when its backup is
// unset — the loop raises the provider failure and `slack/delivery.ts` reports
// capacity. A second Claude model would be a new operational commitment, not a
// refactor.
//
// PURE by design — no `Env`, no Workers type, no fetch: the transport is a port
// (`ClaudeTransport`), so `tsconfig.test.json` compiles this file and
// `tests/claude-provider.test.ts` drives the whole turn with a stub. Production
// binds the port to `vertex/claude.ts`'s rawPredict in `run-agent.ts`.

import { MAX_TOKENS } from "../loop-policy";
import type { ModelTier } from "../tiers";
import type {
  ModelPrompt,
  ModelProvider,
  ModelReply,
  ModelStop,
  ModelText,
  ModelToolCall,
  ModelToolResult,
  ModelTurn,
  ModelUsage,
  ProviderDials,
} from "../model-provider";

/**
 * Tier → Vertex model id. ADR-028: a tier is a model plus a thinking dial,
 * moving together, and both belong to the adapter that sends them — so this
 * table lives HERE and not in the provider-neutral routing module, which used
 * to carry Claude ids that no Gemini turn ever read.
 *
 * Exported for the diagnostics probe, which needs a model id to smoke-test the
 * credential with. Nothing else above the seam names one: a caller says which
 * tier it wants.
 */
export const CLAUDE_MODELS: Record<ModelTier, string> = {
  chill: "claude-haiku-4-5@20251001",
  default: "claude-sonnet-5",
  grind: "claude-opus-4-8",
};

// ── Anthropic Messages wire types (the subset we touch) ──────────────────────

interface TextBlock {
  type: "text";
  text: string;
}
interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}
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
  content?: ContentBlock[];
  stop_reason?: string | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  error?: { message?: string };
}

/**
 * One rawPredict round-trip, as the adapter needs it: the model goes in the URL
 * and `anthropic_version` in the body, both of which are the transport's
 * business (vertex/claude.ts). A PORT rather than a direct import because
 * `vertex/claude.ts` names `Env` and `fetch`, and this file is compiled by the
 * test build, which has neither.
 */
export type ClaudeTransport = (
  model: string,
  body: Record<string, unknown>,
) => Promise<{ status: number; data: unknown }>;

export interface ClaudeProviderOptions {
  transport: ClaudeTransport;
  /** `CLAUDE_MODEL`: pins the default tier to an exact @-versioned id. The
   *  chill and grind tiers stay on `CLAUDE_MODELS`. */
  defaultModel?: string;
}

// Web search runs server-side during the single rawPredict call — on
// Google/Anthropic infra, at zero Worker subrequests, which is why it survives
// on a path whose every local tool costs from the budget the loop rations.
// Needs the GCP org policy `constraints/vertexai.allowedPartnerModelFeatures`.
const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search", max_uses: 3 };

// Standard extended thinking for the reasoning tiers. This is the adapter's own
// dial and nothing else's: a tier maps to a Claude MODEL and stops there, so
// there is no thinking LEVEL on this path the way ADR-028 gives the Gemini
// tiers one. `chill` turns are trivial confirms and skip it.
const THINKING_BUDGET_TOKENS = 6000;

// A paused turn is resumed here, but not forever: a server tool that pauses
// every round would otherwise spin inside one `send` with the loop's iteration
// budget unable to see it. Past this the content is read as it stands.
const MAX_PAUSE_RESUMES = 4;

// Default ceiling for a one-shot `generate` when the caller names none. Modest
// on purpose: a one-shot is a judgement or a classification, and a caller that
// wants a long answer back (a re-drafted reply) says so.
const ONE_SHOT_MAX_TOKENS = 2048;

function textOf(content: ContentBlock[]): string {
  return content
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/**
 * The user-facing reply is the text AFTER the last non-text block (thinking,
 * tool_use, a server tool result). Joining every text block would leak the
 * working monologue; falls back to all text when there are no other blocks.
 */
function finalText(content: ContentBlock[]): string {
  let lastNonText = -1;
  content.forEach((b, i) => {
    if (b.type !== "text") lastNonText = i;
  });
  const after = textOf(content.slice(lastNonText + 1));
  return after || textOf(content);
}

export function claudeProvider(opts: ClaudeProviderOptions): ModelProvider {
  let model = "";
  let tier: ModelTurn["tier"] = "default";
  let thinkingBudget: number | null = null;

  let messages: MessageParam[] = [];
  let system: Array<Record<string, unknown>> = [];
  let tools: Array<Record<string, unknown>> = [];
  /** The model's last reply content, held so `recordToolResults` echoes it
   *  verbatim — that is what preserves a thinking block across a tool round. */
  let lastContent: ContentBlock[] = [];

  const usage: ModelUsage = {
    inputTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    cachedInputTokens: 0,
  };

  /** Tier → model id, one resolution for a turn and for a one-shot. The default
   *  tier is overridable so an exact @-versioned id can be pinned without a code
   *  change; chill and grind are fixed. */
  const modelFor = (t: ModelTier): string =>
    t === "default" ? (opts.defaultModel ?? CLAUDE_MODELS.default) : CLAUDE_MODELS[t];

  const addUsage = (u: ClaudeMessage["usage"]): void => {
    // Cache CREATION is billed as input, so it belongs in the input count;
    // cache READS are the ones that were not billed fresh, which is what
    // `cachedInputTokens` means to every provider.
    usage.inputTokens += (u?.input_tokens ?? 0) + (u?.cache_creation_input_tokens ?? 0);
    usage.outputTokens += u?.output_tokens ?? 0;
    usage.cachedInputTokens += u?.cache_read_input_tokens ?? 0;
    // Thinking tokens are NOT reported separately on this API — they are inside
    // `output_tokens`. Reporting a guess here would be worse than reporting none.
  };

  return {
    name: "vertex-claude",

    /**
     * One prompt, one reply, no tools — and no contact with the turn's state:
     * the messages array, the cached system blocks and the usage counters all
     * belong to the turn, so a one-shot beside a turn in flight leaves it
     * exactly as it was. Only the transport is shared.
     *
     * No extended thinking here either. A one-shot is a judgement or a
     * classification, and the budget would double its latency for a caller that
     * asked for a short answer.
     */
    async generate(prompt: ModelPrompt): Promise<ModelText> {
      const oneShotModel = modelFor(prompt.tier);
      const { status, data } = await opts.transport(oneShotModel, {
        max_tokens: prompt.maxTokens ?? ONE_SHOT_MAX_TOKENS,
        messages: [{ role: "user", content: prompt.prompt }],
        ...(prompt.system ? { system: prompt.system } : {}),
      });
      const parsed = (data ?? {}) as ClaudeMessage;
      if (status !== 200) {
        return {
          ok: false,
          model: oneShotModel,
          // The status rides in the message: not every provider reports one, so
          // the seam has no field for it.
          message: `HTTP ${status}: ${parsed.error?.message ?? "rawPredict failed"}`,
        };
      }
      return { ok: true, model: oneShotModel, text: textOf(parsed.content ?? []) };
    },

    async start(turn: ModelTurn): Promise<void> {
      tier = turn.tier;
      model = modelFor(tier);
      thinkingBudget = tier === "chill" ? null : THINKING_BUDGET_TOKENS;

      // The loop says WHICH block is stable; the `cache_control` shape that
      // exploits it is this adapter's. Vertex honours it for Claude, so the
      // harness rides as a cached prefix and the per-request blocks after it do
      // not — which is the whole point of the distinction.
      system = turn.system
        .filter((b) => b.text)
        .map((b) =>
          b.stable
            ? { type: "text", text: b.text, cache_control: { type: "ephemeral", ttl: "1h" } }
            : { type: "text", text: b.text },
        );

      tools = [
        ...turn.tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema,
        })),
        WEB_SEARCH_TOOL,
      ];

      messages = turn.conversation.map(
        (t): MessageParam => ({
          role: t.role,
          content: t.images?.length
            ? [
                ...t.images.map(
                  (img): ImageBlockParam => ({
                    type: "image",
                    source: { type: "base64", media_type: img.media_type, data: img.data },
                  }),
                ),
                { type: "text", text: t.text },
              ]
            : t.text,
        }),
      );
    },

    async send({ toolsEnabled }): Promise<ModelReply> {
      for (let resumes = 0; ; resumes++) {
        const body: Record<string, unknown> = {
          max_tokens: MAX_TOKENS,
          system,
          messages,
          // The roster stays DECLARED even on the synthesis pass: the API
          // rejects a history carrying tool_result blocks when no tools are
          // defined. `tool_choice: none` is what actually forbids the call.
          tools,
          ...(thinkingBudget
            ? { thinking: { type: "enabled", budget_tokens: thinkingBudget } }
            : {}),
          ...(toolsEnabled ? {} : { tool_choice: { type: "none" } }),
        };

        const { status, data } = await opts.transport(model, body);
        const parsed = (data ?? {}) as ClaudeMessage;
        if (status !== 200) {
          // A failure is DATA, not a throw: the loop asks `fallback` whether a
          // backup exists (here it never does) and then surfaces it.
          return { ok: false, status, message: parsed.error?.message ?? "rawPredict failed" };
        }

        addUsage(parsed.usage);
        lastContent = parsed.content ?? [];

        // Server-side tool work (web_search) can interrupt a long turn. Resumed
        // HERE, by echoing the paused content and calling again: nothing ran in
        // between, the loop spent one iteration, and `pause_turn` never becomes
        // a word above this file.
        if (parsed.stop_reason === "pause_turn" && resumes < MAX_PAUSE_RESUMES) {
          messages.push({ role: "assistant", content: lastContent });
          continue;
        }

        const toolCalls: ModelToolCall[] = lastContent
          .filter((b): b is ToolUseBlock => b.type === "tool_use")
          .map((b) => ({ id: b.id, name: b.name, args: b.input ?? {} }));

        // `tool_use` with no CLIENT call in it is a server-tool turn that has
        // nothing for the loop to run, so it reads as a finished reply rather
        // than as an empty tool round the next request would reject.
        const stop: ModelStop = toolCalls.length > 0 ? "tool" : "end";
        return {
          ok: true,
          // Text beside tool_use is the model narrating the work it is about to
          // do — the loop decides whether that reaches the user (only ahead of
          // read-only work) and whether it becomes a proposal's preview.
          text: stop === "tool" ? textOf(lastContent) : finalText(lastContent),
          toolCalls,
          stop,
        };
      }
    },

    recordToolResults(results: ModelToolResult[]): void {
      // VERBATIM — a rewritten thinking block invalidates the turn.
      messages.push({ role: "assistant", content: lastContent });
      if (results.length === 0) return;
      messages.push({
        role: "user",
        content: results.map(
          (r): ToolResultBlockParam => ({
            type: "tool_result",
            tool_use_id: r.id,
            content: r.text,
            ...(r.isError ? { is_error: true } : {}),
          }),
        ),
      });
    },

    recordUserText(text: string): void {
      messages.push({ role: "user", content: text });
    },

    /** No backup model on this path, by decision. The loop then surfaces the
     *  failure exactly as it does for a Gemini turn with `GEMINI_FALLBACK_MODEL`
     *  unset — one code path for "the provider has nothing else to try". */
    fallback(): boolean {
      return false;
    },

    dials(): ProviderDials {
      // A thinking BUDGET in tokens, which is the only dial this path has:
      // there is no thinking level here, so none is reported. `off` is the
      // chill tier, where extended thinking is skipped outright.
      return { model, detail: { thinking: thinkingBudget ? `${thinkingBudget}` : "off" } };
    },

    usage(): ModelUsage {
      return { ...usage };
    },
  };
}
