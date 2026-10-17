// Drafting one path's blueprint revision from shipped work, on the grind tier.
//
// The model sees today's path — its steps, its lanes and every cell with its
// id — and the card's own words, and answers with row changes on that grid.
// What comes back is read strictly against the grid it was shown:
//
//   • a row on a step or lane the path does not have is never written: the
//     Worker cannot add a step or a lane (ADR-034), so it becomes a GAP the
//     card names, beside anything the model said it could not verify;
//   • `added` on an occupied slot is a change to that cell, `changed` on an
//     empty one an addition, and `deprecated` needs a cell to deprecate;
//   • each row's `from` is the cell's status as read, so the writer can tell a
//     slot that moved since the draft (a stale race) and take it all back;
//   • a row the work did not cause is INFERRED, and only a deprecation may be:
//     a cell that contradicts the path's own cells, which the card marks and
//     asks the owner about. An inferred addition or change is never written.
//
// The path's own status moves to the target too when it is behind it.
//
// GRIND, THEN DEFAULT. A grind-tier capacity failure (a quota, an overloaded
// model) drafts on the default tier instead, and the draft carries a note the
// card shows. Any other failure drafts nothing.
//
// PURE: the provider is a parameter.

import type { ModelProvider, ModelText } from "../agent/model-provider";
import type { BlueprintRevision, EntityStatus, RevisionRow } from "../blueprint-write/index";
import { ENTITY_STATUSES } from "../blueprint-write/index";
import { jsonObjectIn } from "../sweep/detector";

/** The path a revision is drafted against, as the blueprint has it today. */
export interface PathToday {
  pathId: string;
  /** The scenario's id, where the read had it: what a proposal's new path is created in. */
  scenarioId?: string;
  scenario: string;
  path: string;
  status: EntityStatus;
  lanes: Array<{ id: string; name: string }>;
  steps: Array<{ id: string; name: string }>;
  cells: Array<{ id: string; laneId: string; stepId: string; content: string; status: EntityStatus }>;
  /** Where the path opens in the blueprint app. */
  link?: string;
}

/** `promoted` is a row moving on as written: `planned → live` at a deploy. */
export type ChangeKind = "added" | "changed" | "deprecated" | "promoted";

/** One drafted row as the card shows it: blueprint words only. */
export interface DraftedChange {
  kind: ChangeKind;
  step: string;
  lane: string;
  content: string;
  /** The cell's text before, for a change. */
  before?: string;
  /** A deprecation the shipped work did not cause: the cell contradicts the
   *  path's own cells, so the owner is asked about it. Never on an added or a
   *  changed row. */
  inferred?: true;
}

export interface Draft {
  revision: BlueprintRevision;
  changes: DraftedChange[];
  confidence: number;
  /** What the draft could not verify, or could not write. */
  gaps: string[];
  /** Set when the grind tier was out of capacity and the default tier drafted. */
  tierNote?: string;
  /** A deploy's promotion of rows a design hand-off drafted, or a linked
   *  proposal's rows moving on as drawn (`./stages.ts`). */
  promoted?: true;
  /** A line the card shows above its rows: where promoted rows came from, or
   *  what a path's retirement makes way for. Blueprint words. */
  note?: string;
  /** Set on a card that only retires today's path: no rows, no redraft. */
  retires?: true;
}

export interface DraftInput {
  /** The work's title and text, Roadmap words. */
  title: string;
  text: string;
  today: PathToday;
  /** The status the shipped work puts rows at: `live` once deployed. */
  target: EntityStatus;
  /** A redraft: what a reviewer said in the card's thread, and the rows they
   *  pushed back on. Their words outrank the card's where the two disagree. */
  correction?: { text: string; previous: DraftedChange[] };
}

