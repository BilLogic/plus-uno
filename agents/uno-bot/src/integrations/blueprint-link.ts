// Shareable links back into the uno-blueprint app, plus the parser for the
// breadcrumb title the semantic index stores.
//
// WHY IT IS ITS OWN MODULE: a bot answer is only half an answer if the reader
// cannot open what it cites. Slack and the IDE both need a URL they can paste;
// the in-app agent doesn't (the UI is already there). Building that URL is pure
// string work, so it lives here where it can be tested without a network.

import { BLUEPRINT_CONTRACT } from "../generated/blueprint-contract";

/** Query params the app reads — from the vendored cross-repo contract
 *  (canonical home: uno-blueprint src/lib/blueprintContract.ts; re-vendor
 *  with scripts/sync-blueprint-contract.mjs). */
const CELL_PARAM = BLUEPRINT_CONTRACT.urlParams.cell;
const SLICE_PARAM = BLUEPRINT_CONTRACT.urlParams.slice;

function base(appUrl: string | undefined): string | undefined {
  const trimmed = (appUrl ?? "").trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
}

function link(appUrl: string | undefined, param: string, id: string): string | undefined {
  const root = base(appUrl);
  if (!root || !id) return undefined;
  return `${root}/?${param}=${encodeURIComponent(id)}`;
}

/** Deep link that opens the blueprint with this cell selected. */
export function cellUrl(appUrl: string | undefined, cellId: string): string | undefined {
  return link(appUrl, CELL_PARAM, cellId);
}

/** Deep link to a slice someone already cut — the view, not the raw cell. */
export function sliceUrl(appUrl: string | undefined, sliceId: string): string | undefined {
  return link(appUrl, SLICE_PARAM, sliceId);
}

export interface ChunkBreadcrumb {
  phase?: string;
  scenario?: string;
  path?: string;
  step?: string;
  layer?: string;
}

/**
 * Split the indexed title back into its parts.
 *
 * The backfill writes "Phase: P · Scenario: X · Path: Y (happy) · Step: Z ·
 * Layer: L" (migration 0004; migration 0001 wrote the same string WITHOUT the
 * leading phase segment). The bot used to hand that whole string to the model
 * as `title` and leave `layer` / `step` / `scenario` / `phase` empty — so the
 * one instruction blueprint_search cares most about, "attribute every activity
 * to its layer", had nothing to attribute with on the PRIMARY retrieval path,
 * and the citation format the navigation guide demands
 * (`phase › scenario › path — layer × step`) could not be produced at all. The
 * data was there the whole time, unparsed.
 *
 * Label-driven, not positional, so BOTH title shapes parse: chunks embedded
 * before 0004 simply yield no `phase`, and keep working unchanged while the
 * corpus re-embeds. Unknown segments are ignored rather than guessed at: a
 * mis-assigned layer is exactly the fabrication this tool exists to prevent.
 */
export function parseChunkTitle(title: string | undefined): ChunkBreadcrumb {
  const out: ChunkBreadcrumb = {};
  if (!title) return out;
  for (const raw of title.split("·")) {
    const segment = raw.trim();
    const at = segment.indexOf(":");
    if (at < 0) continue;
    const label = segment.slice(0, at).trim().toLowerCase();
    const value = segment.slice(at + 1).trim();
    if (!value) continue;
    if (label === "phase") out.phase = value;
    else if (label === "scenario") out.scenario = value;
    else if (label === "path") out.path = value;
    else if (label === "step") out.step = value;
    else if (label === "layer") out.layer = value;
  }
  return out;
}

/**
 * The chunk text without its leading breadcrumb line.
 *
 * The embedded chunk repeats the title as its first line (that context is what
 * makes the vector match work). Echoing it back as the snippet spends tokens
 * restating `title` and buries the actual cell content underneath it.
 */
export function chunkBody(chunk: string | undefined, title: string | undefined): string {
  const text = (chunk ?? "").trim();
  if (!title) return text;
  const head = title.trim();
  return text.startsWith(head) ? text.slice(head.length).trim() : text;
}
