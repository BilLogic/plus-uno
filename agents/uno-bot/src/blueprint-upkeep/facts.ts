// What a blueprint card says, as data for its Review pop-up: the facts the
// stager puts on the staged proposal (`PendingProposal.facts`), which
// `slack/review-blueprint.ts` lays out. The pop-up reads these and never the
// card's text, as every Worker-staged card's does (`slack/review-stated.ts`).
//
// ONE COMPARISON, ONE SECTION PER STEP. Both cards compare today's path with a
// change, step by step: a revision draws only the steps it touches, each with
// that step's rows today and then its Added, Changed and Deprecated rows; a
// proposal draws every step either side has, today's rows and then the
// proposal's. Today's other steps stay on the blueprint, behind View slice.
//
// TWO VOCABULARIES (ADR-023). The card's why-now is the Roadmap's words (the
// RM-ID, `Dev Status: Deployed`); everything else is the blueprint's.
//
// PURE: data in, data out.

import type {
  BlueprintPathFact,
  BlueprintProposalFacts,
  BlueprintRevisionFacts,
  BlueprintStepFact,
  CardOwner,
} from "../thread-state/index";
import type { Draft, DraftedChange, PathToday } from "./draft";
import type { RevisionSource } from "./card";

/** Steps a revision's pop-up draws in full; past them each is listed as text. */
export const MAX_REVISION_STEPS = 12;
/** Steps a proposal's pop-up draws: one block each, so the view holds them. */
export const MAX_PROPOSAL_STEPS = 40;

const nameOf = (list: ReadonlyArray<{ id: string; name: string }>, id: string) => list.find((x) => x.id === id)?.name ?? id;

/** "17 rows, all live", "6 rows: 4 live, 2 planned", "No rows yet". */
export function rowsLine(cells: ReadonlyArray<{ status: string }>): string {
  if (!cells.length) return "No rows yet";
  const counts = new Map<string, number>();
  for (const c of cells) counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
  const n = `${cells.length} ${cells.length === 1 ? "row" : "rows"}`;
  if (counts.size === 1) return `${n}, ${cells.length === 1 ? "" : "all "}${[...counts.keys()][0]}`;
  return `${n}: ${[...counts].map(([status, k]) => `${k} ${status}`).join(", ")}`;
}

/** Today's rows in one step, in lane order. */
function todayIn(today: PathToday, stepId: string): BlueprintStepFact["today"] {
  const laneAt = new Map(today.lanes.map((l, i) => [l.id, i]));
  return today.cells
    .filter((c) => c.stepId === stepId)
    .sort((a, b) => (laneAt.get(a.laneId) ?? 0) - (laneAt.get(b.laneId) ?? 0))
    .map((c) => ({ lane: nameOf(today.lanes, c.laneId), content: c.content }));
}

/** The step a change sits on, by id where its row says, else by its name. */
function stepIdOf(today: PathToday, change: DraftedChange, row?: { stepId: string }): string | undefined {
  return row?.stepId ?? today.steps.find((s) => s.name === change.step)?.id;
}

/** The status change a revision is written as. */
function statusOf(draft: Draft): BlueprintRevisionFacts["status"] {
  if (draft.retires && draft.revision.path) return { from: draft.revision.path.from, to: draft.revision.path.to };
  const row = draft.revision.rows.find((r) => r.to !== "deprecated");
  if (draft.promoted && row?.from) return { from: row.from, to: row.to };
  if (row) return { to: row.to };
  const path = draft.revision.path;
  return path ? { from: path.from, to: path.to } : { to: "deprecated" };
}

/** How many of each kind of change. */
export function countsOf(changes: readonly DraftedChange[]): BlueprintRevisionFacts["counts"] {
  const n = (kind: DraftedChange["kind"]) => changes.filter((c) => c.kind === kind).length;
  return { added: n("added"), changed: n("changed"), deprecated: n("deprecated"), promoted: n("promoted") };
}

/** "2 added, 1 changed, 1 deprecated", in that order, nothing for none. */
export function countsLine(counts: BlueprintRevisionFacts["counts"]): string {
  return (["added", "changed", "deprecated", "promoted"] as const)
    .filter((k) => counts[k] > 0)
    .map((k) => `${counts[k]} ${k}`)
    .join(", ");
}

/** The card's RM-ID, or its title where it has no number. */
export function roadmapId(source: Pick<RevisionSource, "number" | "title">): string {
  return source.number !== null ? `RM-${source.number}` : source.title;
}

/**
 * The cell View slice opens on: the first row the revision changes that is
 * on the blueprint already (an added row has no cell yet), else none.
 *
 * @param today - The path as read
 * @param draft - The revision
 */