export const DRAFT_TIER = "grind" as const;
const MAX_TEXT_CHARS = 6_000;
/** The output ceiling a shipped-work draft is asked with. Thinking spends the
 *  same ceiling as the answer (`ModelText.cutOff`), so it is room for the
 *  model's thinking and then the JSON: 2,000 left a medium-level model cut
 *  off mid-JSON, which read as a draft with no rows. Kept apart from the
 *  blueprint check's proposal draft (`./proposal.ts`), which takes a turn's
 *  ceiling: this one runs on the scheduled grind tier, non-streaming, where a
 *  longer think is a longer wait on a call a proxy can time out (524). Each
 *  draft logs its thinking spend, so the ceiling is sized from what it
 *  costs. */
export const DRAFT_MAX_TOKENS = 8_000;

export const DRAFT_SYSTEM = [
  "You keep a service blueprint current. A piece of work has shipped. You are shown its title and text, and one path of the blueprint as it is today: its steps, its lanes, and each cell (the square where a step meets a lane) with its text.",
  "Draft the row changes this work makes to THIS path: cells to add, cells whose text changes, and cells to deprecate because the moment no longer happens.",
  "- Use only the step ids and lane ids you are shown. If the change needs a step or a lane the path does not have, do not invent an id: name it in new_steps_or_lanes.",
  "- Write each cell's text the way the path's cells are written: one short sentence about what that actor does at that step.",
  "- Change only what the work changes. Say in gaps what you could not verify from the text.",
  '- A cell the work does not touch may be deprecated only when it contradicts the path\'s own cells (one step says the opposite of another). Mark that row "inferred": true. Never add or change a row the work does not cause.',
  "Reply with JSON only, no prose, in exactly this shape:",
  '{"rows":[{"change":"added|changed|deprecated","step_id":"","lane_id":"","content":"","inferred":false}],"new_steps_or_lanes":[],"confidence":0.0,"gaps":[]}',
].join("\n");

/** The prompt: the work, then the grid with its ids. */
export function draftPrompt(input: DraftInput): string {
  const { today } = input;
  const name = (list: Array<{ id: string; name: string }>, id: string) => list.find((x) => x.id === id)?.name ?? id;
  return [
    `WORK: ${input.title}`,
    input.text.slice(0, MAX_TEXT_CHARS) || "(no text)",
    "",
    `PATH: ${today.scenario} › ${today.path}`,
    `STEPS: ${today.steps.map((s) => `${s.id} = ${s.name}`).join("; ")}`,
    `LANES: ${today.lanes.map((l) => `${l.id} = ${l.name}`).join("; ")}`,
    "CELLS:",
    ...today.cells.map((c) => `- step ${c.stepId} (${name(today.steps, c.stepId)}) × lane ${c.laneId} (${name(today.lanes, c.laneId)}): ${c.content}`),
    ...(input.correction
      ? [
          "",
          "EARLIER DRAFT, which a reviewer pushed back on:",
          ...input.correction.previous.map((c) => `- ${c.kind} ${c.step} × ${c.lane}: ${c.content}`),
          `REVIEWER'S CORRECTION (it outranks the work's text where they disagree): ${input.correction.text.slice(0, 2_000)}`,
          "Draft the rows again with the correction applied.",
        ]
      : []),
  ].join("\n");
}

const CAPACITY = /\b(429|503|529)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded|quota/i;

