// When a sweep finding may be posted: at the first weekday morning run after
// it was detected.
//
// Detection runs in the end-of-day jobs (22:00 UTC) and posting at the morning
// run (14:00 UTC), so people see a card at the start of their day and its 72 h
// clock starts when they can act on it. A finding detected on a Friday evening
// therefore waits for Monday morning. Stated as a function of the detection
// time, not of which run is asking, so a morning job that runs late, twice, or
// on a rehearsal cannot post a finding before its morning.
//
// PURE.

/** The UTC hour of the morning run (`scheduled/runs.ts` anchors it). */
export const MORNING_RUN_HOUR_UTC = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The first weekday 14:00 UTC strictly after `detectedAt`.
 *
 * @param detectedAt - When the finding was detected, epoch ms
 */
export function postableAt(detectedAt: number): number {
  const d = new Date(detectedAt);
  let at = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), MORNING_RUN_HOUR_UTC);
  if (at <= detectedAt) at += DAY_MS;
  while (isWeekend(at)) at += DAY_MS;
  return at;
}

function isWeekend(at: number): boolean {
  const day = new Date(at).getUTCDay();
  return day === 0 || day === 6;
}
