// The notes a `search_blueprint` result carries — about the blueprint's time
// axis, about how the read went, and about what a failure does NOT prove — as
// exported strings.
//
// They live apart from blueprint-search.ts because a string nobody can import
// is a string nobody can sweep, and these are the swept ones: `SEARCH_NOTES`
// below is the sweep's named subject. The reason this header used to give —
// that blueprint-search.ts reaches Env and the metered fetch and so cannot
// compile under tsconfig.test.json — is not the reason: the Workers types sit
// beside the Node ones in that build, and a test drives that module directly
// now (tests/blueprint-unavailable.test.ts, and blueprint-search-payload
// .test.ts drives its note assembly). What is still true is that the notes
// left INSIDE it were not exported, so the sweep could not name them.
// #607 moved the swept-blind ones out: the grounding rule, the cache note, the
// zero-row note, the three failure-path notes and the per-enrichment
// disposition notes are all below, and all in `SEARCH_NOTES`. What stays
// inline in the tool is the prose computed from the rows in hand — the
// breadcrumb caveat, the `url` and `links` instructions — which has no fixed
// text to sweep.
//
// Until #443 the prompt said "status", the tool schema said "status", and
// every tool RESULT still said a path's future was spelled in its name — `Planned:` / `Prototype:` — eleven
// days after the last such name was renamed away. The harness name sweep
// (tests/harness-blueprint-names.test.ts) reads these as a subject now, so the
// next retired convention cannot survive here while it is swept out of the
// prompt.
//
// Vocabulary is the persona's (AGENT.md § Grounding, "Two sources, one time
// axis") and the vendored account's (docs/connectors/supabase/blueprint.md):
// `status` on `paths` and `cells` is proposed · planned · built · live ·
// at_risk · deprecated, and only `live` describes today.

/** What each `status` value means, in the persona's words. One clause per
 *  value so the model has the reading, not just the list. */
export const STATUS_READINGS =
  "only `live` describes how the service works today; " +
  "`planned` is decided and scheduled (say \"is changing\"); " +
  "`proposed` is exploratory (say \"might change\"); " +
  "`built` is code that exists but is not the live route yet; " +
  "`at_risk` is live and measurably failing; " +
  "`deprecated` is live and going away.";

/** Ships on every result. Where a row sits on the time axis, and what to do
 *  when a Notion doc in the conversation disagrees. */
export const CONFLICT_NOTE =
  "Every `path` and cell in the blueprint carries a `status`, and the status says WHEN a row is true: " +
  STATUS_READINGS +
  " Report a non-`live` row as future or as fading, in those words; the `index` marker on its scenario names which non-`live` statuses that scenario's paths carry. " +
  "If a Notion doc in this conversation disagrees, surface the conflict (planned change vs obsolete doc, per the card's status) with both sources named and kept apart.";

/** Appended to CONFLICT_NOTE only when NO index is attached: with nothing
 *  enumerating the blueprint, the honest instruction is to look again before
 *  claiming absence. With the index present the lookup replaces the re-query,
 *  and appending this would ask for a search the index already answered. */
export const REQUERY_TAIL =
  "Nothing here about a scenario's future is not proof it has none: check that scenario for paths and cells whose `status` is not `live` before saying so.";

/** Ships only when an index is attached. What the index is, and the one
 *  condition under which "no future state" may be asserted from it. */
export const INDEX_NOTE =
  "`index` is the COMPLETE live list of the blueprint's phases and scenarios, read just now — including its own `scale` counts, which are the only counts to quote. " +
  "Use it to NAME the phase a scenario sits under rather than inferring one. " +
  "Each scenario's marker is the set of non-`live` `status` values its paths carry (`[planned]`, `[proposed]`, …). " +
  "You may assert that a scenario has no future state ONLY when its `index` entry carries no marker; otherwise search that scenario before making any claim about its absence.";

/** The conflict note as shipped: bare when an index rides along, with the
 *  re-query tail when nothing enumerates the blueprint. */
export function conflictNote(hasIndex: boolean): string {
  return hasIndex ? CONFLICT_NOTE : `${CONFLICT_NOTE} ${REQUERY_TAIL}`;
}

// ── How the read went ────────────────────────────────────────────────────────
//
// Every note below exists because ABSENCE AND FAILURE USED TO SHARE ONE
// SILENCE. Until each read declared its own disposition (#606) the tool could
// not tell a table it had read and found empty from a table it had failed to
// read, so both arrived as a missing key — and a missing key reads, to a
// model, as "there is nothing there". These are the sentences that keep the
// two apart in the payload a person eventually hears.

/** Ships on every result that has rows. The one obligation every other note
 *  is a qualification of. */
export const GROUNDING_NOTE =
  "Ground the answer ONLY in these rows. Do not add facts that aren't here.";

/** No rows matched. A statement about the QUERY, never about the blueprint.
 *
 *  REWRITTEN 2026-08-17: it used to say "the blueprint has nothing on this",
 *  which becomes wrong the moment the index shows the scenario exists — the
 *  zero-row note and the attached index would have given opposite
 *  instructions. */
export const NO_ROWS_NOTE =
  "No rows matched THIS QUERY. That is a statement about the query, not about the blueprint: do NOT say the blueprint has nothing on the subject. Check `index` (or search again with the scenario's own name) before concluding the scenario is empty. If it genuinely is not there, a CURRENT doc (Help Center, shipped PRD) may answer instead — cite and date it; otherwise say 'not in the source' and name who likely can fill the gap (the workflow's owner or lead from the roster).";

