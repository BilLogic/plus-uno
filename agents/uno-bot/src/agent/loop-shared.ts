// Provider-neutral contract + policy shared by BOTH agent loops (the Anthropic
// loop in run-agent.ts and the Gemini loop in gemini-agent.ts).
//
// Extracted 2026-07-12 (review finding) to: (1) break the run-agent ↔
// gemini-agent value-level import cycle — the shared contract used to live
// inside one provider's file; and (2) stop the two lanes from silently drifting
// on the iteration/token/tool caps, the budget-exhausted messages, the interim
// filter, and proposal_resolve validation, all of which were copy-pasted.
//
// This module owns nothing provider-specific: no Anthropic streaming, no Gemini
// wire types. Each loop keeps its own transport and calls into these helpers.

import type { Env } from "../types";
import {
  APPS_MAX_PAGES,
  CATALOG_MAX_PAGES,
  PAGE_TITLE_CAP,
  READ_BLOCK_PAGES,
  ROADMAP_MAX_PAGES,
} from "../integrations/notion";
import { BLUEPRINT_TABLE_FANOUT } from "../integrations/blueprint";
import type { HistoryTurn, PendingProposal } from "../thread-state-client";
import type { SlackContext } from "../tools/dispatcher";
import { addReaction } from "../slack/api";
import { executeNotionSearch } from "../tools/notion-search";
import { executeRoadmapQuery } from "../tools/roadmap-query";
import { executeBlueprintSearch } from "../tools/blueprint-search";
import { executeReadSource } from "../tools/read-source";
import { executeGithubRead } from "../tools/github-read";
import { executeSlackThreadRead } from "../tools/slack-thread-read";
import { executeSlackSearch } from "../tools/slack-search";
import { executeSlackUserProfile, executeSlackChannelMembers } from "../tools/slack-people";

export type { HistoryTurn };

// ── The provider-neutral contract (input/output of one agent turn) ───────────

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
  /** Pre-rendered one-line description of what the user has open in the
   *  assistant panel (e.g. "channel <#C123>"), when chatting from the panel.
   *  Injected as an advisory system block. Absent for channel/@mention turns. */
  assistantContext?: string;
  /** Called with short, FILTERED progress lines (the model's between-tool
   *  narration, capped + capped-count) so the Worker can post them as separate
   *  interim messages. Never receives the full working monologue. */
  onInterim?: (text: string) => void;
}

export type AgentResult =
  | { kind: "text"; text: string }
  | {
      kind: "proposal";
      toolName: string;
      input: Record<string, unknown>;
      /** Brief structural preview the model wrote alongside the tool_use, if any.
       *  The Worker combines this with its standardized proposal footer. */
      previewText?: string;
    }
  | {
      kind: "resolved";
      decision: "confirm" | "cancel";
      pending: PendingProposal;
      messageToUser?: string;
    };

// ── Loop dials (identical across lanes; change here to change both) ───────────

// Raised from 5: grounding questions legitimately chain several read-only
// searches before the model has enough to answer. If exhausted, both lanes fall
// back to a final tools-disabled synthesis pass rather than erroring out.
// dial raised 2026-07-09 — team prefers thorough over fast (user decision).
export const MAX_ITERATIONS = 16;
// dial raised 2026-07-09 — team prefers thorough over fast (user decision):
// Slack's hard cap is 40k chars, and summary-first readability still applies.
// Raised again 2026-07-10 for Sonnet 5 + adaptive thinking: thinking tokens
// share this budget and Sonnet 5's tokenizer counts ~30% more — 8192 risked an
// all-thinking, truncated answer. We stream, so no timeout risk.
export const MAX_TOKENS = 16384;
// Cap on individual read-only tool executions per request. Each execution costs
// Workers subrequests (a blueprint fallback search alone is ~4 fetches); the
// free plan allows 50 per request — blowing it kills the request mid-flight so
// hard even the error post fails ("reacted :eyes: then silence"). Past the cap
// the model is told to answer with what it has.
// dial raised 2026-07-09 — team prefers thorough over fast (user decision).
// NOTE: 12 sits closer to the subrequest cliff than the old 6 — if "eyes then
// silence" recurs on search-heavy turns, this is the first dial to look at.
// Kept as a secondary hard COUNT backstop behind the weighted budget below.
export const READONLY_TOOL_BUDGET = 12;

// ── Subrequest budget: measured spend + a bounded forecast ────────────────────
//
// The free plan hard-caps each Worker invocation at 50 subrequests (Notion
// reads, Slack calls, DO hops, model calls — everything outbound). Call 51 kills
// the invocation, and because POSTING the reply also costs a subrequest, it dies
// silently: 👀 then nothing (live incidents 2026-07-10, 2026-07-13).
//
// This used to run entirely on estimates: a hand-typed per-tool cost table plus
// a flat PRE_GROUNDING_OVERHEAD, with nothing comparing either to reality. They
// drifted — notion_search was priced 4 while scope 'apps' really spent 6 — and
// nothing could notice, because nothing counted. `src/net.ts` now counts every
// outbound call, so the gate reads what was ACTUALLY spent.
//
// One estimate remains and can't be removed: a tool's cost isn't knowable until
// it has run. So the gate is measured-past + bounded-future — real spend so far,
// plus the WORST CASE for the one call about to be made. The `[budget]` line
// logs actual-vs-bound per tool so that remaining estimate can't drift unseen.
//
// Direction matters: an over-estimated bound costs one skipped lookup, an
// under-estimated one costs the whole reply. When unsure, round up.

