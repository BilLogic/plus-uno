// The DM detector: one thread of a person's DM with uno-bot in, three kinds
// of item out.
//
//   • UNANSWERED (F6) — uno-bot's own new answer said it could not find what
//     was asked, or was not sure of it. An answer that gave a source is none.
//   • DISAGREEMENT (C6) — uno-bot's own new answer said two sources disagree
//     (Figma and code on the warning colour, a PRD and a Roadmap card).
//   • DECISION (C7) — the person's new message states a decision the team has
//     made ("we decided the recap goes weekly"). An opinion, a wish or a
//     question is none.
//
// It asks the `chill` tier through ModelProvider's one-shot `generate`, the
// seam every sweep detector takes (ADR-028). The prompt lives beside its
// parse because the two are one contract: anything off the shape is dropped,
// never repaired.
//
// WHAT IS NEW. A message after the DM's cursor — except uno-bot's own posts,
// which it tags (a sweep card, the F6 ask, the raise card, a batch result):
// those are shown as context and are never new, so a card uno-bot posted in
// the morning is never read back as an answer that night (`isFresh`).
//
// WHAT THE PARSE REFUSES: an item on a message that is not one of tonight's
// new ones; an unanswered or disagreement item on a message that is not
// uno-bot's, and a decision on one that is; a summary, topic or source name
// empty once markup is stripped (`cleanWhat`); a disagreement whose two
// sources are the same; a topic that repeats five or more of the person's
// words in a row — what may leave the DM is uno-bot's words, never theirs; and
// a confidence under `DM_CONFIDENCE_FLOOR`.
//
// PURE: the provider is a parameter, so tests replay recorded replies through
// the fake adapter (tests/dm-detector.test.ts, and the eval cases in
// docs/evals/fixtures/dm-cases.json).

import type { ModelProvider } from "../agent/model-provider";
import { cleanWhat } from "../commitments/copy";
import type { DmMessage } from "../sweep/run";

/** Items the detector is less sure of than this are dropped. */
export const DM_CONFIDENCE_FLOOR = 0.7;
export const DM_TIER = "chill" as const;
/** Characters of thread text the prompt carries; past it the oldest messages
 *  are left out and the root stays. */
export const MAX_DM_THREAD_CHARS = 12_000;
const MAX_MESSAGE_CHARS = 1_500;
const MAX_SOURCE_NAME_CHARS = 40;
const MAX_TOKENS = 2_000;
/** Consecutive words of the person's a topic may not repeat. */
const QUOTE_RUN = 5;

export const DM_DETECTOR_SYSTEM = [
  "You read one thread of a person's direct messages with uno-bot, the design team's assistant, and report three kinds of item in its NEW messages.",
  "UNANSWERED: a NEW uno-bot message says it could not find what the person asked, or that it is not sure of the answer (\"I couldn't find…\", \"nothing I can read says…\", \"I'm not certain, but…\"). An answer that names or links a source for what it says is NOT unanswered, even when it hedges.",
  "DISAGREEMENT: a NEW uno-bot message says two sources disagree about something — Figma and the code, a PRD and a Roadmap card, two pages.",
  "DECISION: a NEW message from the person states a decision the team has made (\"we decided the recap goes weekly\", \"we're going with the blue header\"). NOT a decision: an opinion or a preference (\"I think it should be weekly\"), a proposal, a question, or a plan one person has not agreed with anyone.",
  "Reply with JSON only, no prose, in exactly this shape:",
  '{"unanswered":[{"answer_ts":"…","what":"…","confidence":0.0}],"disagreements":[{"answer_ts":"…","topic":"…","sources":["…","…"],"design_system":true|false,"confidence":0.0}],"decisions":[{"message_ts":"…","confidence":0.0}]}',
  "- answer_ts: the ts of the NEW uno-bot message.",
  "- what: what the person was looking for, as it would follow \"I couldn't find\" — a short noun phrase, at most 10 words, in your own words, no quotes, no names.",
  "- topic: what the two sources disagree on, as it would follow \"disagree on\" — at most 6 words, in your own words, never the person's.",
  "- sources: the two sources' short names (\"Figma\", \"the code\", \"the booking PRD\").",
  "- design_system: true when the disagreement is about the design system — the Figma library, design-system code, Storybook, tokens or components.",
  "- message_ts: the ts of the person's NEW message stating the decision.",
  "- confidence: 0 to 1.",
  'Nothing → {"unanswered":[],"disagreements":[],"decisions":[]}.',
].join("\n");

