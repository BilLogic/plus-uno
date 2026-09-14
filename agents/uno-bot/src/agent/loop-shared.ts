// Provider-neutral contract + per-turn scope, shared by both wiring functions
// (gemini-agent.ts, claude-agent.ts) and the tool bodies the loop calls into.
//
// WHAT IS LEFT HERE, after the loop landed (#495) and Claude moved behind the
// seam with it (#496):
//   - `AgentInput`: the turn contract the Worker calls an agent with. `Env`
//     enters here and stops here; the loop itself takes named ports.
//   - The per-turn AsyncLocalStorage scope (tool ledger, correction flag,
//     retrieval receipt, absence signal) that the draft judge reads several
//     frames above the loop.
//   - `executeReadOnlyTool`, the one read-only tool dispatch.
//   - The correction/pushback vocabulary, which drives Worker-side control flow.
//
// WHAT MOVED, and why: the loop's dials, budget strings, narration filter and
// `proposal_resolve` validation now live in `loop-policy.ts`, and `AgentResult`
// and `TurnDials` in `loop.ts`. This file reaches every tool body and so drags
// the whole Workers type graph behind it — the loop cannot import from here and
// still be compiled by `tsconfig.test.json`, which is what makes it testable
// against a fake adapter. Everything is re-exported below, so no caller of this
// module changed; #497 retires the re-export surface with the rest of the bag.

import { AsyncLocalStorage } from "node:async_hooks";
import { GATE_RESERVED } from "../slack/gate-reactions";
import type { AbsenceContext } from "./absence";
import type { Env } from "../types";
import type { HistoryTurn, PendingProposal } from "../thread-state/index";
import type { SlackContext } from "../tools/dispatcher";
import type { AgentImage, ProviderConversationTurn } from "./provider-conversation";
import { addReaction } from "../slack/api";
import { executeNotionSearch } from "../tools/notion-search";
import { executeRoadmapQuery } from "../tools/roadmap-query";
import { executeBlueprintSearch } from "../tools/blueprint-search";
import { executeReadSource } from "../tools/read-source";
import { executeGithubRead } from "../tools/github-read";
import { executeSlackThreadRead } from "../tools/slack-thread-read";
import { executeSlackSearch } from "../tools/slack-search";
import { executeSlackUserProfile, executeSlackChannelMembers } from "../tools/slack-people";
import { readReference } from "../tools/read-reference";
import { toolResultDigest, type ToolCall, type ToolResultNote } from "./tool-transcript";

export type { HistoryTurn };
// The transcript shape lives in its own pure module (tool-transcript.ts) so the
// fields an eval artifact promises can be unit-tested; re-exported here because
// every caller reaches the agent contract through this file.
export type { ToolCall, ToolResultNote } from "./tool-transcript";
export { toolResultDigest, attachToolResult, markUnanswered } from "./tool-transcript";
export { NOT_RUN_TURN_ENDED, NO_RESULT_RECORDED } from "./tool-transcript";

// ── The provider-neutral contract (input/output of one agent turn) ───────────

export type { AgentImage } from "./provider-conversation";

import type { ModelTier } from "./routing";
import type { TurnDials } from "./loop";

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
  /** Legacy current-turn vision input; provider-ready callers use conversation. */
  images?: AgentImage[];
  /** Provider-ready multimodal turns. When present, image blocks remain on the
   *  user turn that introduced them instead of being moved to the latest ask. */
  conversation?: ProviderConversationTurn[];
  /** Pre-rendered one-line description of what the user has open in the
   *  assistant panel (e.g. "channel <#C123>"), when chatting from the panel.
   *  Injected as an advisory system block. Absent for channel/@mention turns. */
  assistantContext?: string;
  /** Called with short, FILTERED progress lines (the model's between-tool
   *  narration, capped + capped-count) so the Worker can post them as separate
   *  interim messages. Never receives the full working monologue. */
  onInterim?: (text: string) => void;
  /** Called once, as the turn finishes, with the tier it was routed to and the
   *  model + thinking level the last model call was sent with — the same facts
   *  the `[uno-bot] request done` log line carries. The headless eval route
   *  reports these so a scenario can assert the level, not just the model
   *  (#421). Absent on production turns, which read the log. */
  onDials?: (dials: TurnDials) => void;
  /** Called for every tool call the model makes, in order, with the arguments
   *  it sent — before dispatch, so gated proposals and budget-refused lookups
   *  are reported too. The headless eval route lists these so a scenario can
   *  assert a call was made and what it named — a `read_reference` for the
   *  skill's method, say (#423). Absent on production turns, which read the
   *  `tools=[…]` log. */
  onToolCall?: (call: ToolCall) => void;
  /** Called after a tool RESULT comes back, with the small honesty fields it
   *  carries — `note`, `visibility`, `error`, never rows and never content.
   *  The eval route attaches these to the call they answer, so a search-shaped
   *  failure is diagnosable from the artifact instead of only from a live
   *  re-run (#452). Absent on production turns. */
  onToolResult?: (result: ToolResultNote) => void;
}

