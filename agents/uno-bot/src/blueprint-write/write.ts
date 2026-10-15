// Writing one approved blueprint revision through the authoring RPCs — all of
// it, or none of it.
//
// EVERY WRITE IS RECORDED, AS UNO-BOT. Each authoring call lands one row in
// `authoring_changes`, and the database's trigger stamps that row `author =
// uno-bot` with uno-bot's `author_id`, because the call carried the bot's JWT
// (plus-uno-blueprint `20261015120000`). Who appends the row depends on the
// RPC. `upsert_cell_at_status` and `set_path_status` append their own in the
// same transaction, and so do the delete functions. Every older RPC
// (`add_step`, `create_path`, …) leaves the record to its caller, so
// `authoringCall` follows one with `record_authoring_change`: a second
// subrequest, which `authoringCallCost` counts.
//
// ALL OR NONE. A revision is reviewed whole, so it is written whole. When a
// write fails, or a cell turns out to have moved since the draft (a stale
// race: a slot filled, a status changed), every write already made — that one
// included — is taken back, newest first. A changed cell is put back as it
// stood. A cell the revision created is deleted through `delete_cell`. What
// could not be taken back is named.
//
// A PROPOSAL IS A NEW PATH. A revision with a `variant` is drawn beside its
// path, never on it: `create_path_at_status` makes the path at its status
// from the first insert (so it is never live), copying the lanes and step
// order of the path it sits beside; one read finds the new path's lanes,
// matched to the drafted rows' lanes by name; and the rows are written there.
// Taking it back deletes the cells and then the path (`delete_path`).
//
// Env-free: the RPC arrives as a function, so the Node suite drives this
// through the Gate with a fake Supabase fetch.

import { VARIANT_KIND, type BlueprintRevision, type EntityStatus, type RevisionRow } from "./revision";

export interface WriterDeps {
  /** One authoring RPC: its result, or a throw with the database's reason. */
  rpc(fn: string, args: Record<string, unknown>): Promise<unknown>;
  /** The agent session every write of this approval is recorded under. */
  sessionId: string;
  /** A path's lanes, read — how a new path's lanes are found. Needed only
   *  for a revision with a `variant`. */
  lanesOf?(pathId: string): Promise<Array<{ id: string; name: string }>>;
}

export type RevisionResult =
  | {
      ok: true;
      written: number;
      cellIds: string[];
      /** The path a `variant` revision created. */
      createdPathId?: string;
    }
  | {
      ok: false;
      /** What stopped the write, in one clause. */
      reason: string;
      /** Writes taken back. */
      tookBack: number;
      /** Writes whose take-back failed — the blueprint still shows them. */
      notTakenBack: string[];
    };

/**
 * The RPCs that append their own `authoring_changes` row. Every other
 * authoring RPC is recorded by its caller.
 */
const SELF_RECORDING = new Set(["upsert_cell_at_status", "set_path_status", "create_path_at_status"]);
const recordsItself = (fn: string) => SELF_RECORDING.has(fn) || fn.startsWith("delete_");

/**
 * Subrequests one authoring call costs: 1, or 2 for an RPC that leaves its
 * record to the caller.
 *
 * @param fn - The authoring RPC's name
 */
export function authoringCallCost(fn: string): number {
  return recordsItself(fn) ? 1 : 2;
}

/**
 * One authoring RPC, recorded. An RPC that does not record itself is followed
 * by `record_authoring_change` under the approval's agent session, as
 * `uno-bot` — the trigger stamps that author on a row under the bot's JWT
 * whatever is passed, and refuses it from anyone else.
 *
 * @param deps - The RPC and the approval's agent session
 * @param fn - The authoring RPC
 * @param args - Its arguments
 * @param revert - The call that undoes it, for the record
 */
export async function authoringCall(
  deps: WriterDeps,
  fn: string,
  args: Record<string, unknown>,
  revert: { fn: string; args: Record<string, unknown> } | null = null,
): Promise<unknown> {
  const result = await deps.rpc(fn, args);
  if (!recordsItself(fn)) {
    await deps.rpc("record_authoring_change", { fn, args, revert, author: "uno-bot", agent_session_id: deps.sessionId });
  }
  return result;
}

/**
 * Blueprint calls a revision can cost at worst: every write, then every one of
 * them taken back. Sign-in is the session's to count (`blueprintSession`).
 *
 * @param revision - The revision to write
 */
export function revisionWriteCalls(revision: Pick<BlueprintRevision, "rows" | "path" | "variant">): number {
  const cell = authoringCallCost("upsert_cell_at_status");
  // A cell's take-back is the same upsert or a delete; budget the dearer.
  const cellBack = Math.max(authoringCallCost("upsert_cell_at_status"), authoringCallCost("delete_cell"));
  const path = authoringCallCost("set_path_status");
  // A new path: its creation, the read of its lanes, and its deletion.
  const variant = revision.variant ? authoringCallCost("create_path_at_status") + 1 + authoringCallCost("delete_path") : 0;
  return revision.rows.length * (cell + cellBack) + (revision.path ? path * 2 : 0) + variant;
}

