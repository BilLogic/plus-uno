// Which Figma comment threads record a decision, and where each belongs
// (#900). One model call per file on the `chill` tier, beside the sweep's
// detectors and on their terms: the prompt and the parse are one contract, and
// anything off shape is dropped, never repaired.
//
// A DECISION is something the team agreed, chose, changed or settled. A
// resolved thread usually is, and so is clear decision wording. An open
// question, an option still weighed, praise, or a visual detail — a colour,
// spacing, alignment, an icon — is not: visual details stay in Figma (#891
// story 5).
//
// THE ROUTES (#891):
//   • `prd` — behaviour or scope. The PRD's one block that states the old
//     rule, rewritten whole; or one line added under the section it belongs
//     to.
//   • `card` — status, owner or timing: one of the card's own fields, and its
//     new value. The write checks the value against the Roadmap's options, so
//     nothing is invented (hard rule 4).
//   • `design-system` — a change to a shared component, token or pattern: an
//     intake's title and body.
//   • `none` — anything else, which yields nothing.
//
// THE PARSE REFUSES a thread it was not shown; a route with no target (`prd`
// with no PRD, `card` with no card); a block or heading it was not offered; a
// field the card does not have; a rewrite `replacementProblem` refuses; an
// added line that is empty, breaks or runs long; and a confidence under the
// sweep's floor. One decision per thread: the first that passes.
//
// PURE: the provider is a parameter. Eval cases:
// docs/evals/fixtures/figma-decision-cases.json (tests/figma-comments.test.ts).

import type { ModelProvider } from "../agent/model-provider";
import { addedProblem, placeFor } from "../sweep/capture-detector";
import {
  CONFIDENCE_FLOOR,
  DETECTOR_TIER,
  jsonObjectIn,
  MAX_MESSAGE_CHARS,
  offeredBlocks,
  replacementProblem,
} from "../sweep/detector";
import type { SweepBlock, SweepSource } from "../sweep/finding";
import type { Section } from "./sections";

/** A decision restated past this is refused. */
const MAX_DECISION_CHARS = 300;
/** An intake title past this is refused; its body past the second. */
const MAX_TITLE_CHARS = 120;
const MAX_BODY_CHARS = 4_000;
/** A card field's new value past this is refused. */
const MAX_VALUE_CHARS = 200;
/** Characters of the PRD's body shown. */
const MAX_PRD_CHARS = 8_000;
const MAX_TOKENS = 4_000;

export type DecisionRoute = "prd" | "card" | "design-system";

/** One thread, as the detector is shown it. */
export interface ShownThread {
  /** The root comment's id: what the reply names. */
  id: string;
  section: Section;
  page: string;
  /** The layer the root is pinned to, when it is not the page itself. */
  layer?: string;
  resolved: boolean;
  comments: Array<{ by: string; at: string; text: string }>;
}

/** A card the file joins, as the detector is shown it. */
export interface ShownCard {
  number: number;
  title: string;
  url: string;
  /** Its fields by name — statuses, selects, dates, people — as the card reads. */
  fields: Record<string, string>;
}

export interface DecisionInput {
  file: { title: string; url: string };
  threads: ShownThread[];
  cards: ShownCard[];
  /** The page a `prd` decision writes to: the card's PRD, else the card; null with no card. */
  prd: SweepSource | null;
}

/** One validated decision. */
export interface DetectedDecision {
  threadId: string;
  route: DecisionRoute;
  /** The decision, restated in one sentence. */
  decision: string;
  confidence: number;
  /** `prd`: the block rewritten, or the block a line goes in after. */
  prd?:
    | { kind: "change"; block: SweepBlock; replacement: string; section: string | null }
    | { kind: "add"; anchorId: string; anchorEditedTime: string; text: string; section: string };
  /** `card`: which card, which field, from what to what. */
  card?: { card: ShownCard; field: string; from: string | null; to: string };
  /** `design-system`: the intake. */
  intake?: { title: string; body: string };
}

export type DecisionResult = { ok: true; decisions: DetectedDecision[] } | { ok: false; error: string };

/** The detector as the read takes it. */
export interface DecisionDetector {
  detect(input: DecisionInput): Promise<DecisionResult>;
}

