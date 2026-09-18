// The agent's one public entry: `runAgent(input)`.
//
// This module IS the loop's interface to the Worker. Everything the Worker
// hands an agent turn (`AgentInput`) enters here, and everything that needs an
// `Env` — the adapter construction, the system prompt, the tool roster, the
// ungated tool dispatch, the per-turn bookkeeping — stops here. Below it the
// loop (`loop.ts`) takes named ports and a `ModelProvider`, which is what lets
// it be compiled and driven by `tests/agent-loop.test.ts` with no Cloudflare
// runtime.
//
// WHAT WAS FOLDED IN HERE (#497), and why the shape is this one:
//   - `loop-shared.ts`, a bag of 29 re-exports over `loop.ts`, `loop-policy.ts`,
//     `model-provider.ts` and `tool-transcript.ts`. Every caller and every test
//     already reached the real module; the bag only made the loop's surface look
//     29 exports wide. Its own contents — `AgentInput`, the per-turn scope, the
//     correction vocabulary, the ungated tool dispatch — are the Env-facing
//     half of this entry, so they live here and the bag is gone.
//   - `gemini-agent.ts` and `claude-agent.ts`, two wiring functions that were
//     the same sixty lines with one differing expression (which adapter to
//     construct). Provider selection was a third file (`runAgent`) passing
//     through to them. All three are one function now: the choice of adapter is
//     an expression, not a module boundary, and the dispatch stopped being
//     exported because those two files were its only callers.
//   - `tool-definitions.ts`, a nine-line re-export of the JSON roster. Its only
//     importers were those same two files; the roster the model is offered is
//     now read off the tool table (`agent/tools.ts`), which is where the
//     schemas and what a tool IS are joined.
//
// Provider selection:
//   MODEL_PROVIDER = "gemini"        → providers/gemini.ts  (DEFAULT/production)
//   MODEL_PROVIDER = "vertex-claude" → providers/claude.ts  (Claude on Vertex AI,
//                                       billed to the GCP project; opt-in)
// Flipping MODEL_PROVIDER is the whole switch. Vertex-Claude degrades to the
// Gemini adapter when its service-account credentials are absent, so a mis-set
// flag costs the opt-in rather than the turn. Everything downstream — the
// proposal gate, delivery, history — is provider-blind because both adapters
// answer the same `ModelProvider` seam (CONTEXT.md § ModelProvider).

import { AsyncLocalStorage } from "node:async_hooks";
import type { AbsenceContext } from "./absence";
import type { Env, SlackContext } from "../types";
import { proposalOperations } from "../thread-state/index";
import type { HistoryTurn, PendingProposal } from "../thread-state/index";
import type { AgentImage, ProviderConversationTurn } from "./provider-conversation";
import { buildProviderConversation } from "./provider-conversation";
import { buildSystemBlocks } from "./skills";
import { routeRequest } from "./routing";
import { threadStateFor } from "../thread-state/production";
import {
  isSubrequestBudgetError,
  meterBreakdown,
  subrequestBudgetTrips,
  subrequestsUsed,
  withSubrequestLimit,
} from "../net";
import { claudeVertexConfigured, claudeVertexRaw } from "../vertex/claude";
import { runLoop, type AgentResult, type LoopBudget, type TurnDials } from "./loop";
import { geminiProvider } from "./providers/gemini";
import { claudeProvider } from "./providers/claude";
import type { ModelTier } from "./routing";
import type { ModelProvider, SystemBlock, ToolSpec } from "./model-provider";
import type { ToolBody } from "./tool-bodies";
import { isToolName, type ToolName } from "./tool-table";
import { TOOLS, TOOLS_BY_NAME } from "./tools";
import type { ToolCall, ToolResultNote } from "./tool-transcript";

export type { HistoryTurn };
export type { AgentImage } from "./provider-conversation";
export type { AgentResult, TurnDials } from "./loop";

// ── The provider-neutral contract (input of one agent turn) ──────────────────

