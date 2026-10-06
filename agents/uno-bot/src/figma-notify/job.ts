// The job a Figma notification queues — the seam each reader fills in (#895).
//
// The route answers Figma within its own request and leaves the work here, on
// the `figma/events` runner, one job per alarm with a fresh budget like every
// other runner job. In this ticket nothing reads one event at a time yet, so
// the job says it ran and is done — the way the `noop` scheduled job proves its
// path end to end. What comes next, by event:
//   • FILE_COMMENT — the @uno reply (#903) re-fetches the comment by id, reads
//     it for a trigger and answers within about a minute.
//   • FILE_UPDATE — the drift re-check (#897) withdraws a live question when
//     the file has caught up.
// The midnight comment read (#900) and the backstop (#896) read the KV notes
// instead, a day at a time.
//
// PURE: it logs and returns.

import type { FigmaEventJob } from "./event";

/**
 * Run one queued Figma event.
 *
 * @param job - What the route kept of the event: ids and times
 * @returns The line it logged
 */
export async function runFigmaEventJob(job: FigmaEventJob): Promise<string> {
  const what =
    job.type === "FILE_COMMENT"
      ? `comment ${job.commentId ?? "?"}${job.parentId ? `, a reply to ${job.parentId}` : ""}`
      : `a change at ${job.at ?? "?"}`;
  const line = `[figma-notify] ${job.type} on ${job.fileKey}: ${what} — noted; nothing reads one event at a time yet`;
  console.log(line);
  return line;
}
