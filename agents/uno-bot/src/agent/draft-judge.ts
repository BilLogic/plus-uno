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
// the active GEMINI_MODEL (low thinking); Anthropic lane → one haiku call.

import type { Env } from "../types";
import { geminiConfigured, geminiGenerate } from "../gemini/client";
import { makeAnthropicClient, MODELS } from "./anthropic-client";
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
- D9 confidence: a factual answer ends with a confidence line like "_Confidence: high — …_"; pure acknowledgements are exempt.

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

async function callJudgeModel(env: Env, userText: string, draft: string): Promise<string | null> {
  const prompt =
    `User message:\n${userText.slice(0, MAX_USER_CHARS)}\n\n` +
    `Draft reply:\n${draft.slice(0, MAX_DRAFT_CHARS)}`;

  const provider = (env.MODEL_PROVIDER ?? "anthropic").toLowerCase();
  if (provider === "gemini" && geminiConfigured(env)) {
    const res = await geminiGenerate(env, {
      system: JUDGE_SYSTEM,
      prompt,
      maxTokens: 6000, // room for a full revised draft
      thinkingLevel: "low",
    });
    if (!res.ok) throw new Error(res.error ?? "gemini judge call failed");
    return res.text ?? null;
  }

  if (env.ANTHROPIC_API_KEY) {
    const client = makeAnthropicClient(env);
    const msg = await client.messages.create({
      model: MODELS.haiku,
      max_tokens: 6000,
      system: JUDGE_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    return msg.content
      .filter((b): b is { type: "text"; text: string } & typeof b => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }

  return null; // no judge credential — caller treats as skip
}

/**
 * Judge a draft against the condensed rubric; return the text to send.
 * Never throws; never blocks a reply (fail open on error/timeout).
 */
export async function reviewDraft(
  env: Env,
  args: { userText: string; draft: string },
): Promise<JudgeOutcome> {
  const { userText, draft } = args;
  if (draft.trim().length < MIN_DRAFT_CHARS) {
    return { text: draft, verdict: "skip" }; // quick lookups stay quick — no log noise
  }

  const startedAt = Date.now();
  let verdict: JudgeOutcome["verdict"] = "error";
  let failed: string[] = [];
  let revisedUsed = false;
  let text = draft;

  try {
    const raw = await Promise.race([
      callJudgeModel(env, userText, draft),
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
        if (revised.length >= draft.trim().length * MIN_REVISION_RATIO) {
          text = revised;
          revisedUsed = true;
        } else {
          console.warn("[draft-judge] fail verdict but unusable revision — sending the original draft");
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
      `revised=${revisedUsed} ms=${Date.now() - startedAt} draft_chars=${draft.length}`,
  );
  return { text, verdict };
}
