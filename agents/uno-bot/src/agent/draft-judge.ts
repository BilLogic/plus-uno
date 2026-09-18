// Inline self-verification before substantive drafts go out (field-scan
// improvement #5, approved 2026-07-12 — "light D1–D9 judge pre-send").
//
// One cheap model call max per outgoing draft: the judge scores the draft
// against a condensed bot-answer rubric (docs/evals/rubrics/bot-answer.md) and,
// when it flags a failure, returns the revised draft IN THE SAME CALL — so
// "judge + revise once" never costs a second round-trip.
//
// Hard policies:
//   • SKIP entirely for short replies (< MIN_DRAFT_CHARS) — quick lookups and
//     acknowledgements never pay the judge tax.
//   • FAIL OPEN: any judge error/timeout/unparseable output → send the
//     ORIGINAL draft unchanged. The judge can only ever improve a reply,
//     never block one.
//   • One telemetry line per judged draft ([uno-bot] draft-judge …), same
//     pattern as the per-request line, so pass/fail rates are measurable via
//     `wrangler tail` / Workers Logs.
//
// THROUGH THE SEAM, ON A NAMED TIER (#605). This module used to read
// `MODEL_PROVIDER` itself and then pick a model and a thinking level per
// provider — the active GEMINI_MODEL at `low`, or Claude's chill model. Two
// things were wrong with that. `MODEL_PROVIDER` was read in two places while
// the code and CONTEXT.md both claimed one (`run-agent.ts`'s `selectProvider`,
// now the only reader and this module's supplier). And a model plus a level the
// caller chose is not a tier (ADR-028), so the judge was assembling a
// configuration nobody had named or measured.
//
// The judge now names `grind` and nothing else: the model, the thinking level,
// the prompt cache, the backup model and the per-call telemetry are the
// adapter's. On the Gemini lane that means `gemini-3.1-pro-preview` at `high`
// — where this module used to send that generation's flash model at `low` —
// which is more thinking and more latency per judged draft, accepted as part of
// the decision (2026-09-18) to stop maintaining an unnamed dial pair here.
//
// Taking a `ModelProvider` rather than an `Env` is also what lets the Node
// suite DRIVE the judge: tests/draft-judge.test.ts runs verdict parsing, the
// correction gate, the skip and the fail-open on the fake adapter, with no
// credential and no Workers runtime.

import { shouldRejectRevision, looksLikeStalledCorrection } from "./revision-guard";
import type { ModelProvider, ModelText } from "./model-provider";
import type { ModelTier } from "./routing";
import { BUILD } from "../version";

// ── the condensed rubric ────────────────────────────────────────────────────
//
// It lived in a leaf module of its own (`draft-judge-rubric.ts`, deleted by
// #595) so that `npm test` "can compile it without dragging the Workers-typed
// graph in". That was never this module's problem after #605 took the `Env` out
// of the judge, and it is nobody's problem now the test compile is a glob over
// `src/**`. The prompt belongs beside the call that sends it.
//
// Condensed from docs/evals/rubrics/bot-answer.md (D1–D9 + hard gates), limited
// to what is CHECKABLE from the draft text alone — the judge can't see tool
// results, so grounding is judged on internal signals (invented-looking links,
// claims with no source named), not on external truth.
//
// KEEP IT IN SYNC WITH THE CANONICAL RUBRIC — this is a copy, and a copy drifts.
// It already did once, and the drift was invisible for weeks: the confidence
// ritual was redesigned on 2026-07-16 from a trailing labelled rating to one
// woven clause, AGENT.md and bot-answer.md were both updated, and this prompt
// was not. The mechanism whose job is catching rubric violations went on
// REQUIRING the retired format, while nothing checked that the replacement
// ritual was present at all. Both halves reached users: a reply shipped with a
// trailing "Confidence: medium" (delivery.ts strips only "high", deliberately —
// a trailing "medium, from memory" is often a reply's only calibration, and
// deleting it reads as more certain than the model was), and a later reply on
// the same question shipped with no calibration whatsoever.
//
// 2026-08-22: the formatting gate was rewritten when the bot switched to
// standard Markdown as its one dialect. It used to FAIL a draft for
// "**double-asterisk bold**, markdown # headings … or markdown [label](url)
// links instead of <url|label>" — i.e. it enforced Slack mrkdwn, which is the
// dialect that renders WORST on the streaming path (`*bold*` is italic there).
// It now fails only bracket citations. A table gate lived here for an hour the
// same day and was removed on measurement: Slack renders tables.
//
// D9 itself was corrected upstream. tests/draft-judge-rubric.test.ts is the
// part that stops the next drift: it pins the dimension and reads bot-answer.md
// from disk, so the copy and the canonical source cannot disagree in silence.

