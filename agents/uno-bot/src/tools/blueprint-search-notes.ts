// The notes a `search_blueprint` result carries about the blueprint's time
// axis, as exported strings.
//
// They live apart from blueprint-search.ts for one reason: that module imports
// Env and fetch, so it cannot compile under tsconfig.test.json, and a string
// nobody can import is a string nobody can sweep. Until #443 the prompt said
// "status", the tool schema said "status", and every tool RESULT still said a
// path's future was spelled in its name — `Planned:` / `Prototype:` — eleven
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

/** Every note this module ships, by name — the sweep's subject. A note added
 *  here is swept the day it is added. */
export const SEARCH_NOTES: ReadonlyArray<readonly [name: string, text: string]> = [
  ["CONFLICT_NOTE", CONFLICT_NOTE],
  ["REQUERY_TAIL", REQUERY_TAIL],
  ["INDEX_NOTE", INDEX_NOTE],
];
