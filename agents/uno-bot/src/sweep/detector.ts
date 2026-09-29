// The drift detector: one thread and the sources it links in, typed findings
// out.
//
// It asks the `chill` tier through ModelProvider's one-shot `generate` — a
// tier, a system block and a prompt; which model that is stays the adapter's
// (ADR-028). The prompt lives here, beside the parse, because the two are one
// contract: the reply is JSON in the shape the system block asks for, and
// anything off that shape is dropped rather than repaired.
//
// WHAT THE PARSE REFUSES, and why each is a refusal rather than a guess:
//   • a source the thread did not link — the model named a page nobody read;
//   • on a writable source, a block the model was not shown IN FULL — a
//     replace overwrites the whole block, so a block too long to show whole
//     is never offered, and the stamp kept is the READ's, never the model's
//     (ADR-029);
//   • evidence that is not a message in the thread;
//   • a replacement that is empty or changes nothing, one carrying a
//     truncation marker the block does not, one longer than the cap, and one
//     that drops more than `MAX_DROPPED_SHARE` of the block's words when no
//     evidence message asks for a removal (`replacementProblem`);
//   • a confidence under `CONFIDENCE_FLOOR`.
// `claimed_by` survives only as a candidate: owner routing honours it when the
// person posted in the thread (`routeOwner`).
//
// PURE: the provider is a parameter, so tests replay recorded replies through
// the fake adapter (tests/sweep-detector.test.ts, and the eval cases in
// docs/evals/fixtures/sweep-drift-cases.json).

import type { ModelProvider } from "../agent/model-provider";
import type { SweepSource, SweepThread } from "./finding";

/** Findings the detector is less sure of than this are dropped. */
export const CONFIDENCE_FLOOR = 0.7;

/** The detector's tier: a comparison, not a turn. */
export const DETECTOR_TIER = "chill" as const;

const MAX_MESSAGE_CHARS = 1_200;
const MAX_SOURCE_CHARS = 4_000;
/** A writable block longer than this is not offered at all: shown cut, its
 *  replacement would overwrite the part the model never saw. */
export const MAX_OFFERED_BLOCK_CHARS = 2_000;
/** The whole of what one source offers for rewriting, block by block, in page
 *  order; blocks past it are not offered. */
export const MAX_OFFERED_CHARS_PER_SOURCE = 12_000;
const MAX_SAID_CHARS = 300;
/** A replacement past this is refused, never cut. */
const MAX_REPLACEMENT_CHARS = 4_000;
/** Share of a block's length, in words, a replacement may shed without an
 *  evidence message asking for a removal — once it sheds more than
 *  `MIN_DROPPED_WORDS`, so a short line reworded ("Owner: design team" →
 *  "Owner: Bea") is not read as a cut. */
export const MAX_DROPPED_SHARE = 0.25;
const MIN_DROPPED_WORDS = 5;
/** What a model writes where it shortened something. */
const TRUNCATION_MARKS = ["…", "[...]", "(...)"];
/** Words in an evidence message that ask for something to go. */
const REMOVAL_WORDS = /\b(remove|removed|removing|delete|deleted|drop|dropped|cut|scrap|scrapped|no longer|get rid of|take out|strike)\b/i;
const DETECTOR_MAX_TOKENS = 8_000;

export const DRIFT_DETECTOR_SYSTEM = [
  "You compare one Slack thread with the sources it links and report DRIFT.",
  "Drift is a point the thread SETTLED — a decision, a changed date, owner, scope or status, a correction someone accepted — that a linked source still states the old way.",
  "Not drift:",
  "- the source already says what the thread says (agreement);",
  "- a proposal, question, idea or open disagreement nobody settled (a near-miss);",
  "- a detail the source never mentions.",
  "Reply with JSON only, no prose, in exactly this shape:",
  '{"findings":[{"source_url":"…","block_id":"…","source_says":"…","thread_says":"…","replacement":"…","evidence_ts":["…"],"claimed_by":"U…"|null,"confidence":0.0}]}',
  "- source_url: one of the listed sources, verbatim.",
  "- block_id: for a WRITABLE source, the id of the one block that states the old thing, from its list; for a read-only source, null.",
  "- replacement: for a writable source, the block's full new text — its current text with only what the thread changed; for a read-only source, \"\".",
  "- source_says / thread_says: one short sentence each.",
  "- evidence_ts: the ts of the thread messages that settle it.",
  "- claimed_by: the Slack user id of whoever claimed or did the work in the thread, or null.",
  "- confidence: 0 to 1 that this is real drift the owner would want fixed.",
  'Nothing drifts → {"findings":[]}.',
].join("\n");

/** One validated finding, before owner routing. */
export interface DetectedDrift {
  source: SweepSource;
  blockId: string | null;
  lastEditedTime: string | null;
  /** The block's whole text as read — what the replacement replaces. */
  original: string;
  sourceSays: string;
  threadSays: string;
  replacement: string;
  evidenceTs: string[];
  claimedBy: string | null;
  confidence: number;
}

/** What one detection came to. A failure is data: the job decides. */
export type DetectorResult = { ok: true; findings: DetectedDrift[] } | { ok: false; error: string };

/** The detector as the sweep job takes it. */
export interface DriftDetector {
  detect(input: { thread: SweepThread; sources: SweepSource[] }): Promise<DetectorResult>;
}

/** The detector over a ModelProvider. */
export function modelDriftDetector(provider: ModelProvider): DriftDetector {
  return { detect: (input) => detectDrift(provider, input) };
}