export const DECISION_DETECTOR_SYSTEM = [
  "You read comment threads left on a Figma design file's Specs and For Review pages, and say which threads record a DECISION and where each belongs.",
  "A decision is something the team agreed, chose, changed or settled. A resolved thread usually is, and so is clear wording such as \"let's go with\", \"we'll\", \"agreed\", \"decided\".",
  "Not a decision: an open question, an option still being weighed, praise, or a visual detail — a colour, spacing, alignment, an icon, a font — which stays in Figma.",
  "Pick one route per decision:",
  "- prd: behaviour or scope — what the product does, for whom, what is in or out. Either rewrite the PRD's one block that states the old rule (block_id, and replacement: the block's full new text, changing only what the decision changed), or add one line under the section it belongs to (section_block_id, a heading's id, and text: the rule, one line, in the PRD's own voice).",
  "- card: status, owner or timing of the work — one of the card's listed fields (field, verbatim) and its new value.",
  "- design-system: a change to a shared component, token or pattern — an intake title (the change, one line) and body (what was decided, where, and why, in a few sentences).",
  "- none: anything else.",
  "Reply with JSON only, no prose, in exactly this shape:",
  '{"decisions":[{"thread_id":"…","route":"prd"|"card"|"design-system"|"none","decision":"…","block_id":"…","replacement":"…","section_block_id":"…","text":"…","card":0,"field":"…","value":"…","title":"…","body":"…","confidence":0.0}]}',
  "- thread_id: a thread id as listed; decision: what was decided, one sentence, no names.",
  "- Give only the keys your route uses; prd takes either block_id and replacement, or section_block_id and text.",
  "- card: the card's number as listed. With no PRD listed there is no prd route; with no card listed there is no card route.",
  "- confidence: 0 to 1 that this thread settled what you say, and that it belongs where you put it.",
  'Nothing → {"decisions":[]}.',
].join("\n");

/** The detector over a ModelProvider. */
export function modelDecisionDetector(provider: ModelProvider): DecisionDetector {
  return {
    async detect(input) {
      const reply = await provider.generate({
        tier: DETECTOR_TIER,
        system: DECISION_DETECTOR_SYSTEM,
        prompt: decisionPrompt(input),
        maxTokens: MAX_TOKENS,
      });
      if (!reply.ok) return { ok: false, error: reply.message };
      return { ok: true, decisions: parseDecisionReply(reply.text, input) };
    },
  };
}

/** The prompt: the file, its cards and their fields, the PRD, then each thread. */
export function decisionPrompt(input: DecisionInput): string {
  const lines = [`FILE — ${input.file.title}`, `url: ${input.file.url}`, ""];
  if (input.cards.length) {
    lines.push("CARDS:");
    for (const c of input.cards) {
      lines.push(`Card ${c.number} — ${c.title}`);
      const fields = Object.entries(c.fields).map(([k, v]) => `${k}: ${v}`);
      lines.push(`fields: ${fields.length ? fields.join(" · ") : "(none read)"}`);
    }
  } else {
    lines.push("CARDS: none — the card route is not available");
  }
  lines.push("");
  if (input.prd) {
    const prd = input.prd;
    lines.push(`PRD — ${prd.title}`, `url: ${prd.url}`);
    const headings = prd.blocks.filter(isHeading);
    lines.push("headings (id · text):", ...(headings.length ? headings.map((b) => `${b.id} · ${b.text}`) : ["(none)"]));
    const offered = offeredBlocks(prd);
    lines.push("blocks (id · full text):", ...(offered.length ? offered.map((b) => `${b.id} · ${b.text}`) : ["(none)"]));
    lines.push("body:", cap(prd.blocks.map((b) => b.text).join("\n"), MAX_PRD_CHARS));
  } else {
    lines.push("PRD: none — the prd route is not available");
  }
  lines.push("", "THREADS:");
  for (const t of input.threads) {
    const where = [t.section, t.page, t.layer].filter(Boolean).join(" › ");
    lines.push(`[thread ${t.id}] ${where} · ${t.resolved ? "resolved" : "open"}`);
    for (const c of t.comments) lines.push(`  ${c.by} (${c.at.slice(0, 10)}): ${cap(c.text, MAX_MESSAGE_CHARS)}`);
  }
  return lines.join("\n");
}

