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
export const READONLY_TOOL_BUDGET = 12;

// ── Shared prompt strings (must read identically in both lanes) ───────────────

/** Fed back as a tool_result when the read-only budget is spent. */
export const BUDGET_EXHAUSTED_LOOKUP_NOTE =
  "Answer NOW from the tool results you already have; if they're insufficient, say exactly what's missing — do not fabricate. If the user asked for an ACTION (filing a card, sending something), you can and should still invoke that one action tool now — actions are not lookups. NEVER mention budgets, limits, turns, or tool mechanics to the user (live 2026-07-10: 'my tool run budget has been exhausted' reached a designer and read as a malfunction).";

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
  currentSenderId: string,
): ResolveValidation {
  if (!pending) {
    return { ok: false, error: "no pending proposal in this thread — reply conversationally instead" };
  }
  if (currentSenderId !== pending.requesterUserId) {
    return { ok: false, error: `not authorized — only <@${pending.requesterUserId}> can resolve this proposal` };
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
  if (name === "slack_search") return executeSlackSearch(env, input);
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
