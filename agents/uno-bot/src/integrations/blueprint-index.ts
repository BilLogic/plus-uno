// Pure shape helpers for the blueprint integration: the live table-of-contents
// renderer, and the two cap discriminators that say WHY a result was clipped.
//
// Split out of blueprint.ts for the same reason blueprint-link.ts was: that
// module imports Env and fetch, so it cannot compile under tsconfig.test.json
// (plain Node, no Workers types) and nothing in it can be unit-tested. These
// are the parts with real logic and no I/O, so they live where tests can reach
// them. blueprint.ts re-exports them; callers import from either.

/** The non-`live` values of the blueprint's `entity_status` domain, in the
 *  order the board thinks about them: least committed first.
 *
 *  This replaces a prefix match on `paths.name`. Until 2026-08-21 a future path
 *  was named `Planned: <topic>` or `Prototype: <topic>`, and this module tested
 *  for those prefixes; on that date the convention was removed and status
 *  became a column on both `paths` and `cells`. Nothing here followed, so from
 *  2026-08-21 to 2026-09-01 EVERY scenario rendered with no marker and the
 *  legend said "no marker = current state only" — while 6 paths were
 *  `proposed`. The index is the instrument the tool description points at for
 *  settling "does this scenario have future state", and it was answering no,
 *  always, in the voice of a complete read.
 *
 *  A prefix on a name could go stale silently. A status value cannot: it is
 *  constrained by the `entity_status` domain, and a value the domain drops
 *  stops appearing in the data. */
export const FUTURE_STATUSES = ["proposed", "planned", "built", "at_risk", "deprecated"] as const;
export type FutureStatus = (typeof FUTURE_STATUSES)[number];

/** The status a path carries when it is not current state, or null when it is.
 *  A missing status is `live` — the column is `not null default 'live'`, so an
 *  absent value means the read did not ask for it, and treating that as future
 *  would mark the whole board. */
export function futureStatus(status: unknown): FutureStatus | null {
  if (typeof status !== "string") return null;
  const s = status.trim();
  return (FUTURE_STATUSES as readonly string[]).includes(s) ? (s as FutureStatus) : null;
}

export const INDEX_LEGEND =
  "Markers are each path's `status`: [proposed] = exploratory, may never happen · " +
  "[planned] = decided and scheduled · [built] = code exists, not the live route yet · " +
  "[at_risk] = live and measurably failing · [deprecated] = live and going away · " +
  "no marker = every path in that scenario is live. Cells carry their own status, " +
  "so a scenario with no marker can still hold a non-live cell.";

export interface BlueprintIndex {
  /** e.g. "6 phases / 22 scenarios / 38 paths", counted from THIS read — the
   *  denominator for any "I looked and found nothing" claim. Never assert a
   *  fixed figure anywhere in this repo: the board is edited daily, and every
   *  hardcoded count written down so far has been wrong within the week. */
  scale: string;
  /** Explains the `[Planned]` / `[Prototype]` markers. */
  legend: string;
  /** One compact line per phase, e.g.
   *  `Application: Discovery(1), Interview & Offer(2)[Prototype]`. */
  phases: string[];
  /** ISO date the index was read. */
  readAt: string;
}

/** PostgREST's two-level embed, as it arrives. Everything is optional because
 *  this is untrusted JSON, not a pinned schema. */
interface IndexPhaseRow {
  name?: unknown;
  scenarios?: unknown;
}

function nameOf(v: unknown): string {
  const n = (v as { name?: unknown } | null)?.name;
  return typeof n === "string" ? n.trim() : "";
}

/**
 * Render the phases→scenarios→paths embed into the compact index.
 *
 * Deliberately names no paths. Inlining every path name measured ~3x the
 * payload for information the count and the labels already carry.
 *
 * @param data - Rows from the phases embed (anything else renders empty)
 * @param readAt - ISO date to stamp on the result
 */
export function renderBlueprintIndex(data: unknown, readAt: string): BlueprintIndex {
  const rows: IndexPhaseRow[] = Array.isArray(data) ? (data as IndexPhaseRow[]) : [];
  let scenarioCount = 0;
  let pathCount = 0;
  const phases: string[] = [];

  for (const row of rows) {
    const phaseName = nameOf(row);
    if (!phaseName) continue; // an unnamed phase is uncitable; listing it helps nobody
    const scenarios = Array.isArray(row.scenarios) ? row.scenarios : [];
    const parts: string[] = [];
    for (const scenario of scenarios) {
      const scenarioName = nameOf(scenario);
      if (!scenarioName) continue;
      scenarioCount += 1;
      const raw = (scenario as { paths?: unknown }).paths;
      const paths = Array.isArray(raw) ? raw : [];
      const named = paths.map(nameOf);
      pathCount += named.length;
      // Several statuses can sit under one scenario (a decided change AND a
      // separate exploration), so this is a set, not a first-match, and it is
      // ordered by FUTURE_STATUSES rather than by encounter — the marker reads
      // the same for the same scenario however the rows arrive.
      const seen = new Set(
        paths.map((p) => futureStatus((p as { status?: unknown })?.status)).filter(Boolean),
      );
      const labels = FUTURE_STATUSES.filter((s) => seen.has(s));
      const marker = labels.length ? `[${labels.join(",")}]` : "";
      parts.push(`${scenarioName}(${named.length})${marker}`);
    }
    // A phase with no scenarios still gets a line: "this phase exists and is
    // empty" is a different fact from "this phase does not exist", and only the
    // first keeps the bot from denying a phase it simply could not read into.
    phases.push(`${phaseName}: ${parts.length ? parts.join(", ") : "(no scenarios)"}`);
  }

  return {
    scale: `${phases.length} phases / ${scenarioCount} scenarios / ${pathCount} paths`,
    legend: INDEX_LEGEND,
    phases,
    readAt,
  };
}

/** WHICH cap clipped the result, when one did.
 *
 *  `truncated` alone says "there is more"; it cannot say more of what. The two
 *  caps mean opposite advice: "semantic" means the vector pass filled its
 *  match_count, so DIFFERENT words are likely to surface different cells;
 *  "max_rows" means the merged set overflowed the response budget, so a
 *  NARROWER query is the fix. */
export type BlueprintCappedBy = "semantic" | "max_rows" | null;

export interface BlueprintCapState {
  truncated: boolean;
  capped_by: BlueprintCappedBy;
}

/**
 * Cap state for the semantic short-circuit. The vector pass asks for at most
 * `matchCount` chunks, so a full house means the CUT-OFF ended the list, not
 * the corpus. This shape used to report `truncated: false` unconditionally —
 * the most common result claiming completeness while clipped.
 *
 * @param rowCount - Rows surviving the similarity floor
 * @param matchCount - SEMANTIC_MATCH_COUNT, the match_count asked of the RPC
 */
export function semanticCap(rowCount: number, matchCount: number): BlueprintCapState {
  const truncated = rowCount >= matchCount;
  return { truncated, capped_by: truncated ? "semantic" : null };
}

/**
 * Cap state for the merged (semantic + keyword) result.
 *
 * @param foundCount - Rows found BEFORE the slice, not after — after the slice
 *   the count equals the cap and the overflow is invisible
 * @param maxRows - MAX_ROWS, the response cap
 */
export function mergedCap(foundCount: number, maxRows: number): BlueprintCapState {
  const truncated = foundCount > maxRows;
  return { truncated, capped_by: truncated ? "max_rows" : null };
}
