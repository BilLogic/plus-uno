// The nightly backstop (#896): a folder listing across the six teams that
// catches a file change no notification told uno-bot about.
//
// WHY ONE IS NEEDED. A FILE_UPDATE can fail to arrive: a delivery that failed
// four times is dropped, a subscription can be paused, and team webhooks "will
// not notify for files in invite-only folders". Every folder file carries its
// `last_modified`, and the route keeps each notified change as
// `figma-notify:changed:<file>` (`./event.ts`). A file whose last change is
// newer than its note was changed without a notification.
//
// THE WINDOW. A sweep looks at changes in (from, until]. `until` is the sweep's
// start less an hour, because FILE_UPDATE comes about 30 minutes after editing
// stops and a change still inside that hour may yet be notified. `from` is the
// last finished sweep's `until`, or a day back the first time. So every change
// falls in exactly one sweep; one made in the run's last hour waits a night.
//
// THE BUDGET. A full sweep is one listing per team and one per folder: 36 Tier
// 2 calls for six teams of five folders, and a scheduled job may spend 38
// (LOOKUP_CEILING). So the sweep is cut into jobs. Each takes the tasks left,
// stops while it still has room for one more call — never by a budget stop,
// so the runner never defers it — and keeps the rest in one KV key. The
// end-of-day run holds three jobs; a sweep a night does not finish, the next
// night resumes, window and all, and a job after a finished sweep lists
// nothing until the next night (`MIN_SWEEP_GAP_MS`). KV is read and written
// once a job, and KV and runner hops draw on their own 1,000-call bucket, not
// the 38.
//
// SAFE TO REPEAT. A folder listed twice — after a stop, or after a job read
// the key before the last job's write had spread — queues nothing twice: the
// runner claims `backstop:<file>:<last_modified>` once, and the note it then
// writes covers the change.
//
// WHAT IT QUEUES. For a missed change, the job a notification would have
// queued, on the same runner, marked `via: "backstop"`; then the file's note
// moves forward, so every reader of the notes sees the change. Ids and times
// only (ADR-030): never a file's name.
//
// PURE: every dependency arrives by name; `./env.ts` binds them.

import { rethrowIfBudget } from "../net";
import { FigmaRequestError, type FigmaClient } from "../figma/client";
import { CHANGED_PREFIX, CHANGED_TTL_S, type FigmaEventJob } from "./event";
import type { FigmaNotes } from "./route";
import type { FigmaTeam } from "./teams";

/** Where the sweep's progress is kept, in HARNESS_KV. */
export const BACKSTOP_STATE_KEY = "figma-notify:backstop";
/** A change this recent may still be notified, so it waits for the next sweep. */
export const GRACE_MS = 60 * 60 * 1000;
/** How far the first sweep ever looks back. */
export const FIRST_LOOK_BACK_MS = 24 * 60 * 60 * 1000;
/** How long after a sweep's end the next may start. The jobs of one run are
 *  minutes apart and the runs a day, so this holds a sweep to once a night. */
export const MIN_SWEEP_GAP_MS = 12 * 60 * 60 * 1000;
/** External subrequests one listing may take: the client tries a call up to
 *  three times. A job stops when it has less than this left. */
export const LISTING_COST = 3;

/** One listing still to make. */
export type BackstopTask =
  | { kind: "team"; team: string; teamId: string }
  | { kind: "folder"; team: string; folderId: string };

/** A sweep under way: its window, and what is left of it. */
export interface BackstopSweep {
  /** Changes after this were not looked at by an earlier sweep, epoch ms. */
  from: number;
  /** Changes up to this are this sweep's, epoch ms. */
  until: number;
  startedAt: number;
  tasks: BackstopTask[];
  /** Listings made so far, across its jobs. */
  listed: number;
  /** Missed changes queued so far, across its jobs. */
  queued: number;
}

/** Everything the backstop keeps between jobs. */
export interface BackstopState {
  sweep: BackstopSweep | null;
  /** The last finished sweep's `until`: where the next one's window starts. */
  lastUntil: number | null;
}

