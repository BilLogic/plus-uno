// uno-bot retrieval evals — scores WHICH ROWS come back, not how the answer reads.
//
// WHY THIS EXISTS, separate from run-evals.mjs: that harness drives full agent
// turns through /debug/eval — ~15s each, model quota, an LLM judge on the prose.
// It has been 19/19 green while 5% of the semantic index pointed at cells that
// no longer existed, because a fabricated citation reads exactly like a good
// one. Nothing in it asserts row identity.
//
// This one hits GET /debug/blueprint-search directly: no model, no judge, no
// quota, whole suite in seconds. It answers "did the right cell come back",
// which is the only question that can tell you whether a retrieval change
// helped.
//
// WHAT IT SHARES WITH THE TURN SUITE, AND WHAT IT DOES NOT (#619). This runner
// used to re-implement the parts of a run that have nothing to do with
// retrieval: its own row literals, its own tallies, its own `writeFileSync`,
// its own `process.exit(1)`. Those are now the eval suite's shared machinery:
//
//   * THE ROW ENVELOPE — `eval-results.mjs` `rowShape`. A row carries the
//     shared verdict spine (`id`/`blocker`/`skipped`/`pass`/`failures`) plus
//     the keys declared below, every key is filled, and a key outside the
//     vocabulary throws instead of vanishing into the artifact.
//   * THE SUMMARY SPINE — `summaryOf`. The date, the fixture stamp and every
//     tally, counted off the rows.
//   * THE GATE AND THE EXIT — `findingsFor` rendered by `scripts/lib/findings.mjs`
//     `report`. A failed blocker is an error and exits 1; a failed diagnostic is
//     a warning that prints and does not fail the job, which is the rule this
//     file used to spell by hand.
//   * THE WRITE — the shared artifact writer, which also says where it wrote.
//
// WHAT STAYS HERE, deliberately: the measurements and the fixture shape. A
// retrieval row records a rank, a retrieval path, a subrequest count and the
// embedding model; a turn row records samples, a judge verdict and a
// transcript. And the FIXTURE is a different document — a bare array of
// `class`/`q`/`k`/`expect*` cases with no turns and no judge note — so its
// shape, its validation and its loader are below rather than in
// `eval-case.mjs`. #616's `CASE_KEYS`/`loadCases` stay the turn suite's: the
// keys overlap in `id` and `blocker` and in none of the assertions, and every
// rule `loadCases` enforces (a `name`, a `judgeNote`, at least one turn) is a
// turn-case rule. Parameterising them would leave a shared `JSON.parse` calling
// somebody else's validator. What IS shared is the DISCIPLINE, applied here to
// this fixture: a misspelt `expectCellIds` would leave a case that still runs,
// still passes and asserts nothing, so `loadRetrievalCases` refuses it.
//
// Scoring per case (k is per-case, from the fixture):
//   expectCellIds      — ANY of these ids within top-k        (hit)
//   expectAllCellIds   — ALL of these ids within top-k
//   expectPath         — >= minMatches rows carry this path name
//   expectScenario     — >= minMatches rows carry this scenario name
//   expectTopScoreBelow— the best similarity is under a bar   (absence cases)
// Reported: recall (share of cases hit), MRR over rank-of-first-hit, plus the
// retrieval path, subrequest cost and latency each query actually spent.
//
// A failing `blocker: true` case exits 1. Everything else reports and does not
// fail the job — the aggregate and absence classes are DIAGNOSTICS that are
// expected to fail before Phase 2 (see the fixture's notes on BR25).
//
// Env:
//   WORKER_URL   e.g. the Worker origin (scripts/worker-url.mjs, or UNO_BOT_WORKER_URL)
//   DEBUG_TOKEN  the Worker's /debug/* gate token
// Optional:
//   CASES_PATH   another fixture. THE fixture needs no path: it is resolved
//                from this file (`RETRIEVAL_FIXTURE_PATH`), so no caller
//                repeats it and none can state a stale one (#616's rule for
//                the turn fixture, and the reason the documented command below
//                used to read the wrong one from `agents/uno-bot`).
//   OUT_PATH     default retrieval-eval-results.json, written relative to the
//                working directory — the npm script runs from the repository
//                root, where the workflow uploads it from
//   BASELINE     path to a previous results file; prints a per-class delta
//
// Run:  npm run evals:retrieval           (from agents/uno-bot)
//       npm run evals:retrieval:selftest  (no network — pins the scorer and the
//                                          fixture's shape, so a pull request
//                                          with no deployment still measures
//                                          something)
//
// BASELINE CONVENTION: the working output is gitignored, like eval-results.json.
// A run worth keeping gets copied to docs/evals/runs/YYYY-MM-DD-retrieval-*.json
// and committed — that is what BASELINE points at. Two exist:
// `2026-08-19-retrieval-baseline.json` and `2026-08-19-retrieval-after-hybrid.json`,
// the latter 26/26 with recall 1.000, which is the score to compare against.
// The comparison reads `summary.byClass`, so a run recorded before this file
// grew its fixture stamp is still readable as a baseline.

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isEntry, report } from "../../../scripts/lib/findings.mjs";
import { fixtureStamp } from "./eval-case.mjs";
import { findingsFor, rowShape, summaryOf, writeResults } from "./eval-results.mjs";