// The loop's own types, re-exported so callers of this module are unchanged.
export type { AgentResult, TurnDials } from "./loop";
export type {
  ModelProvider,
  ModelReply,
  ModelToolCall,
  ModelToolResult,
  ModelUsage,
  ProviderDials,
  SystemBlock,
  ToolSpec,
} from "./model-provider";

// The loop's policy, re-exported for the same reason.
export {
  MAX_ITERATIONS,
  MAX_TOKENS,
  READONLY_TOOL_BUDGET,
  SUBREQUEST_CAP,
  DELIVERY_RESERVE,
  LOOKUP_CEILING,
  STOPPED_MESSAGE,
  BUDGET_EXHAUSTED_LOOKUP_NOTE,
  BUDGET_EXHAUSTED_SYNTHESIS,
  CLARIFY_FALLBACK,
  budgetRefusedResult,
  markPartialLookup,
  makeInterimFilter,
  outOfIterationBudget,
  validateProposalResolve,
} from "./loop-policy";
export type { ResolveValidation } from "./loop-policy";

// ── Confirm/cancel vocabulary: there is none ─────────────────────────────────
//
// CONFIRM_PHRASES / CANCEL_PHRASES, bareResolution and looksLikeResolution
// lived here until 2026-08-22. A typed reply to a pending proposal now goes to
// the model, which reads it with <pending_proposal> in context and calls
// proposal_resolve. The only deterministic resolution left is an emoji — a
// reaction on the card, a button on the card, or a typed emoji alone — and
// that vocabulary is slack/gate-reactions.ts.

// ── Correction / pushback vocabulary (Worker-side, drives control flow) ───────
//
// WHY THIS IS NOT A PROMPT RULE. On turn 2 the bot's own turn-1 claim sits in
// history as authoritative prose with no counter-evidence (tool results are
// never persisted). A prompt rule has to beat that, and it fires exactly when
// instruction-following is weakest. So the Worker classifies instead, the same
// way the proposal gate already drives control flow in the Worker.
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
 * On a hit the turn must (a) force `fresh: true` on search_blueprint so the 60s
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
//  2. WHETHER THIS IS A CORRECTION TURN, so `search_blueprint` can be forced to
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
  /** Names read_reference served this turn, in call order — the receipt that
   *  outlives the turn in place of the text (#423). */
  references: string[];
  receipt?: RetrievalReceipt;
  /** Set when a slack_search this turn came back EMPTY — carries the mode it
   *  ran under, so the delivery path can check the reply does not overclaim the
   *  absence. See agent/absence.ts. */
  absence?: AbsenceContext;
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
  /** True when the rows were served from the short-lived cache rather than read
   *  from the source on this turn. A cache hit is not a fetch performed now,
   *  which is exactly what a freshness claim asserts — the 2026-08-17 shape,
   *  where the bot said "I just checked" over cached rows. */
  cached?: boolean;
}

/** Run `fn` inside a fresh turn scope; returns its result, the tools used, and
 *  the retrieval receipt if one was recorded. */
export async function withTurnScope<T>(
  opts: { correction: boolean },
  fn: () => Promise<T>,
): Promise<{
  result: T;
  tools: string[];
  references: string[];
  receipt?: RetrievalReceipt;
  absence?: AbsenceContext;
}> {
  const store: {
    tools: Set<string>;
    correction: boolean;
    references: string[];
    receipt?: RetrievalReceipt;
    absence?: AbsenceContext;
  } = {
    tools: new Set<string>(),
    correction: opts.correction,
    references: [],
  };
  const result = await turnScope.run(store, fn);
  return {
    result,
    tools: [...store.tools],
    references: [...new Set(store.references)],
    receipt: store.receipt,
    absence: store.absence,
  };
}

