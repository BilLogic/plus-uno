// Blueprint upkeep's end-of-day budget: how its matching and drafting are cut
// into jobs, each an alarm under the 38-subrequest lookup ceiling (ADR-022),
// and sized by cost, not by a count: a job starts a card or a path only while
// the alarm's headroom covers its worst case. No imports, so the run plan
// (`scheduled/runs.ts`) reads it without pulling the job in. Where each
// figure comes from: `./env.ts`.

/** End-of-day jobs that weigh cards. */
export const MATCH_JOBS = 6;
/** External subrequests one card's weighing may spend at its worst: a
 *  deploy's promotion try, then the card and its PRD, the judgement, the
 *  search and the owner. Two such cards fill a job. A card linked to a drawn
 *  proposal reads at most three paths and the owner instead, inside it. */
export const MATCH_COST = 20;
/** End-of-day jobs that draft paths. */
export const DRAFT_JOBS = 6;
/** One path's draft: its read and the draft, grind then default. */
export const DRAFT_COST = 7;