const {
  WORKER_URL,
  DEBUG_TOKEN,
  CASES_PATH,
  OUT_PATH = "retrieval-eval-results.json",
  BASELINE,
  // Score a CANDIDATE search function instead of the live one.
  //
  // Unset in CI and for every normal run: the point of this suite is what the
  // product actually does. Set it to `search_blueprint_<suffix>` to measure a
  // ranking change BEFORE it becomes the function everything calls — which is
  // the loop that was missing when an OR-ranked keyword arm was applied to
  // production, fixed BR3, broke BR1/BR5/BR25/BR26 and had to be reverted
  // (plus-uno-blueprint#154).
  //
  //   RPC_NAME=search_blueprint_min_overlap npm run evals:retrieval
  RPC_NAME,
  // Score a CANDIDATE embedding model instead of the one this deployment's
  // index holds.
  //
  // `RPC_NAME` alone cannot do it. A candidate function reads a candidate
  // COLUMN, and the function refuses a query whose declared model does not
  // match the index it is reading — so a candidate-index run pointed only by
  // `RPC_NAME` came back as `embedding model mismatch` on every case. This
  // names the model the Worker should embed the question with, so the query
  // arrives in the space that column was built in.
  //
  //   RPC_NAME=search_blueprint_cand001 EMBED_MODEL=gemini-embedding-001 \
  //     npm run evals:retrieval
  EMBED_MODEL,
} = process.env;

const REQUEST_TIMEOUT_MS = 30_000;

/** The repository's retrieval fixture, from this file — so no caller repeats
 *  the path, and a run from any working directory measures the same document. */
export const RETRIEVAL_FIXTURE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../docs/evals/fixtures/blueprint-retrieval-cases.json",
);

function required(name, v) {
  if (!v) {
    console.error(`missing env ${name}`);
    process.exit(2);
  }
  return v;
}

// ── The fixture: its shape, and its one loader ────────────────────────────────

/** The keys that make a retrieval case ASSERT something. A case with none of
 *  them runs, passes and measures nothing, which is the worst kind of eval
 *  bug — so the loader refuses it. Every one of them is scored by `scoreCase`. */
export const RETRIEVAL_ASSERTION_KEYS = [
  "expectCellIds",
  "expectAllCellIds",
  "expectPath",
  "expectScenario",
  "expectMatchedByOnly",
  "expectTopScoreBelow",
];

/** Everything a retrieval case may say. Anything else is a typo, named rather
 *  than ignored — `expectCellIDs` would otherwise assert nothing in silence. */
export const RETRIEVAL_CASE_KEYS = [
  "id",
  /** Which retrieval behaviour the case exercises; the rollup groups by it. */
  "class",
  /** Whether a failure here fails the run. The rest are diagnostics. */
  "blocker",
  /** The top-k the case is scored on, per case. */
  "k",
  /** The question, as a person would type it. */
  "q",
  /** How many rows must satisfy `expectPath`/`expectScenario`. */
  "minMatches",
  /** Why this case is the case it is, and where its ids were read from. */
  "note",
  ...RETRIEVAL_ASSERTION_KEYS,
];

/** Everything wrong with one case, as sentences — empty when it is well formed.
 *  Returned rather than thrown so one run names every bad case (`eval-case.mjs`
 *  `problemsWithCase`, same reason: three typos should take one run to fix). */
