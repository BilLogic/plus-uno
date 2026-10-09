// The job a Figma notification queues — the seam each reader fills in (#895).
//
// The route answers Figma within its own request and leaves the work here, on
// the `figma/events` runner, one job per alarm with a fresh budget like every
// other runner job. What each event does:
//   • FILE_UPDATE — the drift re-check (#897) looks at the file, and withdraws
//     a live question it has caught up with (#896). A file no live question
//     names costs one KV read and nothing more. The nightly backstop queues
//     the same job for a change whose notification never came.
//   • FILE_COMMENT — a new comment the route marked as asking uno-bot
//     something gets its answer, as a reply in Figma (#903, `../figma-ask/`).
//     Any other comment is only noted: the midnight comment read (#900) reads
//     the KV notes instead, a day at a time.
//
// A READER'S FAILURE IS LOGGED, NEVER THROWN. The scheduled re-check looks at
// every live question twice a weekday anyway, so a look that failed here is a
// later withdrawal, not a lost one, and a thrown job would only be dropped.
// The one exception is a wait: an ask the budget or Figma's rate limit
// stopped comes back `deferred`, and the runner keeps the job for a fresh
// budget rather than drop someone's question.
//
// PURE: what the job calls arrives by name (`slack/events.ts` binds it).

import type { FigmaEventJob } from "./event";

/** What a FILE_UPDATE and an ask call, bound to `Env` by the runner's dispatch. */
export interface FigmaEventReaders {
  /** Look at a changed file for live drift questions; answers what it did. */
  onFileUpdate?(fileKey: string): Promise<string>;
  /** Answer a comment that asks uno-bot something. */
  onAsk?(ask: { fileKey: string; commentId: string }): Promise<{ outcome: "handled" | "deferred"; said: string }>;
}

/** What one job did: its log line, and whether the runner keeps it. */
export interface FigmaEventResult {
  line: string;
  outcome: "handled" | "deferred";
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Run one queued Figma event.
 *
 * @param job - What the route kept of the event: ids and times
 * @param readers - What each event type calls
 * @returns The line it logged, and `deferred` when the runner should keep it
 */
export async function runFigmaEventJob(job: FigmaEventJob, readers: FigmaEventReaders = {}): Promise<FigmaEventResult> {
  const head = `[figma-notify] ${job.type} on ${job.fileKey}${job.via === "backstop" ? " (from the backstop)" : ""}`;
  let line: string;
  let outcome: FigmaEventResult["outcome"] = "handled";
  if (job.type === "FILE_COMMENT") {
    const what = `comment ${job.commentId ?? "?"}${job.parentId ? `, a reply to ${job.parentId}` : ""}`;
    if (job.asks && job.commentId && readers.onAsk) {
      try {
        const asked = await readers.onAsk({ fileKey: job.fileKey, commentId: job.commentId });
        outcome = asked.outcome;
        line = `${head}: ${what} asks uno-bot — ${asked.said}`;
      } catch (err) {
        line = `${head}: ${what} asks uno-bot — the answer failed: ${messageOf(err)}`;
      }
    } else {
      line = `${head}: ${what} — noted${job.asks ? "" : "; no @uno in it"}`;
    }
  } else if (readers.onFileUpdate) {
    try {
      line = `${head}: a change at ${job.at ?? "?"} — ${await readers.onFileUpdate(job.fileKey)}`;
    } catch (err) {
      line = `${head}: a change at ${job.at ?? "?"} — the drift re-check failed, so the next scheduled run looks instead: ${messageOf(err)}`;
    }
  } else {
    line = `${head}: a change at ${job.at ?? "?"} — noted`;
  }
  console.log(line);
  return { line, outcome };
}
