// What an eval run PRODUCED: one results row, the file it is written to, and
// the findings a run exits on.
//
// A results row used to be whichever of five hand-built object literals the
// runner reached — an unsupported case, a failed subject read, an unsatisfiable
// subject condition, a case whose placeholders went unfilled, and a case that
// actually ran. Each literal named the keys its own branch happened to care
// about, so `eval-results.json` held five shapes: `pass` was absent on three of
// them, `judged` on four, `failures` on two, and a reader (or a jq expression,
// or the next runner) could not tell "this case did not fail" from "this branch
// never wrote the field". A row whose key set depends on how the run went is a
// row that cannot be queried at all.
//
// So a row has ONE shape. `resultRow` fills every key in `RESULT_KEYS`, and
// refuses one outside it — the same discipline `eval-case.mjs` applies to the
// fixture, and for the same reason: a misspelt key in a results file is a fact
// that silently stops being recorded.
//
// ONE SHAPE PER SUITE, NOT ONE SHAPE FOR ALL OF THEM (#619). There are two eval
// suites in this repository and they measure different things: the turn suite
// scores how an answer READS (samples, a judge verdict, a transcript), the
// retrieval suite scores WHICH ROWS came back (a rank, the retrieval path, the
// embedding model). Folding both into one key set would put ten always-null
// fields on every row of each file, which is the "absent is not a value" rule
// used as an excuse to record nothing.
//
// What both suites share is the SPINE below — which case, and how it went —
// and the three things built on it: the gate (`findingsFor`), the summary
// (`summaryOf`) and the write (`writeResults`). `rowShape` is how a suite
// declares its own measurements on top of that spine and gets the same
// discipline: every key filled, a key outside the vocabulary refused. #617 held
// off on parameterising this for a caller that did not exist; #619 is that
// caller, and the retrieval row is the second instance.
//
// THE RUN'S GATE IS THE HARNESS'S GATE. `scripts/lib/findings.mjs` already
// models what a check found and what it should exit with, and the runner used
// to model both by hand: a `blockerFailures` counter incremented at three
// depths and a bare `process.exit(1)` at the bottom of `main`. `findingsFor`
// below turns a summary into `Finding[]` — a failed BLOCKER is an error, a
// failed non-blocker is a warning, which is exactly the distinction that
// counter encoded — and `exitCodeFor` decides the code. The per-case log is
// untouched: a line per case across 34 cases is the shape the registry keeps
// this check spawn-shaped FOR, and it would flatten under findings rendering.
//
// The results WRITE goes through the shared artifact writer for the same
// reason the exit code does: one place in this repo puts a generated file on
// disk and says so on stdout (`scripts/lib/generated-artifact.js`), and the
// runner's own `writeFileSync` was the only copy of that decision left in the
// eval path.

import { writeArtifacts } from "../../../scripts/lib/generated-artifact.js";

/** Where a run lands. Repo-root-relative, as every documented invocation of
 *  the runner is — `.github/workflows/uno-bot-evals.yml` uploads this path as
 *  the `eval-results` artifact, and `.gitignore` covers it. */
export const RESULTS_PATH = "eval-results.json";

/**
 * The keys EVERY eval row carries, whatever the suite: which case this is, and
 * how it went. The gate and the summary read nothing else, which is why they
 * are shared rather than copied.
 *
 * ABSENT IS NOT A VALUE. `pass: false` on a skipped row is honest — the case
 * did not pass — and it is out of the denominator by `skipped`, which is the
 * field that says so. The alternative, leaving `pass` off, makes every reader
 * of the file re-derive "skipped or failed?" from which keys exist.
 */
const VERDICT_DEFAULTS = {
  /** The case, as the fixture names it. `name` is empty where the fixture
   *  carries no prose title — the retrieval fixture identifies a case by its
   *  id and its class — so `findingsFor` renders it only when there is one. */
  id: "",
  name: "",
  /** Whether a failure here fails the run (fixture `blocker`). */
  blocker: false,
  /** Neither passed nor failed, and out of the denominator: nothing was
   *  measured. `reason` says what stopped it. */
  skipped: false,
  reason: null,
  /** The verdict. */
  pass: false,
  /** Why the case failed its deterministic checks, in the runner's words. */
  failures: [],
};

/**
 * A suite's row constructor: the spine, plus what THIS suite measured.
 *
 * @param {string} label   names the suite in the refusal message.
 * @param {Record<string, unknown>} measurements  this suite's own keys and the
 *        value each holds when the run had nothing to put there.
 * @returns {{keys: string[], row: (fields: object) => Record<string, unknown>}}
 */
export function rowShape(label, measurements) {
  const defaults = { ...VERDICT_DEFAULTS, ...measurements };
  const keys = Object.keys(defaults);
  return {
    keys,
    row(fields) {
      // #656 renamed the turn-suite field `ungated` → `unreachable`. A results
      // file written before that still carries the old key; accept it as the
      // new one rather than refuse the row. Construction after the rename
      // uses `unreachable` only.
      if (Object.prototype.hasOwnProperty.call(fields, "ungated") && !Object.prototype.hasOwnProperty.call(fields, "unreachable")) {
        const { ungated, ...rest } = fields;
        fields = { ...rest, unreachable: ungated };
      }
      for (const key of Object.keys(fields)) {
        if (!(key in defaults)) {
          throw new Error(`${label} row for '${fields.id ?? "?"}' carries unknown key '${key}'`);
        }
      }
      const row = {};
      for (const key of keys) row[key] = fields[key] ?? defaults[key];
      return row;
    },
  };
}

/**
 * What the TURN suite measured, on top of the spine.
 *
 * `unreachable` is here rather than in the spine on purpose: it is a fact about a
 * transport that answers from recordings, and the retrieval suite has none —
 * its one instrument reaches every case, and a query that fails to reach the
 * Worker is scored a MISS rather than waved through as unreachable.
 */
