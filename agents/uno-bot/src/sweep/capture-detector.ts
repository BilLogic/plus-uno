// Two more Capture questions, each one model call on the `chill` tier, beside
// the drift detector (`./detector.ts`) and on its terms: the prompt and the
// parse are one contract, and anything off shape is dropped, never repaired.
//
// UNDOCUMENTED ANSWERS (C3). A question asked in a thread and answered there,
// that no listed page states. The model says where the answer belongs — the
// section heading it goes under, or a new section on the closest page — and
// the one line to add. The parse refuses:
//   • an answer the model calls documented, or whose text a listed page
//     already holds — the page has it, so there is nothing to add;
//   • a page the thread did not link and no search found;
//   • a section that is not a heading on a WRITABLE page as read, and a
//     reply naming both a section and a new one, or neither;
//   • a question or an answer that is not a message in the thread;
//   • a line that is empty, breaks, carries a truncation mark or runs past
//     `MAX_ADDED_CHARS`;
//   • a confidence under `CONFIDENCE_FLOOR`.
// The text goes in after the LAST block of that section (or of the page, for a
// new section), stamped with the `last_edited_time` that block had at the read
// (ADR-029): a section that moved since is refused at the write.
//
// DECISIONS IN NOTES AND CARDS (C4). A running note, or a Roadmap card's
// comments and body edits, recording a decision a listed page still states the
// old way. Discussion, an option, a question or a to-do records no decision
// and is not drift. The parse is the drift parse with record entries in place
// of thread messages: evidence must be entries it was shown, and a card's own
// entries are never offered as the blocks to rewrite.
//
// PURE: the provider is a parameter. Eval cases:
// docs/evals/fixtures/sweep-capture-cases.json (tests/sweep-capture-detector.test.ts).

import type { ModelProvider } from "../agent/model-provider";
import {
  CONFIDENCE_FLOOR,
  DETECTOR_TIER,
  jsonObjectIn,
  MAX_MESSAGE_CHARS,
  offeredBlocks,
  replacementProblem,
} from "./detector";
import type { SweepBlock, SweepSource, SweepThread } from "./finding";

/** An added line past this is refused, never cut. */
export const MAX_ADDED_CHARS = 500;
/** A new section's heading past this is refused. */
const MAX_HEADING_CHARS = 80;
/** Characters of one page's body the answer detector is shown. */
const MAX_PAGE_CHARS = 8_000;
const MAX_SAID_CHARS = 300;
const TRUNCATION_MARKS = ["…", "[...]", "(...)"];
const MAX_TOKENS = 4_000;

// ── C3: undocumented answers ─────────────────────────────────────────────────

export const ANSWER_DETECTOR_SYSTEM = [
  "You read one Slack thread and the pages listed, and look for an UNDOCUMENTED ANSWER: a question asked in the thread that someone answered there, which none of the listed pages states.",
  "Not one:",
  '- an answer a listed page already states — report it with "documented": true;',
  '- a question nobody answered, or answered only with a guess, a "maybe" or a pointer ("ask Bea");',
  "- the thread's own logistics (a meeting time, who is out).",
  "For each undocumented answer, say WHERE it belongs on a WRITABLE page: the heading of the section it belongs under (that heading's block id, from the page's headings), or, when no section fits, a new section heading on the closest page. And the one line to add, in the page's own voice.",
  "Reply with JSON only, no prose, in exactly this shape:",
  '{"answers":[{"question_ts":"…","answer_ts":["…"],"answered_by":"U…","documented":false,"source_url":"…","section_block_id":"…"|null,"new_section":"…"|null,"text":"…","confidence":0.0}]}',
  "- source_url: one of the listed WRITABLE pages, verbatim.",
  "- exactly one of section_block_id and new_section.",
  "- text: one line, the fact itself — no quote marks, no names, no \"as discussed\".",
  "- answered_by: the Slack user id of whoever gave the answer.",
  "- confidence: 0 to 1 that this is a settled answer the page's readers would want written down.",
  'Nothing → {"answers":[]}.',
].join("\n");

