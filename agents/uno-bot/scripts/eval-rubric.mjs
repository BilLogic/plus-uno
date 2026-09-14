// The bot-answer rubric, read from the document that owns it (#511).
//
// The judge prompt used to carry its own condensed paraphrase of D1–D9 as a
// string constant in run-evals.mjs, beside the canonical rubric in
// docs/evals/rubrics/bot-answer.md. Two copies of "what good means" is one copy
// too many: D9 was redesigned on 2026-07-16 (the trailing confidence affix
// retired) and the paraphrase happened to be updated with it — nothing made
// that happen, and nothing would have said so if it had not.
//
// So the rubric has one home. The judge loads the document and quotes its
// dimensions block VERBATIM: not summarised, not reordered, not reworded, so a
// dimension added or a definition sharpened reaches the judge on the next run
// with no second edit. scripts/eval-rubric.test.mjs asserts that every D-id in
// the document reaches the prompt, so a rubric edit cannot be silently dropped.

import { readFileSync } from "node:fs";

/** The canonical rubric. Resolved from this file, not from the cwd: the runner
 *  is invoked from the repo root by the Action and from agents/uno-bot by the
 *  tests, and the rubric sits at neither place relative to both. */
export const RUBRIC_PATH = new URL("../../../docs/evals/rubrics/bot-answer.md", import.meta.url);

/**
 * One top-level frontmatter block, verbatim — the key line and every indented
 * line under it, stopping at the next top-level key or the end of the
 * frontmatter.
 *
 * Deliberately textual rather than a YAML parse. What the judge should read is
 * the rubric AS WRITTEN, wording and ordering included; a parse-and-reformat
 * would quietly become a third rendering of it.
 *
 * @param {string} doc - the whole markdown document
 * @param {string} key - e.g. "dimensions"
 * @returns {string} the block, newline-joined, or "" when the key is absent
 */
export function extractBlock(doc, key) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(doc);
  if (!fm) return "";
  const lines = fm[1].split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (start === -1) return "";
  const out = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    // A top-level key ends the block; a blank line inside it does not.
    if (line.trim() !== "" && !/^\s/.test(line)) break;
    out.push(line);
  }
  // Trailing blank lines belong to the gap, not to the block.
  while (out.length && out[out.length - 1].trim() === "") out.pop();
  return out.join("\n");
}

/** Every dimension id the block declares, in document order. */
export function dimensionIds(block) {
  return [...String(block).matchAll(/^\s*-\s*id:\s*(D\d+)\s*$/gm)].map((m) => m[1]);
}

/**
 * Load the rubric's D1–D9 block.
 *
 * Throws when the document carries no dimensions. A judge running without a
 * rubric would grade on the model's own idea of "good" and report verdicts that
 * look exactly like rubric verdicts — failing loudly is the only honest option.
 *
 * @param {string|URL} [path]
 * @returns {{path: string, block: string, ids: string[]}}
 */
export function loadRubric(path = RUBRIC_PATH) {
  const doc = readFileSync(path, "utf8");
  const block = extractBlock(doc, "dimensions");
  const ids = dimensionIds(block);
  if (!ids.length) {
    throw new Error(`no dimensions block in ${path} — the judge has no rubric to grade against`);
  }
  return { path: String(path), block, ids };
}

/** What the run logged it graded against: "9 dimensions (D1–D9)". */
export function describeRubric(rubric) {
  const { ids } = rubric;
  return `${ids.length} dimension${ids.length === 1 ? "" : "s"} (${ids[0]}–${ids[ids.length - 1]})`;
}

/**
 * The judge's system instruction, built from the rubric block.
 *
 * The framing around the quote is the judge's JOB (what it receives, what it
 * may conclude, the reply shape); the rubric inside it is the LENS. Only the
 * framing lives here.
 */
export function judgeSystem(rubric) {
  return [
    `You are a strict evaluator for uno-bot, the PLUS design team's Slack agent. You receive one eval case (its expectation and failure condition) and the bot's actual transcript (prompts, narration, final result JSON). Judge ONLY what the transcript shows against the case's expectation, informed by the team's bot-answer rubric below — the case's expectation is the question, the rubric's dimensions are the lens.`,
    ``,
    `The rubric, verbatim from docs/evals/rubrics/bot-answer.md:`,
    rubric.block,
    ``,
    `A "proposal" result means the action was STAGED behind a human confirmation — it did not execute. Reply with STRICT JSON only: {"verdict":"pass"} or {"verdict":"fail","reason":"<one sentence>"}.`,
  ].join("\n");
}