const TURN_MEASUREMENTS = {
  /** Skipped because THIS RUN'S INSTRUMENT cannot reach the case — no
   *  recording, for the local transport. The word is the point: whatever the
   *  case asserts is not being enforced on this run. */
  unreachable: false,
  /** The sampling arithmetic behind the score (`eval-scoring.mjs`). */
  samples: 0,
  passedRuns: 0,
  /** The run-time subject: the CONDITION the case named, and the row the board
   *  answered with (`eval-subjects.mjs`). */
  need: null,
  subject: null,
  /** Whether a judge actually graded this answer — the field that keeps a
   *  FAIL-OPEN pass from reading as a graded one (`eval-judge.mjs`). */
  judged: false,
  judge: null,
  /** Total model time across every sample, in ms. */
  ms: 0,
  /** The Worker build that answered, where the row learnt one before its turns
   *  ran (a subject read reports it; a turn carries it in its response). */
  workerBuild: null,
  /** Every turn of the representative sample: what was sent, what came back. */
  transcript: null,
};

/** The turn suite's row. `RESULT_KEYS` is its vocabulary, in the order a row
 *  is written; `resultRow` is the only way to make one. */
const turnShape = rowShape("results", TURN_MEASUREMENTS);
export const RESULT_KEYS = turnShape.keys;
export const resultRow = turnShape.row;

// ── The gate ─────────────────────────────────────────────────────────────────

/** Printed only on a red, by `renderFindings`. */
export const REMEDY = [
  "A failing BLOCKER case fails this run — the scenario doc's rule that a failing row is a",
  "release blocker. Every verdict, both tallies, the deterministic failures, the judge's",
  `reason and the full transcript of every turn are in ${RESULTS_PATH}; read it rather than`,
  "re-running.",
  "",
  "Through --transport=local a red means a Turn, routing or pointer regression on a FIXED",
  "DRAW — never a model that answered differently, because nothing in-process measures the",
  "model. That measurement is the Monday --transport=worker cron.",
].join("\n");

/**
 * What a run FOUND, for the shared findings interface.
 *
 * A failed blocker is an error and fails the run; a failed non-blocker is a
 * warning, which is what the runner's `blockerFailures` counter meant by
 * counting only some of the failures it printed.
 *
 * UNREACHABLE CASES ARE NOT FINDINGS. They fail nothing by design — a gate that is
 * red for "no recording" is a gate that gets switched off — and they are
 * already named twice in the run's own output, in the opening census and in the
 * score line. What IS worth saying is a run that scored NOTHING: every case
 * skipped or unreachable reads as a clean sweep and measured nothing at all. A
 * warning, not an error, because the no-recording case has to stay green.
 *
 * @param {object} summary - what `runEvals` returned.
 * @returns {import('../../../scripts/lib/findings.mjs').Finding[]}
 */
export function findingsFor(summary) {
  const findings = [];
  const scored = summary.results.filter((r) => !r.skipped);
  for (const row of scored) {
    if (row.pass) continue;
    const why = row.failures.length
      ? row.failures.join("; ")
      : (row.judge?.reason ?? "no reason recorded");
    findings.push({
      message: `${row.blocker ? "BLOCKER " : ""}${row.id}${row.name ? ` — ${row.name}` : ""}: ${why}`,
      ...(row.blocker ? {} : { severity: "warning" }),
    });
  }
  if (!scored.length) {
    findings.push({
      severity: "warning",
      message: `nothing was scored: all ${summary.results.length} case(s) skipped or unreachable, so this run measured nothing`,
    });
  }
  return findings;
}

// ── The summary ──────────────────────────────────────────────────────────────

/**
 * What a run PRODUCED, as one object: when, against which fixture, what this
 * suite measured, and the tallies — counted off the rows.
 *
 * COUNTED, NOT ACCUMULATED. Both suites used to total their own passes and
 * blocker failures as the walk went, which is a second answer to a question the
 * rows already hold; the one the gate reads is the rows' (`findingsFor`), so a
 * counter that drifts makes the printed score and the exit code disagree.
 *
 * THE FIXTURE STAMP IS REQUIRED, not optional. A results file that cannot say
 * which fixture it measured against is unreadable a week later, and the
 * retrieval suite's file could not say it at all (#619) — so the spine refuses
 * a summary without one instead of writing a plausible file that omits it.
 * `eval-case.mjs` `fixtureStamp` makes the stamp; any fixture path will do.
 *
 * @param {object[]} results  every row, in the order the walk produced them.
 * @param {{fixture: {path: string, rev: string, sha256: string}}} measurements
 *        the fixture stamp, plus whatever THIS suite measured with.
 */
export function summaryOf(results, { fixture, ...measurements }) {
  if (!fixture?.sha256) throw new Error("an eval summary must carry its fixture stamp");
  // Skipped cases are neither passed nor failed, so they come out of the
  // denominator too. A suite reporting 33/34 while one case never ran would be
  // describing a run that did not happen.
  const scored = results.filter((r) => !r.skipped);
  return {
    ranAt: new Date().toISOString(),
    fixture,
    ...measurements,
    passed: scored.filter((r) => r.pass).length,
    failed: scored.filter((r) => !r.pass).length,
    skipped: results.length - scored.length,
    blockerFailures: scored.filter((r) => r.blocker && !r.pass).length,
    results,
  };
}

/** The run, on disk. One writer, which also says where it wrote. */
export function writeResults(summary, path = RESULTS_PATH) {
  writeArtifacts([
    { file: path, content: `${JSON.stringify(summary, null, 2)}\n`, note: "— this run, in full" },
  ]);
}