/** One validated undocumented answer, before owner routing. */
export interface DetectedAnswer {
  source: SweepSource;
  /** The block the text goes in after, and the stamp the read saw on it. */
  anchorId: string;
  anchorEditedTime: string;
  /** The heading it goes under, as the page shows it; null for a new section. */
  section: string | null;
  /** The new section's heading; null under `section`. */
  newSection: string | null;
  text: string;
  /** The question's message. */
  questionTs: string;
  /** The answer's messages and the question's, sorted. */
  evidenceTs: string[];
  answeredBy: string | null;
  confidence: number;
}

/** A thread's answers, or why the model gave none. */
export type AnswerResult = { ok: true; answers: DetectedAnswer[] } | { ok: false; error: string };

// ── C4: decisions in notes and cards ─────────────────────────────────────────

/** One entry of a record: a note block, or a card comment or body block. */
export interface RecordEntry {
  id: string;
  text: string;
}

/** A running note, or a Roadmap card's comments and edits, as the detector reads it. */
export interface SweepRecord {
  kind: "note" | "card";
  url: string;
  title: string;
  entries: RecordEntry[];
}

export const RECORD_DETECTOR_SYSTEM = [
  "You compare a record the team keeps — a running note from a meeting, or a Roadmap card's comments and edits — with the pages listed, and report DRIFT.",
  "Drift is a DECISION the record states — something the team agreed, chose, changed or settled — that a listed page still states the old way.",
  "Not drift:",
  "- discussion, an open question, options weighed, a proposal, an action item or a to-do: nothing was decided;",
  "- the page already says what the record says;",
  "- a detail the page never mentions.",
  "Reply with JSON only, no prose, in exactly this shape:",
  '{"findings":[{"source_url":"…","block_id":"…","source_says":"…","record_says":"…","replacement":"…","evidence_ids":["…"],"confidence":0.0}]}',
  "- source_url: one of the listed WRITABLE pages, verbatim; block_id: the one block that states the old thing, from its list.",
  "- replacement: the block's full new text — its current text with only what the decision changed.",
  "- source_says / record_says: one short sentence each.",
  "- evidence_ids: the ids of the record entries that state the decision.",
  "- confidence: 0 to 1 that this is a real decision the page's owner would want applied.",
  'Nothing drifts → {"findings":[]}.',
].join("\n");

/** One validated decision drift, before owner routing. */
export interface DetectedRecordDrift {
  source: SweepSource;
  blockId: string;
  lastEditedTime: string;
  original: string;
  sourceSays: string;
  recordSays: string;
  replacement: string;
  evidenceIds: string[];
  confidence: number;
}

export type RecordResult = { ok: true; findings: DetectedRecordDrift[] } | { ok: false; error: string };

/** Both detectors, as the sweep takes them. */
export interface CaptureDetector {
  answers(input: { thread: SweepThread; sources: SweepSource[] }): Promise<AnswerResult>;
  record(input: { record: SweepRecord; sources: SweepSource[] }): Promise<RecordResult>;
}

/** Both detectors over a ModelProvider. */
export function modelCaptureDetector(provider: ModelProvider): CaptureDetector {
  return {
    async answers(input) {
      const reply = await provider.generate({
        tier: DETECTOR_TIER,
        system: ANSWER_DETECTOR_SYSTEM,
        prompt: answerPrompt(input.thread, input.sources),
        maxTokens: MAX_TOKENS,
      });
      if (!reply.ok) return { ok: false, error: reply.message };
      return { ok: true, answers: parseAnswerReply(reply.text, input.thread, input.sources) };
    },
    async record(input) {
      const reply = await provider.generate({
        tier: DETECTOR_TIER,
        system: RECORD_DETECTOR_SYSTEM,
        prompt: recordPrompt(input.record, input.sources),
        maxTokens: MAX_TOKENS,
      });
      if (!reply.ok) return { ok: false, error: reply.message };
      return { ok: true, findings: parseRecordReply(reply.text, input.record, input.sources) };
    },
  };
}

/** The answer prompt: the thread, then each page — a writable one with its
 *  headings by id and its body, a read-only one as text. */
