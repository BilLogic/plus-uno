// Figma library poll — what the DS file published since the last look, so the
// repo's copy of the library snapshot is refreshed once per publish.
//
// It runs as ONE job of the end-of-day run (`figma-library-poll`,
// src/scheduled/runs.ts): a publish is rare and nobody needs it noticed
// within minutes. It reads the DS file's versions from the Figma REST API and
// compares their ids with the ones it saw last time, kept in KV. A new
// version, labelled or not, owes the repo's copy of the snapshot a refresh,
// recorded in KV for the `figma-snapshot-refresh` job later in the same run
// (src/figma-library/snapshot-refresh.ts). It posts nothing.
//
// Subrequest math: one external call, `versions`. The snapshot and what is
// owed are KV, charged to the internal bucket (`charge(1, "kv")`).
//
// Named dependencies (`PollDeps`), so tests/figma-poll.test.ts drives it over
// the shared in-memory Figma; `Env` enters only in `runFigmaPoll` at the foot.

import type { Env } from "./types";
import { charge } from "./net";
import type { FigmaClient, FigmaVersionsResponse } from "./figma/client";
import { figmaClientFor } from "./figma/production";
import { owedWith, REFRESH_OWED_KV_KEY, type RefreshOwed } from "./figma-library/snapshot-refresh";

/** The version ids seen last time, in HARNESS_KV. A snapshot kept by the
 *  older poll also holds the library's components and node hashes: they are
 *  ignored, and dropped on the next write. */
const SNAPSHOT_KV_KEY = "figma-poll:snapshot";

/** What the poll remembers between runs. */
export interface Snapshot {
  lastChecked: string;
  /** Every recent version id, labelled or not (`everyVersionIdIn`). */
  versionIds: string[];
}

/** One labelled publish, as `versionsFrom` reads it. */
export interface PublishedVersion {
  id: string;
  label: string;
  description: string;
  createdAt: string;
  /** The publisher's Figma handle. */
  user: string;
}

export interface PollResult {
  ran: boolean;
  summary: string;
  /** New versions this run found. */
  newVersions?: number;
  /** Publishes the repo's copy of the snapshot is now owed a refresh for. */
  refreshOwed?: number;
}

/** What the poll reads and writes, by name. */
export interface PollDeps {
  /** The Figma client: the file's versions. */
  figma: Pick<FigmaClient, "versions">;
  snapshot: { read(): Promise<Snapshot | null>; write(snapshot: Snapshot): Promise<void> };
  /** The publishes the repo's copy of the snapshot is owed a refresh for
   *  (`figma-library/snapshot-refresh.ts`). */
  owed: { read(): Promise<RefreshOwed | null>; write(owed: RefreshOwed): Promise<void> };
  fileKey: string;
  now(): number;
}

/**
 * One poll: read the versions, owe a refresh for each new one, and move the
 * snapshot on.
 *
 * The first run seeds the snapshot and owes nothing. What is owed is
 * recorded before the snapshot moves on: a poll stopped in between finds the
 * same versions again and merges the same ids; one that finished never
 * reports them twice.
 *
 * @param deps - The Figma read, the snapshot and what is owed
 * @param opts - `dryRun` reads and compares, and writes nothing
 */
export async function pollFigmaLibrary(deps: PollDeps, opts: { dryRun?: boolean } = {}): Promise<PollResult> {
  const versionsResponse = await deps.figma.versions(deps.fileKey);
  const everyVersionId = everyVersionIdIn(versionsResponse);
  const at = new Date(deps.now()).toISOString();

  const snapshot = await deps.snapshot.read();
  if (!snapshot) {
    if (!opts.dryRun) await deps.snapshot.write({ lastChecked: at, versionIds: everyVersionId });
    return { ran: true, summary: `initialized snapshot: ${everyVersionId.length} recent version(s)` };
  }

  // A publish left with no label or description reads like an autosave here,
  // so every new version counts, and one that changed nothing costs a refresh
  // that finds nothing.
  const known = new Set(snapshot.versionIds);
  const newVersionIds = everyVersionId.filter((id) => !known.has(id));
  let refreshOwed: number | undefined;
  if (newVersionIds.length) {
    const labelled = new Set(versionsFrom(versionsResponse).map((v) => v.id));
    const owed = owedWith(await deps.owed.read(), newVersionIds, at, newVersionIds.filter((id) => !labelled.has(id)));
    refreshOwed = owed.versionIds.length;
    if (!opts.dryRun) await deps.owed.write(owed);
  }
  if (!opts.dryRun) await deps.snapshot.write({ lastChecked: at, versionIds: everyVersionId });

  if (!newVersionIds.length) return { ran: true, summary: "nothing published since last check" };
  return {
    ran: true,
    summary: `${newVersionIds.length} new version(s): the repo's snapshot is owed a refresh`,
    newVersions: newVersionIds.length,
    ...(refreshOwed !== undefined ? { refreshOwed } : {}),
  };
}

/** Recent labelled publishes only, newest first. Figma autosaves have a null
 *  label AND description, and so does a publish left without either, so this
 *  cannot tell those two apart; the poll counts every version instead
 *  (`everyVersionIdIn`). */
export function versionsFrom(result: FigmaVersionsResponse): PublishedVersion[] {
  return (result.versions ?? [])
    .slice(0, 30)
    .filter((v) => v.label || v.description)
    .slice(0, 10)
    .map((v) => ({
      id: v.id,
      label: v.label ?? "",
      description: v.description ?? "",
      createdAt: v.created_at,
      user: v.user?.handle ?? "Unknown",
    }));
}

/** Every recent version id, newest first, labelled or not — what the poll
 *  remembers having seen, and what owes the repo's snapshot a refresh. */
export function everyVersionIdIn(result: FigmaVersionsResponse): string[] {
  return (result.versions ?? []).slice(0, 30).map((v) => v.id);
}

// ─── KV ──────────────────────────────────────────────────────────────────────

/** A JSON value in HARNESS_KV, charged to the internal bucket (net.ts). */
export function kvJson<T>(env: Env, key: string, empty: T): { read(): Promise<T>; write(value: T): Promise<void> } {
  return {
    async read() {
      if (!env.HARNESS_KV) return empty;
      charge(1, "kv");
      return (await env.HARNESS_KV.get<T>(key, "json")) ?? empty;
    },
    async write(value) {
      if (!env.HARNESS_KV) return;
      charge(1, "kv");
      await env.HARNESS_KV.put(key, JSON.stringify(value));
    },
  };
}

// ─── The binding ─────────────────────────────────────────────────────────────

/**
 * The poll on `Env`: Figma over REST, the snapshot and what is owed in KV.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` writes nothing
 */
export async function runFigmaPoll(env: Env, opts: { dryRun?: boolean } = {}): Promise<PollResult> {
  const figma = figmaClientFor(env);
  if (!figma || !env.FIGMA_FILE_KEY) {
    return { ran: false, summary: "FIGMA_ACCESS_TOKEN / FIGMA_FILE_KEY not configured — poll skipped" };
  }
  if (!env.HARNESS_KV) {
    return { ran: false, summary: "HARNESS_KV not bound — nowhere to keep the snapshot; poll skipped" };
  }
  return pollFigmaLibrary(
    {
      figma,
      snapshot: kvJson<Snapshot | null>(env, SNAPSHOT_KV_KEY, null) as PollDeps["snapshot"],
      owed: kvJson<RefreshOwed | null>(env, REFRESH_OWED_KV_KEY, null) as PollDeps["owed"],
      fileKey: env.FIGMA_FILE_KEY,
      now: () => Date.now(),
    },
    opts,
  );
}
