// An eval CASE: its declared shape, its one loader, and the census of them.
//
// A case used to be five readers and three narrations. The runner parsed the
// fixture, the recorder parsed it again, and three test files parsed it a third,
// fourth and fifth time — each with its own idea of what a case must carry, so
// none of them could refuse a key the others would silently ignore. Meanwhile
// two READMEs stated a case count by hand and a scenarios document narrated the
// cases in prose; the count drifted once already, and the document drifted
// further — it listed cases the fixture does not hold and omitted a dozen it
// does.
//
// THREE THINGS LIVE HERE, and nothing else may parse the fixture:
//
//   * THE SHAPE. `CASE_KEYS` and `TURN_KEYS` are the whole vocabulary; anything
//     else is a typo, and `problemsWithCase` names it. A misspelt assertion key
//     is the worst kind of eval bug — the case still runs, still passes, and
//     asserts nothing.
//   * THE LOADER. `loadCases` is the one reader. It resolves the repository's
//     fixture by default, so a caller that wants THE fixture states no path and
//     cannot state a stale one.
//   * THE CENSUS. Every count anything says about the suite — in a log line, in
//     a README, in the scenarios document — is `censusOf`, never typed. A count
//     in prose that nothing compares is a count that will be wrong.
//
// What a case is MEASURED with is not here: a recording and a transport are the
// instrument (CONTEXT.md), and the census only takes the recorded case ids as an
// argument so it can report which cases the instrument does not reach.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The repository's fixture, from this file — so no caller repeats the path. */
export const FIXTURE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../docs/evals/fixtures/uno-bot-cases.json",
);

// ── The shape ────────────────────────────────────────────────────────────────

/** Keys that make a TURN carry its own assertions. A turn with none of these is
 *  scored by the case-level spec, and only if it is the last turn. */
export const TURN_SPEC_KEYS = [
  "expectKind",
  "expectTool",
  "expectDecision",
  "expectTier",
  "expectLevel",
  "expectToolCalled",
  "expectHistory",
  "forbidTool",
  "textRegex",
];

/** Everything a turn may say. `expectHistory` is deliberately a turn key only —
 *  it asserts on what the runner SENT to that turn. */
export const TURN_KEYS = ["prompt", "usePendingFromPreviousTurn", ...TURN_SPEC_KEYS];

/** Assertions a case may state once, for its final turn. */
export const CASE_SPEC_KEYS = TURN_SPEC_KEYS.filter((k) => k !== "expectHistory").concat([
  "allowProposalIfGateAsk",
]);

/** Everything a case may say. */
export const CASE_KEYS = [
  "id",
  "name",
  "blocker",
  "samples",
  "judgeNote",
  "turns",
  "subject",
  "channel",
  "requestedBy",
  ...CASE_SPEC_KEYS,
];

/** Does this turn carry assertions of its own? */
export function hasOwnSpec(turn) {
  return TURN_SPEC_KEYS.some((k) => k in turn);
}

/** How many times a case is run. Written once, because the majority rule and
 *  every count of total model calls read it. */
export function samplesOf(c) {
  return Number.isInteger(c?.samples) && c.samples > 1 ? c.samples : 1;
}

/**
 * Everything wrong with one case, as sentences — empty when it is well formed.
 *
 * Returned rather than thrown so a loader can report every bad case in one
 * pass: a fixture with three typos should take one run to fix, not three.
 */
export function problemsWithCase(c, where = "case") {
  const at = c?.id ? `${c.id}` : where;
  if (!c || typeof c !== "object" || Array.isArray(c)) return [`${where} is not an object`];
  const problems = [];
  if (typeof c.id !== "string" || !c.id.trim()) problems.push(`${where} has no 'id'`);
  if (typeof c.name !== "string" || !c.name.trim()) problems.push(`${at} has no 'name'`);
  if (typeof c.judgeNote !== "string" || !c.judgeNote.trim()) problems.push(`${at} has no 'judgeNote'`);
  for (const k of Object.keys(c)) {
    if (!CASE_KEYS.includes(k)) problems.push(`${at} carries unknown key '${k}'`);
  }
  if (!Array.isArray(c.turns) || c.turns.length === 0) {
    problems.push(`${at} has no 'turns'`);
    return problems;
  }
  c.turns.forEach((t, i) => {
    const turn = `${at} turn ${i + 1}`;
    if (!t || typeof t !== "object") {
      problems.push(`${turn} is not an object`);
      return;
    }
    if (typeof t.prompt !== "string" || !t.prompt.trim()) problems.push(`${turn} has no 'prompt'`);
    for (const k of Object.keys(t)) {
      if (!TURN_KEYS.includes(k)) problems.push(`${turn} carries unknown key '${k}'`);
    }
  });
  return problems;
}

// ── The loader ───────────────────────────────────────────────────────────────

/**
 * The fixture, validated.
 *
 * Throws on a shape nothing can run, naming every problem at once. The
 * alternative — each caller doing its own `JSON.parse` — is what let a fixture
 * key be misspelt in one reader's vocabulary and absent from another's.
 *
 * `proposed` is the other half of the census: scenarios written down and NOT in
 * the fixture, so the generated document can say so instead of listing them as
 * if they ran.
 *
 * @param {string} [path]
 * @returns {{path: string, cases: object[], proposed: object[], readme: string}}
 */