/** Whether a failed one-shot was the model out of capacity. */
export function isCapacityReply(reply: ModelText): boolean {
  return !reply.ok && reply.unavailable !== true && CAPACITY.test(reply.message);
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const strings = (v: unknown) => (Array.isArray(v) ? v.map(text).filter(Boolean) : []);

/**
 * Read a draft reply against the path it was drafted on.
 *
 * @param reply - The model's text
 * @param input - What it was shown
 * @returns The draft, or null when nothing in it can be written
 */
export function readDraft(reply: string, input: DraftInput): Draft | null {
  const parsed = jsonObjectIn(reply) as Record<string, unknown> | null;
  if (!parsed || !Array.isArray(parsed.rows)) return null;
  const { today, target } = input;
  const step = (id: string) => today.steps.find((s) => s.id === id);
  const lane = (id: string) => today.lanes.find((l) => l.id === id);
  const gaps = [...strings(parsed.gaps)];
  for (const missing of strings(parsed.new_steps_or_lanes)) gaps.push(`needs ${missing}, which uno-bot cannot add — a person adds it`);

  const rows: RevisionRow[] = [];
  const changes: DraftedChange[] = [];
  const taken = new Set<string>();
  for (const raw of parsed.rows as unknown[]) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const s = step(text(r.step_id));
    const l = lane(text(r.lane_id));
    if (!s || !l) {
      gaps.push(`a cell on a step or lane this path does not have (${text(r.step_id) || "?"} × ${text(r.lane_id) || "?"}) was left out`);
      continue;
    }
    const slot = `${s.id}:${l.id}`;
    if (taken.has(slot)) continue;
    const cell = today.cells.find((c) => c.stepId === s.id && c.laneId === l.id);
    const kind = text(r.change);
    const inferred = r.inferred === true;
    if (kind === "deprecated") {
      if (!cell || cell.status === "deprecated") continue;
      rows.push({ stepId: s.id, laneId: l.id, content: cell.content, from: cell.status, to: "deprecated" });
      changes.push({ kind: "deprecated", step: s.name, lane: l.name, content: cell.content, ...(inferred ? { inferred: true as const } : {}) });
      if (inferred) gaps.push(`${s.name} (${l.name}) contradicts the path's own rows, so I marked it deprecated though the work didn't cause it. Retire it?`);
    } else if (inferred && (kind === "added" || kind === "changed")) {
      // Only a deprecation may be inferred: an inferred row is never added.
      gaps.push(`an inferred ${kind === "added" ? "addition" : "change"} at ${s.name} (${l.name}) was left out: only the work's own rows are written`);
      continue;
    } else if (kind === "added" || kind === "changed") {
      const content = text(r.content);
      if (!content) continue;
      rows.push({ stepId: s.id, laneId: l.id, content, from: cell?.status ?? null, to: target });
      changes.push(
        cell
          ? { kind: "changed", step: s.name, lane: l.name, content, before: cell.content }
          : { kind: "added", step: s.name, lane: l.name, content },
      );
    } else {
      continue;
    }
    taken.add(slot);
  }
  if (!rows.length) return null;

  const confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0));
  const behind = ENTITY_STATUSES.indexOf(today.status) < ENTITY_STATUSES.indexOf(target) && today.status !== "deprecated";
  const revision: BlueprintRevision = {
    pathId: today.pathId,
    label: `${today.scenario} › ${today.path}`,
    rows,
    ...(behind ? { path: { from: today.status, to: target } } : {}),
  };
  return { revision, changes, confidence, gaps };
}

/**
 * Why a draft drew no row: one reading, which the log's words and a caller's
 * decision both come from, so the two never disagree.
 *
 *   `cut-off`      — the reply stopped at the output ceiling
 *   `unreadable`   — the reply held no rows to read
 *   `empty`        — it drew no rows, and named nothing missing
 *   `needs-steps`  — it drew no rows, only steps or lanes the path lacks
 *   `off-grid`     — every row was on a step or lane the path does not have
 *   `unwritable`   — rows on the grid, none of which could be written
 *   `removes-only` — a proposal's: every row removes a moment (`./proposal.ts`)
 *   `no-scenario`  — a proposal's: today's path came without its scenario
 *
 * The first two say the model gave no answer; `off-grid` and `unwritable`
 * an answer that cannot be used; the rest an answer that draws nothing.
 */
export type NoDraftReason =
  | { kind: "cut-off" }
  | { kind: "unreadable" }
  | { kind: "empty" }
  | { kind: "needs-steps"; missing: string[] }
  | { kind: "off-grid" }
  | { kind: "unwritable" }
  | { kind: "removes-only" }
  | { kind: "no-scenario" };

