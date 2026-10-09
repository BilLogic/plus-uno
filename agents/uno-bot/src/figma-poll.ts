// Figma library poll — detection only: what the DS file published since the
// last look, as one change set.
//
// It runs as ONE job of the end-of-day run (`figma-library-poll`,
// src/scheduled/runs.ts), not on every cron firing: a publish is rare and
// nobody needs code started within minutes. It fetches the DS file's components
// and published versions from the Figma REST API, diffs them against the
// snapshot in KV, and when something changed it adds one change set to the
// findings in KV. A new version, labelled or not, also owes the repo's copy of
// the snapshot a refresh, recorded in KV for the `figma-snapshot-refresh` job
// (src/figma-library/snapshot-refresh.ts). It posts nothing. The morning
// run's `figma-library-post` job reads the findings and turns each into a
// drafted intake and one card in
// #plus-universal (src/figma-library/post.ts) — findings post at the next
// morning run, like every proactive job.
//
// ONE POLL, ONE CHANGE SET. The diff is between two snapshots a day apart, so
// two publishes on one day arrive as one change set carrying both versions:
// the components API does not say which version touched which component.
//
// Subrequest math, per job (each alarm has a fresh 50; lookups stop at the
// LOOKUP_CEILING of 38, ADR-022). KV reads and writes are charged to the
// internal bucket (`charge(1, "kv")`), not the external 50:
//   quiet run:  components + versions                              = 2 external
//   change run: the same — the post happens in the morning         = 2 external
//   visual-hash check (version published, zero metadata diff):
//     + at most MAX_HASH_REQUESTS (32) node fetches — in practice
//       ceil(1311 components / 50 ids per call) ≈ 27               ≈ 29 external
//   32 + 2 = 34 stays under the ceiling. A missing hash baseline is stored now
//   and diffed on the NEXT publish rather than fetched from the previous
//   version, which would double the node fetches past the cap.
//   A job the ceiling stops is deferred and retried on a fresh budget
//   (src/runner/queue.ts), so an overrun costs a retry, not the run. Each 429
//   the Figma client retries is one more external call.
//
// Wall time: every call goes through the Figma client (src/figma/), which
// paces /nodes — Tier 1 — at 5 a minute. A quiet or a change run is two calls
// and no wait; a full re-hash is a burst of 5, then one every 12 s, so about
// 5½ minutes for 32 chunks, inside a Durable Object alarm's 15.
//
// Named dependencies (`PollDeps`), so tests/figma-library.test.ts drives the
// diff over the shared in-memory Figma; `Env` enters only in `runFigmaPoll` at
// the foot.

import type { Env } from "./types";
import { charge, rethrowIfBudget } from "./net";
import type { FigmaClient, FigmaComponentsResponse, FigmaVersionsResponse } from "./figma/client";
import { figmaClientFor } from "./figma/production";
import { componentIdOf, type LibraryChangeSet, type LibraryComponent, type PublishedVersion } from "./figma-library/draft";
import { owedWith, REFRESH_OWED_KV_KEY, type RefreshOwed } from "./figma-library/snapshot-refresh";

/** Node-ids per /nodes request (URL-length bound, same as v1). */
const HASH_CHUNK_SIZE = 50;
/** Hard cap on /nodes calls per run so one poll stays under the lookup ceiling. */
const MAX_HASH_REQUESTS = 32;
/** Simultaneous Figma fetches (Workers allow 6 open connections; leave headroom). */
const HASH_CONCURRENCY = 4;
/** The snapshot and the findings live in HARNESS_KV under their own prefix. */
const SNAPSHOT_KV_KEY = "figma-poll:snapshot";
export const FINDINGS_KV_KEY = "figma-poll:findings";
/** Change sets kept waiting for a morning post. More than this means the
 *  morning job has been failing for a week; the oldest are dropped, logged. */
export const MAX_FINDINGS = 5;

/** The KV mirror of v1's scripts/figma-component-snapshot.json. */
export interface Snapshot {
  lastChecked: string;
  components: LibraryComponent[];
  /** Every recent version id, labelled or not (`everyVersionIdIn`). */
  versionIds: string[];
  nodeHashes: Record<string, string>;
}

