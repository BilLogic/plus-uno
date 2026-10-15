// Blueprint upkeep's end-of-day budget: how its matching and drafting are cut
// into jobs, each an alarm under the 38-subrequest lookup ceiling (ADR-022).
// No imports, so the run plan (`scheduled/runs.ts`) reads it without pulling
// the job in. Where each figure comes from: `./env.ts`.

/** End-of-day jobs that weigh cards, and the most cards one may weigh. */
export const MATCH_JOBS = 4;
export const CARDS_PER_MATCH_JOB = 3;
/** External subrequests one card's weighing may spend. A job starts a card
 *  only with this much headroom left, so it is sized by cost: a costly card
 *  ends its job early and the next job carries on. */
export const MATCH_COST = 10;
/** End-of-day jobs that draft paths, and the most paths one may draft. */
export const DRAFT_JOBS = 6;
export const PATHS_PER_DRAFT_JOB = 4;
/** One path's draft: its read and the draft, grind then default. */
export const DRAFT_COST = 7;
