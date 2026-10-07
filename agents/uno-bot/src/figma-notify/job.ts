// The job a Figma notification queues — the seam each reader fills in (#895).
//
// The route answers Figma within its own request and leaves the work here, on
// the `figma/events` runner, one job per alarm with a fresh budget like every
// other runner job. What each event does:
//   • FILE_UPDATE — the drift re-check (#897) looks at the file, and withdraws
//     a live question it has caught up with (#896). A file no live question
//     names costs one KV read and nothing more. The nightly backstop queues
//     the same job for a change whose notification never came.
//   • FILE_COMMENT — nothing yet, so the job says it ran: the @uno reply (#903)
//     will re-fetch the comment by id, read it for a trigger and answer within
//     about a minute.
// The midnight comment read (#900) reads the KV notes instead, a day at a time.
//
// A READER'S FAILURE IS LOGGED, NEVER THROWN. The scheduled re-check looks at
// every live question twice a weekday anyway, so a look that failed here is a
// later withdrawal, not a lost one, and a thrown job would only be dropped.
//
// PURE: what the job calls arrives by name (`slack/events.ts` binds it).

import type { FigmaEventJob } from "./event";

/** What a FILE_UPDATE calls, bound to `Env` by the runner's dispatch. */
export interface FigmaEventReaders {
  /** Look at a changed file for live drift questions; answers what it did. */
  onFileUpdate?(fileKey: string): Promise<string>;
}

/**
 * Run one queued Figma event.
 *
 * @param job - What the route kept of the event: ids and times
 * @param readers - What each event type calls
 * @returns The line it logged
 */
export async function runFigmaEventJob(job: FigmaEventJob, readers: FigmaEventReaders = {}): Promise<string> {
  const head = `[figma-notify] ${job.type} on ${job.fileKey}${job.via === "backstop" ? " (from the backstop)" : ""}`;
  let line: string;
  if (job.type === "FILE_COMMENT") {
    const what = `comment ${job.commentId ?? "?"}${job.parentId ? `, a reply to ${job.parentId}` : ""}`;
    line = `${head}: ${what} — noted; nothing reads one comment at a time yet`;
  } else if (readers.onFileUpdate) {
    try {
      line = `${head}: a change at ${job.at ?? "?"} — ${await readers.onFileUpdate(job.fileKey)}`;
    } catch (err) {
      line = `${head}: a change at ${job.at ?? "?"} — the drift re-check failed, so the next scheduled run looks instead: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    line = `${head}: a change at ${job.at ?? "?"} — noted`;
  }
  console.log(line);
  return line;
}
