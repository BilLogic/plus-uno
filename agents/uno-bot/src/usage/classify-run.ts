// The end-of-day run's two usage jobs: label a batch of channel asks, and
// purge text that has been kept too long.
//
// Each classify job takes the OLDEST pending asks, up to one batch, so the
// run's classify jobs — one alarm each — work through the day's backlog in
// order, and a job retried by the runner picks up whatever is still pending.
// A failed classification writes nothing: the asks keep their text and wait
// for the next run, and the purge is what bounds how long that can be.
//
// Pure: the store and the model come in by name, so the Node suite and the
// workerd conformance run drive both jobs with a fake clock.

import type { ModelProvider } from "../agent/model-provider";
import { classifyAsks, painCategoryOf } from "./categories";
import type { AskCategoryStore } from "./category-store";

/** Asks per classify job — one `chill` call and one batched write each. */
export const CLASSIFY_BATCH_SIZE = 20;

/** Classify jobs in one end-of-day run: up to this many batches a day, so at
 *  most 100 asks. A busier day's remainder waits for the next run, oldest
 *  first; an ask still waiting after 14 days loses its text unlabelled. */
export const CLASSIFY_BATCHES = 5;

/** How long channel text may be kept, whatever happened to it (ADR-030). */
export const TEXT_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Label one batch of pending channel asks and null their text, in one write.
 *
 * @returns What it labelled (0 when nothing was pending)
 * @throws When the classifier fails — nothing is written
 */
export async function runClassifyBatch(deps: {
  store: AskCategoryStore;
  provider: ModelProvider;
  now: () => number;
  dryRun: boolean;
}): Promise<{ labelled: number; blank: number }> {
  const asks = await deps.store.pendingAsks(CLASSIFY_BATCH_SIZE);
  if (asks.length === 0) return { labelled: 0, blank: 0 };
  const subTypes = await classifyAsks(
    deps.provider,
    asks.map((a) => a.text),
  );
  const labels = asks.map((ask, i) => {
    const subType = subTypes[i] ?? null;
    return { turnId: ask.turnId, subType, painCategory: painCategoryOf(subType, ask.staged) };
  });
  if (!deps.dryRun) await deps.store.label(labels, deps.now());
  return { labelled: labels.length, blank: labels.filter((l) => l.subType === null).length };
}

/**
 * Null every text older than the retention window. A dry run clears nothing.
 *
 * @returns How many rows it cleared
 */
export async function runTextPurge(deps: {
  store: AskCategoryStore;
  now: () => number;
  dryRun: boolean;
}): Promise<number> {
  if (deps.dryRun) return 0;
  return deps.store.purgeTextBefore(deps.now() - TEXT_RETENTION_MS);
}
