// Whether a Figma frame now shows what a thread settled (#897): the one
// judgement behind "don't ask" and "withdraw the question".
//
// It reads the frame's TEXT LAYERS, the same evidence the drift detector read
// when it found the drift (`sweep/detector.ts`), because the model seam takes
// text only (`ModelProvider.generate`). So a decision about layout or visuals
// cannot be confirmed here: the judge says so, and the person is asked.
//
// ONLY A CONFIDENT YES COUNTS. A reply off the shape, a model that failed or
// was never configured, and a yes under `CONFIDENCE_FLOOR` are all "unsure",
// and "unsure" means the question is asked, or stays. A wrong "shows" would
// silence a real question; a wrong "unsure" costs one ask a person can answer.
//
// PURE: the provider is a parameter, so tests replay recorded replies through
// the fake adapter, as the detector's tests do.

import type { ModelProvider } from "../agent/model-provider";
import { CONFIDENCE_FLOOR, DETECTOR_TIER, jsonObjectIn } from "../sweep/detector";

/** Characters of the frame's text the judge is shown. */
const MAX_FRAME_CHARS = 4_000;
const MAX_SAID_CHARS = 300;
const JUDGE_MAX_TOKENS = 400;

export const FRAME_MATCH_SYSTEM = [
  "A Slack thread settled a change to a Figma design. You are shown what it settled, what the frame showed when the change was found, and the frame's text layers now.",
  "Decide whether the frame NOW shows the settled change.",
  "- shows: true only when the text layers plainly show it — the new copy, the new label, the item now there or now gone.",
  "- A change the text layers cannot show (a layout, a colour, spacing, an icon, an interaction) is shows: false. So is a frame that only partly shows it, or that you are unsure of.",
  "Reply with JSON only, no prose, in exactly this shape:",
  '{"shows":true|false,"confidence":0.0}',
  "- confidence: 0 to 1 that your answer is right.",
].join("\n");

/** What one judgement is made from. */
export interface FrameJudgeInput {
  /** What the thread settled. */
  threadSays: string;
  /** What the file showed when the drift was found. */
  sourceSays: string;
  frame: { name: string; texts: readonly string[]; truncated: boolean };
}

export type FrameVerdict = "shows" | "unsure";

/** The judge as the drift jobs take it. */
export type FrameJudge = (input: FrameJudgeInput) => Promise<FrameVerdict>;

/** The judge over a ModelProvider, on the detector's tier. */
export function modelFrameJudge(provider: ModelProvider): FrameJudge {
  return async (input) => {
    const reply = await provider.generate({
      tier: DETECTOR_TIER,
      system: FRAME_MATCH_SYSTEM,
      prompt: frameMatchPrompt(input),
      maxTokens: JUDGE_MAX_TOKENS,
    });
    return reply.ok ? parseFrameMatch(reply.text) : "unsure";
  };
}

/** The prompt: the decision, the frame as it was, the frame as it is. */
export function frameMatchPrompt(input: FrameJudgeInput): string {
  const text = input.frame.texts.join("\n");
  return [
    `SETTLED: ${cap(input.threadSays, MAX_SAID_CHARS)}`,
    `THE FRAME SHOWED THEN: ${cap(input.sourceSays, MAX_SAID_CHARS)}`,
    "",
    `THE FRAME NOW — "${input.frame.name}", its text layers in order${input.frame.truncated ? " (only the first ones: the frame holds more)" : ""}:`,
    text ? cap(text, MAX_FRAME_CHARS) : "(no text layers)",
  ].join("\n");
}

/**
 * The reply, read strictly: "shows" only for `{"shows": true}` with a
 * confidence at or over the floor.
 *
 * @param text - The model's reply
 */
export function parseFrameMatch(text: string): FrameVerdict {
  const raw = jsonObjectIn(text) as { shows?: unknown; confidence?: unknown } | null;
  if (!raw || raw.shows !== true) return "unsure";
  const confidence = typeof raw.confidence === "number" ? raw.confidence : Number.NaN;
  return confidence >= CONFIDENCE_FLOOR && confidence <= 1 ? "shows" : "unsure";
}

function cap(text: string, max: number): string {
  const flat = text.trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}