export function loadCases(path = FIXTURE_PATH) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    throw new Error(`${path}: cannot be read as JSON — ${err.message}`);
  }
  const cases = Array.isArray(raw) ? raw : raw?.cases;
  if (!Array.isArray(cases) || cases.length === 0) throw new Error(`${path}: holds no cases`);

  const problems = cases.flatMap((c, i) => problemsWithCase(c, `case ${i + 1}`));
  const ids = cases.map((c) => c?.id).filter(Boolean);
  for (const id of new Set(ids)) {
    if (ids.filter((x) => x === id).length > 1) problems.push(`case id '${id}' appears twice`);
  }
  if (problems.length) throw new Error(`${path}:\n  - ${problems.join("\n  - ")}`);

  return {
    path,
    cases,
    proposed: Array.isArray(raw?._proposed) ? raw._proposed : [],
    readme: typeof raw?._readme === "string" ? raw._readme : "",
  };
}

/**
 * The fixture's identity: the repo revision it was read at, and a hash of the
 * bytes actually loaded.
 *
 * BOTH, deliberately. `rev` places the run in history; `sha256` says what was
 * measured even when `rev` cannot — Actions checks out at depth 1, so a
 * per-file `git log` returns nothing unless that commit happened to touch the
 * fixture, and a locally-edited fixture is not the committed one at all. The
 * hash is the fact; the revision is the context.
 */
export function fixtureStamp(path) {
  const bytes = readFileSync(path);
  const sha256 = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  // stderr ignored on both: git is being ASKED a question it may not be able to
  // answer (no checkout, a fixture outside the work tree), and a `fatal:`
  // printed into the middle of the log reads like the run broke.
  const git = (args) =>
    execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  let rev = process.env.GITHUB_SHA ?? "";
  if (!rev) {
    try {
      rev = git(["rev-parse", "HEAD"]);
    } catch {
      rev = "unknown";
    }
  }
  let dirty = false;
  try {
    dirty = git(["status", "--porcelain", "--", path]) !== "";
  } catch {
    /* not a checkout — the hash still identifies the bytes */
  }
  return { path, rev: `${rev.slice(0, 12)}${dirty ? "+dirty" : ""}`, sha256 };
}

// ── The census ───────────────────────────────────────────────────────────────

/**
 * What the suite is, counted.
 *
 * `recorded` is the list of case ids some instrument can answer — the local
 * transport's recordings. Given it, the census names the cases that instrument
 * does NOT reach: **ungated**. That word is the point. Such a case is skipped
 * by name, which is correct (failing it would make a gate that is red by
 * construction), but a skip nobody counts is a case that gates nothing and
 * reads as if it did.
 *
 * Omit `recorded` and the census says `recorded: null` AND `gated: null` — the
 * honest answer for the worker transport, which has no recordings to report.
 * That is a different fact from "none are recorded", and a different fact from
 * "all of them are gated": nothing here knows either way, and a census that
 * answered 0 or `total` to a question it was not given the input for is the
 * kind of number this module exists to stop.
 *
 * @param {object[]} cases
 * @param {{recorded?: string[]|null}} [opts]
 */
export function censusOf(cases, { recorded = null } = {}) {
  const known = recorded ? new Set(recorded) : null;
  const families = new Map();
  for (const c of cases) {
    const prefix = /^[A-Z]+/.exec(c.id)?.[0] ?? c.id;
    if (!families.has(prefix)) families.set(prefix, []);
    families.get(prefix).push(c.id);
  }
  const subjects = new Map();
  for (const c of cases) {
    const need = c.subject?.need;
    if (need) subjects.set(need, (subjects.get(need) ?? 0) + 1);
  }
  const ungated = known ? cases.filter((c) => !known.has(c.id)).map((c) => c.id) : [];
  return {
    total: cases.length,
    blockers: cases.filter((c) => c.blocker).length,
    multiTurn: cases.filter((c) => c.turns.length > 1).length,
    turns: cases.reduce((n, c) => n + c.turns.length, 0),
    samples: cases.reduce((n, c) => n + samplesOf(c), 0),
    sampled: cases.filter((c) => samplesOf(c) > 1).length,
    withSubject: cases.filter((c) => c.subject?.need).length,
    subjects: [...subjects.entries()].sort().map(([need, count]) => ({ need, count })),
    families: [...families.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([prefix, ids]) => ({ prefix, count: ids.length, ids })),
    recorded: known ? cases.filter((c) => known.has(c.id)).length : null,
    gated: known ? cases.length - ungated.length : null,
    ungated,
  };
}

/** The census as one log line — what a run says about itself before it starts. */
export function describeCensus(census) {
  const parts = [
    `${census.total} cases`,
    `${census.blockers} blockers`,
    `${census.samples} sample runs`,
  ];
  if (census.recorded !== null) {
    parts.push(
      census.ungated.length
        ? `${census.ungated.length} UNGATED (no recording): ${census.ungated.join(", ")}`
        : "0 ungated",
    );
  }
  return parts.join(", ");
}
