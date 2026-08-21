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
// Provider-aware like the agent loops: Gemini lane → one generateContent on
// the active GEMINI_MODEL (low thinking); Vertex-Claude lane → one chill call.

import { shouldRejectRevision, looksLikeStalledCorrection } from "./revision-guard";
import type { Env } from "../types";
import { geminiConfigured, geminiGenerate } from "../gemini/client";
import { claudeVertexConfigured, claudeVertexGenerate } from "../vertex/claude";
import { MODELS } from "./routing";
import { BUILD } from "../version";

// Drafts under this length are never judged. 1500 chars targets deliverable-
// shaped output (PRD drafts, spec answers, recaps) and exempts ordinary
// conversational replies — the judge's failure modes (overclaiming, invented
// links, structure) barely occur below this, and every judged reply pays one
// extra model round-trip of latency.
const MIN_DRAFT_CHARS = 1500;
// Hard wall-clock cap; past it the original draft ships (fail open).
const JUDGE_TIMEOUT_MS = 25_000;
// Inputs are capped so the judge call stays cheap and bounded.
const MAX_USER_CHARS = 2_000;
const MAX_DRAFT_CHARS = 8_000;
const MAX_PRIOR_CHARS = 4_000;
// A "revision" shorter than this fraction of the original is treated as a
// judge malfunction (e.g. it answered instead of revising) — original ships.
const MIN_REVISION_RATIO = 0.25;

// Condensed from docs/evals/rubrics/bot-answer.md (D1–D9 + hard gates),
// limited to what is CHECKABLE from the draft text alone — the judge can't
// see tool results, so grounding is judged on internal signals (invented-
// looking links, claims with no source named), not on external truth.
const JUDGE_SYSTEM = `You are a strict pre-send reviewer for uno-bot, the PLUS design team's Slack assistant. You receive the user's message and the bot's DRAFT reply. Judge ONLY what is visible in the draft.

Rubric (condensed from the team's D1–D9 bot-answer rubric):
- D1 answer quality: leads with the answer to what was asked; complete; scoped — no filler, no scaffolding ("Here is the breakdown"), no journey recap.
- D3 clarify-vs-act: if required inputs are clearly missing, the draft asks for them instead of guessing or using placeholders.
- D5 routing: people are referenced correctly (<@U…> mentions or names), channels as <#C…>; resources are hyperlinked <url|label> at the point of mention.
- D8 grounding: no fabrication signals — no URLs that look constructed rather than fetched, no confident claims explicitly from memory, no internal contradictions.
- D9 confidence: a factual answer carries exactly ONE woven clause saying what was checked or how sure it is ("checked the Roadmap board just now", "the docs I found are from May"). A trailing label — "_Confidence: high — …_", a one-word rating, a "based on…" footer — is RETIRED: fail a draft that ends with one. Fail also on two such clauses, or none at all. Pure acknowledgements are exempt.

HARD GATES (any one → verdict "fail"):
- Claims a gated action already happened ("I've filed the card") — actions must stay future/conditional until confirmed.
- Broken Slack formatting: **double-asterisk bold**, markdown # headings, [1]-style bracket citations, or markdown [label](url) links instead of <url|label>.
- Leaks internal mechanics: tool names in snake_case, "Worker", "KV", model/tier names, token or tool budgets.
- Placeholder text left in ("TODO", "[insert …]", "lorem").

Do NOT fail a draft for facts you cannot verify, for tone, or for length alone. Prefer "pass" when in doubt.

Reply with STRICT JSON only, no code fences, no commentary:
  {"verdict":"pass"}
or
  {"verdict":"fail","failed":["D9","gate:formatting"],"revised":"<the FULL corrected draft — same content and voice, minimal edits, Slack mrkdwn (*single-asterisk bold*, <url|label> links)>"}`;

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
  env: Env,
  userText: string,
  draft: string,
  ctx: {
    correction: boolean;
    priorAssistantText?: string;
    toolsUsedThisTurn: string[];
    stalled: boolean;
    extraInstruction?: string;
  },
): Promise<string | null> {
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

  // Judge on the active lane, defaulting to Gemini (production).
  const provider = (env.MODEL_PROVIDER ?? "gemini").toLowerCase();
  if (provider === "vertex-claude" && claudeVertexConfigured(env)) {
    const res = await claudeVertexGenerate(env, {
      model: MODELS.chill,
      system,
      prompt,
      maxTokens: 6000, // room for a full revised draft
    });
    if (!res.ok) throw new Error(res.error ?? "vertex-claude judge call failed");
    return res.text ?? null;
  }

  if (geminiConfigured(env)) {
    const res = await geminiGenerate(env, {
      system,
      prompt,
      maxTokens: 6000, // room for a full revised draft
      thinkingLevel: "low",
    });
    if (!res.ok) throw new Error(res.error ?? "gemini judge call failed");
    return res.text ?? null;
  }

  return null; // no judge credential — caller treats as skip
}

/**
 * Judge a draft against the condensed rubric; return the text to send.
 * Never throws; never blocks a reply (fail open on error/timeout).
 */
export async function reviewDraft(
  env: Env,
  args: {
    userText: string;
    draft: string;
    /** True when the Worker classified this turn as the user correcting the
     *  previous reply (loop-shared looksLikeCorrection). Turns on the extra
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
    return { text: draft, verdict: "skip" };
  }

  // Deterministic mirror of shouldRejectRevision: a post-correction reply that
  // is near-identical to the reply it was correcting. Costs no model call.
  const stalled =
    correction && !!priorAssistantText && looksLikeStalledCorrection(priorAssistantText, draft);

  const startedAt = Date.now();
  let verdict: JudgeOutcome["verdict"] = "error";
  let failed: string[] = [];
  let revisedUsed = false;
  let text = draft;

  try {
    const raw = await Promise.race([
      callJudgeModel(env, userText, draft, {
        correction,
        priorAssistantText,
        toolsUsedThisTurn,
        stalled,
        extraInstruction,
      }),
      new Promise<"__timeout__">((resolve) => setTimeout(() => resolve("__timeout__"), JUDGE_TIMEOUT_MS)),
    ]);

    if (raw === "__timeout__") {
      verdict = "error";
      console.warn("[draft-judge] timed out — sending the original draft");
    } else if (raw === null) {
      verdict = "skip"; // no judge credential configured
    } else {
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
        console.warn(`[draft-judge] unparseable judge output (${raw.slice(0, 120)}) — sending the original draft`);
      }
    }
  } catch (err) {
    verdict = "error"; // fail open
    console.warn(`[draft-judge] failed: ${err instanceof Error ? err.message : String(err)} — sending the original draft`);
  }

  console.log(
    `[uno-bot] draft-judge build=${BUILD} verdict=${verdict} failed=[${failed.join(",")}] ` +
      `revised=${revisedUsed} ms=${Date.now() - startedAt} draft_chars=${draft.length} ` +
      `correction=${correction ? "yes" : "no"} stalled=${stalled ? "yes" : "no"} ` +
      `forced=${forceReason ?? "no"} ` +
      `tools=[${toolsUsedThisTurn.join(",")}]`,
  );
  return { text, verdict };
}