export interface PollResult {
  ran: boolean;
  summary: string;
  created?: number;
  modified?: number;
  deleted?: number;
  newVersions?: number;
  /** Change sets now waiting for the morning post. */
  pending?: number;
  /** Publishes the repo's copy of the snapshot is now owed a refresh for. */
  refreshOwed?: number;
}

/** What the poll reads and writes, by name. */
export interface PollDeps {
  /** The Figma client: the file's components, its versions, and node hashes. */
  figma: Pick<FigmaClient, "components" | "versions" | "nodes">;
  snapshot: { read(): Promise<Snapshot | null>; write(snapshot: Snapshot): Promise<void> };
  findings: { read(): Promise<LibraryChangeSet[]>; write(findings: LibraryChangeSet[]): Promise<void> };
  /** The publishes the repo's copy of the snapshot is owed a refresh for
   *  (`figma-library/snapshot-refresh.ts`). Absent, none is recorded. */
  owed?: { read(): Promise<RefreshOwed | null>; write(owed: RefreshOwed): Promise<void> };
  fileKey: string;
  now(): number;
}

// ─── Diffing (straight port of v1) ──────────────────────────────────────────

interface ComponentDiff {
  created: LibraryComponent[];
  modified: LibraryComponent[];
  deleted: LibraryComponent[];
}

function diffComponents(oldComponents: LibraryComponent[], newComponents: LibraryComponent[]): ComponentDiff {
  const oldMap = new Map(oldComponents.map((c) => [c.key, c]));
  const newMap = new Map(newComponents.map((c) => [c.key, c]));
  const diff: ComponentDiff = { created: [], modified: [], deleted: [] };
  for (const [key, comp] of newMap) {
    const old = oldMap.get(key);
    if (!old) diff.created.push(comp);
    else if (old.name !== comp.name || old.description !== comp.description) diff.modified.push(comp);
  }
  for (const [key, comp] of oldMap) {
    if (!newMap.has(key)) diff.deleted.push(comp);
  }
  return diff;
}

/**
 * One poll: fetch, diff against the snapshot, add a change set to the findings
 * when something changed, and advance the snapshot.
 *
 * The first run seeds the snapshot and finds nothing (v1's CI auto-init). The
 * snapshot advances whether or not anything changed: not advancing would find
 * the same publish again tomorrow and draft a second intake for it.
 *
 * @param deps - Figma reads, the snapshot and the findings
 * @param opts - `dryRun` reads and diffs, and writes nothing
 */
