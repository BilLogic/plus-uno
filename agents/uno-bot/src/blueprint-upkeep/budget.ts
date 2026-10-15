// Blueprint upkeep's subrequest figures: how its matching and drafting are cut
// into jobs, each an alarm under the 38-subrequest lookup ceiling (ADR-022),
// and sized by cost, not by a count: a job starts a card or a path only while
// the alarm's headroom covers its worst case. The turn's milestone comparison
// counts from the same figures. No imports, so the run plan
// (`scheduled/runs.ts`) reads it without pulling the job in. Where each
// figure comes from: `./env.ts`.

/** One path read (`readPathOf`): the matched cell's path, then that path's
 *  cells, lanes and ordered steps. */
export const PATH_READ_COST = 5;
/** The service-change gate at its worst: the judgement (1) and the search (up to 3). */
export const GATE_SUBREQUESTS = 4;
/** One draft: grind, then default when grind is out of capacity. */
export const DRAFT_CALLS = 2;
/** A card's words: its page and up to three block pages (4), and its one PRD the same (4). */
export const EVIDENCE_COST = 8;
/** The card's owner: a Slack lookup or two. */
export const OWNER_COST = 2;
/** A deploy's redraft of its hand-off's path against the card's words now:
 *  the words, the draft, and the owner looked up after it. */
export const PROMOTION_REDRAFT_COST = EVIDENCE_COST + DRAFT_CALLS + OWNER_COST;
/** End-of-day jobs that weigh cards. */
export const MATCH_JOBS = 6;
/** External subrequests one card's weighing may spend at its worst: a
 *  deploy's promotion try, then the card and its PRD, the judgement, the
 *  search and the owner. A job starts a card only while this much is left,
 *  so one such card fills a job; lighter cards fit several. A card linked to
 *  a drawn proposal reads at most three paths and the owner instead, inside
 *  it. */
export const MATCH_COST = 20;
/** End-of-day jobs that draft paths. */
export const DRAFT_JOBS = 6;
/** One path's draft: its read and the draft, grind then default. */
export const DRAFT_COST = PATH_READ_COST + DRAFT_CALLS;