// Worst-case subrequests ONE call of a tool can spend. DERIVED from the page
// caps and fan-outs themselves, not copied next to a comment claiming they
// match — a hand-copied bound is the same class of drift ADR-022 retires, just
// moved from "estimate vs reality" to "bound vs page cap". Raising
// CATALOG_MAX_PAGES now updates this automatically.
const MAX_SUBREQUESTS_PER_TOOL: Record<string, number> = {
  // 1 page fetch + block pagination, +1 for the figma/github variants.
  source_read: 1 + READ_BLOCK_PAGES + 1,
  // SA token on a cold isolate + embed + semantic RPC + keyword RPC + fan-out.
  blueprint_search: 4 + BLUEPRINT_TABLE_FANOUT,
  delegate: 6,
  // apps: directory pages + power-user title lookups. catalog: its page cap.
  notion_search: Math.max(APPS_MAX_PAGES + PAGE_TITLE_CAP, CATALOG_MAX_PAGES),
  // A filtered read, plus a full unfiltered rescan when a renamed property
  // makes Notion 400 the filter.
  roadmap_query: ROADMAP_MAX_PAGES * 2,
  github_read: 4,
  slack_search: 3,
  slack_thread_read: 3,
  slack_user_profile: 3,
  slack_channel_members: 3,
  slack_react: 2,
};
// Default bound for any unlisted read-only tool.
const MAX_SUBREQUESTS_DEFAULT = 5;

/** Worst-case subrequests one call of this tool can spend. */
export function maxToolSubrequests(name: string): number {
  return MAX_SUBREQUESTS_PER_TOOL[name] ?? MAX_SUBREQUESTS_DEFAULT;
}

export const SUBREQUEST_CAP = 50; // Cloudflare free-plan hard cap per invocation.
// Reserved for delivery — NEVER spent on lookups: final post + one retry + 2
// history writes + the pre-send review-judge model call + margin.
export const DELIVERY_RESERVE = 12;
// Measured spend may reach this before a lookup is refused (= 38). Higher than
// the old GROUNDING_BUDGET of 28 because the 10 units that used to be set aside
// as PRE_GROUNDING_OVERHEAD are no longer a guess — startup cost is now counted
// as it happens, so it doesn't need reserving twice.
export const LOOKUP_CEILING = SUBREQUEST_CAP - DELIVERY_RESERVE;

/**
 * True when another loop iteration can't be afforded. Refusing a LOOKUP is not
 * enough on its own: once lookups are exhausted the model can keep asking for
 * tools, and while each refusal is free, the model round-trip that carries it is
 * not — MAX_ITERATIONS of those walk straight through DELIVERY_RESERVE and kill
 * the post. Both loops check this before calling the model and fall through to
 * their tools-disabled synthesis pass instead.
 *
 * `+ 1` because the synthesis pass itself still has to be paid for.
 */
export function outOfIterationBudget(used: number): boolean {
  return used + 1 >= LOOKUP_CEILING;
}

/**
 * Record what a tool call ACTUALLY spent, for the `[budget]` line. This is the
 * feedback loop the old estimate table never had: a bound reality exceeds is a
 * latent silent death, and one chronically far above reality is wasted research
 * headroom. Both now show up in the logs rather than in an incident.
 *
 * @param log - Per-invocation accumulator, joined into the telemetry line
 */
export function noteSpend(log: string[], tool: string, spent: number): void {
  const bound = maxToolSubrequests(tool);
  if (spent > bound) {
    console.warn(`[budget] BOUND EXCEEDED ${tool}: spent ${spent} > bound ${bound} — raise the derivation in MAX_SUBREQUESTS_PER_TOOL`);
  }
  log.push(`${tool}=${spent}/${bound}${spent > bound ? "!" : ""}`);
}

// ── Shared prompt strings (must read identically in both lanes) ───────────────

/** Fed back as a tool_result when the read-only budget is spent. */
export const BUDGET_EXHAUSTED_LOOKUP_NOTE =
  "Answer NOW from the tool results you already have; if they're insufficient, say exactly what's missing — do not fabricate. If the user asked for an ACTION (filing a card, sending something), you can and should still invoke that one action tool now — actions are not lookups. NEVER mention budgets, limits, turns, or tool mechanics to the user (live 2026-07-10: 'my tool run budget has been exhausted' reached a designer and read as a malfunction). If you couldn't gather everything the user asked for, deliver what you DO have and briefly offer to continue on the SPECIFIC missing piece (e.g. \"I've got X — want me to check Y next?\") — framed as a natural next step, never as an error or a limit.";

