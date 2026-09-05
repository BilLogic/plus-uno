// search_blueprint's SCOPE: the four filters and the granularity rung, read off
// the tool input, validated against the contract, and rendered onto the wire.
//
// The portal accepted these for weeks while the Worker sent none of them, so
// every question — "what happens in Goal Setting", "how many cells mention
// Zoom", "what shape does onboarding have" — arrived as the same unscoped
// free-text search competing for fifteen slots (#413). The choice the model
// should make was made for it by omission.
//
// A PURE module, like blueprint-include.ts and blueprint-link.ts: no Env, no
// fetch, no Workers types. Wire names come from the vendored contract and
// nowhere else — PostgREST binds RPC arguments BY NAME, so a literal here would
// be a rename waiting to become a silent no-op filter. The granularity values
// come from the same file, because a NAME the contract knows and a VALUE the
// function body rejects are two different promises (the layers→lanes rename
// missed the guard clause and `lane` was refused for a day).

import { BLUEPRINT_CONTRACT } from "../generated/blueprint-contract";

const PARAM = BLUEPRINT_CONTRACT.searchBlueprintParams;

/** The rungs `granularity` accepts, in the contract's order. This is the list
 *  the tool schema's enum is asserted against — see tests/blueprint-scope.test.ts. */
export const GRANULARITY = BLUEPRINT_CONTRACT.searchBlueprintGranularity.accepted;
export type Granularity = (typeof GRANULARITY)[number];

export interface BlueprintScope {
  filterPhase?: string;
  filterScenario?: string;
  filterPathKind?: string;
  filterLaneRole?: string;
  granularity?: Granularity;
}

/** Tool-input keys, spelled as the wire spells them. The schema exposes the
 *  contract's names verbatim so the model's vocabulary and the RPC's agree. */
const INPUT_KEYS = [
  ["filterPhase", PARAM.filterPhase],
  ["filterScenario", PARAM.filterScenario],
  ["filterPathKind", PARAM.filterPathKind],
  ["filterLaneRole", PARAM.filterLaneRole],
] as const;

function trimmed(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function isGranularity(v: unknown): v is Granularity {
  return typeof v === "string" && (GRANULARITY as readonly string[]).includes(v);
}

/** Read the scope off a tool input. Empty strings are "not set". A granularity
 *  outside the contract's list is REJECTED rather than dropped: sending nothing
 *  would answer at `cell` and read as the blueprint having no phase-level view. */
export function scopeFromInput(input: Record<string, unknown>): {
  scope: BlueprintScope;
  error?: string;
} {
  const scope: BlueprintScope = {};
  for (const [field, key] of INPUT_KEYS) {
    const v = trimmed(input[key]);
    if (v) scope[field] = v;
  }
  const g = input[PARAM.granularity];
  if (g !== undefined && g !== null && g !== "") {
    if (!isGranularity(g)) {
      return {
        scope,
        error: `'${PARAM.granularity}' must be one of ${GRANULARITY.join(", ")}; got ${JSON.stringify(g)}`,
      };
    }
    scope.granularity = g;
  }
  return { scope };
}

/** True when at least one FILTER is set — the condition under which `query`
 *  may be omitted (filter-only predicate mode). Granularity alone does not
 *  qualify: a rung with neither terms nor a scope is a whole-corpus listing. */
export function hasFilter(scope: BlueprintScope): boolean {
  return Boolean(scope.filterPhase || scope.filterScenario || scope.filterPathKind || scope.filterLaneRole);
}

export function hasScope(scope: BlueprintScope): boolean {
  return hasFilter(scope) || scope.granularity !== undefined;
}

/** The scope as RPC body fields, keyed by the contract's wire names. Unset
 *  fields are OMITTED, not sent as null, so the portal's defaults apply.
 *
 *  `granularity` is `text[]` on the wire (production signature, verified
 *  2026-09-05 on #413: `granularity text[] = '{cell}'`), so the one rung the
 *  model picks travels as a one-element array. The tool schema keeps it a
 *  scalar enum — one level per question is the choice being asked for. */
export function scopeBody(scope: BlueprintScope): Record<string, string | string[]> {
  const body: Record<string, string | string[]> = {};
  for (const [field, key] of INPUT_KEYS) {
    const v = scope[field];
    if (v) body[key] = v;
  }
  if (scope.granularity) body[PARAM.granularity] = [scope.granularity];
  return body;
}

/** A stable fragment for the result-cache key. Two searches with the same
 *  words and a different scope are different searches; without this the second
 *  would be served the first one's rows. Empty when nothing is set, so an
 *  unscoped key is byte-identical to what it was before scope existed.
 *  NUL-delimited, like the include and rpc fragments beside it in blueprint.ts. */
export function scopeKey(scope: BlueprintScope): string {
  const body = scopeBody(scope);
  const keys = Object.keys(body).sort();
  return keys.length ? "\u0000scope:" + keys.map((k) => `${k}=${String(body[k])}`).join("&") : "";
}

/** The honesty line for a corpus-wide count. `rows.length` is the top-k
 *  slice; `matched` is how many actually matched, and a count answer must come
 *  from the latter. Undefined when the two agree — nothing to say. */
export function matchedNote(matched: number, shown: number, granularity: Granularity = "cell"): string | undefined {
  if (matched === shown) return undefined;
  const unit = matched === 1 ? granularity : `${granularity}s`;
  return `${matched} ${unit} match corpus-wide; the top ${shown} are here. For any how-many answer use ${matched}, never the number of rows shown.`;
}
