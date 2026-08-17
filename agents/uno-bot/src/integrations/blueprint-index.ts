// Pure shape helpers for the blueprint integration: the live table-of-contents
// renderer, and the two cap discriminators that say WHY a result was clipped.
//
// Split out of blueprint.ts for the same reason blueprint-link.ts was: that
// module imports Env and fetch, so it cannot compile under tsconfig.test.json
// (plain Node, no Workers types) and nothing in it can be unit-tested. These
// are the parts with real logic and no I/O, so they live where tests can reach
// them. blueprint.ts re-exports them; callers import from either.

/** The path name that marks a scenario's future/roadmap branch. Matched
 *  EXACTLY against `paths.name` — never `path_type`, and never as a substring
 *  (blueprint-navigation.md § 4). A false marker promises a roadmap branch that
 *  does not exist, which is the mirror image of the bug the index fixes. */
export const FUTURE_PATH_NAME = "Future (roadmap)";

/** Ships with every index: an unexplained `*` is worse than no marker, and a
 *  legend carried in the payload cannot drift away from the data the way a
 *  prompt rule can. */
export const INDEX_LEGEND = `* = has a ${FUTURE_PATH_NAME} path`;

export interface BlueprintIndex {
  /** e.g. "6 phases / 23 scenarios / 39 paths" — the denominator for any
   *  "I looked and found nothing" claim. */
  scale: string;
  /** Explains the `*` marker. */
  legend: string;
  /** One compact line per phase, e.g.
   *  `Application: Discovery(1), Interview & Offer(2)*`. */
  phases: string[];
  /** ISO date the index was read. */
  readAt: string;
}

/** PostgREST's two-level embed, as it arrives. Everything is optional because
 *  this is untrusted JSON, not a pinned schema. */
interface IndexPhaseRow {
  name?: unknown;
  service_scenarios?: unknown;
}

function nameOf(v: unknown): string {
  const n = (v as { name?: unknown } | null)?.name;
  return typeof n === "string" ? n.trim() : "";
}

/**
 * Render the phases→scenarios→paths embed into the compact index.
 *
 * Deliberately names no paths. Inlining all 39 path names measured ~3x the
 * payload for information the count and the `*` already carry.
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
    const scenarios = Array.isArray(row.service_scenarios) ? row.service_scenarios : [];
    const parts: string[] = [];
    for (const scenario of scenarios) {
      const scenarioName = nameOf(scenario);
      if (!scenarioName) continue;
      scenarioCount += 1;
      const raw = (scenario as { paths?: unknown }).paths;
      const named = (Array.isArray(raw) ? raw : []).map(nameOf);
      pathCount += named.length;
      const future = named.includes(FUTURE_PATH_NAME) ? "*" : "";
      parts.push(`${scenarioName}(${named.length})${future}`);
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