/**
 * Why a reply `readDraft` read as nothing drew no row.
 *
 * @param reply - The model's text
 * @param input - What it was shown
 * @param cutOff - Whether the reply stopped at the output ceiling
 */
export function noDraftReason(reply: string, input: DraftInput, cutOff?: boolean): NoDraftReason {
  if (cutOff) return { kind: "cut-off" };
  const parsed = jsonObjectIn(reply) as Record<string, unknown> | null;
  if (!parsed || !Array.isArray(parsed.rows)) return { kind: "unreadable" };
  const missing = strings(parsed.new_steps_or_lanes);
  if (!parsed.rows.length) return missing.length ? { kind: "needs-steps", missing } : { kind: "empty" };
  const onGrid = (parsed.rows as unknown[]).some((raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    return input.today.steps.some((s) => s.id === text(r.step_id)) && input.today.lanes.some((l) => l.id === text(r.lane_id));
  });
  return { kind: onGrid ? "unwritable" : "off-grid" };
}

/**
 * A reason in a log line's words.
 *
 * @param reason - Why the draft drew no row
 */
export function noDraftWords(reason: NoDraftReason): string {
  switch (reason.kind) {
    case "cut-off":
      return "the reply stopped at the output ceiling";
    case "unreadable":
      return "the reply held no rows to read";
    case "empty":
      return "the reply drew no rows";
    case "needs-steps":
      return `it needs only steps or lanes the path does not have: ${reason.missing.join("; ")}`;
    case "off-grid":
      return "every row it drew was on a step or lane the path does not have";
    case "unwritable":
      return "no row it drew could be written";
    case "removes-only":
      return "it only removes moments, and a path with no cells shows nothing";
    case "no-scenario":
      return "today's path was read without its scenario, which the new path is created in";
  }
}

/**
 * Why a reply `readDraft` read as nothing drew no row, in a log line's words.
 *
 * @param reply - The model's text
 * @param input - What it was shown
 * @param cutOff - Whether the reply stopped at the output ceiling
 */
export function whyNoDraft(reply: string, input: DraftInput, cutOff?: boolean): string {
  return noDraftWords(noDraftReason(reply, input, cutOff));
}

/**
 * What a one-shot's thinking spent of its ceiling, for a draft's log line;
 * empty when the adapter did not say.
 *
 * @param reply - The model's answer
 * @param ceiling - The ceiling it was asked with
 */
export function thinkingSpent(reply: ModelText, ceiling: number): string {
  return reply.ok && reply.thinkingTokens !== undefined ? ` (thinking ${reply.thinkingTokens} of ${ceiling})` : "";
}

/**
 * Draft one path's revision: on the grind tier, or on the default tier when
 * the grind tier is out of capacity.
 *
 * @param provider - The model
 * @param input - The work and today's path
 * @returns The draft, or null when nothing writable came back
 */
export async function draftRevision(provider: ModelProvider, input: DraftInput): Promise<Draft | null> {
  const ask = (tier: "grind" | "default") =>
    provider.generate({ tier, system: DRAFT_SYSTEM, prompt: draftPrompt(input), maxTokens: DRAFT_MAX_TOKENS });
  let reply = await ask(DRAFT_TIER);
  let tierNote: string | undefined;
  if (isCapacityReply(reply)) {
    reply = await ask("default");
    tierNote = "Drafted on the default tier: the grind tier was out of capacity.";
  }
  if (!reply.ok) return null;
  const draft = readDraft(reply.text, input);
  const where = `[upkeep] ${input.today.scenario} › ${input.today.path}`;
  const spent = thinkingSpent(reply, DRAFT_MAX_TOKENS);
  if (!draft) console.log(`${where}: no draft — ${whyNoDraft(reply.text, input, reply.cutOff)}${spent}`);
  else if (spent) console.log(`${where}: drafted${spent}`);
  return draft && tierNote ? { ...draft, tierNote } : draft;
}
