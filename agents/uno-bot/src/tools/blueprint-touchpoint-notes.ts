// The notes a `search_blueprint` result carries beside touchpoint REGISTRY
// rows (#414) — what a touchpoint is, what the registry does and does not
// cover, and what an empty read means — told only when those rows are in
// hand, never on every turn.
//
// The always-loaded prompt does not explain touchpoints, on purpose: a turn
// that never asks about tooling would pay for the explanation on every
// request. The tool DESCRIPTION says only when to ask for the registry; the
// explanation of what came back rides here, in the result, with the rows it
// explains. Same shape as blueprint-inventory-notes.ts: a module with no
// `Env` and no Workers globals, so tsconfig.test.json compiles it, the
// triggers are asserted rather than assumed, and the harness name sweep
// (tests/harness-blueprint-names.test.ts) can read every string as a subject.
//
// Vocabulary is the vendored account's (docs/connectors/supabase/blueprint.md
// § `touchpoints`, § What absence means): the registry is the deployment-level
// catalog, one row per real thing, unique by name; PLACEMENTS — which cell
// uses which touchpoint, and whether it is core or peripheral there — are a
// separate table this read does not touch, and a placement naming a tool the
// registry lacks means the registry is behind, not that the tool is unreal.

/** Ships with every non-empty registry read. What the rows are, and the one
 *  thing they cannot answer. */
export const TOUCHPOINT_NOTE =
  "`touchpoints` are rows from the blueprint's touchpoint REGISTRY: the deployment-level catalog of the tools, documents, channels and artifacts the service runs through — an app screen, an email, a Zoom room — one row per real thing, unique by `name`, with `kind` (its category) and `summary` (what it is for). " +
  "The registry says WHAT exists, not WHERE it is used: which cells use a touchpoint, and whether it is core or peripheral there, is recorded on placements this read does not cover. Answer where-is-it-used from the search rows, and say that the registry itself does not place a tool. " +
  "A tool the search rows name that the registry lacks is real; the registry is the part that is behind. " +
  "`url` on a row is the tool's own authored address — surface it verbatim, never edit it.";

/** The share path, stated honestly: there is no page per touchpoint in the
 *  app (blueprint-link.ts appRootUrl says why), so the only link is the
 *  blueprint itself. Undefined when no app URL is configured — a note
 *  promising a link that does not exist is the failure it exists to avoid. */
export function touchpointLinkNote(appUrl: string | undefined): string | undefined {
  return appUrl
    ? `The app has no page per touchpoint, so a registry row has no deep link of its own: ${appUrl} opens the blueprint itself. Link that, once, if the reader needs the source — do not hand-build a per-touchpoint URL.`
    : undefined;
}

/** The rows are a capped, filtered page; a "how many tools" answer must come
 *  from the registry's total, never from counting the page. Undefined when
 *  the page IS the registry, so the note is not a restatement. */
export function touchpointCountNote(shown: number, registryTotal: number | undefined): string | undefined {
  return typeof registryTotal === "number" && registryTotal !== shown
    ? `The registry has ${registryTotal} touchpoints in total; \`touchpoints\` shows the ${shown} matched to this question. For any count-of-touchpoints answer, use ${registryTotal}.`
    : undefined;
}

/** The empty read, reported as absence from the REGISTRY and nothing wider —
 *  and naming what was searched, so "no entry for Zoom" cannot be mistaken
 *  for "no entry for anything". */
export function touchpointAbsenceNote(words: readonly string[], registryTotal: number | undefined): string {
  const searched = words.length ? `matched ${words.map((w) => `"${w}"`).join(", ")} by name, kind or summary` : "came back";
  const checked = typeof registryTotal === "number" ? ` (${registryTotal} registry entries checked)` : "";
  return (
    `No touchpoint in the registry ${searched}${checked}. ` +
    "That is absence from the REGISTRY, not proof the service has no such tool: a tool can be named on a cell without a registry entry, and then the registry is behind. " +
    "Say the registry has no entry for it; if the search rows name the tool, answer from them."
  );
}

/**
 * The touchpoint notes a result earns. Pure, so the triggers can be asserted.
 *
 * @param words          the query terms the registry was filtered by.
 * @param rows           how many registry rows came back.
 * @param registryTotal  the registry's true size, when the read could count it.
 * @param appUrl         the blueprint's root, when one is configured.
 */
export function touchpointNotes({
  words,
  rows,
  registryTotal,
  appUrl,
}: {
  words: readonly string[];
  rows: number;
  registryTotal: number | undefined;
  appUrl: string | undefined;
}): string[] {
  if (rows === 0) return [touchpointAbsenceNote(words, registryTotal)];
  return [TOUCHPOINT_NOTE, touchpointLinkNote(appUrl), touchpointCountNote(rows, registryTotal)].filter(
    (n): n is string => Boolean(n),
  );
}

/** Every note this module ships, by name, rendered with sample values where
 *  a note is a template — the sweep's subject. A note added here is swept
 *  the day it is added. */
export const TOUCHPOINT_NOTES: ReadonlyArray<readonly [name: string, text: string]> = [
  ["TOUCHPOINT_NOTE", TOUCHPOINT_NOTE],
  ["touchpointLinkNote", touchpointLinkNote("https://uno-blueprint.netlify.app/")!],
  ["touchpointCountNote", touchpointCountNote(3, 93)!],
  ["touchpointAbsenceNote", touchpointAbsenceNote(["zoom"], 93)],
];