export function problemsWithRetrievalCase(c, where = "case") {
  if (!c || typeof c !== "object" || Array.isArray(c)) return [`${where} is not an object`];
  const at = typeof c.id === "string" && c.id.trim() ? c.id : where;
  const problems = [];
  if (typeof c.id !== "string" || !c.id.trim()) problems.push(`${where} has no 'id'`);
  if (typeof c.q !== "string" || !c.q.trim()) problems.push(`${at} has no query 'q'`);
  if (typeof c.class !== "string" || !c.class.trim()) problems.push(`${at} has no 'class'`);
  for (const k of Object.keys(c)) {
    if (!RETRIEVAL_CASE_KEYS.includes(k)) problems.push(`${at} carries unknown key '${k}'`);
  }
  if (!RETRIEVAL_ASSERTION_KEYS.some((k) => k in c)) {
    problems.push(`${at} asserts nothing (expected one of ${RETRIEVAL_ASSERTION_KEYS.join(", ")})`);
  }
  return problems;
}

/**
 * The retrieval fixture, validated. The one reader of it.
 *
 * The array's first member carries only `_readme` — the fixture's own prose
 * about how to run it — and is separated out here rather than skipped by a
 * `filter(c => c.id)` that would equally skip a case whose id was misspelt away.
 *
 * @param {string} [path]
 * @returns {{path: string, cases: object[], readme: string}}
 */
export function loadRetrievalCases(path = RETRIEVAL_FIXTURE_PATH) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    throw new Error(`${path}: cannot be read as JSON — ${err.message}`);
  }
  if (!Array.isArray(raw)) throw new Error(`${path}: is not an array of cases`);
  const readme = raw.find((c) => typeof c?._readme === "string" && Object.keys(c).length === 1);
  const cases = raw.filter((c) => c !== readme);
  if (!cases.length) throw new Error(`${path}: holds no cases`);

  const problems = cases.flatMap((c, i) => problemsWithRetrievalCase(c, `case ${i + 1}`));
  const ids = cases.map((c) => c?.id).filter(Boolean);
  for (const id of new Set(ids)) {
    if (ids.filter((x) => x === id).length > 1) problems.push(`case id '${id}' appears twice`);
  }
  if (problems.length) throw new Error(`${path}:\n  - ${problems.join("\n  - ")}`);

  return { path, cases, readme: readme?._readme ?? "" };
}

// ── The row: the shared spine, plus what RETRIEVAL measured ───────────────────

/**
 * `reasons` was this file's word for what the spine calls `failures`, and the
 * spine's word wins: the gate reads that key on both suites. A results file
 * written before #619 carries `reasons`; the per-class rollup a baseline is
 * compared on does not touch either, so the recorded baselines stay readable.
 */
export const { keys: RETRIEVAL_RESULT_KEYS, row: retrievalRow } = rowShape("retrieval results", {
  /** Which class of retrieval behaviour, and what was asked. */
  class: null,
  q: "",
  /** 1-based rank of the first matching row, or 0 when nothing matched. */
  rank: 0,
  /** Which arm answered, and how strong its best match was. `top_score` is
   *  only present on semantic results, so `null` is "no similarity to judge". */
  retrieval: null,
  top_score: null,
  /** What the query cost: rows returned, subrequests spent, wall time. */
  rows: 0,
  subrequests: null,
  ms: null,
  /** What the WORKER says it embedded with, not what was asked for. A
   *  deployment that predates the parameter ignores it silently, and this is
   *  the field that shows that: the live model comes back where the candidate
   *  was requested, instead of a run that looks like a candidate measurement
   *  and is not one. */
  embedModel: null,
  /** The judged window, for eyeballing a miss without re-running by hand. */
  top: [],
});

/** One query against the live Worker. Never throws — a transport failure is a
 *  RESULT ("this case errored"), not a crash that loses the other 25 cases. */