/**
 * The reply, validated against what the detector was shown. Anything off
 * shape is dropped, one decision at a time; a reply that is not JSON at all
 * is no decisions.
 */
export function parseDecisionReply(text: string, input: DecisionInput): DetectedDecision[] {
  const raw = jsonObjectIn(text) as { decisions?: unknown } | null;
  const list = raw && Array.isArray(raw.decisions) ? raw.decisions : [];
  const threads = new Set(input.threads.map((t) => t.id));
  const out: DetectedDecision[] = [];
  const decided = new Set<string>();
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const f = entry as Record<string, unknown>;
    const threadId = str(f.thread_id);
    if (!threads.has(threadId) || decided.has(threadId)) continue;
    const confidence = typeof f.confidence === "number" ? f.confidence : Number.NaN;
    if (!(confidence >= CONFIDENCE_FLOOR) || confidence > 1) continue;
    const decision = str(f.decision);
    if (!decision || decision.includes("\n") || decision.length > MAX_DECISION_CHARS) continue;
    const route = str(f.route);
    const base = { threadId, decision, confidence };
    let found: DetectedDecision | null = null;
    if (route === "prd") found = prdDecision(f, input.prd, base);
    else if (route === "card") found = cardDecision(f, input.cards, base);
    else if (route === "design-system") found = intakeDecision(f, base);
    if (!found) continue;
    decided.add(threadId);
    out.push(found);
  }
  return out;
}

type Base = Pick<DetectedDecision, "threadId" | "decision" | "confidence">;

function prdDecision(f: Record<string, unknown>, prd: SweepSource | null, base: Base): DetectedDecision | null {
  if (!prd?.writable) return null;
  const blockId = str(f.block_id);
  const sectionId = str(f.section_block_id);
  if (!!blockId === !!sectionId) return null;
  if (blockId) {
    const block = offeredBlocks(prd).find((b) => b.id === blockId);
    const replacement = str(f.replacement);
    if (!block?.lastEditedTime || replacementProblem(block.text, replacement, [base.decision])) return null;
    return { ...base, route: "prd", prd: { kind: "change", block, replacement, section: sectionAbove(prd.blocks, block.id) } };
  }
  const added = str(f.text);
  if (addedProblem(added)) return null;
  const place = placeFor(prd, sectionId, "");
  if (!place?.section) return null;
  return {
    ...base,
    route: "prd",
    prd: { kind: "add", anchorId: place.anchorId, anchorEditedTime: place.anchorEditedTime, text: added, section: place.section },
  };
}

function cardDecision(f: Record<string, unknown>, cards: readonly ShownCard[], base: Base): DetectedDecision | null {
  const card = cards.find((c) => c.number === Number(f.card)) ?? (cards.length === 1 ? cards[0] : undefined);
  if (!card) return null;
  const asked = str(f.field).toLowerCase();
  const field = Object.keys(card.fields).find((k) => k.toLowerCase() === asked);
  const to = str(f.value);
  if (!field || !to || to.includes("\n") || to.length > MAX_VALUE_CHARS) return null;
  const from = card.fields[field] ?? null;
  if (from !== null && from.trim().toLowerCase() === to.toLowerCase()) return null;
  return { ...base, route: "card", card: { card, field, from, to } };
}

function intakeDecision(f: Record<string, unknown>, base: Base): DetectedDecision | null {
  const title = str(f.title);
  const body = str(f.body);
  if (!title || title.includes("\n") || title.length > MAX_TITLE_CHARS) return null;
  if (!body || body.length > MAX_BODY_CHARS) return null;
  return { ...base, route: "design-system", intake: { title, body } };
}

/** The heading a block sits under, or null above every heading. */
function sectionAbove(blocks: readonly SweepBlock[], blockId: string): string | null {
  const at = blocks.findIndex((b) => b.id === blockId);
  for (let i = at - 1; i >= 0; i--) if (isHeading(blocks[i]!)) return blocks[i]!.text.trim();
  return null;
}

function isHeading(b: SweepBlock): boolean {
  return (b.type ?? "").startsWith("heading_");
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function cap(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