export const JUDGE_SYSTEM = `You are a strict pre-send reviewer for uno-bot, the PLUS design team's Slack assistant. You receive the user's message and the bot's DRAFT reply. Judge ONLY what is visible in the draft.

Rubric (condensed from the team's D1–D9 bot-answer rubric):
- D1 answer quality: leads with the answer to what was asked; complete; scoped — no filler, no scaffolding ("Here is the breakdown"), no journey recap.
- D3 clarify-vs-act: if required inputs are clearly missing, the draft asks for them instead of guessing or using placeholders.
- D5 routing: people are referenced correctly (<@U…> mentions or names), channels as <#C…>; resources are hyperlinked [label](url) at the point of mention.
- D8 grounding: no fabrication signals — no URLs that look constructed rather than fetched, no confident claims explicitly from memory, no internal contradictions.
- D9 confidence: a factual answer carries exactly ONE woven clause saying what was checked or how sure it is ("checked the Roadmap board just now", "the docs I found are from May"). A trailing label — "_Confidence: high — …_", a one-word rating, a "based on…" footer — is RETIRED: fail a draft that ends with one. Fail also on two such clauses, or none at all. Pure acknowledgements are exempt.

HARD GATES (any one → verdict "fail"):
- Claims a gated action already happened ("I've filed the card") — actions must stay future/conditional until confirmed.
- Bracket citations: [1]-style footnotes, [RM-2292]-style ticket brackets, or a repo path in brackets used as a citation. Link at the point of mention instead.
- Leaks internal mechanics: tool names in snake_case, "Worker", "KV", model/tier names, token or tool budgets.
- Placeholder text left in ("TODO", "[insert …]", "lorem").

Do NOT fail a draft for facts you cannot verify, for tone, or for length alone. Prefer "pass" when in doubt.

Reply with STRICT JSON only, no code fences, no commentary:
  {"verdict":"pass"}
or
  {"verdict":"fail","failed":["D9","gate:formatting"],"revised":"<the FULL corrected draft — same content and voice, minimal edits, standard Markdown (**bold**, [label](url) links, - bullets, and tables where genuinely tabular)>"}`;

// Drafts under this length are never judged, unless a caller forces it — a
// correction turn, or the confidence pre-check. The floor targets
// deliverable-shaped output (PRD drafts, spec answers, recaps) and exempts
// ordinary conversational replies, because every judged reply pays one extra
// model round-trip of latency.
//
// Lowered 1500 -> 1000 on 2026-08-21 (Bill). 1500 was chosen against the
// judge's OTHER dimensions — overclaiming, invented links, structure — which
// really do cluster in long output. But a substantive blueprint answer with a
// couple of citations and a caveat lands around 1100-1400 characters, so it
// sat just under the old floor and went unjudged on every dimension, not only
// on the confidence clause. The pre-check forces D9 below this line anyway;
// this is about the rest of the rubric.
const MIN_DRAFT_CHARS = 1000;
// Hard wall-clock cap; past it the original draft ships (fail open).
const JUDGE_TIMEOUT_MS = 25_000;
// Inputs are capped so the judge call stays cheap and bounded.
const MAX_USER_CHARS = 2_000;
const MAX_DRAFT_CHARS = 8_000;
const MAX_PRIOR_CHARS = 4_000;
// A "revision" shorter than this fraction of the original is treated as a
// judge malfunction (e.g. it answered instead of revising) — original ships.
const MIN_REVISION_RATIO = 0.25;
// Room for a full revised draft to come back in the same call.
const JUDGE_MAX_TOKENS = 6000;

/**
 * The tier the judge grades on — the ONLY thing it says about the model.
 *
 * `grind` because a judge should be at least as strong as what it grades, and
 * because a tier is a model AND a thinking level moving together (ADR-028): the
 * judge naming a level of its own is how it ended up on a configuration no tier
 * described. Exported so the test can assert the tier rather than infer it.
 */
export const JUDGE_TIER: ModelTier = "grind";

/** Appended to the judge system prompt ONLY on a detected correction turn — the
 *  one-obligation-per-field rule that governs tool payloads applies here too.
 *
 *  The gate is deliberately narrow because the failure it catches is narrow: on
 *  2026-08-17 the bot, told its denial was wrong, restated the same three links
 *  at greater length and said "I checked … just now" while cached rows were
 *  being served. Neither a new source nor a concession appeared anywhere in it. */
const CORRECTION_GATE = `

CORRECTION TURN. The user's message is CORRECTING your previous reply, which is included above as "Previous reply". One extra HARD GATE applies, and it OVERRIDES "prefer pass when in doubt":
- The draft must EITHER cite a source that was fetched on this turn (the tools that ran this turn are listed above — a draft naming no source when tools ran, or naming only what the previous reply already named, does not count) OR plainly concede the previous reply was wrong.
- Restating the previous reply's content at greater length is a FAIL, however well written.
- A freshness claim ("I just checked", "re-ran that") when no lookup tool ran this turn is a FAIL.
Failure code: "gate:correction".`;