export interface BackstopDeps {
  figma: Pick<FigmaClient, "teamFolders" | "folderFiles">;
  teams: readonly FigmaTeam[];
  state: { get(): Promise<BackstopState | null>; put(state: BackstopState): Promise<void> };
  /** The route's notes (`./route.ts`). */
  notes: FigmaNotes;
  /** The route's claim-and-queue on the `figma/events` runner. */
  enqueueOnce(eventId: string, job: FigmaEventJob): Promise<"queued" | "seen">;
  meter?: { headroom(): { subrequests: number } };
  now(): number;
  /** Lists and reads the notes; queues and writes nothing. */
  dryRun?: boolean;
}

export interface BackstopReport {
  kind: "figma-backstop";
  key: string;
  outcome: "handled";
  /** Listings this job made. */
  listed: number;
  /** Files this job saw changed inside the window. */
  inWindow: number;
  /** Changes this job found no notification for. */
  missed: Array<{ fileKey: string; at: string }>;
  /** Listings the sweep still has to make. */
  left: number;
  /** The sweep finished in this job. */
  finished: boolean;
  note: string | null;
  summary: string;
}

/**
 * One backstop job: start a sweep, or resume the one under way, and list
 * until it is done or this job's budget is nearly spent.
 *
 * @param job - The `figma-backstop-N` job
 * @param deps - Everything it touches, by name
 * @throws Only what it did not expect; the progress is saved first
 */
export async function runBackstop(job: { key: string }, deps: BackstopDeps): Promise<BackstopReport> {
  const now = deps.now();
  const notes: string[] = [];
  const missed: BackstopReport["missed"] = [];
  let listed = 0;
  let inWindow = 0;

  const state: BackstopState = structuredClone((await deps.state.get()) ?? { sweep: null, lastUntil: null });
  if (!state.sweep) {
    if (!deps.teams.length) return report(job, { listed, inWindow, missed, left: 0, finished: false, notes: ["no teams to list"], dryRun: deps.dryRun });
    const until = now - GRACE_MS;
    // A later job of the same run finds tonight's sweep done, and lists nothing.
    if (state.lastUntil !== null && until - state.lastUntil < MIN_SWEEP_GAP_MS) {
      return report(job, { listed, inWindow, missed, left: 0, finished: false, notes: ["tonight's sweep has already finished"], dryRun: deps.dryRun });
    }
    state.sweep = {
      from: state.lastUntil ?? until - FIRST_LOOK_BACK_MS,
      until,
      startedAt: now,
      tasks: deps.teams.map((t): BackstopTask => ({ kind: "team", team: t.name, teamId: t.id })),
      listed: 0,
      queued: 0,
    };
  }
  const sweep = state.sweep;

  try {
    while (sweep.tasks.length) {
      if ((deps.meter?.headroom().subrequests ?? Infinity) < LISTING_COST) {
        notes.push("this job's budget is nearly spent — the next job resumes");
        break;
      }
      const task = sweep.tasks[0]!;
      const where = task.kind === "team" ? `team ${task.team}` : `a ${task.team} folder (${task.folderId})`;
      let listing: { folders?: { id: string }[]; files?: { key: string; last_modified: string }[] };
      try {
        listing = task.kind === "team" ? await deps.figma.teamFolders(task.teamId) : await deps.figma.folderFiles(task.folderId);
      } catch (err) {
        rethrowIfBudget(err);
        if (err instanceof FigmaRequestError && err.status === 404) {
          // Gone, or never ours to list: nothing a retry would find.
          notes.push(`${where}: Figma says 404, so skipped`);
          sweep.tasks.shift();
          continue;
        }
        notes.push(`${where} could not be listed (${messageOf(err)}) — kept for the next job`);
        break;
      }
      listed += 1;
      sweep.listed += 1;
      if (task.kind === "team") {
        sweep.tasks.shift();
        // A team's folders next, so one team finishes before the next starts.
        sweep.tasks.unshift(...(listing.folders ?? []).map((f): BackstopTask => ({ kind: "folder", team: task.team, folderId: f.id })));
        continue;
      }
      const stop = await compareFolder(listing.files ?? [], sweep, deps, missed, notes);
      inWindow += stop.inWindow;
      if (stop.refused) break;
      sweep.tasks.shift();
    }
  } finally {
    if (!sweep.tasks.length) {
      state.lastUntil = sweep.until;
      state.sweep = null;
    }
    if (!deps.dryRun) await deps.state.put(state);
  }
  return report(job, { listed, inWindow, missed, left: sweep.tasks.length, finished: !sweep.tasks.length, notes, dryRun: deps.dryRun, sweep });
}

