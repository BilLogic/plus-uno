// Run-time SUBJECTS for the blueprint evals (#415).
//
// An eval scenario names a CONDITION — "a scenario that has a future-state
// path", "a tool the registry knows", "a detail class the blueprint has no
// field for" — and the live database answers it with a row. The scenario never
// names the row.
//
// WHY. Every blueprint eval written before this named its subject: `Goal
// Setting`, `Regular Tutor`, `Zoom`, `Escalation`. Each of those is a fact
// about the board on the day the case was written, and the board is edited
// daily. A rename turns such a case red while nothing is wrong with the bot —
// which is the SAME failure #411 exists to fix, one layer up: a document
// encoding a schema fact that the schema moved out from under. A condition
// cannot go stale that way. It can only stop being satisfiable, and that is a
// finding worth reporting rather than a false red.
//
// A PURE module, like blueprint-scope.ts and blueprint-index.ts beside it: no
// Env, no fetch, no Workers types, so tsconfig.test.json compiles it and the
// selection rules are asserted against fixture rows rather than against
// production. The DB reads arrive injected (`SubjectReads`); the Worker route
// in src/index.ts is the only place they are bound to real ones.
//
// WHAT IS NOT HERE, and why. A `proposed-cell` condition — a cell whose own
// `status` is `proposed` or `planned` — would need `cells.status`, and that
// column is not in the contract's `botDirectReadColumns.cells`, so the bot has
// no read that returns it. Adding a direct read for it here would put a column
// on the wire that `check:contract:live` does not select and /health/blueprint
// does not probe, which is precisely the unguarded-direct-read class that cost
// eleven silent days. Future state is asked at the PATH level instead, where
// `status` already rides the outline read the bot makes for orientation.

import { futureStatus } from "./blueprint-index";

/** The closed set of conditions the subject route knows. An unknown `need`
 *  gets this list back rather than an empty subject: "no row satisfies your
 *  condition" and "that is not a condition" are different answers, and a case
 *  skipped for the second reason is a typo nobody would ever see. */
export const SUBJECT_NEEDS = [
  "phase-any",
  "scenario-any",
  "scenario-with-future-paths",
  "touchpoint-any",
  "corpus-term",
  "absent-detail",
] as const;

export type SubjectNeed = (typeof SUBJECT_NEEDS)[number];

export function isSubjectNeed(v: unknown): v is SubjectNeed {
  return typeof v === "string" && (SUBJECT_NEEDS as readonly string[]).includes(v);
}

/**
 * A subject, as the fixture spells it: `{{subject.<field>}}`.
 *
 * `name` is always present and is the condition's primary row — the same value
 * as the field the case actually reads, so a case may use either. The rest are
 * present only when the need promises them (NEED_FIELDS).
 */
export interface BlueprintSubject {
  /** The primary row's display name. Always set. */
  name: string;
  phase?: string;
  scenario?: string;
  /** The non-live path that made `scenario-with-future-paths` true. */
  path?: string;
  /** That path's status — `proposed`, `planned`, `built`, `at_risk`, `deprecated`. */
  status?: string;
  touchpoint?: string;
  /** The touchpoint's `kind` column ("screen", "email", "zoom room", …). */
  kind?: string;
  /** A word the corpus matches more often than one page of rows can show. */
  term?: string;
  /** `total_matched` for that term — the corpus-wide count. */
  matched?: number;
  /** How many rows that same search returned, i.e. what a naive count would say. */
  shown?: number;
  /** A real cell's content, for a question about it the blueprint cannot answer. */
  cell?: string;
  /** The class of detail the blueprint has no field for ("duration"). */
  detail?: string;
}

/** Which `{{subject.…}}` fields each need promises. The fixture's placeholders
 *  are checked against this (scripts/eval-subjects.test.mjs keeps the runner's
 *  copy in step), so a case cannot ask a condition for a field it never sets
 *  and discover it only during a live run. */
export const NEED_FIELDS: Record<SubjectNeed, readonly string[]> = {
  "phase-any": ["name", "phase"],
  "scenario-any": ["name", "scenario", "phase"],
  "scenario-with-future-paths": ["name", "scenario", "phase", "path", "status"],
  "touchpoint-any": ["name", "touchpoint", "kind"],
  "corpus-term": ["name", "term", "matched", "shown"],
  "absent-detail": ["name", "cell", "detail", "scenario", "phase"],
};

// ── The reads, injected ──────────────────────────────────────────────────────

/** One row of a `search_blueprint` result, as much of it as selection needs. */
export interface SubjectSearchRow {
  kind?: unknown;
  title?: unknown;
}