export interface JudgeOutcome {
  /** The text to send: the revised draft on a usable "fail", else the original. */
  text: string;
  verdict: "pass" | "fail" | "skip" | "error";
  /** Why, on a verdict that graded nothing. A skip fails open — the draft ships
   *  either way — so an unexplained one is indistinguishable in the logs from a
   *  draft the judge read and approved. `judgeSkipped` below is the only
   *  constructor for a skip, so no path can forget it; the same rule the eval
   *  judge keeps with its own `judgeSkipped` (#618). */
  reason?: string;
}

/** What a skip with no reason is recorded as — a bug, named rather than blank. */
const UNRECORDED_SKIP_REASON = "skipped for no recorded reason";

/** A skip, which always carries why, and always ships the draft unchanged. */
function judgeSkipped(draft: string, reason: string): JudgeOutcome {
  return { text: draft, verdict: "skip", reason: reason.trim() || UNRECORDED_SKIP_REASON };
}

interface JudgeJson {
  verdict?: unknown;
  failed?: unknown;
  revised?: unknown;
}

function parseJudgeJson(raw: string): JudgeJson | null {
  // Tolerate accidental code fences / prose around the JSON object.
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as JudgeJson;
  } catch {
    return null;
  }
}

async function callJudgeModel(
  provider: ModelProvider,
  userText: string,
  draft: string,
  ctx: {
    correction: boolean;
    priorAssistantText?: string;
    toolsUsedThisTurn: string[];
    stalled: boolean;
    extraInstruction?: string;
  },
): Promise<ModelText> {
  const prompt =
    (ctx.correction && ctx.priorAssistantText
      ? `Previous reply (the one the user is correcting):\n${ctx.priorAssistantText.slice(0, MAX_PRIOR_CHARS)}\n\n`
      : "") +
    // Deterministic evidence, computed before the call, so the judge is not
    // asked to eyeball similarity across two long texts.
    (ctx.stalled
      ? "MEASURED: this draft retains almost all of the previous reply's vocabulary — it is a restatement. Unless it plainly concedes the previous reply was wrong, fail it with \"gate:correction\".\n\n"
      : "") +
    // Sent on EVERY turn, not just corrections. D9 asks whether the draft says
    // what it rests on, and "cites a source fetched this turn" is unjudgeable
    // without knowing which tools ran — the judge was scoring that dimension
    // blind on every non-correction turn.
    `Tools that ran this turn: ${ctx.toolsUsedThisTurn.join(", ") || "(none)"}\n\n` +
    `User message:\n${userText.slice(0, MAX_USER_CHARS)}\n\n` +
    `Draft reply:\n${draft.slice(0, MAX_DRAFT_CHARS)}` +
    // A deterministic pre-check already decided WHAT is wrong; passing its one
    // sentence through beats asking the judge to rediscover it, and a specific
    // instruction is what keeps the repair from producing generic filler.
    (ctx.extraInstruction ? `\n\n${ctx.extraInstruction}` : "");

  const system = ctx.correction ? JUDGE_SYSTEM + CORRECTION_GATE : JUDGE_SYSTEM;

  // A tier, a system block, a prompt and a ceiling. Whether that is Gemini or
  // Claude, which model the tier resolves to, what level it thinks at and
  // whether a credential exists at all are all the adapter's side of the seam.
  return provider.generate({ tier: JUDGE_TIER, system, prompt, maxTokens: JUDGE_MAX_TOKENS });
}

/**
 * Judge a draft against the condensed rubric; return the text to send.
 * Never throws; never blocks a reply (fail open on error/timeout).
 */