/**
 * One folder's files against their notes: each change inside the window with
 * no note covering it is queued, and its note moved forward.
 *
 * @returns How many files changed inside the window, and whether a refused
 *   enqueue stopped it — the folder is then listed again by the next job
 */
async function compareFolder(
  files: readonly { key: string; last_modified: string }[],
  sweep: BackstopSweep,
  deps: BackstopDeps,
  missed: BackstopReport["missed"],
  notes: string[],
): Promise<{ inWindow: number; refused: boolean }> {
  let inWindow = 0;
  for (const file of files) {
    const at = Date.parse(file.last_modified);
    if (!Number.isFinite(at) || at <= sweep.from || at > sweep.until) continue;
    inWindow += 1;
    const key = `${CHANGED_PREFIX}${file.key}`;
    const note = await deps.notes.get(key);
    const noted = note ? Date.parse(note.at) : Number.NaN;
    // A notification's time is when Figma sent it, after the edit: at or
    // past the last change, the change was notified.
    if (Number.isFinite(noted) && noted >= at) continue;
    missed.push({ fileKey: file.key, at: file.last_modified });
    if (deps.dryRun) continue;
    const eventId = `backstop:${file.key}:${file.last_modified}`;
    const job: FigmaEventJob = { eventId, type: "FILE_UPDATE", webhookId: "backstop", fileKey: file.key, at: file.last_modified, via: "backstop" };
    try {
      if ((await deps.enqueueOnce(eventId, job)) === "queued") sweep.queued += 1;
    } catch (err) {
      rethrowIfBudget(err);
      notes.push(`${file.key}: the runner refused the job (${messageOf(err)}) — its folder is kept for the next job`);
      return { inWindow, refused: true };
    }
    try {
      await deps.notes.put(key, { at: file.last_modified }, CHANGED_TTL_S);
    } catch (err) {
      rethrowIfBudget(err);
      // The job is queued, which is what matters; a later sweep's window has
      // already moved past this change, so a missing note queues nothing twice.
      notes.push(`${file.key}: queued, but its note was not written (${messageOf(err)})`);
    }
  }
  return { inWindow, refused: false };
}

function report(
  job: { key: string },
  r: {
    listed: number;
    inWindow: number;
    missed: BackstopReport["missed"];
    left: number;
    finished: boolean;
    notes: string[];
    dryRun?: boolean | undefined;
    sweep?: BackstopSweep;
  },
): BackstopReport {
  const note = r.notes.length ? r.notes.join("; ") : null;
  const window = r.sweep ? ` in ${new Date(r.sweep.from).toISOString()}–${new Date(r.sweep.until).toISOString()}` : "";
  const verb = r.dryRun ? "would queue" : "queued";
  const end = r.finished ? "sweep finished" : `${r.left} listing(s) left`;
  const summary = `listed ${r.listed}${window}: ${r.inWindow} file(s) changed, ${r.missed.length} with no notification, ${verb}; ${end}${note ? ` — ${note}` : ""}`;
  return { kind: "figma-backstop", key: job.key, outcome: "handled", listed: r.listed, inWindow: r.inWindow, missed: r.missed, left: r.left, finished: r.finished, note, summary };
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
