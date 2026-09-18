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
 * Every key a results row carries, with the value it holds when this run had
 * nothing to put there.
 *
 * ABSENT IS NOT A VALUE. `pass: false` on a skipped row is honest — the case
 * did not pass — and it is out of the denominator by `skipped`, which is the
 * field that says so. The alternative, leaving `pass` off, makes every reader
 * of the file re-derive "skipped or failed?" from which keys exist.
 */
const RESULT_DEFAULTS = {
  /** The case, as the fixture names it. */
  id: "",
  name: "",
  /** Whether a failure here fails the run (fixture `blocker`). */
  blocker: false,
  /** Neither passed nor failed, and out of the denominator: nothing was
   *  measured. `reason` says what stopped it. */
  skipped: false,
  /** Skipped because THIS RUN'S INSTRUMENT cannot reach the case — no
   *  recording, for the local transport. The word is the point: whatever the
   *  case asserts is not being enforced on this run. */
  ungated: false,
  reason: null,
  /** The score, and the sampling arithmetic behind it (`eval-scoring.mjs`). */
  pass: false,
  samples: 0,
  passedRuns: 0,
  /** The run-time subject: the CONDITION the case named, and the row the board
   *  answered with (`eval-subjects.mjs`). */
  need: null,
  subject: null,
  /** Why the case failed its deterministic checks, in the runner's words. */
  failures: [],
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

/** The row's vocabulary, in the order a row is written. */
export const RESULT_KEYS = Object.keys(RESULT_DEFAULTS);

/**
 * One results row. The only way to make one.
 *
 * @param {Partial<Record<keyof typeof RESULT_DEFAULTS, unknown>>} fields
 * @returns {Record<string, unknown>}
 */
export function resultRow(fields) {
  for (const key of Object.keys(fields)) {
    if (!(key in RESULT_DEFAULTS)) {
      throw new Error(`results row for '${fields.id ?? "?"}' carries unknown key '${key}'`);
    }
  }
  const row = {};
  for (const key of RESULT_KEYS) row[key] = fields[key] ?? RESULT_DEFAULTS[key];
  return row;
}

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
 * UNGATED CASES ARE NOT FINDINGS. They fail nothing by design — a gate that is
 * red for "no recording" is a gate that gets switched off — and they are
 * already named twice in the run's own output, in the opening census and in the
 * score line. What IS worth saying is a run that scored NOTHING: every case
 * skipped or ungated reads as a clean sweep and measured nothing at all. A
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
      message: `${row.blocker ? "BLOCKER " : ""}${row.id} — ${row.name}: ${why}`,
      ...(row.blocker ? {} : { severity: "warning" }),
    });
  }
  if (!scored.length) {
    findings.push({
      severity: "warning",
      message: `nothing was scored: all ${summary.results.length} case(s) skipped or ungated, so this run measured nothing`,
    });
  }
  return findings;
}

/** The run, on disk. One writer, which also says where it wrote. */
export function writeResults(summary, path = RESULTS_PATH) {
  writeArtifacts([
    { file: path, content: `${JSON.stringify(summary, null, 2)}\n`, note: "— this run, in full" },
  ]);
}
