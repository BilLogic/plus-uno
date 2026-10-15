// The library snapshot refresh bound to `Env` — the only file in the folder
// that names it. The refresh (`./snapshot-refresh.ts`) reads what the poll
// (`../figma-poll.ts`) left owed in HARNESS_KV, reads the repo's snapshot from
// GitHub, and sends `repository_dispatch` with GITHUB_TOKEN.
//
// The repo is `GITHUB_REPO`, the harness repo: the snapshot lives there, and a
// refresh that keeps not landing files its `automation-blocked` issue there.

import type { Env } from "../types";
import { GithubRequestError, githubIssueClient, githubLibraryReads, resolveRepoFor } from "../integrations/github";
import { kvJson } from "../figma-poll";
import { repositoryDispatch } from "../tools/github-dispatch";
import {
  BLOCKED_LABEL,
  REFRESH_BRANCH,
  REFRESH_OWED_KV_KEY,
  runSnapshotRefresh,
  SNAPSHOT_PATH,
  type RefreshOwed,
  type SnapshotRefreshReport,
} from "./snapshot-refresh";
import { charge } from "../net";

/**
 * The `figma-snapshot-refresh` job on `Env` (#898): settle what the repo's
 * snapshot now records, and start the refresh for whatever the poll found
 * published that it does not.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` reads what is owed and what landed, and dispatches,
 *   files and writes nothing
 */
export async function runSnapshotRefreshOnEnv(env: Env, opts: { dryRun: boolean }): Promise<SnapshotRefreshReport | { summary: string }> {
  const kv = env.HARNESS_KV;
  if (!kv) return { summary: "HARNESS_KV not bound — no publish is recorded, so nothing to refresh" };
  const owed = kvJson<RefreshOwed | null>(env, REFRESH_OWED_KV_KEY, null);
  const target = resolveRepoFor(env, undefined);
  return runSnapshotRefresh({
    owed: {
      read: owed.read,
      async update(change) {
        // Read again: a poll may have recorded a publish since this job read.
        const next = change(await owed.read());
        if (next) return owed.write(next);
        charge(1, "kv");
        await kv.delete(REFRESH_OWED_KV_KEY);
      },
    },
    async landed() {
      if (!target.ok) throw new Error(`no repo: ${target.error}`);
      const reads = githubLibraryReads(env, target.entry);
      const [onMain, onBranch] = await Promise.all([
        reads.rawFile(SNAPSHOT_PATH).then(versionIdsIn),
        // No refresh branch is no refresh waiting for review, not a failure.
        reads.rawFile(SNAPSHOT_PATH, REFRESH_BRANCH).then(versionIdsIn, (err: unknown) => {
          if (err instanceof GithubRequestError && err.status === 404) return [];
          throw err;
        }),
      ]);
      return [...onMain, ...onBranch];
    },
    async dispatch(eventType, payload) {
      // Unset, the refresh stays owed and every run says why.
      if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) throw new Error("GITHUB_TOKEN or GITHUB_REPO is not set");
      return repositoryDispatch(env, eventType, payload);
    },
    async fileBlocked(issue) {
      if (!target.ok) throw new Error(`no repo: ${target.error}`);
      return (await githubIssueClient(env, target.entry).createIssue({ ...issue, labels: [BLOCKED_LABEL] })).number;
    },
    dryRun: opts.dryRun,
  });
}

/** The version ids a snapshot file records (`versionIds[].id`). */
function versionIdsIn(text: string): string[] {
  const parsed = JSON.parse(text) as { versionIds?: Array<{ id?: unknown }> };
  return (parsed.versionIds ?? []).flatMap((v) => (typeof v?.id === "string" ? [v.id] : []));
}
