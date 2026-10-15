// A blueprint revision: the drafted row changes to one path, the unit a ✅
// approves and the writer applies.
//
// Blueprint words only. A row here is one cell — the step × lane square on a
// path — never a Roadmap card's field, and a status is the blueprint's own
// vocabulary (`proposed · planned · built · live · at_risk · deprecated`).

/** The blueprint's status vocabulary, the only one ever written. */
export const ENTITY_STATUSES = ["proposed", "planned", "built", "live", "at_risk", "deprecated"] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

/**
 * One cell the revision writes: its slot, its text, and its status before and
 * after.
 *
 * `from` is what the draft READ — `null` for a cell that does not exist yet.
 * The writer holds the write to it: a cell that has moved since the draft (a
 * slot filled, a status changed) is a stale race, and the whole revision is
 * taken back rather than written over somebody else's edit. A deprecation is
 * a row like any other, with `to: "deprecated"`; a revision deletes only a
 * cell it created itself, when it takes that cell back.
 */
export interface RevisionRow {
  laneId: string;
  stepId: string;
  content: string;
  from: EntityStatus | null;
  to: EntityStatus;
}

export interface BlueprintRevision {
  pathId: string;
  /** `scenario › path`, for the thread's account of the write. */
  label: string;
  rows: RevisionRow[];
  /** The path's own status change, written after its rows, when it has one. */
  path?: { from: EntityStatus; to: EntityStatus };
  /**
   * Draw the rows on a NEW path beside `pathId` instead of on it: a proposal.
   * The writer creates the path at `status` (`create_path_at_status`, lanes
   * and step order copied from `pathId`), then writes each row on the new
   * path's lane of the same name. `pathId`'s own cells are never written.
   */
  variant?: BlueprintVariant;
}

/** The kind a drawn proposal's path takes in the blueprint's route vocabulary. */
export const VARIANT_KIND = "variant" as const;

export interface BlueprintVariant {
  scenarioId: string;
  /** The new path's name. */
  name: string;
  status: EntityStatus;
  /** `pathId`'s lanes by id, so each row finds its lane on the new path by name. */
  lanes: Record<string, string>;
}

const isStatus = (v: unknown): v is EntityStatus => ENTITY_STATUSES.includes(v as EntityStatus);
const isText = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/**
 * A staged operation's input, read back as a revision — or why it is not one.
 *
 * The card was staged by the Worker, so a malformed input is a bug upstream;
 * it is answered, not thrown, because the Gate is mid-flight.
 *
 * @param input - The operation's input as stored on the card
 */
export function readRevision(input: Record<string, unknown>): BlueprintRevision | { error: string } {
  const { pathId, label, rows, path, variant } = input;
  if (!isText(pathId)) return { error: "the revision names no path" };
  if (!Array.isArray(rows) || rows.length === 0) return { error: "the revision has no rows" };
  const read: RevisionRow[] = [];
  for (const [i, raw] of rows.entries()) {
    const r = (raw ?? {}) as Record<string, unknown>;
    if (!isText(r.laneId) || !isText(r.stepId) || !isText(r.content)) {
      return { error: `row ${i + 1} needs a lane, a step and its text` };
    }
    if (!isStatus(r.to) || (r.from !== null && !isStatus(r.from))) {
      return { error: `row ${i + 1} names a status outside the blueprint's vocabulary` };
    }
    read.push({ laneId: r.laneId, stepId: r.stepId, content: r.content, from: r.from, to: r.to });
  }
  let pathChange: BlueprintRevision["path"];
  if (path !== undefined) {
    const p = (path ?? {}) as Record<string, unknown>;
    if (!isStatus(p.from) || !isStatus(p.to)) return { error: "the path's status change is outside the vocabulary" };
    pathChange = { from: p.from, to: p.to };
  }
  let drawn: BlueprintVariant | undefined;
  if (variant !== undefined) {
    const v = (variant ?? {}) as Record<string, unknown>;
    const lanes = (v.lanes ?? {}) as Record<string, unknown>;
    if (!isText(v.scenarioId) || !isText(v.name) || !isStatus(v.status)) return { error: "the new path needs a scenario, a name and a status" };
    if (typeof lanes !== "object" || !read.every((r) => isText(lanes[r.laneId]))) return { error: "a row's lane has no name to find it by on the new path" };
    drawn = { scenarioId: v.scenarioId, name: v.name, status: v.status, lanes: Object.fromEntries(read.map((r) => [r.laneId, lanes[r.laneId] as string])) };
  }
  return {
    pathId,
    label: isText(label) ? label : "the path",
    rows: read,
    ...(pathChange ? { path: pathChange } : {}),
    ...(drawn ? { variant: drawn } : {}),
  };
}