export async function pollFigmaLibrary(deps: PollDeps, opts: { dryRun?: boolean } = {}): Promise<PollResult> {
  const [components, versionsResponse] = await Promise.all([
    deps.figma.components(deps.fileKey).then(componentsFrom),
    deps.figma.versions(deps.fileKey),
  ]);
  const versions = versionsFrom(versionsResponse);
  const everyVersionId = everyVersionIdIn(versionsResponse);
  console.log(`[figma-poll] ${components.length} components, ${versions.length} recent published versions`);
  const at = new Date(deps.now()).toISOString();

  const snapshot = await deps.snapshot.read();
  if (!snapshot) {
    const nodeHashes = await fetchNodeHashes(deps.figma, deps.fileKey, components);
    if (!opts.dryRun) {
      await deps.snapshot.write({ lastChecked: at, components, versionIds: everyVersionId, nodeHashes });
    }
    return { ran: true, summary: `initialized snapshot: ${components.length} components, ${Object.keys(nodeHashes).length} node hashes` };
  }

  const diff = diffComponents(snapshot.components, components);
  const known = new Set(snapshot.versionIds);
  const newVersions = versions.filter((v) => !known.has(v.id));

  // Version published but metadata silent → check visual properties via node
  // hashes. No stored hashes → store a baseline now and diff from the NEXT
  // publish (see the subrequest math above).
  let refreshedHashes: Record<string, string> | null = null;
  const metadataChanged = diff.created.length + diff.modified.length + diff.deleted.length > 0;
  if (!metadataChanged && newVersions.length > 0) {
    refreshedHashes = await fetchNodeHashes(deps.figma, deps.fileKey, components);
    const oldHashes = snapshot.nodeHashes ?? {};
    if (Object.keys(oldHashes).length) {
      for (const comp of components) {
        const id = comp.nodeId;
        if (id && refreshedHashes[id] && oldHashes[id] && oldHashes[id] !== refreshedHashes[id]) {
          diff.modified.push(comp);
        }
      }
      console.log(`[figma-poll] visual check: ${diff.modified.length} changed component(s)`);
    } else {
      console.log("[figma-poll] no stored node hashes — baseline stored, visual diff resumes next publish");
    }
  }

  const changed = diff.created.length + diff.modified.length + diff.deleted.length + newVersions.length > 0;
  let pending: number | undefined;
  if (changed) {
    // A component is new when none of its variants was in the snapshot, and
    // removed when none is left — a variant added to Badge updates Badge.
    const before = new Set(snapshot.components.map(componentIdOf));
    const after = new Set(components.map(componentIdOf));
    const changeSet: LibraryChangeSet = {
      detectedAt: at,
      fileKey: deps.fileKey,
      versions: newVersions,
      created: diff.created,
      modified: diff.modified,
      deleted: diff.deleted,
      newComponentIds: [...new Set(diff.created.map(componentIdOf))].filter((id) => !before.has(id)),
      removedComponentIds: [...new Set(diff.deleted.map(componentIdOf))].filter((id) => !after.has(id)),
    };
    const findings = [...(await deps.findings.read()), changeSet];
    if (findings.length > MAX_FINDINGS) {
      console.error(`[figma-poll] ${findings.length} change sets waiting — dropping the oldest ${findings.length - MAX_FINDINGS}`);
    }
    const kept = findings.slice(-MAX_FINDINGS);
    pending = kept.length;
    if (!opts.dryRun) await deps.findings.write(kept);
  }

  // A publish owes the repo's copy a refresh (#898), labelled or not: a
  // publish left with no label or description reads like an autosave here, so
  // every new version counts, and one that changed nothing costs a refresh
  // that finds nothing. Recorded before the snapshot moves on: a poll stopped
  // in between finds the same versions again and merges the same ids; one
  // that finished never reports them twice. A library edited with no new
  // version owes nothing.
  let refreshOwed: number | undefined;
  const newVersionIds = everyVersionId.filter((id) => !known.has(id));
  if (newVersionIds.length && deps.owed) {
    const labelled = new Set(newVersions.map((v) => v.id));
    const owed = owedWith(await deps.owed.read(), newVersionIds, at, newVersionIds.filter((id) => !labelled.has(id)));
    refreshOwed = owed.versionIds.length;
    if (!opts.dryRun) await deps.owed.write(owed);
  }

  if (!opts.dryRun) {
    await deps.snapshot.write({
      lastChecked: at,
      components,
      versionIds: everyVersionId,
      nodeHashes: refreshedHashes ?? snapshot.nodeHashes ?? {},
    });
  }

  if (!changed) return { ran: true, summary: "no changes since last check", ...(refreshOwed !== undefined ? { refreshOwed } : {}) };
  return {
    ran: true,
    summary: `changes detected — created:${diff.created.length} modified:${diff.modified.length} deleted:${diff.deleted.length} versions:${newVersions.length}`,
    created: diff.created.length,
    modified: diff.modified.length,
    deleted: diff.deleted.length,
    newVersions: newVersions.length,
    ...(pending !== undefined ? { pending } : {}),
    ...(refreshOwed !== undefined ? { refreshOwed } : {}),
  };
}

// ─── Component filtering (v1's non-DS ignore list, verbatim) ────────────────

const IGNORED_COMPONENT_PATTERNS = [
  /^layout-blocks\//i, // Figma grid helper components
  /^_/, //                 internal/deprecated (e.g. _Obsoleted Input)
  /guidelines$/i, //       documentation frames (e.g. Spacing Token Guidelines)
  /^colors,/i, //          color documentation
  /^draft$/i, //           work-in-progress items
];