/** A cache hit must not be narrated as a fresh read: AGENT.md requires a
 *  freshness claim to be backed by a fetch THIS turn, and until the read
 *  reported `cached` nothing distinguished the two. */
export function cacheNote(ageMs: number): string {
  return `These rows came from a short-lived cache (${Math.round(ageMs / 1000)}s old), NOT from a read made just now. Do not say you "just checked" or "re-ran" anything — answer from the rows without claiming freshness.`;
}

/** The orientation read, when it did not answer.
 *
 *  TWO reasons and two sentences, because they send a person to different
 *  places: `failed` to an outage, `unavailable` to the Worker's configuration.
 *  Before #607 the tool had one word for both — and no word at all for the
 *  other four enrichments, whose failures arrived as an omitted key. */
export function orientationNote(disposition: "failed" | "unavailable"): string {
  const why =
    disposition === "unavailable"
      ? "No blueprint index is configured on this deployment"
      : "The blueprint index could not be read this turn";
  return `${why}, so you have NO list of what exists. Do not state that a scenario, phase or future path is absent — say you could not check.`;
}

/** What each enrichment is, in the words its absence has to be reported in.
 *  Naming the table is the point: "could not read it" with no subject is not
 *  something a person can act on. */
const ENRICHMENT_SUBJECTS = {
  edges: "the dependency edges around these cells",
  findings: "the findings recorded against these cells",
  slices: "the saved slices",
  touchpoints: "the touchpoint registry",
} as const;

export type FailedEnrichment = keyof typeof ENRICHMENT_SUBJECTS;

/** An enrichment that was asked for and did not answer.
 *
 *  THE FIX THIS IS: the enrichment reads were isolated so a hiccup could not
 *  cost the rows — but an isolated failure left the key off the result, which
 *  is the same shape as a table that really holds nothing. A findings-table
 *  400 therefore reached Slack as "there are no findings against these cells".
 *  It is a failure to LOOK, and it says nothing at all about what is there. */
export function enrichmentFailureNote(
  name: FailedEnrichment,
  disposition: "failed" | "unavailable",
): string {
  const subject = ENRICHMENT_SUBJECTS[name];
  const why =
    disposition === "unavailable"
      ? `is not configured on this deployment, so ${subject} could not be looked up`
      : `could not be read this turn, so ${subject} is missing from this result`;
  return `\`${name}\` ${why}. That is a failure to LOOK, not evidence of absence: do NOT report that there are none, and do not count them. Say that part could not be checked.`;
}

// ── The three failures the tool answers with ─────────────────────────────────
//
// Each one is a `reason` the model can branch on by machine plus the sentence
// a person should hear. What they share is the guard: a failure to look is
// never evidence the subject is missing from the blueprint. What they do NOT
// share is where they send someone — configuration, budget, or an outage — and
// collapsing any two of them loses the only actionable half.

/** This deployment has no blueprint credentials. A fact about the Worker's
 *  configuration, not about the blueprint being down. WHICH credentials are
 *  missing goes to the operator's log and never into this payload. */
export const NOT_CONFIGURED_NOTE =
  "This deployment has NO blueprint configured — the source of truth was never wired up here, and nothing about this says whether the answer is in it. Do NOT fabricate an answer and do not report absence. Say the blueprint isn't available on this deployment, and fall back to cited docs or say you don't know.";

/** Out of subrequests. The source is fine and the answer may well be in it;
 *  this invocation simply cannot spend another read. Narrating that as
 *  unreachable invites "so it's not in the blueprint". */
export const BUDGET_NOTE =
  "This invocation ran OUT OF READ BUDGET before the query finished — the blueprint was reachable and this says NOTHING about whether the answer is in it. Do not report absence, do not fabricate. Say the lookup was cut short, and either answer from what you already have (labelled as partial) or offer to retry with a narrower question.";

/** Anything else: the source of truth exists and this turn could not read it. */
export const UNREACHABLE_NOTE =
  "Blueprint query failed — do not fabricate; tell the user you couldn't reach the source of truth. This is a failure to LOOK, not evidence of absence: never report the subject as missing from the blueprint on the strength of it.";

/** Every note this module ships, by name — rendered with sample values where a
 *  note is a template, as blueprint-touchpoint-notes.ts does. The sweep's
 *  subject: a note added here is swept the day it is added. */
export const SEARCH_NOTES: ReadonlyArray<readonly [name: string, text: string]> = [
  ["CONFLICT_NOTE", CONFLICT_NOTE],
  ["REQUERY_TAIL", REQUERY_TAIL],
  ["INDEX_NOTE", INDEX_NOTE],
  ["GROUNDING_NOTE", GROUNDING_NOTE],
  ["NO_ROWS_NOTE", NO_ROWS_NOTE],
  ["cacheNote", cacheNote(42_000)],
  ["orientationNote(failed)", orientationNote("failed")],
  ["orientationNote(unavailable)", orientationNote("unavailable")],
  ...(Object.keys(ENRICHMENT_SUBJECTS) as FailedEnrichment[]).map(
    (name): readonly [string, string] => [
      `enrichmentFailureNote(${name})`,
      enrichmentFailureNote(name, "failed"),
    ],
  ),
  ["enrichmentFailureNote(unavailable)", enrichmentFailureNote("findings", "unavailable")],
  ["NOT_CONFIGURED_NOTE", NOT_CONFIGURED_NOTE],
  ["BUDGET_NOTE", BUDGET_NOTE],
  ["UNREACHABLE_NOTE", UNREACHABLE_NOTE],
];
