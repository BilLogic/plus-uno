// Pure shape helpers for the blueprint integration: the live table-of-contents
// renderer, and the two cap discriminators that say WHY a result was clipped.
//
// Split out of blueprint.ts for the same reason blueprint-link.ts was: that
// module imports Env and fetch, so it cannot compile under tsconfig.test.json
// (plain Node, no Workers types) and nothing in it can be unit-tested. These
// are the parts with real logic and no I/O, so they live where tests can reach
// them. blueprint.ts re-exports them; callers import from either.

/** The blueprint's two future-state path labels (blueprint-navigation.md § 4).
 *
 *  `Planned`   — decided and scheduled; code exists or the ship is committed.
 *  `Prototype` — exploratory; a proposal, a design iteration, or a TBD that may
 *                never ship.
 *
 *  Replaces the single `Future (roadmap)` name, which conflated the two and so
 *  could only ever be reported with one confidence level. Both are matched as a
 *  PREFIX of `paths.name` — `Planned`, or `Planned: <topic>` — never against
 *  `path_type`, and never as a free substring (a path merely *mentioning*
 *  "planned" mid-name is not a future path).
 *
 *  Prefix rather than exact match is also what makes this survive the semantic
 *  path: chunk titles render the name with its type appended
 *  ("Prototype: Reflection redesign (named)"), so an exact-match test silently
 *  failed on every semantically retrieved row. */
export const FUTURE_LABELS = ["Planned", "Prototype"] as const;
export type FutureLabel = (typeof FUTURE_LABELS)[number];

/** The label a path name carries, or null for an ordinary current-state path. */
export function futureLabel(pathName: string): FutureLabel | null {
  const name = pathName.trim();
  for (const label of FUTURE_LABELS) {
    if (name === label || name.startsWith(`${label}:`)) return label;
  }
  return null;
}

/** Ships with every index: an unexplained marker is worse than no marker, and a
 *  legend carried in the payload cannot drift away from the data the way a
 *  prompt rule can. The labels are spelled out rather than abbreviated to a
 *  symbol — the whole point is that the two mean different things. */
export const INDEX_LEGEND =
  "[Planned] = decided and scheduled, not yet shipped · [Prototype] = exploratory, may never ship · no marker = current state only";

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
      const named = (Array.isArray(raw) ? raw : []).map(nameOf);
      pathCount += named.length;
      // Both labels can sit under one scenario (a shipped-soon change AND a
      // separate exploration), so this is a set, not a first-match.
      const labels = FUTURE_LABELS.filter((label) =>
        named.some((n) => futureLabel(n) === label),
      );
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
