// ModelProvider — the seam between the one agent loop and a model.
//
// The loop decides what a turn DOES: whether another iteration is affordable,
// whether `/stop` was pressed, what a side-effect call becomes, when a lookup
// is refused, when to give up and synthesise, whether to retry after a failure.
// An adapter decides what a model SEES and how its answer is read: the wire
// shape, the system-prompt mechanics, the tier's model and dials, the cache, the
// backup model, the tool-result echo discipline.
//
// Two ways through: a TURN (`start` / `send` / `recordToolResults` …), which is
// the loop's, and a one-shot `generate`, which is for every other caller that
// wants text back from a named tier and no tools at all.
//
// So everything crossing this file is neutral. A `functionCall` part, a
// `tool_use` block, a `pause_turn`, a thought signature, a `cachedContent`
// reference: none of those names may appear above an adapter. That is what lets
// one loop serve Gemini in production, Claude via Vertex (#496) and a scripted
// fake in tests, and what lets a budget, cancellation or synthesis fix land once.
//
// PURE by design — no `Env`, no Workers type, no fetch — so `tsconfig.test.json`
// compiles it and the fake adapter beside the loop's own tests.

import type { ModelTier } from "./routing";
import type { ProviderConversationTurn } from "./provider-conversation";

/** One tool as the roster offers it to a model. The schema travels as written
 *  in `tool-definitions.json`; an adapter converts it to its own dialect. */
export interface ToolSpec {
  name: string;
  description: string;
  input_schema: unknown;
}

/**
 * One block of the system prompt the loop composed.
 *
 * `stable` marks the block that is identical for every request on this build —
 * the harness. It is the only block a cache can hold, and the only one that may
 * be sent separately from the rest, so the distinction is the loop's to make and
 * the adapter's to exploit.
 */
export interface SystemBlock {
  text: string;
  stable: boolean;
}

/** A tool call the model asked for, neutral. `id` is whatever the adapter needs
 *  to pair a result back to this call; the loop only carries it. */
export interface ModelToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

/** One answer to one call, going back to the model. */
export interface ModelToolResult {
  id: string;
  name: string;
  text: string;
  /** Marks a refusal rather than an answer, where the wire format distinguishes
   *  them. Purely advisory: the text says it either way. */
  isError?: boolean;
}

/** Token spend for the whole turn, as far as the provider reported it. */
export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  /** Prompt tokens served from a cache rather than billed fresh. */
  cachedInputTokens: number;
}

/**
 * Why the model stopped.
 *
 * `end` — it is done talking; `text` is the reply.
 * `tool` — it wants the calls in `toolCalls` answered.
 * `paused` — server-side work (a hosted web search) interrupted the turn; the
 *   loop records the reply and calls again, with no tools to run in between.
 */
export type ModelStop = "end" | "tool" | "paused";

/**
 * One model round-trip's outcome.
 *
 * A FAILURE is data, not a throw, because the loop is the thing that decides
 * what a status means: it asks the adapter whether a backup model exists for
 * that status and retries if one does. An adapter that threw would be making
 * that call on the loop's behalf.
 */
export type ModelReply =
  | { ok: true; text: string; toolCalls: ModelToolCall[]; stop: ModelStop }
  | { ok: false; status: number; message: string };

/** What the last send actually ran on. `model` is named because every provider
 *  has one; everything else is `detail`, so no provider's dial — a Gemini
 *  thinking level, a Claude thinking budget — sits in a shared field that the
 *  other provider has to report as null. */
export interface ProviderDials {
  model: string;
  detail: Record<string, string>;
}

/**
 * One prompt-and-reply with no tools and no history — everything `generate`
 * needs.
 *
 * The caller names a TIER and nothing else about the model, exactly as it does
 * for a turn: the tier's model and its dials move together inside the adapter
 * (ADR-028), so nothing that comes through here spells a model id. (One caller
 * still bypasses the seam and names a model itself — the diagnostics probe,
 * whose whole job is to check one provider's credential; the draft judge came
 * through here in #605. The contract is about what crosses this file.)
 */
export interface ModelPrompt {
  tier: ModelTier;
  /** The instruction block, when there is one. Omitted rather than empty. */
  system?: string;
  prompt: string;
  /** Output ceiling for this call. The adapter's own default applies without it;
   *  a caller expecting a long answer (a re-drafted reply) should say so. */
  maxTokens?: number;
}