export function firstChangedCell(today: PathToday, draft: Draft): string | null {
  for (const row of draft.revision.rows) {
    const cell = today.cells.find((c) => c.stepId === row.stepId && c.laneId === row.laneId);
    if (cell) return cell.id;
  }
  return null;
}

/**
 * A revision's facts: the path, why now, today's rows in the steps it touches
 * and that step's changes, keyed to the rows the Approve writes.
 *
 * @param r - The revision as it waits: its card, today's path, its draft, its
 *   owners and where View slice opens
 */
export function revisionFacts(r: {
  source: RevisionSource;
  today: PathToday;
  draft: Draft;
  owners: readonly CardOwner[];
  view?: string;
}): BlueprintRevisionFacts {
  const { source, today, draft } = r;
  const byStep = new Map<string, BlueprintStepFact>();
  const stepOf = (stepId: string) => {
    let step = byStep.get(stepId);
    if (!step) {
      step = { step: nameOf(today.steps, stepId), today: todayIn(today, stepId) };
      byStep.set(stepId, step);
    }
    return step;
  };
  // A retirement writes the path alone, so its changes have no rows to key.
  const rows = draft.retires ? [] : draft.revision.rows;
  draft.changes.forEach((change, i) => {
    const stepId = stepIdOf(today, change, rows[i]);
    if (!stepId) return;
    const step = stepOf(stepId);
    const row = { lane: change.lane, content: change.content };
    switch (change.kind) {
      case "added":
        (step.added ??= []).push({ ...row, row: i });
        break;
      case "changed":
        (step.changed ??= []).push({ ...row, row: i, before: change.before ?? "" });
        break;
      case "deprecated":
        (step.deprecated ??= []).push({ ...row, ...(change.inferred ? { inferred: true } : {}) });
        break;
      case "promoted":
        (step.promoted ??= []).push(row);
        break;
    }
  });
  const order = new Map(today.steps.map((s, i) => [s.id, i]));
  const steps = [...byStep.entries()].sort(([a], [b]) => (order.get(a) ?? 0) - (order.get(b) ?? 0)).map(([, s]) => s);
  const pathFact: BlueprintPathFact = { name: today.path, rows: rowsLine(today.cells), ...(r.view ?? today.link ? { view: r.view ?? today.link } : {}) };
  return {
    kind: "blueprint_revision",
    scenario: today.scenario,
    ...(today.link ? { scenarioUrl: today.link } : {}),
    status: statusOf(draft),
    counts: countsOf(draft.changes),
    card: { id: roadmapId(source), url: source.url, status: `${source.status.property}: ${source.status.value}`, quote: source.quote.trim() },
    owners: [...r.owners],
    today: pathFact,
    steps: steps.slice(0, MAX_REVISION_STEPS),
    ...(steps.length > MAX_REVISION_STEPS ? { later: steps.slice(MAX_REVISION_STEPS) } : {}),
    questions: [...draft.gaps],
    inferred: draft.changes.filter((c) => c.inferred).length,
    ...(draft.tierNote ? { tierNote: draft.tierNote } : {}),
    ...(draft.note ? { note: draft.note } : {}),
    ...(draft.retires ? { retires: true } : {}),
  };
}

/**
 * A proposal's facts: every step either side has, today's rows and then the
 * proposal's on its new path.
 *
 * @param p - Today's path, the new path's name, the rows it draws and what the
 *   draft could not verify
 */
export function proposalFacts(p: {
  today: PathToday;
  name: string;
  changes: readonly DraftedChange[];
  rows: number;
  gaps: readonly string[];
}): BlueprintProposalFacts {
  const { today } = p;
  const steps: BlueprintStepFact[] = [];
  for (const step of today.steps) {
    const proposed = p.changes.filter((c) => c.step === step.name).map((c) => ({ lane: c.lane, content: c.content }));
    const now = todayIn(today, step.id);
    if (now.length || proposed.length) steps.push({ step: step.name, today: now, proposed });
  }
  return {
    kind: "blueprint_proposal",
    scenario: today.scenario,
    ...(today.link ? { scenarioUrl: today.link } : {}),
    name: p.name,
    today: { name: today.path, rows: rowsLine(today.cells), ...(today.link ? { view: today.link } : {}) },
    steps: steps.slice(0, MAX_PROPOSAL_STEPS),
    moreSteps: Math.max(0, steps.length - MAX_PROPOSAL_STEPS),
    rows: p.rows,
    gaps: [...p.gaps],
  };
}