export interface DmUnanswered {
  answerTs: string;
  /** Cleaned (`cleanWhat`). */
  what: string;
  confidence: number;
}

export interface DmDisagreement {
  answerTs: string;
  /** Cleaned, and never the person's own words. */
  topic: string;
  sources: [string, string];
  designSystem: boolean;
  confidence: number;
}

export interface DmDecision {
  messageTs: string;
  confidence: number;
}

export type DmDetection =
  | { ok: true; unanswered: DmUnanswered[]; disagreements: DmDisagreement[]; decisions: DmDecision[] }
  | { ok: false; error: string };

/** The detector as the DM thread hook takes it. */
export interface DmDetector {
  detect(input: { rootTs: string; messages: readonly DmMessage[]; since: string }): Promise<DmDetection>;
}

/** The detector over a ModelProvider. */
export function modelDmDetector(provider: ModelProvider): DmDetector {
  return { detect: (input) => detectDmItems(provider, input) };
}

/**
 * Whether a message is one of tonight's new ones: after the cursor, and not
 * one of uno-bot's own tagged posts — a card, an ask, a note — which are
 * context only.
 */
export function isFresh(m: DmMessage, since: string): boolean {
  return isNew(m.ts, since) && !(m.byBot && m.tag);
}

/** A new message of either side: the gate on the model call. A thread with
 *  nothing new — uno-bot's own posts aside — costs none. */
export function mayHoldDmItem(messages: readonly DmMessage[], since: string): boolean {
  return messages.some((m) => isFresh(m, since) && m.text.trim().length > 0);
}

/**
 * Detect the items in one DM thread's new messages.
 *
 * @param provider - The model seam; asked at most once, on the `chill` tier
 * @param input.messages - The thread, both sides, root first
 * @param input.since - The DM's cursor: messages after it are new
 */
export async function detectDmItems(
  provider: ModelProvider,
  input: { rootTs: string; messages: readonly DmMessage[]; since: string },
): Promise<DmDetection> {
  const none = { ok: true as const, unanswered: [], disagreements: [], decisions: [] };
  if (!mayHoldDmItem(input.messages, input.since)) return none;
  const shown = withinChars(input.messages, input.rootTs);
  const reply = await provider.generate({
    tier: DM_TIER,
    system: DM_DETECTOR_SYSTEM,
    prompt: dmDetectorPrompt(shown, input.since),
    maxTokens: MAX_TOKENS,
  });
  if (!reply.ok) return { ok: false, error: reply.message };
  return { ok: true, ...parseDmReply(reply.text, shown, input.since) };
}

/** The prompt: the thread, oldest first, each side named, new messages marked. */
export function dmDetectorPrompt(messages: readonly DmMessage[], since: string): string {
  const lines = ["THREAD (oldest first; NEW marks tonight's messages):"];
  for (const m of messages) {
    const who = m.byBot ? "uno-bot" : "person";
    lines.push(`${isFresh(m, since) ? "NEW " : ""}[${m.ts}] ${who}: ${cap(m.text, MAX_MESSAGE_CHARS)}`);
  }
  return lines.join("\n");
}

/**
 * The reply, validated against the messages it was shown. Off-shape entries
 * are dropped one at a time; a reply that is not JSON is nothing.
 */
