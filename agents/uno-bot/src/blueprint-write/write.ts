// Writing one approved blueprint revision through the authoring RPCs — all of
// it, or none of it.
//
// TWO RPCS, BOTH RECORDING THEMSELVES. `upsert_cell_at_status` writes a cell's
// text and status in one statement; `set_path_status` a path's status. Each
// appends its own `authoring_changes` row in the same transaction — author
// `agent`, `author_id` uno-bot's account, the agent session this approval
// minted, and the captured inverse (plus-uno-blueprint `20261015120000`). So a
// write is one subrequest and can never land unrecorded; nothing here calls
// `record_authoring_change`.
//
// ALL OR NONE. A revision is reviewed whole, so it is written whole. When a
// write fails, or a cell turns out to have moved since the draft (a stale
// race: a slot filled, a status changed), every write already made — that one
// included — is taken back, newest first, through the same RPCs. A changed
// cell is put back as it stood. A NEW cell cannot be: uno-bot's identity may
// not delete (a trigger refuses it), so it is set to `deprecated` and named,
// for a person to delete. What could not be taken back is named too.
//
// Env-free: the RPC arrives as a function, so the Node suite drives this
// through the Gate with a fake Supabase fetch.

import type { BlueprintRevision, EntityStatus, RevisionRow } from "./revision";

export interface WriterDeps {
  /** One authoring RPC: its result, or a throw with the database's reason. */
  rpc(fn: "upsert_cell_at_status" | "set_path_status", args: Record<string, unknown>): Promise<unknown>;
  /** The agent session every write of this approval is recorded under. */
  sessionId: string;
}

export type RevisionResult =
  | { ok: true; written: number; cellIds: string[] }
  | {
      ok: false;
      /** What stopped the write, in one clause. */
      reason: string;
      /** Writes taken back. */
      tookBack: number;
      /** New cells left `deprecated` because uno-bot may not delete them. */
      leftDeprecated: string[];
      /** Writes whose take-back failed — the blueprint still shows them. */
      notTakenBack: string[];
    };

/**
 * Blueprint calls a revision can cost at worst: every write, then every one of
 * them taken back. Sign-in is the session's to count (`blueprintSession`).
 *
 * @param revision - The revision to write
 */
export function revisionWriteCalls(revision: Pick<BlueprintRevision, "rows" | "path">): number {
  const writes = revision.rows.length + (revision.path ? 1 : 0);
  return writes * 2;
}

type Written =
  | { kind: "cell"; row: RevisionRow; id: string; previous: { content: string; status: EntityStatus } | null }
  | { kind: "path"; previous: EntityStatus };

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
  const cellArgs = (row: RevisionRow, content: string, status: EntityStatus) => ({
    path_id: revision.pathId,
    lane_id: row.laneId,
    step_id: row.stepId,
    content,
    status,
    agent_session_id: deps.sessionId,
  });

  let reason: string | null = null;
  for (const row of revision.rows) {
    let report: CellReport;
    try {
      report = (await deps.rpc("upsert_cell_at_status", cellArgs(row, row.content, row.to))) as CellReport;
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
      const report = (await deps.rpc("set_path_status", {
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
    return { ok: true, written: written.length, cellIds };
  }

  // Newest first, so each take-back meets the state its write left.
  let tookBack = 0;
  const leftDeprecated: string[] = [];
  const notTakenBack: string[] = [];
  for (const w of [...written].reverse()) {
    try {
      if (w.kind === "path") {
        await deps.rpc("set_path_status", { path_id: revision.pathId, status: w.previous, agent_session_id: deps.sessionId });
      } else if (w.previous) {
        await deps.rpc("upsert_cell_at_status", cellArgs(w.row, w.previous.content, w.previous.status));
      } else {
        await deps.rpc("upsert_cell_at_status", cellArgs(w.row, w.row.content, "deprecated"));
        leftDeprecated.push(w.id);
      }
      tookBack += 1;
    } catch (err) {
      notTakenBack.push(`${w.kind === "path" ? "the path's status" : slotOf(w.row)} (${message(err)})`);
    }
  }
  return { ok: false, reason, tookBack, leftDeprecated, notTakenBack };
}