async function search(q) {
  const url =
    `${WORKER_URL.replace(/\/+$/, "")}/debug/blueprint-search` +
    `?q=${encodeURIComponent(q)}&fresh=1` +
    (RPC_NAME ? `&rpc=${encodeURIComponent(RPC_NAME)}` : "") +
    (EMBED_MODEL ? `&embed_model=${encodeURIComponent(EMBED_MODEL)}` : "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "x-debug-token": DEBUG_TOKEN },
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    return await res.json();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

/** Rank (1-based) of the first row matching `pred`, or 0 when absent. */
function rankOf(rows, pred) {
  for (let i = 0; i < rows.length; i++) if (pred(rows[i])) return i + 1;
  return 0;
}

export function scoreCase(c, res) {
  if (!res.ok) return { pass: false, rank: 0, reasons: [`request failed: ${res.error}`] };

  const k = c.k ?? 10;
  const rows = (res.rows ?? []).slice(0, k);
  const reasons = [];
  let rank = 0;
  let pass = true;

  if (c.expectCellIds?.length) {
    rank = rankOf(rows, (r) => c.expectCellIds.includes(r.id));
    if (!rank) {
      pass = false;
      reasons.push(`none of ${c.expectCellIds.length} expected cell id(s) in top-${k}`);
    }
  }

  if (c.expectAllCellIds?.length) {
    const got = new Set(rows.map((r) => r.id));
    const missing = c.expectAllCellIds.filter((id) => !got.has(id));
    if (missing.length) {
      pass = false;
      reasons.push(`missing ${missing.length}/${c.expectAllCellIds.length} required cell id(s)`);
    }
    if (!rank) rank = rankOf(rows, (r) => c.expectAllCellIds.includes(r.id));
  }

  if (c.expectPath) {
    const n = rows.filter((r) => r.path === c.expectPath).length;
    const need = c.minMatches ?? 1;
    if (n < need) {
      pass = false;
      reasons.push(`path "${c.expectPath}": ${n} row(s) in top-${k}, needed ${need}`);
    }
    if (!rank) rank = rankOf(rows, (r) => r.path === c.expectPath);
  }

  if (c.expectScenario) {
    const n = rows.filter((r) => r.scenario === c.expectScenario).length;
    const need = c.minMatches ?? 1;
    if (n < need) {
      pass = false;
      reasons.push(`scenario "${c.expectScenario}": ${n} row(s) in top-${k}, needed ${need}`);
    }
    if (!rank) rank = rankOf(rows, (r) => r.scenario === c.expectScenario);
  }

  if (c.expectMatchedByOnly) {
    // Absence cases. NOT a similarity threshold — that was tried and measured
    // impossible: the two answer-less queries scored 0.607/0.654, between real
    // hits at 0.565 and 0.647, so any floor rejecting them rejects six good
    // cases too. What retrieval can honestly assert is that nothing matched
    // the blueprint's own words — only the vector list fired.
    const others = rows.filter((r) => r.matchedBy && r.matchedBy !== c.expectMatchedByOnly);
    if (others.length) {
      pass = false;
      reasons.push(
        `expected ${c.expectMatchedByOnly}-only corroboration, got ${[...new Set(others.map((r) => r.matchedBy))].join(", ")}`,
      );
    }
  }

  if (c.expectTopScoreBelow !== undefined) {
    // Absence cases. `top_score` is only present on semantic results; a keyword
    // answer has no similarity to compare, so treat it as unscoreable rather
    // than silently passing a case that measured nothing.
    const top = res.top_score;
    if (top === undefined) {
      reasons.push(`no top_score to judge (retrieval=${res.retrieval}) — unscoreable`);
      pass = false;
    } else if (!(top < c.expectTopScoreBelow)) {
      pass = false;
      reasons.push(`top_score ${top} >= floor ${c.expectTopScoreBelow}`);
    }
  }

  return { pass, rank, reasons };
}

function pct(n, d) {
  return d ? `${((100 * n) / d).toFixed(0)}%` : "n/a";
}

// ── self-test ────────────────────────────────────────────────────────────────
// `node run-retrieval-evals.mjs --self-test` — no network, no Worker.
//
// The scorer IS the instrument for every later phase. A bug here doesn't look
// like a bug; it looks like a confident recall number, and someone spends a day
// tuning a ranker against it. These pin the cases that are easy to get subtly
// wrong: k-truncation, any-of vs all-of, minMatches, and an errored request
// scoring as a miss rather than a pass.
function selfTest() {
  const row = (id, extra = {}) => ({ id, scenario: "S", path: "P", step: "T", layer: "L", ...extra });
  const ok = (rows, extra = {}) => ({ ok: true, rows, retrieval: "semantic", ...extra });
  const checks = [];
  const check = (name, cond) => checks.push({ name, pass: !!cond });

  // any-of within k
  check("any-of hits at rank 2",
    scoreCase({ k: 5, expectCellIds: ["b"] }, ok([row("a"), row("b")])).rank === 2);
  check("any-of respects k truncation",
    scoreCase({ k: 1, expectCellIds: ["b"] }, ok([row("a"), row("b")])).pass === false);

  // all-of
  check("all-of fails when one is missing",
    scoreCase({ k: 5, expectAllCellIds: ["a", "z"] }, ok([row("a"), row("b")])).pass === false);
  check("all-of passes when all present",
    scoreCase({ k: 5, expectAllCellIds: ["a", "b"] }, ok([row("a"), row("b")])).pass === true);

  // minMatches on path / scenario
  check("path minMatches unmet fails",
    scoreCase({ k: 5, expectPath: "P", minMatches: 3 }, ok([row("a"), row("b")])).pass === false);
  check("path minMatches met passes",
    scoreCase({ k: 5, expectPath: "P", minMatches: 2 }, ok([row("a"), row("b")])).pass === true);
  check("scenario counts only matching rows",
    scoreCase({ k: 5, expectScenario: "S", minMatches: 2 },
      ok([row("a"), row("b", { scenario: "OTHER" })])).pass === false);

  // absence
  check("absence passes below the floor",
    scoreCase({ k: 5, expectTopScoreBelow: 0.5 }, ok([row("a")], { top_score: 0.4 })).pass === true);
  check("absence fails at or above the floor",
    scoreCase({ k: 5, expectTopScoreBelow: 0.5 }, ok([row("a")], { top_score: 0.5 })).pass === false);
  check("absence is unscoreable without top_score",
    scoreCase({ k: 5, expectTopScoreBelow: 0.5 }, ok([row("a")])).pass === false);

  // a failed request must never read as a pass
  check("transport failure is not a pass",
    scoreCase({ k: 5, expectCellIds: ["a"] }, { ok: false, error: "boom" }).pass === false);

  // THE FIXTURE AND THE ENVELOPE, offline (#619). The scorer is one half of the
  // instrument; the other half is that the fixture says what it means to say
  // and the artifact records it. Both are checkable with no Worker, which is
  // the whole point of running this step before the scored one.
  const raises = (fn, re) => {
    try {
      fn();
      return false;
    } catch (err) {
      return re.test(err.message);
    }
  };
  const good = { id: "X1", class: "paraphrase", q: "a question", expectCellIds: ["a"] };

  check("the repository's fixture loads and every case is well formed",
    loadRetrievalCases().cases.length > 0);
  check("the fixture's _readme is separated, not scored as a case",
    loadRetrievalCases().cases.every((c) => c.id) && loadRetrievalCases().readme.length > 0);
  check("a misspelt assertion key is named rather than ignored",
    problemsWithRetrievalCase({ ...good, expectCellIDs: ["a"] })
      .some((p) => p.includes("unknown key 'expectCellIDs'")));
  check("a case that asserts nothing is refused",
    problemsWithRetrievalCase({ id: "X1", class: "paraphrase", q: "a question" })
      .some((p) => p.includes("asserts nothing")));
  check("a case with no query is refused",
    problemsWithRetrievalCase({ id: "X1", class: "paraphrase", expectCellIds: ["a"] })
      .some((p) => p.includes("no query 'q'")));
  check("a well-formed case has no problems", problemsWithRetrievalCase(good).length === 0);
  check("the fixture's own shape is the vocabulary the scorer reads",
    RETRIEVAL_ASSERTION_KEYS.every((k) => RETRIEVAL_CASE_KEYS.includes(k)));

  check("a results row carries the same keys whichever branch wrote it",
    [retrievalRow({ id: "X1" }), retrievalRow({ id: "X2", pass: true, rank: 1, ms: 40 })]
      .every((r) => JSON.stringify(Object.keys(r)) === JSON.stringify(RETRIEVAL_RESULT_KEYS)));
  check("a key outside the row's vocabulary is refused, not written",
    raises(() => retrievalRow({ id: "X1", reasons: ["typo'd key"] }), /unknown key 'reasons'/));
  check("a summary with no fixture stamp is refused",
    raises(() => summaryOf([retrievalRow({ id: "X1" })], {}), /must carry its fixture stamp/));
  check("a run's summary counts its blocker failures off the rows",
    summariseRetrieval([
      retrievalRow({ id: "X1", class: "paraphrase", blocker: true, pass: false, failures: ["miss"] }),
      retrievalRow({ id: "X2", class: "paraphrase", pass: true, rank: 1 }),
    ]).blockerFailures === 1);
  check("a failed blocker is an error and a failed diagnostic a warning",
    (() => {
      const findings = findingsFor(summariseRetrieval([
        retrievalRow({ id: "X1", class: "paraphrase", blocker: true, pass: false, failures: ["miss"] }),
        retrievalRow({ id: "X2", class: "absence", pass: false, failures: ["diag"] }),
      ]));
      return findings.length === 2 &&
        findings[0].message === "BLOCKER X1: miss" &&
        findings[1].severity === "warning";
    })());
  check("a summary carries the fixture it measured against",
    /^[0-9a-f]{12}$/.test(summariseRetrieval([retrievalRow({ id: good.id })]).fixture.sha256));

  const failed = checks.filter((c) => !c.pass);
  for (const c of checks) console.log(`  ${c.pass ? "ok" : "FAIL"}  ${c.name}`);
  console.log(`\n[self-test] ${checks.length - failed.length}/${checks.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

if (isEntry(import.meta.url) && process.argv.includes("--self-test")) selfTest();

// ── The walk ──────────────────────────────────────────────────────────────────
/**
 * Every case, queried and scored, as rows.
 *
 * The instrument is an ARGUMENT, as the turn suite's transport is: `search`
 * takes a query and answers `{ ok, rows, ... }`, so the walk can be driven from
 * canned answers with no Worker and no deployment. Nothing here writes a file
 * or exits a process — `main` below does both.
 *
 * @param {{cases: object[], search: (q: string) => Promise<object>, log?: Function}} deps
 */
export async function walkRetrieval({ cases, search, log = console.log }) {
  const results = [];
  for (const c of cases) {
    const res = await search(c.q);
    const { pass, rank, reasons } = scoreCase(c, res);
    results.push(
      retrievalRow({
        id: c.id,
        class: c.class,
        blocker: !!c.blocker,
        q: c.q,
        pass,
        rank,
        failures: reasons,
        retrieval: res.retrieval ?? null,
        top_score: res.top_score ?? null,
        rows: res.rows?.length ?? 0,
        subrequests: res.subrequests ?? null,
        ms: res.ms ?? null,
        embedModel: res.embed_model ?? null,
        // Keep the judged window for eyeballing a miss without re-running by
        // hand. `k`, not 3: a case is scored on top-k, and recording fewer rows
        // than were judged means a miss cannot be diagnosed from the artifact —
        // which is exactly what happened when the `Lane:` breadcrumb re-embed
        // moved BR3 and BR4 (plus-uno-blueprint#154).
        //
        // `r.lane`, not `r.layer`: the RPC's output column was renamed by
        // 20260820120100 and this line was not, so every artifact since has
        // recorded `undefined` — dropped silently by JSON.stringify, so the
        // field simply vanished rather than reading as wrong.
        top: (res.rows ?? []).slice(0, c.k ?? 10).map((r) => ({
          id: r.id, scenario: r.scenario, path: r.path, step: r.step, lane: r.lane, score: r.score,
        })),
      }),
    );
    const tag = pass ? "PASS" : c.blocker ? "FAIL" : "diag";
    log(
      `[${tag}] ${c.id} (${c.class}) rank=${rank || "-"} ` +
        `retrieval=${res.retrieval ?? "?"} sub=${res.subrequests ?? "?"} ${res.ms ?? "?"}ms` +
        `${reasons.length ? ` — ${reasons.join("; ")}` : ""}`,
    );
  }
  return results;
}

/** The per-class rollup: recall, and MRR over the rank of the first hit. */
export function rollupByClass(results) {
  const byClass = {};
  for (const cls of [...new Set(results.map((r) => r.class))]) {
    const rs = results.filter((r) => r.class === cls);
    const hits = rs.filter((r) => r.pass);
    // MRR over cases that produced a rank; a miss contributes 0, which is the
    // standard definition and keeps it comparable across runs.
    const mrr = rs.reduce((s, r) => s + (r.rank ? 1 / r.rank : 0), 0) / rs.length;
    byClass[cls] = {
      cases: rs.length,
      passed: hits.length,
      recall: hits.length / rs.length,
      mrr: Number(mrr.toFixed(3)),
    };
  }
  return byClass;
}

/**
 * This run, as one object. The tallies, the date and the fixture stamp are the
 * shared spine (`eval-results.mjs` `summaryOf`); everything named here is what
 * RETRIEVAL measured, and with what.
 *
 * @param {object[]} results
 * @param {{casesPath?: string, worker?: string, rpc?: string, embedModel?: string}} opts
 */
export function summariseRetrieval(results, { casesPath = RETRIEVAL_FIXTURE_PATH, worker, rpc, embedModel } = {}) {
  const subs = results.map((r) => r.subrequests).filter((n) => typeof n === "number");
  const passed = results.filter((r) => r.pass).length;
  return summaryOf(results, {
    // WHAT WAS MEASURED, AGAINST WHAT — the stamp this file had no answer for
    // before #619. A retrieval score is only comparable to another score taken
    // against the same golden set, and the set is edited: ids get re-read out
    // of the live blueprint, cases get added, a `k` gets widened. A results
    // file that says only "26 cases, recall 1.000" cannot be told from one
    // taken against a laxer fixture.
    fixture: fixtureStamp(casesPath),
    worker: worker ?? null,
    // Which function produced these numbers. Recorded ALWAYS, not only when
    // overridden: a results file that does not say is one someone compares
    // against the live baseline a week later without noticing it is not one.
    rpc: rpc ?? "search_blueprint",
    // The MODEL, for the same reason and with one difference: the function's
    // name is knowable from the override, the model is not. Two runs against
    // one candidate function, one per model, differ in nothing else a reader
    // of this file can see. Recorded as what the WORKER said it used rather
    // than what was asked for, so a silently ignored parameter shows up here
    // as the live model instead of the candidate.
    embedModel: results.find((r) => r.embedModel)?.embedModel ?? embedModel ?? null,
    cases: results.length,
    blockers: results.filter((r) => r.blocker).length,
    recallOverall: Number((passed / results.length).toFixed(3)),
    subrequestsAvg: subs.length ? Number((subs.reduce((a, b) => a + b, 0) / subs.length).toFixed(2)) : null,
    subrequestsMax: subs.length ? Math.max(...subs) : null,
    byClass: rollupByClass(results),
  });
}

/** Printed only on a red, by the shared findings renderer. */
export const RETRIEVAL_REMEDY = [
  "A failing BLOCKER case fails this run; a failing diagnostic is a warning — the aggregate",
  "and absence classes are expected to fail before Phase 2 (the fixture's notes on BR25).",
  "Every verdict, the judged window of rows and what each query cost are in the results file",
  "named above; read it rather than re-running.",
  "",
  "A red here is a RETRIEVAL result only if some cases passed. All of them failing at the",
  "transport means the eval never reached the Worker, which the lines above say directly.",
].join("\n");

async function main() {
  required("WORKER_URL", WORKER_URL);
  required("DEBUG_TOKEN", DEBUG_TOKEN);

  const fixture = loadRetrievalCases(CASES_PATH ?? RETRIEVAL_FIXTURE_PATH);
  console.log(`[retrieval] ${fixture.cases.length} cases against ${WORKER_URL}\n`);

  const results = await walkRetrieval({ cases: fixture.cases, search });
  const summary = summariseRetrieval(results, {
    casesPath: fixture.path,
    worker: WORKER_URL,
    rpc: RPC_NAME,
    embedModel: EMBED_MODEL,
  });

  console.log("\n── by class ──");
  for (const [cls, s] of Object.entries(summary.byClass)) {
    console.log(`  ${cls.padEnd(17)} recall ${pct(s.passed, s.cases).padStart(4)} (${s.passed}/${s.cases})  MRR ${s.mrr}`);
  }
  console.log(
    `\n  overall ${summary.passed}/${summary.cases}` +
      `   subrequests avg ${summary.subrequestsAvg} max ${summary.subrequestsMax}` +
      `   (fixture ${summary.fixture.rev}/${summary.fixture.sha256})`,
  );

  if (BASELINE && existsSync(BASELINE)) {
    const parsed = JSON.parse(readFileSync(BASELINE, "utf8"));
    // A run recorded before #619 nested its tallies under `summary`; one
    // recorded since is the summary. Both are baselines worth comparing, and
    // the rollup a comparison reads is in the same place in either.
    const base = parsed.summary ?? parsed;
    console.log("\n── vs baseline ──");
    for (const cls of Object.keys(summary.byClass)) {
      const b = base.byClass?.[cls];
      if (!b) continue;
      const d = summary.byClass[cls].recall - b.recall;
      const sign = d > 0 ? "+" : "";
      console.log(`  ${cls.padEnd(17)} ${sign}${(d * 100).toFixed(0)}pp recall, MRR ${sign}${(summary.byClass[cls].mrr - b.mrr).toFixed(3)}`);
    }
  }

  writeResults(summary, OUT_PATH);
  // Said before the gate renders, because it is what makes a red readable: a
  // wholesale transport failure is not a retrieval result at all.
  diagnoseWholesaleFailure(results);
  // THE GATE IS THE HARNESS'S. A failing blocker is an error and a failing
  // diagnostic a warning (eval-results.mjs `findingsFor`), and
  // scripts/lib/findings.mjs decides the banner, the stream and the exit code.
  // The per-case log above is untouched, which is why this stays spawn-shaped.
  report("evals:retrieval", findingsFor(summary), {
    remedy: `${RETRIEVAL_REMEDY}\n\nResults: ${OUT_PATH}`,
    summary: `${summary.passed}/${summary.cases} passed, recall ${summary.recallOverall}, no blocker failed`,
  });
}

/**
 * When EVERY case failed the same way, say what that pattern means.
 *
 * A retrieval regression looks like some cases passing and some not. All 26
 * failing with an identical transport error is not retrieval at all — it is the
 * eval never reaching the Worker, and the per-case output says so 26 times
 * without ever saying it once.
 *
 * The 404 is the expensive one to read. `/debug/*` closes on a token mismatch
 * rather than returning 401, deliberately, so that an unauthenticated caller
 * cannot confirm the route exists. So a wrong DEBUG_TOKEN and a Worker without
 * the route are indistinguishable from the outside — and after the #288 account
 * move they were the same morning: the repo secret still held the OLD Worker's
 * token while the new Worker had a different one, and all 26 cases returned
 * "HTTP 404: not found" with 0% recall in every class.
 */
function diagnoseWholesaleFailure(results) {
  const failures = results.filter((r) => !r.pass);
  if (failures.length !== results.length || results.length === 0) return;

  const errors = failures.map((r) => (r.failures ?? []).join(" ")).filter((e) => e.includes("request failed"));
  if (errors.length !== results.length) return;

  const say = (...lines) => {
    console.error("");
    for (const l of lines) console.error(l);
  };

  if (errors.every((e) => e.includes("HTTP 404"))) {
    say(
      `[retrieval] every one of the ${results.length} cases returned 404, which is not a retrieval result.`,
      "  /debug/* closes the route on a token mismatch instead of returning 401, so a WRONG",
      "  DEBUG_TOKEN and a missing route look identical from here. The token is the usual cause:",
      "",
      "    the Worker's DEBUG_TOKEN is set with `wrangler secret put DEBUG_TOKEN`",
      "    this eval reads GitHub's repo secret of the same name",
      "",
      "  Two copies of one value, so they drift — most recently when the Worker moved accounts",
      "  (#288) and only one side was updated. Check they match before reading these scores as",
      "  a retrieval problem.",
    );
    return;
  }
  if (errors.every((e) => e.includes("HTTP 5"))) {
    say(`[retrieval] all ${results.length} cases got a 5xx. The Worker is up but erroring — check its logs, not these scores.`);
    return;
  }
  if (errors.every((e) => /abort|timeout|fetch failed|ENOTFOUND|ECONNREFUSED/i.test(e))) {
    say(
      `[retrieval] all ${results.length} cases failed to connect to ${WORKER_URL}.`,
      "  Nothing was measured. Check the host is right and the Worker is deployed.",
    );
    return;
  }
  say(`[retrieval] all ${results.length} cases failed at the transport, so nothing about retrieval was measured.`);
}

// Imported by the test, executed by the npm script — so the walk only starts
// when this file IS the entry point (#610). Before, importing this module to
// test one of its functions fired a live run.
if (isEntry(import.meta.url)) {
  main().catch((err) => {
    console.error(`[retrieval] FAILED: ${err.message}`);
    process.exit(2);
  });
}