export interface SubjectSearchResult {
  rows: SubjectSearchRow[];
  /** `total_matched`, surfaced by searchBlueprint as `matched_total`. */
  matched?: number;
}

export interface SubjectReads {
  /** The phases→scenarios→paths(name,status) embed — the same read the bot's
   *  orientation index makes, unrendered. */
  outline: () => Promise<unknown>;
  /** The touchpoint registry, unfiltered. */
  touchpoints: () => Promise<Array<Record<string, unknown>>>;
  /** One scoped `search_blueprint`. */
  search: (
    query: string,
    scope: { filterScenario?: string; granularity?: string },
  ) => Promise<SubjectSearchResult>;
  /** The columns the contract says `cells` carries — the evidence for
   *  `absent-detail`, so "the blueprint has no duration field" is read off the
   *  schema rather than remembered. */
  cellColumns: readonly string[];
}

export interface SubjectPick {
  need: SubjectNeed;
  subject: BlueprintSubject | null;
  /** Why no subject, when there is none. Reaches the eval log verbatim. */
  reason?: string;
}

// ── Outline walking ──────────────────────────────────────────────────────────

export interface OutlineScenario {
  phase: string;
  scenario: string;
  paths: Array<{ name: string; status: string | null }>;
}

function nameOf(v: unknown): string {
  const n = (v as { name?: unknown } | null)?.name;
  return typeof n === "string" ? n.trim() : "";
}

/** Flatten the outline embed into (phase, scenario, paths) triples, in the
 *  order the read returned them — which is `position`, so the pick is the
 *  board's own first, not an arbitrary one. Unnamed rows are dropped: a subject
 *  with no name cannot be substituted into a prompt. */
export function walkOutline(data: unknown): OutlineScenario[] {
  const out: OutlineScenario[] = [];
  const phases = Array.isArray(data) ? data : [];
  for (const phaseRow of phases) {
    const phase = nameOf(phaseRow);
    if (!phase) continue;
    const rawScenarios = (phaseRow as { scenarios?: unknown })?.scenarios;
    const scenarios = Array.isArray(rawScenarios) ? rawScenarios : [];
    for (const scenarioRow of scenarios) {
      const scenario = nameOf(scenarioRow);
      if (!scenario) continue;
      const rawPaths = (scenarioRow as { paths?: unknown })?.paths;
      const paths = (Array.isArray(rawPaths) ? rawPaths : [])
        .map((p) => ({
          name: nameOf(p),
          status: futureStatus((p as { status?: unknown })?.status) as string | null,
        }))
        .filter((p) => p.name);
      out.push({ phase, scenario, paths });
    }
  }
  return out;
}

// ── absent-detail ────────────────────────────────────────────────────────────

/**
 * Detail classes a service blueprint is routinely asked for and does not model.
 *
 * `columnPattern` is what makes the claim checkable: the class qualifies only
 * while NO cell column matches it. The day the schema grows a `duration_min`,
 * this condition stops being satisfiable and the case skips with a reason —
 * instead of a blocker asserting the bot must refuse to answer a question the
 * blueprint can now answer.
 */
export const ABSENT_DETAIL_CLASSES: ReadonlyArray<{ detail: string; columnPattern: RegExp }> = [
  { detail: "duration", columnPattern: /dur|minut|hour|elapsed|length|seconds/i },
  { detail: "volume", columnPattern: /count|volume|headcount|quantity|throughput/i },
];

/** The first class the cells table has no field for, or undefined. */
export function absentDetailClass(cellColumns: readonly string[]): string | undefined {
  const found = ABSENT_DETAIL_CLASSES.find(
    (c) => !cellColumns.some((col) => c.columnPattern.test(col)),
  );
  return found?.detail;
}

/** A cell title short enough to sit inside a question. Cell `content` is an
 *  activity phrase, but nothing constrains its length, and a 400-character
 *  subject substituted into "how long does X take" is not a question anyone
 *  would ask. Shortest first, ties broken alphabetically, so the pick is stable
 *  across the samples of one case. */
export const MAX_CELL_SUBJECT_CHARS = 120;

export function pickCellTitle(rows: readonly SubjectSearchRow[]): string | undefined {
  const titles = rows
    .filter((r) => r?.kind === "cell" || r?.kind === undefined)
    .map((r) => (typeof r?.title === "string" ? r.title.trim() : ""))
    .filter((t) => t.length > 0 && t.length <= MAX_CELL_SUBJECT_CHARS);
  if (!titles.length) return undefined;
  titles.sort((a, b) => a.length - b.length || a.localeCompare(b));
  return titles[0];
}