export function parseDmReply(
  text: string,
  shown: readonly DmMessage[],
  since: string,
): { unanswered: DmUnanswered[]; disagreements: DmDisagreement[]; decisions: DmDecision[] } {
  const raw = (jsonObjectIn(text) ?? {}) as Record<string, unknown>;
  const byTs = new Map(shown.map((m) => [m.ts, m] as const));
  const personTexts = shown.filter((m) => !m.byBot).map((m) => m.text);
  const newBy = (ts: unknown, bot: boolean): DmMessage | null => {
    const m = byTs.get(str(ts));
    return m && isFresh(m, since) && m.byBot === bot ? m : null;
  };
  const entries = (key: string): Record<string, unknown>[] =>
    (Array.isArray(raw[key]) ? (raw[key] as unknown[]) : []).filter(
      (e): e is Record<string, unknown> => !!e && typeof e === "object",
    );

  const unanswered: DmUnanswered[] = [];
  for (const e of entries("unanswered")) {
    const m = newBy(e.answer_ts, true);
    const confidence = confidenceOf(e.confidence);
    const what = cleanWhat(str(e.what));
    if (!m || confidence === null || !what || unanswered.some((u) => u.answerTs === m.ts)) continue;
    unanswered.push({ answerTs: m.ts, what, confidence });
  }

  const disagreements: DmDisagreement[] = [];
  for (const e of entries("disagreements")) {
    const m = newBy(e.answer_ts, true);
    const confidence = confidenceOf(e.confidence);
    const topic = cleanWhat(str(e.topic));
    const names = (Array.isArray(e.sources) ? e.sources : []).map((s) => capWords(nameOf(str(s)), MAX_SOURCE_NAME_CHARS));
    if (!m || confidence === null || !topic || names.length !== 2 || !names[0] || !names[1]) continue;
    if (names[0].toLowerCase() === names[1].toLowerCase()) continue;
    if (repeatsPerson(topic, personTexts)) continue;
    if (disagreements.some((d) => d.answerTs === m.ts && d.topic.toLowerCase() === topic.toLowerCase())) continue;
    disagreements.push({ answerTs: m.ts, topic, sources: [names[0], names[1]], designSystem: e.design_system === true, confidence });
  }

  const decisions: DmDecision[] = [];
  for (const e of entries("decisions")) {
    const m = newBy(e.message_ts, false);
    const confidence = confidenceOf(e.confidence);
    if (!m || confidence === null || decisions.some((d) => d.messageTs === m.ts)) continue;
    decisions.push({ messageTs: m.ts, confidence });
  }
  return { unanswered, disagreements, decisions };
}

/**
 * Whether `text` repeats `QUOTE_RUN` or more of the person's words in a row —
 * a quote, which may not leave the DM.
 *
 * @param text - What would leave
 * @param personTexts - The person's messages
 */
export function repeatsPerson(text: string, personTexts: readonly string[]): boolean {
  const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const mine = words(text);
  if (mine.length < QUOTE_RUN) return false;
  const theirs = personTexts.map((t) => ` ${words(t).join(" ")} `);
  for (let i = 0; i + QUOTE_RUN <= mine.length; i++) {
    const run = ` ${mine.slice(i, i + QUOTE_RUN).join(" ")} `;
    if (theirs.some((t) => t.includes(run))) return true;
  }
  return false;
}

/** The root, then the newest messages that fit. */
function withinChars(messages: readonly DmMessage[], rootTs: string): DmMessage[] {
  const size = (m: DmMessage) => Math.min(m.text.length, MAX_MESSAGE_CHARS) + 40;
  const root = messages.find((m) => m.ts === rootTs);
  let left = MAX_DM_THREAD_CHARS - (root ? size(root) : 0);
  const kept: DmMessage[] = [];
  for (const m of [...messages].reverse()) {
    if (m === root) continue;
    if (size(m) > left) break;
    left -= size(m);
    kept.unshift(m);
  }
  return root ? [root, ...kept] : kept;
}

/** A source's name, cleaned as a summary is, keeping its own capital
 *  ("Figma", not "figma"). */
function nameOf(raw: string): string {
  const cleaned = cleanWhat(raw);
  if (!cleaned) return "";
  const upper = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return raw.includes(upper.slice(0, Math.min(upper.length, 6))) ? upper : cleaned;
}

function confidenceOf(v: unknown): number | null {
  return typeof v === "number" && v >= DM_CONFIDENCE_FLOOR && v <= 1 ? v : null;
}

function isNew(ts: string, since: string): boolean {
  return Number(ts) > Number(since);
}

function jsonObjectIn(text: string): unknown {
  const from = text.indexOf("{");
  const to = text.lastIndexOf("}");
  if (from < 0 || to <= from) return null;
  try {
    return JSON.parse(text.slice(from, to + 1));
  } catch {
    return null;
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function cap(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function capWords(text: string, max: number): string {
  return text.length > max ? text.slice(0, max).replace(/\s+\S*$/, "").trim() : text;
}