/**
 * Detect drift in one thread.
 *
 * @param provider - The model seam; asked once, on the `chill` tier
 * @param input - The thread and the sources it links, read
 */
export async function detectDrift(
  provider: ModelProvider,
  input: { thread: SweepThread; sources: SweepSource[] },
): Promise<DetectorResult> {
  const reply = await provider.generate({
    tier: DETECTOR_TIER,
    system: DRIFT_DETECTOR_SYSTEM,
    prompt: detectorPrompt(input.thread, input.sources),
    maxTokens: DETECTOR_MAX_TOKENS,
  });
  if (!reply.ok) return { ok: false, error: reply.message };
  return { ok: true, findings: parseDetectorReply(reply.text, input.thread, input.sources) };
}

/** The prompt: the thread, oldest first, then each source. */
export function detectorPrompt(thread: SweepThread, sources: SweepSource[]): string {
  const lines = ["THREAD (oldest first):"];
  for (const m of thread.messages) lines.push(`[${m.ts}] <@${m.user}>: ${cap(m.text, MAX_MESSAGE_CHARS)}`);
  sources.forEach((s, i) => {
    lines.push("", `SOURCE ${i + 1} — ${s.writable ? "WRITABLE" : "read-only"} — ${s.title}`, `url: ${s.url}`);
    if (s.writable) {
      const offered = offeredBlocks(s);
      lines.push("blocks (id · full text):");
      for (const b of offered) lines.push(`${b.id} · ${b.text}`);
      const left = s.blocks.length - offered.length;
      if (left) lines.push(`(${left} long block(s) not shown — they cannot be rewritten)`);
    } else {
      lines.push(cap(s.text, MAX_SOURCE_CHARS));
    }
  });
  return lines.join("\n");
}

/**
 * The reply, validated against what was actually read. Anything off shape is
 * dropped, one finding at a time; a reply that is not JSON at all is no
 * findings.
 */
export function parseDetectorReply(text: string, thread: SweepThread, sources: SweepSource[]): DetectedDrift[] {
  const raw = jsonObjectIn(text);
  const list = raw && Array.isArray((raw as { findings?: unknown }).findings) ? (raw as { findings: unknown[] }).findings : [];
  const threadTs = new Set(thread.messages.map((m) => m.ts));
  const out: DetectedDrift[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const f = entry as Record<string, unknown>;
    const source = sources.find((s) => s.url === str(f.source_url));
    if (!source) continue;
    const confidence = typeof f.confidence === "number" ? f.confidence : Number.NaN;
    if (!(confidence >= CONFIDENCE_FLOOR) || confidence > 1) continue;
    const evidenceTs = (Array.isArray(f.evidence_ts) ? f.evidence_ts : []).map(str).filter((ts) => threadTs.has(ts));
    if (!evidenceTs.length) continue;
    const sourceSays = cap(str(f.source_says), MAX_SAID_CHARS);
    const threadSays = cap(str(f.thread_says), MAX_SAID_CHARS);
    if (!sourceSays || !threadSays) continue;

    let blockId: string | null = null;
    let lastEditedTime: string | null = null;
    let original = "";
    let replacement = "";
    if (source.writable) {
      const block = offeredBlocks(source).find((b) => b.id === str(f.block_id));
      replacement = str(f.replacement);
      if (!block || !block.lastEditedTime) continue;
      const evidence = thread.messages.filter((m) => evidenceTs.includes(m.ts)).map((m) => m.text);
      if (replacementProblem(block.text, replacement, evidence)) continue;
      blockId = block.id;
      lastEditedTime = block.lastEditedTime;
      original = block.text;
    }
    const claimed = str(f.claimed_by);
    out.push({
      source,
      blockId,
      lastEditedTime,
      original,
      sourceSays,
      threadSays,
      replacement,
      evidenceTs: [...new Set(evidenceTs)].sort(),
      claimedBy: claimed || null,
      confidence,
    });
  }
  return out;
}

/** The blocks of a writable source the model may rewrite: each shown whole,
 *  in page order, until the source's share is spent. */
export function offeredBlocks(source: SweepSource): SweepSource["blocks"] {
  const offered: SweepSource["blocks"] = [];
  let spent = 0;
  for (const b of source.blocks) {
    if (b.text.length > MAX_OFFERED_BLOCK_CHARS) continue;
    if (spent + b.text.length > MAX_OFFERED_CHARS_PER_SOURCE) break;
    spent += b.text.length;
    offered.push(b);
  }
  return offered;
}

/**
 * Why a replacement may not stand in for a block, or null when it may. It
 * replaces the WHOLE block, so anything it leaves out is deleted from the page.
 *
 * @param original - The block's text as read
 * @param replacement - What the model would write
 * @param evidence - The text of the messages it cites
 */
export function replacementProblem(original: string, replacement: string, evidence: readonly string[]): string | null {
  if (!replacement) return "empty";
  if (replacement === original) return "unchanged";
  if (replacement.length > MAX_REPLACEMENT_CHARS) return "too long";
  if (TRUNCATION_MARKS.some((m) => replacement.includes(m) && !original.includes(m))) return "truncated";
  // A fix swaps words; one that comes back much shorter has lost some.
  const was = words(original).length;
  const shed = was - words(replacement).length;
  const tooMuch = shed > MIN_DROPPED_WORDS && shed > MAX_DROPPED_SHARE * was;
  if (tooMuch && !evidence.some((t) => REMOVAL_WORDS.test(t))) return "drops too much";
  return null;
}

function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** The first JSON object in a reply, fenced or not. */
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