function isIgnoredComponent(c: LibraryComponent): boolean {
  if (!c.containingFrame && !c.name) return true;
  if (IGNORED_COMPONENT_PATTERNS.some((p) => p.test(c.name))) return true;
  if (IGNORED_COMPONENT_PATTERNS.some((p) => p.test(c.containingFrame))) return true;
  return false;
}

/**
 * The components a /components response lists, ignore list applied. The
 * component SET is kept when Figma names one — a variant's set is what the
 * registry maps to code — and the containing frame otherwise.
 */
export function componentsFrom(result: FigmaComponentsResponse): LibraryComponent[] {
  const mapped = (result.meta?.components ?? []).map((c): LibraryComponent => {
    const set = c.containing_frame?.containingComponentSet;
    const setNodeId = set?.nodeId ?? c.containing_frame?.nodeId;
    return {
      key: c.key,
      name: c.name,
      description: c.description ?? "",
      nodeId: c.node_id,
      containingFrame: set?.name ?? c.containing_frame?.name ?? "",
      ...(setNodeId ? { setNodeId } : {}),
    };
  });
  return mapped.filter((c) => !isIgnoredComponent(c));
}

/** Recent labelled publishes only, newest first — what the release card
 *  counts. Figma autosaves have a null label AND description, and so does a
 *  publish left without either, so this cannot tell those two apart; the
 *  snapshot refresh counts every version instead (`everyVersionIdIn`). */
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

// ─── Node hashes (visual-change detection when metadata alone is silent) ────
// v1 hashed with MD5; here it's SHA-256 via WebCrypto (no node:crypto needed).
// Only internal consistency matters — the KV snapshot is seeded fresh.

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * A hash per component node, read in chunks. A chunk Figma will not serve is
 * left out — its components show no visual change this run. A budget stop is
 * not: it stops the poll before anything is written, so the deferred retry
 * still sees the publish as new rather than finding the snapshot advanced.
 */
async function fetchNodeHashes(
  figma: Pick<FigmaClient, "nodes">,
  fileKey: string,
  components: LibraryComponent[],
): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  const chunks: LibraryComponent[][] = [];
  for (let i = 0; i < components.length; i += HASH_CHUNK_SIZE) {
    chunks.push(components.slice(i, i + HASH_CHUNK_SIZE));
  }
  if (chunks.length > MAX_HASH_REQUESTS) {
    console.warn(`[figma-poll] ${chunks.length} hash chunks exceeds cap ${MAX_HASH_REQUESTS} — hashing the first ${MAX_HASH_REQUESTS * HASH_CHUNK_SIZE} components only`);
    chunks.length = MAX_HASH_REQUESTS;
  }

  // Batched concurrency: HASH_CONCURRENCY chunks in flight at a time. The
  // client paces them; the batches keep any one call's wait for its slot
  // well inside its 60 s.
  for (let i = 0; i < chunks.length; i += HASH_CONCURRENCY) {
    await Promise.all(chunks.slice(i, i + HASH_CONCURRENCY).map(async (chunk) => {
      const ids = chunk.map((c) => c.nodeId).filter(Boolean);
      if (!ids.length) return;
      try {
        const result = await figma.nodes(fileKey, ids, { geometry: "paths" });
        for (const [nodeId, nodeData] of Object.entries(result.nodes ?? {})) {
          if (nodeData?.document) hashes[nodeId] = await sha256Hex(JSON.stringify(nodeData.document));
        }
      } catch (err) {
        rethrowIfBudget(err);
        console.warn(`[figma-poll] node-hash chunk failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }));
  }
  return hashes;
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
 * The poll on `Env`: Figma over REST, the snapshot and the findings in KV.
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
      findings: kvJson<LibraryChangeSet[]>(env, FINDINGS_KV_KEY, []),
      owed: kvJson<RefreshOwed | null>(env, REFRESH_OWED_KV_KEY, null) as NonNullable<PollDeps["owed"]>,
      fileKey: env.FIGMA_FILE_KEY,
      now: () => Date.now(),
    },
    opts,
  );
}
