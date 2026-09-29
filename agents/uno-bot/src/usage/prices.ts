// The checked-in price table the usage record estimates a turn's cost from.
//
// USD per million tokens, list prices, read 2026-09-29:
//   - Gemini: ai.google.dev/gemini-api/docs/pricing (paid tier, prompts
//     ≤200k tokens). uno-bot is billed through Vertex AI, whose rates are not
//     reproduced here; these are the published list rates, and the column is
//     an ESTIMATE for that reason.
//   - Claude: Anthropic's first-party rates. On Vertex, Claude is
//     partner-priced and may differ.
// A model absent from this table is priced at null, never at zero, so an
// unpriced turn shows up in a query instead of reading as free. Update the
// table when a tier's model changes (src/agent/gemini-tiers.ts,
// src/agent/providers/claude.ts, wrangler.toml's GEMINI_* vars).

export interface ModelRates {
  /** Fresh (uncached) prompt tokens. */
  input: number;
  /** Output tokens, thinking included — both providers bill thinking as output. */
  output: number;
  /** Prompt tokens served from a cache. */
  cachedInput: number;
}

interface PriceWindow {
  /** Epoch ms the rate stops applying; absent for the open-ended current rate. */
  until?: number;
  rates: ModelRates;
}

const JAN_1_2027 = Date.UTC(2027, 0, 1);

/** Oldest window first; the first window whose `until` is after the turn wins. */
export const PRICE_TABLE: Readonly<Record<string, readonly PriceWindow[]>> = {
  "gemini-3.8-flash": [
    { until: JAN_1_2027, rates: { input: 0.75, output: 3.75, cachedInput: 0.075 } },
    { rates: { input: 1.5, output: 7.5, cachedInput: 0.15 } },
  ],
  "gemini-3.7-flash": [
    { until: JAN_1_2027, rates: { input: 0.75, output: 3.75, cachedInput: 0.075 } },
    { rates: { input: 1.5, output: 7.5, cachedInput: 0.15 } },
  ],
  "gemini-3.5-flash-lite": [{ rates: { input: 0.3, output: 2.5, cachedInput: 0.03 } }],
  "gemini-3.1-pro-preview": [{ rates: { input: 2, output: 12, cachedInput: 0.2 } }],
  "gemini-2.5-pro": [{ rates: { input: 1.25, output: 10, cachedInput: 0.125 } }],
  "claude-sonnet-5": [{ rates: { input: 2, output: 10, cachedInput: 0.2 } }],
  "claude-opus-4-8": [{ rates: { input: 5, output: 25, cachedInput: 0.5 } }],
  "claude-haiku-4-5": [{ rates: { input: 1, output: 5, cachedInput: 0.1 } }],
};

/** The rates for `model` at `at`, or null when the table does not price it.
 *  A Vertex `@version` suffix is ignored: it pins a snapshot, not a price. */
export function ratesFor(model: string, at: number): ModelRates | null {
  const windows = PRICE_TABLE[model.split("@")[0] ?? model];
  if (!windows) return null;
  return (windows.find((w) => w.until === undefined || at < w.until) ?? null)?.rates ?? null;
}

/** Token counts as a `ModelProvider` reports them (`agent/model-provider.ts`). */
export interface TokenSpend {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cachedInputTokens: number;
}

/**
 * The estimated USD cost of one turn's tokens, or null for an unpriced model.
 *
 * The two adapters count differently, and this is where that is reconciled:
 *   - Gemini's prompt count INCLUDES the cached tokens, and its thinking count
 *     is separate from its output count;
 *   - Claude's input count EXCLUDES cache reads (they arrive on their own), and
 *     its output count already includes thinking, which it reports as 0.
 * So fresh input is `input - cached` for Gemini and `input` for Claude, and
 * output is `output + thinking` for both.
 */
export function estimateCostUsd(
  provider: string,
  model: string,
  spend: TokenSpend,
  at: number,
): number | null {
  const rates = ratesFor(model, at);
  if (!rates) return null;
  const fresh =
    provider === "gemini"
      ? Math.max(0, spend.inputTokens - spend.cachedInputTokens)
      : spend.inputTokens;
  const usd =
    (fresh * rates.input +
      spend.cachedInputTokens * rates.cachedInput +
      (spend.outputTokens + spend.thinkingTokens) * rates.output) /
    1_000_000;
  // Micro-dollar precision: enough for a per-turn cost, and stable in a query.
  return Math.round(usd * 1_000_000) / 1_000_000;
}
