// The repo's copy of the library, refreshed once per publish (#898).
//
// `scripts/figma-component-snapshot.json` is the repo's record of what the
// library has published — what `check:figma-snapshots` reads. The Worker's own
// baseline lives in KV (`../figma-poll.ts`), so a publish moved the Worker on
// and left the repo's copy behind until someone ran
// `figma-snapshot-refresh.yml` by hand. Now the poll that finds the publish
// says the refresh is owed, and this job starts it.
//
// THE HAND-OFF. The end-of-day poll, on finding a newly published version,
// adds its id to `figma-poll:refresh-owed` before it moves its own snapshot on
// — so a poll that stops in between finds the same version again, and one that
// finished never reports it twice. This job, right after the poll and again
// the next morning, sends one `repository_dispatch` (`figma-library-published`)
// for everything owed, then clears it. A refused dispatch leaves it owed, so
// the next run tries again. Nothing owed — a quiet day, or a library edited
// with no new version — sends nothing.
//
// ONE AT A TIME is the workflow's: its concurrency group runs one refresh and
// holds the next behind it. Publishes found the same night share a refresh,
// since a refresh records the library as it then stands.
//
// THE PAYLOAD carries the newest version's id, digits only, which the workflow
// shows in its summary and nowhere else (no `client_payload` reaches a shell).
//
// PURE: the store and the dispatch arrive by name; `./env.ts` binds them.

import { rethrowIfBudget } from "../net";

/** Where the poll leaves the publishes the repo's copy has yet to record. */
export const REFRESH_OWED_KV_KEY = "figma-poll:refresh-owed";
/** The `repository_dispatch` event `figma-snapshot-refresh.yml` runs on. */
export const REFRESH_EVENT = "figma-library-published";

/** The publishes a refresh is owed for. */
export interface RefreshOwed {
  /** Published version ids, newest first. */
  versionIds: string[];
  /** When the oldest of them was found. */
  since: string;
}

export interface SnapshotRefreshDeps {
  owed: { read(): Promise<RefreshOwed | null>; clear(): Promise<void> };
  /** Send the `repository_dispatch`: ok on GitHub's 204. */
  dispatch(eventType: string, payload: Record<string, unknown>): Promise<{ ok: boolean; status: number }>;
  dryRun?: boolean;
}

export interface SnapshotRefreshReport {
  kind: "figma-snapshot-refresh";
  outcome: "handled";
  /** A refresh was started this run. */
  dispatched: boolean;
  /** What was owed when the run began, newest first. */
  versionIds: string[];
  summary: string;
}

/**
 * Merge newly published versions into what is owed: newest first, each once.
 *
 * @param owed - What was owed already, or null
 * @param versionIds - The publishes the poll just found, newest first
 * @param at - When it found them, ISO
 */
export function owedWith(owed: RefreshOwed | null, versionIds: readonly string[], at: string): RefreshOwed {
  return { versionIds: [...new Set([...versionIds, ...(owed?.versionIds ?? [])])], since: owed?.since ?? at };
}

/**
 * One run of the `figma-snapshot-refresh` job: start the refresh for whatever
 * the poll found published, once.
 *
 * @param deps - What is owed, and the dispatch
 * @throws Only a budget stop; a refused dispatch is reported and stays owed
 */
export async function runSnapshotRefresh(deps: SnapshotRefreshDeps): Promise<SnapshotRefreshReport> {
  const owed = await deps.owed.read();
  const versionIds = owed?.versionIds ?? [];
  const done = (dispatched: boolean, summary: string): SnapshotRefreshReport => ({
    kind: "figma-snapshot-refresh",
    outcome: "handled",
    dispatched,
    versionIds,
    summary,
  });
  if (!versionIds.length) return done(false, "nothing published since the last refresh");
  const newest = versionIds[0]!;
  const what = `${versionIds.length} publish(es), newest version ${newest}`;
  if (deps.dryRun) return done(false, `would start the refresh for ${what}`);

  let answer: { ok: boolean; status: number };
  try {
    answer = await deps.dispatch(REFRESH_EVENT, { figma_version_id: newest });
  } catch (err) {
    rethrowIfBudget(err);
    return done(false, `the dispatch failed (${err instanceof Error ? err.message : String(err)}) — still owed, so the next run tries again`);
  }
  if (!answer.ok) return done(false, `GitHub refused the dispatch (${answer.status}) — still owed, so the next run tries again`);
  await deps.owed.clear();
  return done(true, `started the refresh for ${what}`);
}
