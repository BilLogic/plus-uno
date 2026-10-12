// A merged library PR's link, waiting for its Review card.
//
// The morning tracker sees a library PR merge (`figma-library/track.ts`) and
// queues it with the components its card dispatched; the `figma-dev-links-pr`
// job, after the tracker, posts one card per queued PR that adds its link to
// those components in Dev Mode (`runDevLinksPost`). While `FIGMA_DEV_LINKS`
// is not on (`./gate.ts`) the queue only waits, so nothing posts before the
// live check on one component.
//
// PURE.

import { rethrowIfBudget } from "../net";
import type { DevLinksRequest, DevLinksResult } from "./run";

/** One merged PR, and the components it changed. */
export interface QueuedPrLinks {
  pr: { number: number; url: string };
  components: string[];
}

/** Where merged PRs wait, in HARNESS_KV. */
export const PR_QUEUE_KV_KEY = "figma-links:prs";

/** PRs a queue keeps at most; the oldest go first past it. */
export const MAX_QUEUED_PRS = 20;
/** PRs one job posts, each a card: a card is about seven subrequests (the
 *  registry, the links of two files, three pages of members, the post). */
const PER_RUN = 3;

interface Store<T> {
  read(): Promise<T>;
  write(value: T): Promise<void>;
}

/**
 * Queue a merged PR; a PR already queued is not added twice.
 *
 * @param queue - Where merged PRs wait
 * @param entry - The PR and its components
 */
export async function queuePrLinks(queue: Store<QueuedPrLinks[]>, entry: QueuedPrLinks): Promise<void> {
  const kept = await queue.read();
  if (kept.some((q) => q.pr.number === entry.pr.number)) return;
  await queue.write([...kept, entry].slice(-MAX_QUEUED_PRS));
}

/**
 * The morning job: post a card for each queued PR, while the setting allows.
 * A PR whose card posted, or that has nothing left to add, leaves the queue;
 * one that failed stays for the next morning.
 *
 * @param deps - The queue, whether the setting is on, and the post
 * @param opts - `dryRun` posts nothing and keeps the queue as it is
 */
export async function runQueuedPrLinks(
  deps: { queue: Store<QueuedPrLinks[]>; on: boolean; post(request: DevLinksRequest, opts: { dryRun?: boolean }): Promise<DevLinksResult> },
  opts: { dryRun?: boolean } = {},
): Promise<{ summary: string }> {
  const queued = await deps.queue.read();
  if (!queued.length) return { summary: "no merged PR waiting" };
  if (!deps.on) return { summary: `${queued.length} merged PR waiting until FIGMA_DEV_LINKS is on` };
  const done = new Set<number>();
  const lines: string[] = [];
  for (const q of queued.slice(0, PER_RUN)) {
    try {
      const result = await deps.post({ pr: q.pr, components: q.components }, opts);
      lines.push(`#${q.pr.number}: ${result.summary}`);
      if (!result.retry && !opts.dryRun) done.add(q.pr.number);
    } catch (err) {
      rethrowIfBudget(err);
      lines.push(`#${q.pr.number}: kept — ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (!opts.dryRun) await deps.queue.write(queued.filter((q) => !done.has(q.pr.number)));
  return { summary: lines.join("; ") };
}
