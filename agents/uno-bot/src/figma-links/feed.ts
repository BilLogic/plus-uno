// What feeds the merged-PR queue (`./queue.ts`): PRs merged into main that
// change a design-system component.
//
// THE FEED — `feedMergedPrs`, the first step of the morning
// `figma-dev-links-pr` job: read one page of the pulls most recently closed
// into main, keep those merged after the last one this feed has seen, and,
// oldest first, read each one's changed files. A file under
// `design-system/src/components/` names its component folder — `<group>/<Name>/`
// or a flat `<group>/<Name>.*` — and that folder is the component whose
// registry `code.source` sits in it (`component-registry.json`, the same map
// the cards match a component to its Figma node by). Each PR that names one
// is queued with its components; the queue, the cards and the
// `FIGMA_DEV_LINKS` setting do the rest.
//
// THE MARK — the last merged PR seen (its merge time and number). It moves
// past each PR whose files were read, so a PR is never queued twice; a first
// run sets it at the newest merge and queues nothing, so the feed starts from
// the day it is deployed rather than from the repo's history. A PR merged
// after the mark was updated after it, so the page covers every one unless it
// came back full with its oldest update still past the mark; then the run
// note names that gap for a person to check, and the page is read as usual.
//
// THE BUDGET — one pull-list read, then one files read per PR, at most
// `FILES_PER_RUN`; PRs past that wait for the next morning behind the mark.
// With the registry read that is at most seven GitHub subrequests.
//
// PURE.

import { rethrowIfBudget } from "../net";
import type { DevLinkRegistry } from "./links";
import { queuePrLinks, type QueuedPrLinks } from "./queue";

/** A merged pull, as the feed reads it. */
export interface MergedPull {
  number: number;
  url: string;
  /** ISO. */
  mergedAt: string;
}

/** One page of the pulls most recently updated among those closed into main. */
export interface MergedPullPage {
  /** The merged ones. */
  pulls: MergedPull[];
  /** Whether the page came back full, so older pulls may lie past it. */
  full: boolean;
  /** The oldest `updated_at` on the page, merged or not; null for an empty page. */
  oldestUpdatedAt: string | null;
}

/** The last merged PR the feed has seen. */
export interface SeenMark {
  mergedAt: string;
  number: number;
}

interface Store<T> {
  read(): Promise<T>;
  write(value: T): Promise<void>;
}

export interface FeedDeps {
  /** One page of the pulls most recently updated among those closed into main. */
  mergedPulls(): Promise<MergedPullPage>;
  /** A pull's changed file paths. */
  pullFiles(number: number): Promise<string[]>;
  registry(): Promise<DevLinkRegistry>;
  queue: Store<QueuedPrLinks[]>;
  mark: Store<SeenMark | null>;
}

/** Files reads one run makes; the PRs past them wait for the next run. */
export const FILES_PER_RUN = 5;

const COMPONENTS_DIR = "design-system/src/components/";

/**
 * The component folder a path under the components directory names —
 * `<group>/<Name>` for `<group>/<Name>/…` and for a flat `<group>/<Name>.*` —
 * or null for anything else (a file at the top, a group's own index).
 *
 * @param path - A repo path
 */
export function componentFolderOf(path: string): string | null {
  if (!path.startsWith(COMPONENTS_DIR)) return null;
  const parts = path.slice(COMPONENTS_DIR.length).split("/");
  if (parts.length < 2) return null;
  const [group, second] = parts as [string, string];
  const name = parts.length === 2 ? second.split(".")[0]! : second;
  if (!name || name === "index") return null;
  return `${group}/${name}`;
}

/**
 * Each registry component's folder, mapped back to its name.
 *
 * @param registry - component-registry.json
 */
export function componentsByFolder(registry: DevLinkRegistry): Map<string, string> {
  const byFolder = new Map<string, string>();
  for (const [name, entry] of Object.entries(registry.components)) {
    const folder = entry.code?.source ? componentFolderOf(entry.code.source) : null;
    if (folder && !byFolder.has(folder)) byFolder.set(folder, name);
  }
  return byFolder;
}

const after = (p: SeenMark, mark: SeenMark) => p.mergedAt > mark.mergedAt || (p.mergedAt === mark.mergedAt && p.number > mark.number);
const order = (a: MergedPull, b: MergedPull) => (a.mergedAt === b.mergedAt ? a.number - b.number : a.mergedAt < b.mergedAt ? -1 : 1);

/**
 * Queue the component changes of PRs merged since the last run.
 *
 * @param deps - GitHub's reads, the registry, the queue and the mark
 * @param opts - `dryRun` reads and says what it would queue, and writes nothing
 */
export async function feedMergedPrs(deps: FeedDeps, opts: { dryRun?: boolean } = {}): Promise<{ summary: string }> {
  const page = await deps.mergedPulls();
  const pulls = [...page.pulls].sort(order);
  const mark = await deps.mark.read();
  if (!mark) {
    const newest = pulls.at(-1);
    if (!newest) return { summary: "no merged PR yet; nothing marked" };
    if (!opts.dryRun) await deps.mark.write({ mergedAt: newest.mergedAt, number: newest.number });
    return { summary: `starting after #${newest.number}` };
  }
  const fresh = pulls.filter((p) => after(p, mark));
  // A PR merged after the mark was updated after it too, so a page whose
  // oldest update is at or before the mark holds every one. A full page that
  // stops short of it may have left some behind; what it holds is still read.
  const gap = page.full && page.oldestUpdatedAt && page.oldestUpdatedAt > mark.mergedAt ? page.oldestUpdatedAt : null;
  const gapNote = gap ? `PRs merged between ${mark.mergedAt} and ${gap} may be missing from the page read, so check them by hand` : null;
  if (!fresh.length) return { summary: gapNote ?? "no PR merged since the last run" };

  const byFolder = componentsByFolder(await deps.registry());
  const lines: string[] = [];
  let seen = mark;
  let tried = 0;
  for (const p of fresh.slice(0, FILES_PER_RUN)) {
    tried += 1;
    let files: string[];
    try {
      files = await deps.pullFiles(p.number);
    } catch (err) {
      rethrowIfBudget(err);
      lines.push(`#${p.number}: files not read, kept for the next run — ${err instanceof Error ? err.message : String(err)}`);
      break;
    }
    const folders = [...new Set(files.map(componentFolderOf).filter((f): f is string => f !== null))];
    const components = folders.flatMap((f) => (byFolder.has(f) ? [byFolder.get(f)!] : []));
    const unknown = folders.filter((f) => !byFolder.has(f));
    if (components.length) {
      if (!opts.dryRun) await queuePrLinks(deps.queue, { pr: { number: p.number, url: p.url }, components });
      lines.push(`#${p.number}: queued ${components.join(", ")}`);
    }
    if (unknown.length) lines.push(`#${p.number}: no registry component for ${unknown.join(", ")}, skipped`);
    seen = { mergedAt: p.mergedAt, number: p.number };
  }
  // The PRs no file read reached: after a failed one, or past the cap.
  const waiting = fresh.length - tried;
  if (waiting > 0) lines.push(`${waiting} more merged PR(s) wait for the next run`);
  if (gapNote) lines.push(gapNote);
  if (!opts.dryRun && seen !== mark) await deps.mark.write(seen);
  return { summary: lines.join("; ") || `${fresh.length} merged PR(s), none touching a component` };
}