/** Injected as a final user turn to force a tools-disabled synthesis pass. */
export const BUDGET_EXHAUSTED_SYNTHESIS =
  "(system: tool budget exhausted — answer the original question NOW from the tool results above; do not request more tools. If the results are insufficient, say what's missing.)";

/** Fallback shown when even the synthesis pass produced no text. */
export const CLARIFY_FALLBACK =
  "I pulled up a lot of context but couldn't wrap it into a clean answer — can you narrow the question a little?";

// ── Interim-narration filter (same policy, provider-specific plumbing) ────────

// Between-tool narration is surfaced to the user as SHORT separate messages
// (never in the final reply). Capped at 3 per request and ~280 chars each; only
// the first line of a narration block is used. The full monologue is never
// exposed (user decision 2026-07-10 after a delivered reply included seven
// paragraphs of it). Returns an emit(raw) each loop calls with candidate text.
export function makeInterimFilter(onInterim?: (text: string) => void): (raw: string) => void {
  let interimSent = 0;
  return (raw: string): void => {
    if (!onInterim || interimSent >= 3) return;
    const line = raw.trim().split("\n")[0]?.trim() ?? "";
    if (line.length < 15) return; // too short to be informative
    interimSent++;
    onInterim(line.length > 280 ? `${line.slice(0, 277)}…` : line);
  };
}

// ── Bare confirm/cancel vocabulary (single source, two matchers) ──────────────

// One vocabulary drives BOTH the deterministic fast-path (events.ts, exact match
// on the whole message) and the model-routing shortcut (anthropic-client.ts,
// word-contains). They used to be two hand-maintained lists that disagreed —
// "lgtm" resolved but wouldn't route, "nope" routed but wouldn't resolve
// (review 2026-07-12). Keep phrases lowercase; multi-word is fine.
export const CONFIRM_PHRASES = [
  "go ahead", "yes", "yes please", "confirm", "confirmed", "do it",
  "ship it", "approve", "approved", "sure", "ok", "okay", "lgtm",
];
export const CANCEL_PHRASES = [
  "cancel", "cancel it", "no", "nope", "stop", "abort", "nevermind",
  "never mind", "don't", "dont",
];

/** Exact-match the whole (trimmed, de-punctuated) message → a resolution, or
 *  null. Used for the no-model fast-path; anything longer routes to the model. */
export function bareResolution(text: string): "confirm" | "cancel" | null {
  const bare = text.trim().toLowerCase().replace(/[.!?\s]+$/g, "");
  if (CONFIRM_PHRASES.includes(bare)) return "confirm";
  if (CANCEL_PHRASES.includes(bare)) return "cancel";
  return null;
}

/** True if the text CONTAINS any resolution phrase as a word — the looser test
 *  the router uses to send a likely confirm/cancel to the cheap lane. */
export function looksLikeResolution(text: string): boolean {
  return RESOLUTION_WORD_RE.test(text.toLowerCase());
}
const RESOLUTION_WORD_RE = new RegExp(
  `\\b(${[...CONFIRM_PHRASES, ...CANCEL_PHRASES].map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
);

// ── proposal_resolve validation (Worker-side authorization, both lanes) ───────

export type ResolveValidation =
  | { ok: true; decision: "confirm" | "cancel"; messageToUser?: string }
  | { ok: false; error: string };

/** Validate a proposal_resolve call against the thread's pending state and the
 *  current sender. Enforced Worker-side even though the system prompt already
 *  tells the model — defense in depth. */
export function validateProposalResolve(
  args: { decision?: unknown; message_to_user?: unknown } | undefined,
  pending: PendingProposal | null,
  // Kept for signature stability + logging; no longer gated on — anyone in the
  // thread may confirm/cancel (2026-07-14).
  _currentSenderId: string,
): ResolveValidation {
  if (!pending) {
    return { ok: false, error: "no pending proposal in this thread — reply conversationally instead" };
  }
  const decision = args?.decision;
  if (decision !== "confirm" && decision !== "cancel") {
    return { ok: false, error: "decision must be 'confirm' or 'cancel'" };
  }
  const msg = typeof args?.message_to_user === "string" ? args.message_to_user : undefined;
  return { ok: true, decision, messageToUser: msg };
}

// ── Read-only tool execution (shared by both lanes) ───────────────────────────

export async function executeReadOnlyTool(
  env: Env,
  name: string,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  if (name === "notion_search") return executeNotionSearch(env, input);
  if (name === "roadmap_query") return executeRoadmapQuery(env, input);
  if (name === "blueprint_search") return executeBlueprintSearch(env, input);
  if (name === "source_read") return executeReadSource(env, input);
  if (name === "github_read") return executeGithubRead(env, input);
  if (name === "slack_thread_read") return executeSlackThreadRead(env, input);
  if (name === "slack_search") return executeSlackSearch(env, input, slack);
  if (name === "slack_react") return executeSlackReact(env, input, slack);
  if (name === "slack_user_profile") return executeSlackUserProfile(env, input);
  if (name === "slack_channel_members") return executeSlackChannelMembers(env, input);
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
      error: "white_check_mark and x are reserved for confirm/cancel on proposal cards",
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
