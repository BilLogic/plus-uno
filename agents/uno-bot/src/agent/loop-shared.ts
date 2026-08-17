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

import { AsyncLocalStorage } from "node:async_hooks";
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

import type { ModelTier } from "./routing";

export interface AgentInput {
  env: Env;
  userText: string;
  /** Explicit tier from /grind, /chill or a shortcut. Beats every routing
   *  heuristic — see routeRequest. Absent on ordinary turns. */
  tierOverride?: ModelTier;
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

// ── Subrequest budget: enforced at the boundary ──────────────────────────────
//
// The free plan hard-caps each Worker invocation at 50 EXTERNAL subrequests
// (Notion reads, Slack calls, model calls — everything that leaves Cloudflare;
// DO and KV hops are a separate 1,000 bucket). Call 51 kills
// the invocation, and because POSTING the reply also costs a subrequest, it dies
// silently: 👀 then nothing (live incidents 2026-07-10, 2026-07-13).
//
// This ran on estimates twice over. First a hand-typed per-tool cost table with
// nothing comparing it to reality — it drifted (notion_search priced 4 while
// scope 'apps' really spent 6) and nothing could notice, because nothing
// counted. Then a measured counter plus a per-tool WORST-CASE bound, because a
// gate that decides before a call can't know what the call will cost. That was
// honest but still a hand-maintained table, and still had to be conservative:
// a tool bounded at 10 was refused with 9 units left even when it would have
// spent 2.
//
// Now `countedFetch` refuses the call that would cross the ceiling and throws
// (net.ts). Nothing has to predict anything: the ceiling is unbreachable
// whatever a tool costs, paging loops turn the stop into a partial read with
// `truncated: true`, and there is no table left to drift.
//
// The one rule handlers must respect: a budget stop is NOT an empty result.
// Swallowing it reports "there is nothing there" — the false-absence bug this
// codebase keeps having to fix. Use `rethrowIfBudget` at best-effort catches.
//
// That rule is a convention, and a future `catch {}` can break it without ever
// mentioning the budget. So the tool boundary doesn't rely on it: net.ts counts
// every stop, the loop compares the count either side of a lookup, and a rise
// stamps `markPartialLookup` on whatever came back. Swallowing the throw now
// costs an unnecessary label, not a false absence.

export const SUBREQUEST_CAP = 50; // Cloudflare free-plan EXTERNAL cap per invocation.
// Reserved for delivery — NEVER spent on lookups: final post + one retry + the
// pre-send review-judge model call + margin. (History writes are Durable Object
// hops, which live in the separate 1,000 internal bucket — see net.ts charge.)
export const DELIVERY_RESERVE = 12;
// Lookups run under this limit; delivery runs unlimited against the real cap.
export const LOOKUP_CEILING = SUBREQUEST_CAP - DELIVERY_RESERVE;

/**
 * True when another loop iteration can't be afforded.
 *
 * The model round-trip is the one subrequest every iteration spends, and it is
 * deliberately NOT under the enforced limit — a budget stop there means no reply
 * at all, which is the outcome we're avoiding. So it stays a pre-check: refusing
 * lookups alone left the model free to keep requesting tools, and while each
 * refusal is free, the round-trip carrying it is not. `+ 1` because the
 * tools-disabled synthesis pass still has to be paid for.
 */
export function outOfIterationBudget(used: number): boolean {
  return used + 1 >= LOOKUP_CEILING;
}

// ── Shared prompt strings (must read identically in both lanes) ───────────────

/** Fed back as a tool_result when the read-only budget is spent. */
export const BUDGET_EXHAUSTED_LOOKUP_NOTE =
  "Answer NOW from the tool results you already have; if they're insufficient, say exactly what's missing — do not fabricate. If the user asked for an ACTION (filing a card, sending something), you can and should still invoke that one action tool now — actions are not lookups. NEVER mention budgets, limits, turns, or tool mechanics to the user (live 2026-07-10: 'my tool run budget has been exhausted' reached a designer and read as a malfunction). If you couldn't gather everything the user asked for, deliver what you DO have and briefly offer to continue on the SPECIFIC missing piece (e.g. \"I've got X — want me to check Y next?\") — framed as a natural next step, never as an error or a limit.";

/**
 * Stamp a tool result the budget cut short. Appended rather than merged into the
 * JSON: the result may be any shape, and the model reads the text either way.
 *
 * @param resultText - Whatever the tool returned
 */
export function markPartialLookup(resultText: string): string {
  return `${resultText}\n\n(system: this lookup was cut short — the turn ran out of lookup capacity mid-read, so the result above is INCOMPLETE. Nothing found here does NOT mean nothing exists; treat it as unread, not empty, and say which part you couldn't check rather than reporting it as absent.)`;
}

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

// ── Correction / pushback vocabulary (Worker-side, drives control flow) ───────
//
// WHY THIS IS NOT A PROMPT RULE. On turn 2 the bot's own turn-1 claim sits in
// history as authoritative prose with no counter-evidence (tool results are
// never persisted). A prompt rule has to beat that, and it fires exactly when
// instruction-following is weakest. So the Worker classifies instead, the same
// way CONFIRM_PHRASES / looksLikeResolution already drive control flow above.
//
// Deliberately CONSERVATIVE-LEANING-BROAD: a false positive costs one extra
// blueprint search (cheap, and the freshest possible answer); a false negative
// costs a repeat of the 2026-08-17 incident, where the bot restated a wrong
// denial at greater length while claiming it had just re-checked.
const CORRECTION_PATTERNS: RegExp[] = [
  // "no, I meant …" / "no — I'm asking about …"
  /\bno[,.! ]+\s*(i|im|i'm|i am)\b/i,
  /\b(i|we)\s+(meant|mean)\b/i,
  // "I'm talking about …" / "I was asking about …"
  /\b(i'm|im|i am|i was|we're|we are)\s+(talking|asking|referring)\s+about\b/i,
  // "that's not …" / "that isn't …" / "this isn't what I asked"
  /\bthat('s| is| was)?\s*n[o']t\b/i,
  /\bthis\s+is\s*n[o']t\b/i,
  /\bnot\s+what\s+(i|we)\s+(asked|meant|wanted)\b/i,
  // "that's wrong" / "you're wrong" / "this is incorrect" — but NOT a bare
  // "wrong" anywhere in the message. The blueprint is full of ordinary
  // questions about wrong things ("what happens if a tutor logs the wrong
  // hours?"), and every one of them was being read as a correction of the
  // previous reply.
  /\b(that|this|you|you're|youre|it)('s| is| are| was| were)?\s*(is\s+)?(wrong|incorrect|mistaken)\b/i,
  // "actually, …" as a lead-in (not mid-sentence hedging)
  /^\s*(actually|no|nope|nah)\b[,\s—-]/i,
  // Direct pushback on a denial — the exact shape of the failing thread
  // ("it IS in there", "there is one"). Anchored on a contradiction verb next
  // to the existence word: the earlier form let any clause containing "there"
  // downstream of "it is" match, which caught plain descriptive sentences.
  /\b(it|there)\s+(is|does|are)\b[^.?!]{0,40}\b(exist|in there|in the blueprint)\b/i,
  /\b(check|look)\s+again\b/i,
  /\b(re-?check|re-?read|re-?search)\b/i,
];

/**
 * True when this message reads as the user CORRECTING the bot's previous reply.
 *
 * On a hit the turn must (a) force `fresh: true` on blueprint_search so the 60s
 * result cache cannot serve the same rows back under a "I just re-checked"
 * claim, and (b) carry a one-turn directive naming the prior query so it is not
 * reissued verbatim. Both are wired in slack/events.ts.
 */
export function looksLikeCorrection(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  // A long message is usually a new question that happens to contain "not",
  // not a correction of the last reply. The real ones are short.
  if (t.length > 400) return false;
  return CORRECTION_PATTERNS.some((re) => re.test(t));
}

/**
 * The one-turn system directive injected on a correction. Names the PRIOR query
 * so the model cannot reissue it verbatim and call that a re-check.
 *
 * @param priorQuery - The blueprint query the previous turn ran, if it is known
 */
export function correctionDirective(priorQuery?: string): string {
  const prior = priorQuery
    ? ` Your previous turn searched the blueprint for "${priorQuery}" — do NOT reissue that query verbatim; search with DIFFERENT words (the scenario name, the path name, the layer) before answering.`
    : " Search the source again with DIFFERENT words from last turn before answering.";
  return (
    "(system: the user is CORRECTING your previous reply. Treat your own earlier claim as UNVERIFIED, not as established fact." +
    prior +
    " Your reply must either cite something you fetched THIS turn, or plainly concede you got it wrong. Restating the previous answer at greater length is a failure, and so is claiming you re-checked without a new lookup.)"
  );
}

// ── Per-turn scope: tool ledger + correction flag ────────────────────────────
//
// Two things have to cross frames the AgentInput contract does not carry:
//
//  1. WHICH TOOLS RAN. The draft judge gates a correction reply on whether it
//     cites something fetched this turn; the executions happen deep inside
//     whichever provider loop is active, and the judge runs in slack/events.ts,
//     several frames above.
//  2. WHETHER THIS IS A CORRECTION TURN, so `blueprint_search` can be forced to
//     `fresh: true` at the boundary. Left to the model, a pushback re-runs a
//     near-identical query and the SAME rows come back under an "I just
//     re-checked" claim — a cache serving a lie.
//
// Rather than thread a context object through both loops' signatures, this
// mirrors net.ts's per-invocation meter: an AsyncLocalStorage scope entered by
// the caller. Outside a scope every call is a no-op, so a test or a direct
// integration call costs nothing and leaks nothing across requests.
const turnScope = new AsyncLocalStorage<{
  tools: Set<string>;
  correction: boolean;
  receipt?: RetrievalReceipt;
}>();

/** What a turn actually retrieved. Persisted on the assistant HistoryTurn so
 *  turn 2 has counter-evidence to the turn-1 prose, and so a correction turn
 *  can be told which query NOT to reissue. Rows are NOT persisted — only the
 *  shape of the lookup, which is what the next turn needs to reason about. */
export interface RetrievalReceipt {
  tool: string;
  query: string;
  /** The `path` of the first row, when the rows carry one (e.g. "Prototype: Reflection redesign"). */
  path?: string;
  count: number;
  /** Distinct scenario names across the rows, capped — the "what did I look at". */
  scenarios: string[];
}

/** Run `fn` inside a fresh turn scope; returns its result, the tools used, and
 *  the retrieval receipt if one was recorded. */
export async function withTurnScope<T>(
  opts: { correction: boolean },
  fn: () => Promise<T>,
): Promise<{ result: T; tools: string[]; receipt?: RetrievalReceipt }> {
  const store: { tools: Set<string>; correction: boolean; receipt?: RetrievalReceipt } = {
    tools: new Set<string>(),
    correction: opts.correction,
  };
  const result = await turnScope.run(store, fn);
  return { result, tools: [...store.tools], receipt: store.receipt };
}

/** Record what a lookup retrieved. Last write wins — the most recent search is
 *  the one a follow-up turn is pushing back on. No-op outside a turn scope. */
export function recordRetrieval(receipt: RetrievalReceipt): void {
  const store = turnScope.getStore();
  if (store) store.receipt = receipt;
}

/** Derive a receipt from a blueprint_search result payload. Best-effort by
 *  design: a malformed payload costs a receipt, never the turn. */
function recordBlueprintReceipt(resultJson: string): void {
  if (!turnScope.getStore()) return;
  try {
    const parsed = JSON.parse(resultJson) as {
      ok?: unknown;
      query?: unknown;
      count?: unknown;
      rows?: Array<{ path?: unknown; scenario?: unknown }>;
    };
    if (parsed.ok !== true || typeof parsed.query !== "string") return;
    const rows = Array.isArray(parsed.rows) ? parsed.rows : [];
    const path = rows.find((r) => typeof r?.path === "string")?.path;
    const scenarios = [
      ...new Set(
        rows
          .map((r) => r?.scenario)
          .filter((s): s is string => typeof s === "string" && s.length > 0),
      ),
    ].slice(0, 8);
    recordRetrieval({
      tool: "blueprint_search",
      query: parsed.query,
      ...(typeof path === "string" ? { path } : {}),
      count: typeof parsed.count === "number" ? parsed.count : rows.length,
      scenarios,
    });
  } catch {
    // A receipt is diagnostic context, never load-bearing for the reply.
  }
}

/** True when the active turn was classified as a user correction. */
export function isCorrectionTurn(): boolean {
  return turnScope.getStore()?.correction === true;
}

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
  // Ledger first: a tool that THREW still ran, and "did this turn fetch
  // anything?" is a question about attempts, not successes.
  turnScope.getStore()?.tools.add(name);
  if (name === "notion_search") return executeNotionSearch(env, input);
  if (name === "roadmap_query") return executeRoadmapQuery(env, input);
  if (name === "blueprint_search") {
    // On a correction turn the cache MUST NOT answer — see withTurnScope.
    const out = await executeBlueprintSearch(env, isCorrectionTurn() ? { ...input, fresh: true } : input);
    // The receipt is derived HERE, not inside the tool, so blueprint-search.ts
    // stays free of an import back into this module (the value-level cycle this
    // file was extracted to break).
    recordBlueprintReceipt(out);
    return out;
  }
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
  // Mirror of gate.ts CONFIRM/CANCEL sets — every emoji the gate would read as
  // a decision is off-limits to the bot, not just the canonical pair.
  const GATE_RESERVED = new Set([
    "white_check_mark", "heavy_check_mark", "+1", "thumbsup",
    "x", "negative_squared_cross_mark", "no_entry_sign",
  ]);
  if (GATE_RESERVED.has(emoji)) {
    return JSON.stringify({
      ok: false,
      error: `${emoji} is reserved for confirm/cancel on proposal cards`,
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
