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
/** The saved slice that cites a drafted path, for its View slice: one read. */
export const SLICE_READ_COST = 1;
/** The service-change gate at its worst: the judgment (1) and the search (up to 3). */
export const GATE_SUBREQUESTS = 4;
/** One draft: grind, then default when grind is out of capacity. */
export const DRAFT_CALLS = 2;
/** A card's words: its page and up to three block pages (4), and its one PRD the same (4). */
export const EVIDENCE_COST = 8;
/** Contributors looked up for one card: each confirms, and the rest past it
 *  are left off the card. */
export const MAX_OWNERS = 3;
/** The first Contributor: the Team Members directory, or a Slack lookup or two. */
export const OWNER_COST = 2;
/** Each further Contributor: one lookup by name, the directory already read. */
export const FURTHER_OWNER_COST = 1;
/** Every Contributor a card may have looked up. */
export const OWNERS_COST = OWNER_COST + (MAX_OWNERS - 1) * FURTHER_OWNER_COST;
/** A deploy's redraft of its hand-off's path against the card's words now:
 *  the words, the draft, and the Contributors looked up after it. */
export const PROMOTION_REDRAFT_COST = EVIDENCE_COST + DRAFT_CALLS + OWNERS_COST;
/** End-of-day jobs that weigh cards. */
export const MATCH_JOBS = 6;
/** External subrequests one card's weighing may spend at its worst: a
 *  deploy's promotion try (the path read, 5), then the card and its PRD (8),
 *  the judgment and the search (4) and its Contributors (4) — 21, kept at
 *  22. A job starts a card only while this much is left, so one such card
 *  fills a job; lighter cards fit several. A card linked to a drawn proposal
 *  reads at most three paths and its Contributors instead, inside it. */
export const MATCH_COST = 22;
/** End-of-day jobs that draft paths. */
export const DRAFT_JOBS = 6;
/** One path's draft: its read, the draft (grind then default) and the slice
 *  that cites it. */
export const DRAFT_COST = PATH_READ_COST + DRAFT_CALLS + SLICE_READ_COST;