export function answerPrompt(thread: SweepThread, sources: SweepSource[]): string {
  const lines = ["THREAD (oldest first):"];
  for (const m of thread.messages) lines.push(`[${m.ts}] <@${m.user}>: ${cap(m.text, MAX_MESSAGE_CHARS)}`);
  sources.forEach((s, i) => {
    lines.push("", `PAGE ${i + 1} — ${s.writable ? "WRITABLE" : "read-only"} — ${s.title}${s.foundBy ? " (found by search)" : ""}`, `url: ${s.url}`);
    if (s.writable) {
      const headings = s.blocks.filter(isHeading);
      lines.push("headings (id · text):", ...(headings.length ? headings.map((b) => `${b.id} · ${b.text}`) : ["(none)"]));
      lines.push("body:", cap(s.blocks.map((b) => b.text).join("\n"), MAX_PAGE_CHARS));
    } else {
      lines.push(cap(s.text, MAX_PAGE_CHARS));
    }
  });
  return lines.join("\n");
}

/**
 * The answer reply, validated against what was read. Anything off shape is
 * dropped, one answer at a time.
 */
export function parseAnswerReply(text: string, thread: SweepThread, sources: SweepSource[]): DetectedAnswer[] {
  const list = listIn(text, "answers");
  const threadTs = new Set(thread.messages.map((m) => m.ts));
  const out: DetectedAnswer[] = [];
  for (const f of list) {
    if (f.documented === true) continue;
    const source = sources.find((s) => s.writable && s.url === str(f.source_url));
    if (!source) continue;
    const confidence = typeof f.confidence === "number" ? f.confidence : Number.NaN;
    if (!(confidence >= CONFIDENCE_FLOOR) || confidence > 1) continue;
    const questionTs = str(f.question_ts);
    const answerTs = (Array.isArray(f.answer_ts) ? f.answer_ts : []).map(str).filter((ts) => threadTs.has(ts) && ts !== questionTs);
    if (!threadTs.has(questionTs) || !answerTs.length) continue;
    const added = str(f.text);
    if (addedProblem(added) || alreadyOnPage(added, source)) continue;

    const place = placeFor(source, str(f.section_block_id), str(f.new_section));
    if (!place) continue;
    const by = str(f.answered_by);
    out.push({
      source,
      ...place,
      text: added,
      questionTs,
      evidenceTs: [...new Set([questionTs, ...answerTs])].sort(),
      answeredBy: by || null,
      confidence,
    });
  }
  return out;
}

/** The record prompt: the record's entries by id, then each page. */
export function recordPrompt(record: SweepRecord, sources: SweepSource[]): string {
  const what = record.kind === "note" ? "RUNNING NOTE" : "ROADMAP CARD — comments and edits";
  const lines = [`${what} — ${record.title}`, "entries (id · text):"];
  for (const e of record.entries) lines.push(`${e.id} · ${cap(e.text, MAX_MESSAGE_CHARS)}`);
  sources.forEach((s, i) => {
    lines.push("", `PAGE ${i + 1} — ${s.writable ? "WRITABLE" : "read-only"} — ${s.title}${s.foundBy ? " (found by search)" : ""}`, `url: ${s.url}`);
    if (s.writable) {
      lines.push("blocks (id · full text):");
      for (const b of offeredFor(s, record)) lines.push(`${b.id} · ${b.text}`);
    } else {
      lines.push(cap(s.text, MAX_PAGE_CHARS));
    }
  });
  return lines.join("\n");
}