type Written =
  | { kind: "cell"; row: RevisionRow; id: string; previous: { content: string; status: EntityStatus } | null }
  | { kind: "path"; previous: EntityStatus }
  | { kind: "created-path"; id: string };

interface CellReport {
  id: string;
  inserted: boolean;
  previous: { id: string; content: string; status: EntityStatus } | null;
}

const slotOf = (row: RevisionRow) => `step ${row.stepId} × lane ${row.laneId}`;
const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * Write the revision, or leave the blueprint as it found it.
 *
 * @param revision - The approved revision
 * @param deps - The RPC and the approval's agent session
 */
export async function writeRevision(revision: BlueprintRevision, deps: WriterDeps): Promise<RevisionResult> {
  const written: Written[] = [];
  let reason: string | null = null;

  // Where the rows go: the revision's path, or a new one beside it.
  let target = revision.pathId;
  let laneOf = (row: RevisionRow) => row.laneId;
  if (revision.variant) {
    const v = revision.variant;
    if (!deps.lanesOf) return { ok: false, reason: "no way to read the new path's lanes", tookBack: 0, notTakenBack: [] };
    try {
      target = String(
        await authoringCall(deps, "create_path_at_status", {
          scenario_id: v.scenarioId,
          name: v.name,
          status: v.status,
          kind: VARIANT_KIND,
          lane_source_path_id: revision.pathId,
          agent_session_id: deps.sessionId,
        }),
      );
    } catch (err) {
      return { ok: false, reason: `creating the path ${v.name} failed: ${message(err)}`, tookBack: 0, notTakenBack: [] };
    }
    written.push({ kind: "created-path", id: target });
    try {
      const byName = new Map((await deps.lanesOf(target)).map((l) => [l.name, l.id]));
      const missing = revision.rows.map((r) => v.lanes[r.laneId]!).filter((name) => !byName.has(name));
      if (missing.length) reason = `the new path has no lane ${missing.map((n) => `"${n}"`).join(", ")}`;
      laneOf = (row) => byName.get(v.lanes[row.laneId]!)!;
    } catch (err) {
      reason = `reading the new path's lanes failed: ${message(err)}`;
    }
  }

  const cellArgs = (row: RevisionRow, content: string, status: EntityStatus) => ({
    path_id: target,
    lane_id: laneOf(row),
    step_id: row.stepId,
    content,
    status,
    agent_session_id: deps.sessionId,
  });

  for (const row of reason === null ? revision.rows : []) {
    let report: CellReport;
    try {
      report = (await authoringCall(deps, "upsert_cell_at_status", cellArgs(row, row.content, row.to))) as CellReport;
    } catch (err) {
      reason = `writing ${slotOf(row)} failed: ${message(err)}`;
      break;
    }
    const previous = report.inserted || !report.previous ? null : { content: report.previous.content, status: report.previous.status };
    written.push({ kind: "cell", row, id: report.id, previous });
    const moved = row.from === null ? previous !== null : previous?.status !== row.from;
    if (moved) {
      reason = `${slotOf(row)} changed since the draft (drafted as ${row.from ?? "empty"}, found ${previous?.status ?? "empty"})`;
      break;
    }
  }

  if (reason === null && revision.path) {
    try {
      const report = (await authoringCall(deps, "set_path_status", {
        path_id: revision.pathId,
        status: revision.path.to,
        agent_session_id: deps.sessionId,
      })) as { previous: { status: EntityStatus } };
      written.push({ kind: "path", previous: report.previous.status });
      if (report.previous.status !== revision.path.from) {
        reason = `the path changed since the draft (drafted as ${revision.path.from}, found ${report.previous.status})`;
      }
    } catch (err) {
      reason = `writing the path's status failed: ${message(err)}`;
    }
  }

  if (reason === null) {
    const cellIds = written.flatMap((w) => (w.kind === "cell" ? [w.id] : []));
    return { ok: true, written: written.length, cellIds, ...(revision.variant ? { createdPathId: target } : {}) };
  }

  // Newest first, so each take-back meets the state its write left.
  let tookBack = 0;
  const notTakenBack: string[] = [];
  for (const w of [...written].reverse()) {
    try {
      if (w.kind === "created-path") {
        await authoringCall(deps, "delete_path", { path_id: w.id });
      } else if (w.kind === "path") {
        await authoringCall(deps, "set_path_status", { path_id: revision.pathId, status: w.previous, agent_session_id: deps.sessionId });
      } else if (w.previous) {
        await authoringCall(deps, "upsert_cell_at_status", cellArgs(w.row, w.previous.content, w.previous.status));
      } else {
        await authoringCall(deps, "delete_cell", { cell_id: w.id });
      }
      tookBack += 1;
    } catch (err) {
      const what = w.kind === "created-path" ? `the new path ${w.id}` : w.kind === "path" ? "the path's status" : slotOf(w.row);
      notTakenBack.push(`${what} (${message(err)})`);
    }
  }
  return { ok: false, reason, tookBack, notTakenBack };
}
