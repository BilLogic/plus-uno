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
// finished never reports it twice. This job runs later in the same end-of-day
// run and sends one `repository_dispatch` (`figma-library-published`) for
// everything owed. Nothing owed — a quiet day, or a library edited with no new
// version — sends nothing.
//
// OWED UNTIL IT LANDS. GitHub accepting the dispatch says a run was queued,
// not that it finished: the run may still give up on a rate limit (exit 75)
// and write nothing. So a version stays owed until the repo's snapshot records
// it — on `main`, or on the refresh branch whose draft PR is waiting for
// review — and each night this job first reads those two files and settles
// what they record. Whatever is still owed is dispatched again, so a run that
// gave up is completed by a later night's.
//
// UNLABELLED, SETTLED ON DISPATCH. A publish left with no label or
// description reads like an autosave, so the poll owes a refresh for every new
// version and marks those (`unlabelled`). The repo's snapshot records labelled
// versions only and never shows one of them landing, so the dispatch GitHub
// accepts settles it; a version that changed nothing costs one refresh that
// finds nothing.
//
// ONE REFRESH PER PUBLISH, ONE RUN AT A TIME. The job runs once a night,
// after every job of that run that reads Figma, so the Action's node fetches
// never share uno-bot's half of Figma's Tier 1 with the Worker's own. A run
// takes minutes and the next dispatch is a day away, and the workflow's
// concurrency group holds any second run behind the first. Publishes found the
// same night share a refresh, since a refresh records the library as it then
// stands.
//
// A REFRESH THAT KEEPS NOT LANDING IS SAID ONCE. Each night that ends with a
// refresh still owed after a try — GitHub refused the dispatch, or accepted it
// and nothing landed — counts one. At `STALL_LIMIT` the job files one
// `automation-blocked` issue, the label the headless sweeps file a blocked run
// under (`scripts/prompts/references/headless-intake.md`), and files no other
// until a version lands and the count starts again.
//
// THE PAYLOAD carries the newest version's id, digits only, which the workflow
// shows in its summary and nowhere else (no `client_payload` reaches a shell).
//
// PURE: the store, the repo reads, the dispatch and the filing arrive by name;
// `./env.ts` binds them.

import { rethrowIfBudget } from "../net";

/** Where the poll leaves the publishes the repo's copy has yet to record. */
export const REFRESH_OWED_KV_KEY = "figma-poll:refresh-owed";
/** The `repository_dispatch` event `figma-snapshot-refresh.yml` runs on. */
export const REFRESH_EVENT = "figma-library-published";
/** The repo's snapshot file, and the branch the workflow pushes it to. */
export const SNAPSHOT_PATH = "scripts/figma-component-snapshot.json";
export const REFRESH_BRANCH = "chore/figma-snapshot-refresh";
/**
 * Nights with a try and still nothing landed before it is said: three
 * weekday runs. One miss is a busy Figma or a GitHub blip, and the next night
 * completes it; three in a row is not transient, and a snapshot three working
 * days behind a publish is as late as nobody being told should get.
 */
export const STALL_LIMIT = 3;
/** The label a blocked automation's issue carries (not `harness-intake`). */
export const BLOCKED_LABEL = "automation-blocked";

/** The publishes a refresh is owed for. */
export interface RefreshOwed {
  /** Published version ids, newest first. */
  versionIds: string[];
  /** The ones among them with no label or description, which the repo's
   *  snapshot never records: each is settled by the refresh GitHub accepts. */
  unlabelled?: string[];
  /** When the oldest of them was found. */
  since: string;
  /** Nights that tried to start the refresh since a version last landed. */
  tries?: number;
  /** What the last try came to, for the blocked issue. */
  lastTry?: string;
  /** The `automation-blocked` issue filed for these tries, once. */
  blockedIssue?: number;
}

