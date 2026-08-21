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
// The rubric text lives in its own leaf module so `npm test` can compile it
// without dragging the Workers-typed graph in — see draft-judge-rubric.ts.
import { JUDGE_SYSTEM } from "./draft-judge-rubric";
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
  ctx: { correction: boolean; priorAssistantText?: string; toolsUsedThisTurn: string[]; stalled: boolean },
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
    (ctx.correction ? `Tools that ran this turn: ${ctx.toolsUsedThisTurn.join(", ") || "(none)"}\n\n` : "") +
    `User message:\n${userText.slice(0, MAX_USER_CHARS)}\n\n` +
    `Draft reply:\n${draft.slice(0, MAX_DRAFT_CHARS)}`;

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
  },
): Promise<JudgeOutcome> {
  const { userText, draft, priorAssistantText } = args;
  const correction = args.correction === true;
  const toolsUsedThisTurn = args.toolsUsedThisTurn ?? [];
  // The length floor is BYPASSED on a correction. The 2026-08-17 denial that
  // started all this was short, so it was never judged — the one turn where the
  // judge had something to catch is the one it sat out.
  if (!correction && draft.trim().length < MIN_DRAFT_CHARS) {
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
      callJudgeModel(env, userText, draft, { correction, priorAssistantText, toolsUsedThisTurn, stalled }),
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
      `tools=[${toolsUsedThisTurn.join(",")}]`,
  );
  return { text, verdict };
}