/**
 * What a one-shot came back with. `model` is named for the same reason
 * `ProviderDials` names it — every provider has one, and a caller's telemetry
 * line wants to say which answered.
 *
 * A FAILURE is data here too, but there is no status: only some providers give
 * one, and a field the others must report as null is the mistake `ProviderDials`
 * avoids. The status, where there is one, is inside `message`.
 *
 * THREE DISPOSITIONS, because "did not answer" and "was never asked" are not
 * the same fact about a run:
 *
 *   `ok: true`                    — the model answered; `text` is the answer.
 *   `ok: false`                   — it WAS asked and something went wrong: a
 *                                   429, a timeout, an empty candidate.
 *   `ok: false, unavailable: true` — it was NEVER asked, because the adapter
 *                                   cannot ask: no credential, no endpoint.
 *
 * The third arm landed in #605 (it was left open by #604) for the draft judge,
 * whose two outcomes are not interchangeable: a judge that errored should be
 * reported as an error, and a judge that was never configured should be
 * reported as a skip. Collapsing them is the fail-open blindness the eval
 * judge's own skip reasons exist to prevent.
 *
 * WHICH ADAPTER DECIDES IS THE POINT. How a provider authenticates is exactly
 * what this seam hides, so the alternative — the caller checking credentials
 * before it calls — would put one adapter's auth knowledge above the seam, and
 * add a second check the day a second provider is asked to judge.
 *
 * `unavailable` is optional-and-false on the failure arm rather than absent
 * from it, so `res.unavailable === true` NARROWS: TypeScript's excess-property
 * check does not run on a value already typed, and two arms that differ only
 * by an extra property would otherwise be mutually assignable.
 */
export type ModelText =
  | { ok: true; model: string; text: string }
  | { ok: false; unavailable?: false; model: string; message: string }
  | { ok: false; unavailable: true; model: string; message: string };

/** Everything an adapter needs to open a turn. */
export interface ModelTurn {
  /** Opaque to the adapter's caller: the loop never maps a tier to a model.
   *  The adapter does, and re-derives it if it falls back. */
  tier: ModelTier;
  conversation: ProviderConversationTurn[];
  system: SystemBlock[];
  tools: ToolSpec[];
}

export interface ModelProvider {
  /** Provider label for the turn's telemetry — "gemini", "fake". */
  readonly name: string;

  /**
   * One prompt, one reply, no tools and no history — a single round-trip that
   * stands entirely outside a turn.
   *
   * This is for the callers that are not the loop: the draft judge scoring a
   * draft, a probe checking a credential, a one-line classification. It reads
   * nothing the adapter is holding and writes nothing back, so it may be called
   * before `start`, after it, or beside a turn in flight without disturbing it.
   *
   * The tier is the only thing the caller says about the model.
   */
  generate(prompt: ModelPrompt): Promise<ModelText>;

  /**
   * Open the turn. The adapter builds its wire-shaped message list here and
   * holds it for the rest of the turn; warming a cache belongs here too, so the
   * Worker entry never has to.
   */
  start(turn: ModelTurn): Promise<void>;

  /**
   * One model round-trip.
   *
   * @param opts.toolsEnabled - False for the synthesis pass. The roster stays
   *   declared (a history containing tool results is rejected without it); the
   *   model is told it may not call.
   */
  send(opts: { toolsEnabled: boolean }): Promise<ModelReply>;

  /**
   * Append the model's own last reply, then these results, to the adapter's
   * transcript.
   *
   * The reply goes back VERBATIM — that is what preserves a thought signature
   * or a paused block. Every call the last reply announced must be answered, or
   * the next send fails on an orphaned call; an empty `results` is therefore
   * meaningful only after a `paused` stop, where the reply announced nothing.
   */
  recordToolResults(results: ModelToolResult[]): void;

  /** Append a plain user turn — the loop's synthesis nudge. */
  recordUserText(text: string): void;

  /**
   * Switch to a backup model for `status`, for the rest of the turn.
   *
   * @returns True when a backup existed and the adapter switched, so the loop
   *   should retry the same send. False when there is none — the loop then
   *   surfaces the failure. Called at most once per turn by the loop.
   */
  fallback(status: number): boolean;

  /** What the last send ran on. */
  dials(): ProviderDials;

  /** Token spend so far this turn. */
  usage(): ModelUsage;
}