/** The record reply, validated: the drift parse, with entries as evidence. */
export function parseRecordReply(text: string, record: SweepRecord, sources: SweepSource[]): DetectedRecordDrift[] {
  const entries = new Map(record.entries.map((e) => [e.id, e.text] as const));
  const out: DetectedRecordDrift[] = [];
  for (const f of listIn(text, "findings")) {
    const source = sources.find((s) => s.writable && s.url === str(f.source_url));
    if (!source) continue;
    const confidence = typeof f.confidence === "number" ? f.confidence : Number.NaN;
    if (!(confidence >= CONFIDENCE_FLOOR) || confidence > 1) continue;
    const evidenceIds = [...new Set((Array.isArray(f.evidence_ids) ? f.evidence_ids : []).map(str).filter((id) => entries.has(id)))];
    if (!evidenceIds.length) continue;
    const sourceSays = cap(str(f.source_says), MAX_SAID_CHARS);
    const recordSays = cap(str(f.record_says), MAX_SAID_CHARS);
    if (!sourceSays || !recordSays) continue;
    const block = offeredFor(source, record).find((b) => b.id === str(f.block_id));
    if (!block || !block.lastEditedTime) continue;
    const replacement = str(f.replacement);
    if (replacementProblem(block.text, replacement, evidenceIds.map((id) => entries.get(id)!))) continue;
    out.push({
      source,
      blockId: block.id,
      lastEditedTime: block.lastEditedTime,
      original: block.text,
      sourceSays,
      recordSays,
      replacement,
      evidenceIds: evidenceIds.sort(),
      confidence,
    });
  }
  return out;
}

/** The blocks of a page a record's fix may rewrite: the drift detector's,
 *  less the record's own entries when the page is the record's own card. */
function offeredFor(source: SweepSource, record: SweepRecord): SweepBlock[] {
  const own = new Set(record.entries.map((e) => e.id));
  return offeredBlocks(source).filter((b) => !own.has(b.id));
}

/**
 * Where an answer goes: after the last block of the named heading's section,
 * or after the page's last block for a new section. A new section named like
 * an existing heading goes under that heading instead.
 */
function placeFor(
  source: SweepSource,
  sectionId: string,
  newSection: string,
): Pick<DetectedAnswer, "anchorId" | "anchorEditedTime" | "section" | "newSection"> | null {
  if (!!sectionId === !!newSection) return null;
  const blocks = source.blocks;
  let at = sectionId ? blocks.findIndex((b) => b.id === sectionId && isHeading(b)) : -1;
  if (newSection) {
    if (newSection.includes("\n") || newSection.length > MAX_HEADING_CHARS) return null;
    at = blocks.findIndex((b) => isHeading(b) && flat(b.text) === flat(newSection));
    if (at < 0) {
      const last = blocks.at(-1);
      if (!last?.lastEditedTime) return null;
      return { anchorId: last.id, anchorEditedTime: last.lastEditedTime, section: null, newSection };
    }
  }
  if (at < 0) return null;
  const heading = blocks[at]!;
  const level = headingLevel(heading);
  let end = at;
  for (let i = at + 1; i < blocks.length; i++) {
    const b = blocks[i]!;
    if (isHeading(b) && headingLevel(b) <= level) break;
    end = i;
  }
  const anchor = blocks[end]!;
  if (!anchor.lastEditedTime) return null;
  return { anchorId: anchor.id, anchorEditedTime: anchor.lastEditedTime, section: heading.text.trim(), newSection: null };
}

/** Why a line may not be added, or null when it may. */
function addedProblem(text: string): string | null {
  if (!text) return "empty";
  if (text.includes("\n")) return "more than one line";
  if (text.length > MAX_ADDED_CHARS) return "too long";
  if (TRUNCATION_MARKS.some((m) => text.includes(m))) return "truncated";
  return null;
}

/** Whether the page already holds the line, words compared. */
function alreadyOnPage(text: string, source: SweepSource): boolean {
  const line = flat(text);
  return line.length > 0 && flat(source.blocks.map((b) => b.text).join(" ")).includes(line);
}

function isHeading(b: SweepBlock): boolean {
  return (b.type ?? "").startsWith("heading_");
}

function headingLevel(b: SweepBlock): number {
  return Number((b.type ?? "").slice("heading_".length)) || 1;
}

function listIn(text: string, key: string): Record<string, unknown>[] {
  const raw = jsonObjectIn(text) as Record<string, unknown> | null;
  const list = raw && Array.isArray(raw[key]) ? (raw[key] as unknown[]) : [];
  return list.filter((e): e is Record<string, unknown> => !!e && typeof e === "object");
}

/** Lowercased words, one space apart — how "already says it" is compared. */
function flat(text: string): string {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).join(" ");
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function cap(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