export interface AgentInput {
  env: Env;
  userText: string;
  /**
   * The tier this turn is running at, already routed.
   *
   * Routing is a TURN decision — it reads the words the person typed and
   * whether a proposal is pending (#498) — and the tier travels from there as
   * an opaque name the adapter maps to a model and its dials. Absent when the
   * caller has not routed, in which case this entry routes on the text it was
   * handed; that fallback is why a turn and its loop could disagree about the
   * tier, each routing on a different string.
   */
  tier?: ModelTier;
  /** Why that tier — carried for the turn's one telemetry line. */
  routeReason?: string;
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
  /** The clarify-vs-act check, already bound to the thread by the caller. The
   *  loop asks it before staging a side-effect call so a refusal can go back to
   *  the model as that call's result; callers that omit it stage unchecked and
   *  leave the check to whoever runs it afterwards. */
  preflight?: (name: string, args: Record<string, unknown>) => Promise<{ ask: string } | null>;
  /** When the turn began. Passed straight through to the loop, which uses it to
   *  ignore a stop flag raised before this turn — see `loop.ts` `cancelSince`. */
  cancelSince?: number;
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

// ── The entry ────────────────────────────────────────────────────────────────

/** The loop's budget port over the real per-invocation meter (net.ts, ADR-022). */
const liveBudget: LoopBudget = {
  used: subrequestsUsed,
  trips: subrequestBudgetTrips,
  withLookupLimit: withSubrequestLimit,
  isBudgetError: isSubrequestBudgetError,
  breakdown: meterBreakdown,
};

export async function runAgent(input: AgentInput): Promise<AgentResult> {
  const { env, userText, history, currentSender, pending, images, slack, assistantContext } = input;
  const conversation = input.conversation ?? buildProviderConversation(history, userText, images);

  // Routing reads turn knowledge (the words, whether a proposal is pending) and
  // produces an opaque tier NAME. The adapter maps that name to a model and a
  // thinking level (ADR-028); nothing between the two knows either.
  //
  // The Turn module routes and hands the name down (#498), so the common path
  // takes it as given rather than routing a second time on a different string —
  // `userText` here is the model's whole context block, not the question the
  // person typed, and routing the two separately is how a turn and its loop came
  // to disagree about the tier. A caller that has not routed still gets routed
  // for, on what it did hand over.
  const routed = routeRequest({
    userText,
    hasPending: pending !== null,
    override: input.tierOverride,
  });
  const tier = input.tier ?? routed.tier;
  const routeReason = input.tier ? (input.routeReason ?? "routed-by-turn") : routed.reason;

  const pendingForSystem = pending
    ? {
        operations: proposalOperations(pending),
        toolName: pending.toolName,
        input: pending.input,
        requesterUserId: pending.requesterUserId,
      }
    : null;
  const blocks = await buildSystemBlocks(env, pendingForSystem, currentSender, assistantContext);
  // Block 0 is the harness: identical for every request on this build, and so
  // the only block a provider cache can hold. Everything after it is
  // per-request — who sent this, what proposal is pending.
  const system: SystemBlock[] = blocks.map((b, i) => ({ text: b.text, stable: i === 0 }));

  // Off the tool table, not off the schema file: the table's join is what
  // refuses a schema with no row and a row with no schema, and building the
  // model's roster through it is what makes that refusal reach a deployment.
  // `tool-definitions.json` is still where every schema is written.
  const tools: ToolSpec[] = TOOLS.map((t) => ({
    name: t.name,
    description: t.schema.description,
    input_schema: t.schema.input_schema,
  }));

  // Keyed like the CONVERSATION, not the thread. `/stop` arrives carrying only
  // a channel, so the key it can compute is the one this must read: a DM
  // collapses to the single "dm" conversation (mirroring conversationTs in
  // events.ts), a channel uses its thread.
  //
  // PASSED IN (slack.conversationTs) rather than re-derived, because
  // re-deriving it is exactly how the two ends drifted: an explicitly threaded
  // DM resolves to the thread, not to "dm", and the expression below cannot
  // know that. The fallback keeps the old behaviour for any caller that has not
  // supplied it. One mechanism, read in one place, whichever adapter answers.
  const cancelThread =
    slack?.conversationTs ?? (slack?.channel?.startsWith("D") ? "dm" : (slack?.threadTs ?? "dm"));

  return runLoop({
    provider: selectProvider(env),
    deps: {
      executeReadOnlyTool: (name, args) => executeUngatedTool(env, name, args, slack),
      threadState: threadStateFor(env),
      budget: liveBudget,
      ...(input.preflight ? { preflight: input.preflight } : {}),
    },
    tier,
    routeReason,
    conversation,
    system,
    tools,
    pending,
    currentSenderId: currentSender.userId,
    cancelKey: slack?.channel ? { channel: slack.channel, thread: cancelThread } : null,
    ...(input.cancelSince !== undefined ? { cancelSince: input.cancelSince } : {}),
    onInterim: input.onInterim,
    onDials: input.onDials,
    onToolCall: input.onToolCall,
    onToolResult: input.onToolResult,
  });
}

/**
 * Which adapter answers — the ONE place `MODEL_PROVIDER` is read, and now
 * actually the only one (#605): the draft judge read it too until it started
 * taking a provider built here, and `scripts/provider-read.test.mjs` fails
 * the build if a second reader appears.
 *
 * EXPORTED for that reason. Every caller that wants a model — the loop's own
 * turn below, and the draft judge through `turn/env-deps.ts` — takes the
 * provider this returns, so "which provider" is decided once per `Env` rather
 * than re-derived per caller from the same var.
 *
 * The Claude adapter takes a transport port rather than an `Env`, so it compiles
 * in the Node test build and `tests/claude-provider.test.ts` drives a whole
 * Claude-shaped turn with a stubbed rawPredict and no network.
 */
export function selectProvider(env: Env): ModelProvider {
  const provider = (env.MODEL_PROVIDER ?? "gemini").toLowerCase();
  if (provider === "vertex-claude" && claudeVertexConfigured(env)) {
    return claudeProvider({
      transport: (model, body) => claudeVertexRaw(env, model, body),
      defaultModel: env.CLAUDE_MODEL,
    });
  }
  return geminiProvider(env);
}

// ── Confirm/cancel vocabulary: there is none ─────────────────────────────────
//
// CONFIRM_PHRASES / CANCEL_PHRASES, bareResolution and looksLikeResolution
// lived in this contract until 2026-08-22. A typed reply to a pending proposal now goes to
// the model, which reads it with <pending_proposal> in context and calls
// proposal_resolve. The only deterministic resolution left is an emoji — a
// reaction on the card, a button on the card, or a typed emoji alone — and
// that vocabulary is slack/gate-reactions.ts.

// ── Correction / pushback vocabulary ────────────────────────────────────────
//
// It lives in `agent/correction.ts`, import-free, because the module that ACTS
// on it is Turn (`turn/turn.ts`) — which `tsconfig.test.json` compiles, and
// this entry, which reaches every tool body, it cannot. Re-exported here
// because this is the agent's one public surface, and `isCorrectionTurn` below
// is the scope's own read of the same fact.
export { looksLikeCorrection, correctionDirective } from "./correction";

// ── Per-turn scope: tool ledger + correction flag ────────────────────────────
//
// Two things have to cross frames the AgentInput contract does not carry:
//
//  1. WHICH TOOLS RAN. The draft judge gates a correction reply on whether it
//     cites something fetched this turn; the executions happen deep inside
//     the loop, and the judge runs in slack/events.ts, several frames above.
//  2. WHETHER THIS IS A CORRECTION TURN, so `search_blueprint` can be forced to
//     `fresh: true` at the boundary. Left to the model, a pushback re-runs a
//     near-identical query and the SAME rows come back under an "I just
//     re-checked" claim — a cache serving a lie.
//
// Rather than thread a context object through the loop's signature, this
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
function recordRetrieval(receipt: RetrievalReceipt): void {
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
function isCorrectionTurn(): boolean {
  return turnScope.getStore()?.correction === true;
}

// ── Ungated tool dispatch ────────────────────────────────────────────────────
//
// ONE LOOKUP. A call names a tool, the table answers with that tool's row, and
// the row carries both the standing that says whether this dispatch may run it
// and the body that runs it (`agent/tools.ts`).
//
// It was a chain of eleven `if (name === …)` comparisons ending in an
// `ok:false` that read "not read-only or not implemented" (#597). That ending
// was reachable for a tool the model had been correctly offered: a name in the
// union with no arm in the chain fell off the end and came back as a
// non-answer the model could not tell from a real refusal, and nothing held
// the chain and the union equal. There is no end to fall off now — every
// `ungated` row has a body by type, so the arm cannot be the missing thing.
//
// The two guards below refuse facts about the NAME that arrived, neither of
// them about this dispatch's coverage: a name that is no tool at all (the
// model invented one), and a tool that is not `ungated` (the loop peels those
// off, so one arriving here is a caller bug). Both answer `ok:false` rather
// than throw, because the model is the reader.

/**
 * What the TURN knows that the tool does not — composed around the body rather
 * than folded into it.
 *
 * A body is the tool, and `tool-bodies.ts` is where it is paired with its row.
 * These three wrappers read the per-turn scope instead: whether this is a
 * correction turn, and what the turn should remember having looked at. That is
 * the dispatch's knowledge, so it stays with whoever dispatches. A row with no
 * wrapper runs its body as it stands.
 *
 * The receipts are derived HERE rather than inside the tools, so
 * `blueprint-search.ts` and `slack-search.ts` stay free of a value-level
 * import back into this module — the cycle this file was extracted to break.
 */
const TURN_WRAPPERS: Partial<Record<ToolName, (body: ToolBody) => ToolBody>> = {
  search_blueprint: (body) => async (env, input, slack) => {
    // On a correction turn the cache MUST NOT answer — see withTurnScope.
    const out = await body(env, isCorrectionTurn() ? { ...input, fresh: true } : input, slack);
    recordBlueprintReceipt(out);
    return out;
  },
  slack_search: (body) => async (env, input, slack) => {
    const out = await body(env, input, slack);
    recordAbsenceSignal(out);
    return out;
  },
  read_reference: (body) => async (env, input, slack) => {
    const out = await body(env, input, slack);
    recordReferenceHit(out);
    return out;
  },
};

async function executeUngatedTool(
  env: Env,
  name: string,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  // Ledger first: a tool that THREW still ran, and "did this turn fetch
  // anything?" is a question about attempts, not successes.
  turnScope.getStore()?.tools.add(name);
  if (!isToolName(name)) {
    return JSON.stringify({ ok: false, error: `no tool named '${name}'` });
  }
  const row = TOOLS_BY_NAME[name];
  if (row.access !== "ungated") {
    return JSON.stringify({
      ok: false,
      error: `'${name}' is ${row.access} and does not run inside the turn`,
    });
  }
  const wrap = TURN_WRAPPERS[name];
  return (wrap ? wrap(row.run) : row.run)(env, input, slack);
}

/**
 * Record a `read_reference` HIT on the turn's reference list.
 *
 * A property lookup, no fetch — and a miss read nothing, so only a hit is
 * worth carrying past the turn (#423). Best-effort: the list is a courtesy to
 * the next turn, never load-bearing.
 */
function recordReferenceHit(resultJson: string): void {
  const store = turnScope.getStore();
  if (!store) return;
  try {
    const parsed = JSON.parse(resultJson) as { ok?: unknown; name?: unknown };
    if (parsed.ok === true && typeof parsed.name === "string") store.references.push(parsed.name);
  } catch {
    // the receipt is a courtesy to the next turn, never load-bearing
  }
}
