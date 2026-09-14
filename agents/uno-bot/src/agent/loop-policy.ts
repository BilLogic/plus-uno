// The loop's policy: the dials it runs on, the strings it feeds back, the
// narration filter, and the authorization check on the model's own
// `proposal_resolve` call.
//
// WHY IT IS ITS OWN FILE. `loop.ts` is provider-free AND runtime-free: it names
// no `Env`, no Workers type, no `fetch`, so `tsconfig.test.json` compiles it and
// the loop's own behaviour is testable against a fake adapter without a network
// or a Durable Object. These values used to live in the shared-constants bag
// (`loop-shared.ts`), which reached every tool body and so dragged the whole
// Workers type graph behind it — importing them from there would have put the
// loop back out of reach of its own tests. The bag is gone (#497) and every
// caller names this file.
//
// Nothing provider-specific belongs here. A model id, a thinking level and a
// wire shape are the adapter's business (see `model-provider.ts`).

import type { PendingProposal } from "../thread-state/index";

// ── Loop dials ───────────────────────────────────────────────────────────────

// Raised from 5: grounding questions legitimately chain several read-only
// searches before the model has enough to answer. If exhausted, the loop falls
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
// Durable Object and KV hops are a separate 1,000 bucket). Call 51 kills the
// invocation, and because POSTING the reply also costs a subrequest, it dies
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
// `truncated: true`, and there is no table left to drift. ADR-022.
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

// ── Shared prompt strings ────────────────────────────────────────────────────

/** Fed back as a tool result when the read-only budget is spent. */
export const BUDGET_EXHAUSTED_LOOKUP_NOTE =
  "Answer NOW from the tool results you already have; if they're insufficient, say exactly what's missing — do not fabricate. If the user asked for an ACTION (filing a card, sending something), you can and should still invoke that one action tool now — actions are not lookups. NEVER mention budgets, limits, turns, or tool mechanics to the user (live 2026-07-10: 'my tool run budget has been exhausted' reached a designer and read as a malfunction). If you couldn't gather everything the user asked for, deliver what you DO have and briefly offer to continue on the SPECIFIC missing piece (e.g. \"I've got X — want me to check Y next?\") — framed as a natural next step, never as an error or a limit.";

/** The tool result a refused lookup reports, ready to hand back. */
export function budgetRefusedResult(): string {
  return JSON.stringify({
    ok: false,
    error: "no more lookups available this turn",
    note: BUDGET_EXHAUSTED_LOOKUP_NOTE,
  });
}

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

/** What a cancelled turn says. A `/stop` lands at a tool boundary, so nothing
 *  was half-written and the message can promise that outright. */
export const STOPPED_MESSAGE =
  "Stopped there — I didn't finish that one. Nothing was created or changed.";

// ── Interim-narration filter ─────────────────────────────────────────────────

// Between-tool narration is surfaced to the user as SHORT separate messages
// (never in the final reply). Capped at 3 per request and ~280 chars each; only
// the first line of a narration block is used. The full monologue is never
// exposed (user decision 2026-07-10 after a delivered reply included seven
// paragraphs of it). Returns an emit(raw) the loop calls with candidate text.
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

// ── proposal_resolve validation (Worker-side authorization) ──────────────────

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