export async function reviewDraft(
  provider: ModelProvider,
  args: {
    userText: string;
    draft: string;
    /** True when the Worker classified this turn as the user correcting the
     *  previous reply (run-agent looksLikeCorrection). Turns on the extra
     *  gate AND bypasses the length floor. */
    correction?: boolean;
    /** The reply being corrected. Only sent on a correction turn — the judge
     *  cannot see "restated the same thing" without it. */
    priorAssistantText?: string;
    /** Read-only tools executed this turn. "Cites a source fetched this turn"
     *  is unjudgeable without it. */
    toolsUsedThisTurn?: string[];
    /** Why this draft must be judged regardless of length — set by a caller
     *  that already found something wrong (the confidence pre-check passes the
     *  verdict kind). Bypasses the length floor exactly as `correction` does,
     *  and is logged so a forced judgement is distinguishable from a routine
     *  one when reading `wrangler tail`. */
    forceReason?: string;
    /** One extra line appended to the judge prompt. Carries the specific repair
     *  the caller's own check already identified. */
    extraInstruction?: string;
  },
): Promise<JudgeOutcome> {
  const { userText, draft, priorAssistantText, forceReason, extraInstruction } = args;
  const correction = args.correction === true;
  const toolsUsedThisTurn = args.toolsUsedThisTurn ?? [];
  // The length floor is BYPASSED on a correction. The 2026-08-17 denial that
  // started all this was short, so it was never judged — the one turn where the
  // judge had something to catch is the one it sat out.
  if (!correction && !forceReason && draft.trim().length < MIN_DRAFT_CHARS) {
    // Skips used to bypass telemetry entirely, so "the judge never ran" and
    // "the judge passed it" looked identical in the logs.
    console.log(
      `[uno-bot] draft-judge build=${BUILD} verdict=skip reason=short draft_chars=${draft.length} correction=no`,
    );
    return judgeSkipped(draft, "draft shorter than the judged floor");
  }

  // Deterministic mirror of shouldRejectRevision: a post-correction reply that
  // is near-identical to the reply it was correcting. Costs no model call.
  const stalled =
    correction && !!priorAssistantText && looksLikeStalledCorrection(priorAssistantText, draft);

  const startedAt = Date.now();
  let verdict: JudgeOutcome["verdict"] = "error";
  let reason = "";
  let failed: string[] = [];
  let revisedUsed = false;
  let text = draft;

  try {
    const answer = await Promise.race([
      callJudgeModel(provider, userText, draft, {
        correction,
        priorAssistantText,
        toolsUsedThisTurn,
        stalled,
        extraInstruction,
      }),
      new Promise<"__timeout__">((resolve) => setTimeout(() => resolve("__timeout__"), JUDGE_TIMEOUT_MS)),
    ]);

    if (answer === "__timeout__") {
      verdict = "error";
      reason = `timed out after ${JUDGE_TIMEOUT_MS}ms`;
      console.warn("[draft-judge] timed out — sending the original draft");
    } else if (answer.ok === false && answer.unavailable === true) {
      // NEVER ASKED: the adapter has no credential, so there is no judgement to
      // report either way. A skip, not an error — the distinction the seam's
      // third disposition exists to carry (#605), and the reason is the
      // adapter's own words about what is missing.
      verdict = "skip";
      reason = answer.message;
    } else if (answer.ok === false) {
      // ASKED AND DID NOT ANSWER — an error, which fails open to the original.
      verdict = "error";
      reason = answer.message;
      console.warn(`[draft-judge] judge call failed: ${answer.message} — sending the original draft`);
    } else {
      const raw = answer.text;
      const parsed = parseJudgeJson(raw);
      if (parsed?.verdict === "pass") {
        verdict = "pass";
      } else if (parsed?.verdict === "fail") {
        verdict = "fail";
        failed = Array.isArray(parsed.failed) ? parsed.failed.filter((f): f is string => typeof f === "string") : [];
        const revised = typeof parsed.revised === "string" ? parsed.revised.trim() : "";
        if (revised.length < draft.trim().length * MIN_REVISION_RATIO) {
          console.warn("[draft-judge] fail verdict but truncated revision — sending the original draft");
        } else if (shouldRejectRevision(draft, revised)) {
          // Length was the ONLY check until 2026-08-06, and a degenerate
          // revision is usually longer than the draft, so it passed. One
          // shipped to a user. The judge can lower quality as easily as raise
          // it; nothing was looking at what came back.
          console.warn("[draft-judge] revision diverges from the draft — sending the original draft");
        } else {
          text = revised;
          revisedUsed = true;
        }
      } else {
        verdict = "error";
        reason = "unparseable judge output";
        console.warn(`[draft-judge] unparseable judge output (${raw.slice(0, 120)}) — sending the original draft`);
      }
    }
  } catch (err) {
    verdict = "error"; // fail open
    reason = err instanceof Error ? err.message : String(err);
    console.warn(`[draft-judge] failed: ${reason} — sending the original draft`);
  }

  console.log(
    `[uno-bot] draft-judge build=${BUILD} verdict=${verdict} reason=${reason || "-"} ` +
      `failed=[${failed.join(",")}] ` +
      `revised=${revisedUsed} ms=${Date.now() - startedAt} draft_chars=${draft.length} ` +
      `correction=${correction ? "yes" : "no"} stalled=${stalled ? "yes" : "no"} ` +
      `forced=${forceReason ?? "no"} ` +
      `tools=[${toolsUsedThisTurn.join(",")}]`,
  );
  if (verdict === "skip") return judgeSkipped(text, reason);
  return { text, verdict, ...(reason ? { reason } : {}) };
}