// ── corpus-term ──────────────────────────────────────────────────────────────

/** How many registry names to probe before giving up. Each probe is one
 *  `search_blueprint` call, and this route runs under the same 50-subrequest
 *  cap as everything else in the Worker. */
export const CORPUS_TERM_PROBES = 4;

/** Registry names usable as a single search term: one word, three characters
 *  or more, letters and digits only. "Zoom" qualifies; "Google Meet" does not,
 *  because a two-word term makes "how many cells mention X" a question about
 *  the tokenizer rather than about the count. */
export function termCandidates(rows: ReadonlyArray<Record<string, unknown>>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const name = typeof row?.name === "string" ? row.name.trim() : "";
    if (!/^[A-Za-z][A-Za-z0-9]{2,}$/.test(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

// ── Selection ────────────────────────────────────────────────────────────────

const none = (need: SubjectNeed, reason: string): SubjectPick => ({ need, subject: null, reason });

/**
 * Pick a subject satisfying `need` from the live board.
 *
 * Never returns a subject for "nothing satisfies it" — that is a `subject:
 * null` with a reason, which the runner reports as a SKIP. A skip is neither a
 * pass nor a failure: the case had nothing to measure, and recording it as
 * green would be the same lie as a silent empty read.
 */
export async function selectSubject(need: SubjectNeed, reads: SubjectReads): Promise<SubjectPick> {
  if (need === "touchpoint-any") {
    const rows = await reads.touchpoints();
    const hit = rows.find((r) => typeof r?.name === "string" && r.name.trim());
    if (!hit) return none(need, "the touchpoint registry returned no named row");
    const name = String(hit.name).trim();
    const kind = typeof hit.kind === "string" ? hit.kind.trim() : undefined;
    return { need, subject: { name, touchpoint: name, ...(kind ? { kind } : {}) } };
  }

  if (need === "corpus-term") {
    const candidates = termCandidates(await reads.touchpoints());
    if (!candidates.length) {
      return none(need, "no registry name is a single searchable word");
    }
    for (const term of candidates.slice(0, CORPUS_TERM_PROBES)) {
      const result = await reads.search(term, { granularity: "cell" });
      const shown = result.rows.length;
      const matched = result.matched;
      // The condition is not "a term with hits" but "a term whose corpus-wide
      // count exceeds the page of rows" — without that gap the completeness
      // question has no wrong answer to catch, because counting the rows shown
      // would give the right number by accident.
      if (typeof matched === "number" && matched > shown && matched > 1) {
        return { need, subject: { name: term, term, matched, shown } };
      }
    }
    return none(
      need,
      `no registry term among the first ${CORPUS_TERM_PROBES} matches more cells than one page shows`,
    );
  }

  const outline = walkOutline(await reads.outline());

  if (need === "phase-any") {
    const hit = outline.find((s) => s.phase);
    if (!hit) return none(need, "the outline read returned no named phase");
    return { need, subject: { name: hit.phase, phase: hit.phase } };
  }

  if (need === "scenario-any") {
    const hit = outline.find((s) => s.paths.length > 0) ?? outline[0];
    if (!hit) return none(need, "the outline read returned no named scenario");
    return { need, subject: { name: hit.scenario, scenario: hit.scenario, phase: hit.phase } };
  }

  if (need === "scenario-with-future-paths") {
    for (const s of outline) {
      const future = s.paths.find((p) => p.status !== null);
      if (future) {
        return {
          need,
          subject: {
            name: s.scenario,
            scenario: s.scenario,
            phase: s.phase,
            path: future.name,
            status: future.status as string,
          },
        };
      }
    }
    return none(need, "every path on the board is live — no scenario carries future state");
  }

  // absent-detail
  const detail = absentDetailClass(reads.cellColumns);
  if (!detail) {
    return none(need, "every detail class this route knows now has a cells column");
  }
  const scenario = outline.find((s) => s.paths.length > 0) ?? outline[0];
  if (!scenario) return none(need, "the outline read returned no named scenario");
  const result = await reads.search("", {
    filterScenario: scenario.scenario,
    granularity: "cell",
  });
  const cell = pickCellTitle(result.rows);
  if (!cell) {
    return none(need, `no cell under '${scenario.scenario}' has a title short enough to ask about`);
  }
  return {
    need,
    subject: { name: cell, cell, detail, scenario: scenario.scenario, phase: scenario.phase },
  };
}
