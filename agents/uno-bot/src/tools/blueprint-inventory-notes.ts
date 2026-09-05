// The blueprint's INSTANCE inventory — what it has no fields for, and how thin
// its coverage runs — told beside the rows it applies to, not on every turn.
//
// Until #412 these two paragraphs sat in the always-loaded guide
// (docs/connectors/supabase/blueprint-navigation.md § Known-silent areas and
// § Content depth), ~1,500 chars paid on every request whether or not the
// turn touched the blueprint. They describe the DATA, not the voice, so they
// belong where the data is returned: `search_blueprint` already carries one
// obligation per field in its `notes`, and these are two more, each emitted
// only when the result it explains is in hand. A module with no `Env` and no
// Workers globals, so tsconfig.test.json compiles it and the trigger
// conditions are asserted rather than assumed.

/** A question after a detail class the blueprint has no structured field
 *  for. Such details appear only inside general cell evidence, and only
 *  sometimes — so a miss is likely a gap in the data, not in the search. */
const UNSTRUCTURED_DETAIL =
  /\b(script|scripts|verbatim|wording|say to|says to|duration|how long|minutes?|hours?|how many|count|counts|number of|target|targets|date|dates|deadline|when does|when do|when is)\b/i;

/** Few enough rows that the result reads as a content gap rather than a
 *  retrieval failure — every retriever runs on every search since 2026-08-19,
 *  so a short result is no longer the ladder having skipped a path. */
const SHALLOW_ROWS = 3;

export const KNOWN_SILENT_NOTE =
  "The question asks for a detail class the blueprint has NO structured field for — verbatim scripts, durations, counts, targets, dates. Such details appear only inside general cell evidence, and only sometimes. Quote one where a row states it explicitly; absent from these rows after checking every evidence field, abstain and name who should fill the gap rather than estimating.";

export const CONTENT_DEPTH_NOTE =
  "Coverage is uneven and judged from the rows you just read. A result this thin is more often a CONTENT GAP than a retrieval failure: every retriever ran, so a shallow scenario returning two or three cells means the blueprint does not cover it yet. Say so and route a `uno-maintain` intake, rather than synthesizing an answer out of adjacent scenarios.";

/**
 * The inventory notes a result earns. Pure, so the triggers can be asserted.
 *
 * @param query   the model's query, as sent.
 * @param rows    how many rows came back.
 * @param capped  whether the result was truncated — a capped result is not
 *                thin, whatever its length.
 */
export function inventoryNotes({ query, rows, capped }: { query: string; rows: number; capped: boolean }): string[] {
  const out: string[] = [];
  if (rows > 0 && UNSTRUCTURED_DETAIL.test(query)) out.push(KNOWN_SILENT_NOTE);
  if (rows > 0 && rows <= SHALLOW_ROWS && !capped) out.push(CONTENT_DEPTH_NOTE);
  return out;
}
