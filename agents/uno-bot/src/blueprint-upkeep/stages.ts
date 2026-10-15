// A Roadmap card's two shipping moments, and what each writes on the
// blueprint (spec: status mapping):
//
//   • `Design Status: Shipped` — the design is handed to dev: rows at
//     `planned`. A deprecation is HELD, not written: the moment it retires
//     still happens until the work deploys, so it waits on the record below.
//   • `Dev Status: Deployed` — the work is live: rows at `live`. When the
//     card's design hand-off drafted rows, the deploy PROMOTES those rows
//     (`planned → live`, and the held deprecations) instead of drafting them
//     again; only when none of them is `planned` on the blueprint today — the
//     `planned` card was never approved — is a fresh `live` revision drafted.
//
// A card is weighed once per moment: the seen set holds `pageId@stage`, and a
// card weighed at a later moment counts as weighed at every earlier one, so a
// deployed card whose `Design Status` still reads `Shipped` is not drafted
// back to `planned`.
//
// PURE: rows in, rows out.

import type { EntityStatus, RevisionRow } from "../blueprint-write/index";
import type { Draft, DraftedChange, PathToday } from "./draft";

/** The Roadmap moments the job watches, earliest first, and the status each writes. */
export const STAGES = {
  designed: { property: "Design Status", value: "Shipped", target: "planned" },
  deployed: { property: "Dev Status", value: "Deployed", target: "live" },
} as const satisfies Record<string, { property: string; value: string; target: EntityStatus }>;

export type ShipStage = keyof typeof STAGES;
const ORDER: readonly ShipStage[] = ["designed", "deployed"];

/**
 * The latest moment a card's status values hold, or null for neither.
 *
 * @param values - The row's select and status values by property name
 */
export function stageOf(values: Record<string, string[]>): ShipStage | null {
  for (const stage of [...ORDER].reverse()) {
    const { property, value } = STAGES[stage];
    if (values[property]?.includes(value)) return stage;
  }
  return null;
}

const key = (pageId: string, stage: ShipStage) => `${pageId}@${stage}`;

/** Whether a card was weighed at this moment or a later one. A bare page id
 *  is a deploy weighed before the moments were told apart. */
export function weighedAt(seen: ReadonlySet<string>, pageId: string, stage: ShipStage): boolean {
  if (seen.has(pageId)) return true;
  return ORDER.slice(ORDER.indexOf(stage)).some((s) => seen.has(key(pageId, s)));
}

/** Mark a card weighed at this moment and every earlier one. */
export function markWeighed(seen: Set<string>, pageId: string, stage: ShipStage): void {
  for (const s of ORDER.slice(0, ORDER.indexOf(stage) + 1)) seen.add(key(pageId, s));
}

/** One square of a path: where a step meets a lane. */
export interface Slot {
  stepId: string;
  laneId: string;
}

/** What a design hand-off drafted for a card, kept until its deploy. */
export interface PlannedRows {
  pageId: string;
  /** The matched cell: the handle today's path is read again from. */
  cellId: string;
  /** The sentence the `planned` card quoted. */
  quote: string;
  /** The rows drafted at `planned`. */
  rows: Slot[];
  /** The deprecations held for the deploy. */
  deprecate: Slot[];
}

/**
 * A `planned` draft with its deprecations taken out and held.
 *
 * @param draft - The draft at `planned`
 * @returns The draft left, or null when only deprecations were drafted, and the held slots
 */
export function holdDeprecations(draft: Draft): { draft: Draft | null; deprecate: Slot[] } {
  const held = draft.revision.rows.filter((r) => r.to === "deprecated");
  if (!held.length) return { draft, deprecate: [] };
  const rows = draft.revision.rows.filter((r) => r.to !== "deprecated");
  const deprecate = held.map(({ stepId, laneId }) => ({ stepId, laneId }));
  if (!rows.length) return { draft: null, deprecate };
  return {
    draft: { ...draft, revision: { ...draft.revision, rows }, changes: draft.changes.filter((c) => c.kind !== "deprecated") },
    deprecate,
  };
}

const at = (today: PathToday, slot: Slot) => today.cells.find((c) => c.stepId === slot.stepId && c.laneId === slot.laneId);
const nameOf = (list: Array<{ id: string; name: string }>, id: string) => list.find((x) => x.id === id)?.name ?? id;

/**
 * The deploy's promotion of a card's `planned` rows: each still `planned`
 * today to `live`, and each held deprecation. Null when none is `planned`
 * today, so the deploy drafts afresh.
 *
 * @param planned - What the design hand-off drafted
 * @param today - The path as the blueprint holds it now
 */
export function promotionDraft(planned: PlannedRows, today: PathToday): Draft | null {
  const rows: RevisionRow[] = [];
  const changes: DraftedChange[] = [];
  const where = (slot: Slot) => ({ step: nameOf(today.steps, slot.stepId), lane: nameOf(today.lanes, slot.laneId) });
  let moved = 0;
  for (const slot of planned.rows) {
    const cell = at(today, slot);
    if (cell?.status !== "planned") {
      moved += 1;
      continue;
    }
    rows.push({ ...slot, content: cell.content, from: "planned", to: "live" });
    changes.push({ kind: "promoted", ...where(slot), content: cell.content });
  }
  if (!rows.length) return null;
  for (const slot of planned.deprecate) {
    const cell = at(today, slot);
    if (!cell || cell.status === "deprecated") continue;
    rows.push({ ...slot, content: cell.content, from: cell.status, to: "deprecated" });
    changes.push({ kind: "deprecated", ...where(slot), content: cell.content });
  }
  const behind = today.status === "proposed" || today.status === "planned" || today.status === "built";
  return {
    revision: {
      pathId: today.pathId,
      label: `${today.scenario} › ${today.path}`,
      rows,
      ...(behind ? { path: { from: today.status, to: "live" as const } } : {}),
    },
    changes,
    confidence: 1,
    gaps: moved ? [`${moved} row(s) drafted at planned are no longer planned on the blueprint and were left out`] : [],
    promoted: true,
  };
}