/**
 * Note an EMPTY slack_search, with the visibility it ran under.
 *
 * Only the empty case is recorded: with results in hand the reply is talking
 * about what it found, and there is no absence to overclaim. Best-effort by
 * design — a malformed payload costs the check, never the turn.
 */
function recordAbsenceSignal(resultJson: string): void {
  const store = turnScope.getStore();
  if (!store) return;
  try {
    const p = JSON.parse(resultJson) as {
      results?: unknown[];
      visibility?: string;
      searched_surfaces?: string;
    };
    if (!Array.isArray(p.results) || p.results.length > 0) return;
    store.absence = {
      visibility: p.visibility ?? "unknown",
      searchedSurfaces: p.searched_surfaces ?? "unknown",
    };
  } catch {
    // no signal, no check — never a thrown turn
  }
}

/** Record what a lookup retrieved. Last write wins — the most recent search is
 *  the one a follow-up turn is pushing back on. No-op outside a turn scope. */
export function recordRetrieval(receipt: RetrievalReceipt): void {
  const store = turnScope.getStore();
  if (store) store.receipt = receipt;
}

/** Derive a receipt from a search_blueprint result payload. Best-effort by
 *  design: a malformed payload costs a receipt, never the turn. */
function recordBlueprintReceipt(resultJson: string): void {
  if (!turnScope.getStore()) return;
  try {
    const parsed = JSON.parse(resultJson) as {
      ok?: unknown;
      query?: unknown;
      count?: unknown;
      cached?: unknown;
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
      tool: "search_blueprint",
      query: parsed.query,
      ...(typeof path === "string" ? { path } : {}),
      count: typeof parsed.count === "number" ? parsed.count : rows.length,
      scenarios,
      ...(parsed.cached === true ? { cached: true } : {}),
    });
  } catch {
    // A receipt is diagnostic context, never load-bearing for the reply.
  }
}

/** True when the active turn was classified as a user correction. */
export function isCorrectionTurn(): boolean {
  return turnScope.getStore()?.correction === true;
}

// ── Read-only tool execution ─────────────────────────────────────────────────

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
  if (name === "search_blueprint") {
    // On a correction turn the cache MUST NOT answer — see withTurnScope.
    const out = await executeBlueprintSearch(env, isCorrectionTurn() ? { ...input, fresh: true } : input);
    // The receipt is derived HERE, not inside the tool, so blueprint-search.ts
    // stays free of an import back into this module (the value-level cycle this
    // file was extracted to break).
    recordBlueprintReceipt(out);
    return out;
  }
  if (name === "source_read") return executeReadSource(env, input, slack);
  if (name === "github_read") return executeGithubRead(env, input);
  if (name === "slack_thread_read") return executeSlackThreadRead(env, input);
  if (name === "slack_search") {
    const out = await executeSlackSearch(env, input, slack);
    // Derived HERE rather than inside the tool, so slack-search.ts stays free
    // of a value-level import back into this module — the same reason
    // recordBlueprintReceipt lives here.
    recordAbsenceSignal(out);
    return out;
  }
  if (name === "slack_react") return executeSlackReact(env, input, slack);
  if (name === "slack_user_profile") return executeSlackUserProfile(env, input);
  if (name === "slack_channel_members") return executeSlackChannelMembers(env, input);
  if (name === "read_reference") {
    // A property lookup, no fetch. Recorded on a HIT only: the receipt says
    // what the turn read, and a miss read nothing.
    const out = readReference(input);
    const store = turnScope.getStore();
    if (store) {
      try {
        const parsed = JSON.parse(out) as { ok?: unknown; name?: unknown };
        if (parsed.ok === true && typeof parsed.name === "string") store.references.push(parsed.name);
      } catch {
        // the receipt is a courtesy to the next turn, never load-bearing
      }
    }
    return out;
  }
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
  // Every emoji the gate would read as a decision is off-limits to the bot —
  // the same set the gate reads, imported rather than mirrored.
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