export interface SnapshotRefreshDeps {
  /** What is owed. `update` reads it again and writes what `change` returns
   *  (null clears it), so a publish the poll recorded meanwhile stays owed. */
  owed: {
    read(): Promise<RefreshOwed | null>;
    update(change: (current: RefreshOwed | null) => RefreshOwed | null): Promise<void>;
  };
  /** The version ids the repo's snapshot records, on `main` and on the
   *  refresh branch together. Throws when they cannot be read. */
  landed(): Promise<readonly string[]>;
  /** Send the `repository_dispatch`: ok on GitHub's 204. */
  dispatch(eventType: string, payload: Record<string, unknown>): Promise<{ ok: boolean; status: number }>;
  /** File the `automation-blocked` issue; resolves to its number. */
  fileBlocked(issue: { title: string; body: string }): Promise<number>;
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
 * @param unlabelled - Those of them with no label or description
 */
export function owedWith(
  owed: RefreshOwed | null,
  versionIds: readonly string[],
  at: string,
  unlabelled: readonly string[] = [],
): RefreshOwed {
  const merged: RefreshOwed = { ...owed, versionIds: [...new Set([...versionIds, ...(owed?.versionIds ?? [])])], since: owed?.since ?? at };
  const quiet = [...new Set([...unlabelled, ...(owed?.unlabelled ?? [])])];
  if (quiet.length) merged.unlabelled = quiet;
  return merged;
}

/**
 * The owed versions a snapshot recording `recorded` covers: the newest one it
 * records and every older one. A refresh records the library as it stands, so
 * a snapshot holding version N holds everything published before it, even an
 * id its 30-version window has since dropped.
 *
 * @param owed - Owed ids, newest first
 * @param recorded - The ids the snapshot records
 */
export function coveredBy(owed: readonly string[], recorded: readonly string[]): string[] {
  const known = new Set(recorded);
  const i = owed.findIndex((id) => known.has(id));
  return i === -1 ? [] : owed.slice(i);
}

/**
 * What is still owed once `landed` is recorded: null when nothing is. A
 * version landing is progress, so the tries start again from none.
 *
 * @param owed - What is owed now
 * @param landed - The versions the repo's snapshot now records
 */
export function owedAfter(owed: RefreshOwed | null, landed: readonly string[]): RefreshOwed | null {
  const left = (owed?.versionIds ?? []).filter((id) => !landed.includes(id));
  if (!left.length) return null;
  const unlabelled = (owed!.unlabelled ?? []).filter((id) => left.includes(id));
  return { versionIds: left, since: owed!.since, ...(unlabelled.length ? { unlabelled } : {}) };
}

/**
 * One run of the `figma-snapshot-refresh` job: settle what the repo's snapshot
 * now records, and start the refresh for whatever is still owed.
 *
 * @param deps - What is owed, the repo reads, the dispatch and the filing
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
  if (!owed || !versionIds.length) return done(false, "nothing published since the last refresh");

  // What landed since the last night. Unreadable, nothing is settled and the
  // refresh is started again: a second run of an unchanged library is cheap.
  let covered: string[] = [];
  try {
    covered = coveredBy(versionIds, await deps.landed());
  } catch (err) {
    rethrowIfBudget(err);
    console.warn(`[figma-library] snapshot refresh: the repo's snapshot is unread (${messageOf(err)})`);
  }
  const left = versionIds.filter((id) => !covered.includes(id));
  if (!left.length) {
    if (!deps.dryRun) await deps.owed.update((current) => owedAfter(current, covered));
    return done(false, `the repo's snapshot records version ${versionIds[0]}: nothing owed`);
  }

  const newest = left[0]!;
  const what = `${left.length} publish(es), newest version ${newest}`;
  if (deps.dryRun) return done(false, `would start the refresh for ${what}`);

  let lastTry: string;
  let dispatched = false;
  try {
    const answer = await deps.dispatch(REFRESH_EVENT, { figma_version_id: newest });
    dispatched = answer.ok;
    lastTry = answer.ok ? "GitHub accepted the dispatch, and nothing has landed since" : `GitHub refused the dispatch (${answer.status})`;
  } catch (err) {
    rethrowIfBudget(err);
    lastTry = `the dispatch failed (${messageOf(err)})`;
  }

  // A publish with no label is one the repo's snapshot never records, so the
  // refresh GitHub accepts settles it; a labelled one waits to land.
  const sent = dispatched ? left.filter((id) => owed.unlabelled?.includes(id)) : [];
  const waiting = left.filter((id) => !sent.includes(id));

  // A version that landed resets the count; otherwise this night is one more.
  const tries = (covered.length ? 0 : (owed.tries ?? 0)) + 1;
  let blockedIssue = covered.length ? undefined : owed.blockedIssue;
  let filed = "";
  if (waiting.length && tries >= STALL_LIMIT && blockedIssue === undefined) {
    try {
      blockedIssue = await deps.fileBlocked(blockedIssueFor({ ...owed, versionIds: waiting }, tries, lastTry));
      filed = `; filed #${blockedIssue}`;
    } catch (err) {
      rethrowIfBudget(err);
      filed = `; the blocked issue was not filed (${messageOf(err)}), so the next night tries again`;
    }
  }
  await deps.owed.update((current) => {
    const still = covered.length || sent.length ? owedAfter(current, [...covered, ...sent]) : current;
    if (!still) return null;
    return { ...still, tries, lastTry, ...(blockedIssue === undefined ? {} : { blockedIssue }) };
  });

  const settled = covered.length ? `${covered.length} landed; ` : "";
  if (dispatched) return done(true, `${settled}started the refresh for ${what}${filed}`);
  return done(false, `${settled}${lastTry} — still owed, so the next night tries again${filed}`);
}

/**
 * The `automation-blocked` issue: what is owed, since when, and what each
 * night came to — enough for whoever picks it up to start at the right end.
 */
export function blockedIssueFor(owed: RefreshOwed, tries: number, lastTry: string): { title: string; body: string } {
  return {
    title: `[figma-snapshot-refresh] blocked: the library snapshot has not refreshed after ${tries} nights`,
    body: [
      `uno-bot has tried ${tries} nights running to refresh \`${SNAPSHOT_PATH}\`, and the snapshot on \`main\` and on \`${REFRESH_BRANCH}\` still does not record the library's newest publish.`,
      "",
      `- Owed since: ${owed.since}`,
      `- Versions owed, newest first: ${owed.versionIds.join(", ")}`,
      `- Last night: ${lastTry}`,
      "",
      "Where to look: the `Refresh Figma Component Snapshot` runs in Actions. A run that says Figma was busy will be retried each night; a run that failed for another reason, or no run at all, is what this issue is for. A refused dispatch usually means `GITHUB_TOKEN` on the Worker lacks Contents write on the repo. `gh workflow run figma-snapshot-refresh.yml` from `main` runs it by hand.",
      "",
      "uno-bot keeps trying each night and files no second issue until a version lands.",
    ].join("\n"),
  };
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
