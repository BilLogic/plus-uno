// The usage record's scheduled jobs: label a batch of channel asks, and purge
// text that has been kept too long.
//
// Each classify job takes the pending asks the store ranks first (fewest
// failed attempts, then oldest), up to one batch, so the run's classify jobs —
// one alarm each — work through the backlog, and a job retried by the runner
// picks up whatever is still pending.
//
// ONE BAD ASK MUST NOT STALL THE REST. A batch call that fails is retried one
// ask at a time in the same job, so the asks that can be labelled are, and each
// that still fails has the failure counted against it. After
// `MAX_CLASSIFY_ATTEMPTS` it is given up on — blank, text nulled — and until
// then it ranks behind every ask with fewer failures. A failure that is not
// the ask's fault — a rate limit, a server error — is never counted; if the
// classifier is down outright, nothing is counted,
// and the job fails, to be tried again by the next run.
//
// Pure: the store and the model come in by name, so the Node suite and the
// workerd conformance run drive both jobs with a fake clock.

import type { ModelProvider } from "../agent/model-provider";
import { ClassifyError, classifyAsks, painCategoryOf, type SubType } from "./categories";
import type { AskCategoryStore, AskLabel, PendingAsk } from "./category-store";

/** Asks per classify job — one `chill` call and one batched write, when the
 *  batch call succeeds. */
export const CLASSIFY_BATCH_SIZE = 20;

/** Classify jobs in one end-of-day run: up to this many batches a day, so at
 *  most 100 asks. A busier day's remainder waits for the next run; an ask
 *  still waiting after the retention window loses its text unlabelled. */
export const CLASSIFY_BATCHES = 5;

/** Failed classifications an ask may have before it is stored blank. */
export const MAX_CLASSIFY_ATTEMPTS = 3;

/** One-at-a-time calls that may fail, with none succeeding, before the job
 *  decides the classifier is down rather than the asks bad. */
const OUTAGE_AFTER = 3;

/** The longest channel text may be kept, whatever happened to it (ADR-030). */
export const TEXT_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * The purge's cutoff: text older than this goes at every run, morning and end
 * of day.
 *
 * WHY 11 DAYS AND NOT 14. The runs are weekday-only, so the longest gap
 * between two is Friday 18:00 ET to Monday 10:00 ET (64 h), and one missed run
 * stretches it to Monday 18:00 — 72 h, three days, and an hour more on the
 * weekend the clocks go back. Text is purged once it is 11 days less an hour
 * old, so the oldest any text can be before a run clears it is 11 + 3 = 14
 * days: the retention window holds through a weekend and one lost run.
 */
export const PURGE_AFTER_MS = TEXT_RETENTION_MS - (3 * 24 + 1) * 60 * 60 * 1000;

/** What one classify job did. */
export interface ClassifyReport {
  /** Asks labelled, blank answers included. */
  labelled: number;
  /** Of those, how many came back blank. */
  blank: number;
  /** Asks whose classification failed and was counted against them. */
  failed: number;
  /** Of those, how many reached the limit and were stored blank. */
  givenUp: number;
}

/**
 * Label one batch of pending channel asks and null their text.
 *
 * Under a dry run it reads and calls the model as it would, and writes
 * nothing — so what it reports is what it WOULD write.
 *
 * @throws ClassifyError when the classifier is unavailable, or no ask in the
 *   batch could be labelled — nothing is written
 */
export async function runClassifyBatch(deps: {
  store: AskCategoryStore;
  provider: ModelProvider;
  now: () => number;
  dryRun: boolean;
}): Promise<ClassifyReport> {
  const asks = await deps.store.pendingAsks(CLASSIFY_BATCH_SIZE);
  if (asks.length === 0) return { labelled: 0, blank: 0, failed: 0, givenUp: 0 };

  const { labels, failed } = await classifyWithFallback(deps.provider, asks);
  const at = deps.now();
  let givenUp = 0;
  if (!deps.dryRun) {
    await deps.store.label(labels, at);
    givenUp = await deps.store.recordFailures(failed, MAX_CLASSIFY_ATTEMPTS, at);
  } else {
    givenUp = asks.filter((a) => failed.includes(a.turnId) && a.attempts + 1 >= MAX_CLASSIFY_ATTEMPTS).length;
  }
  return {
    labelled: labels.length,
    blank: labels.filter((l) => l.subType === null).length,
    failed: failed.length,
    givenUp,
  };
}

/** The batch in one call; on failure, one ask at a time. */
async function classifyWithFallback(
  provider: ModelProvider,
  asks: readonly PendingAsk[],
): Promise<{ labels: AskLabel[]; failed: string[] }> {
  const labelOf = (ask: PendingAsk, subType: SubType | null): AskLabel => ({
    turnId: ask.turnId,
    subType,
    painCategory: painCategoryOf(subType, ask.staged),
  });

  let batchError: unknown;
  try {
    const subTypes = await classifyAsks(
      provider,
      asks.map((a) => a.text),
    );
    return { labels: asks.map((ask, i) => labelOf(ask, subTypes[i] ?? null)), failed: [] };
  } catch (err) {
    // A classifier that cannot be asked at all will not answer one at a time.
    if (err instanceof ClassifyError && err.kind === "unavailable") throw err;
    batchError = err;
  }

  const labels: AskLabel[] = [];
  const failed: string[] = [];
  let transientInARow = 0;
  let lastTransient: unknown;
  // A batch of one has already been tried on its own.
  for (const ask of asks) {
    try {
      if (asks.length === 1) throw batchError;
      const [subType] = await classifyAsks(provider, [ask.text]);
      labels.push(labelOf(ask, subType ?? null));
      transientInARow = 0;
    } catch (err) {
      if (!isTransient(err)) {
        // Something about THIS ask: count it, so it cannot hold its place.
        failed.push(ask.turnId);
        transientInARow = 0;
        continue;
      }
      // A rate limit, a server error, a dropped connection: not the ask's
      // fault, so never counted against it.
      lastTransient = err;
      transientInARow += 1;
      if (transientInARow >= OUTAGE_AFTER) break;
    }
  }
  // Nothing labelled and nothing that was the asks' fault: the classifier is
  // down. The next run tries again, with nothing counted.
  if (labels.length === 0 && failed.length === 0) {
    throw lastTransient instanceof Error ? lastTransient : new Error(String(lastTransient ?? batchError));
  }
  return { labels, failed };
}

/**
 * A failure that says nothing about the ask: the classifier unavailable, a
 * rate limit, a server error, a timeout or a dropped connection. What is left
 * — an unreadable answer, or a call refused for what it carried (a 400, a
 * blocked prompt, an empty candidate) — is counted against the ask.
 */
export function isTransient(err: unknown): boolean {
  if (!(err instanceof ClassifyError)) return true;
  if (err.kind === "unavailable") return true;
  if (err.kind === "unreadable") return false;
  return /\b(408|429|5\d\d)\b|timed? ?out|timeout|network|fetch failed|ECONN|overloaded|unavailable|quota|exhausted/i.test(
    err.message,
  );
}

/**
 * Null every text older than the purge cutoff. A dry run clears nothing.
 *
 * @returns How many rows it cleared
 */
export async function runTextPurge(deps: {
  store: AskCategoryStore;
  now: () => number;
  dryRun: boolean;
}): Promise<number> {
  if (deps.dryRun) return 0;
  return deps.store.purgeTextBefore(deps.now() - PURGE_AFTER_MS);
}
