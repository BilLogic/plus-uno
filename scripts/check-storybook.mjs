/**
 * `npm run check:storybook` — the Storybook browser suite, turned on.
 *
 * WHY IT EXISTS. The suite has been installed and wired since the addons went
 * in: 382 story files, `addon-a11y` and `addon-vitest` on Playwright browser
 * mode, `a11y: { test: 'error' }` set globally in `.storybook/preview.jsx`. No
 * workflow referenced any of it, so none of it ever ran — an accessibility rule
 * set to `error` errored at nobody, and a story that stopped rendering said so
 * to nobody.
 *
 * HOW MANY `play` FUNCTIONS THERE ACTUALLY ARE: one file's worth. #169 and its
 * parent were written around "284 of 382 stories carry a `play` block", which
 * came from grepping `play:` — a pattern that matches `display:` in every inline
 * style object in the corpus. Re-measured 2026-08-26 with a word boundary, and
 * against the imports interaction tests need: zero story files matched `play` as
 * a key, zero imported `storybook/test`. The first two arrived the same day, in
 * `LabelAssociation.stories.jsx` (#206), which asserts what axe cannot see —
 * that no `label[for]` in the story points at an id no element carries. So the
 * play path below stopped being a gate held open for a future test and started
 * carrying one.
 *
 * TWO FAILURE KINDS, TWO MECHANISMS. Vitest reports one status per story, but
 * the failures underneath are not one population:
 *
 *   - A `play` failure, or a render error, is a defect introduced by a change.
 *     There are zero of them on `main` today (measured, not assumed). Anything
 *     that appears is new, so it blocks immediately.
 *   - An a11y violation is mostly inherited. 146 story tests fail on axe rules
 *     that predate this gate, spread across 15 rules with no shared cause left
 *     after #153 — nothing to fix in one commit. Blocking on the absolute count
 *     would stop all work; deleting the rules would keep the count honest and
 *     the accessibility fictional. So a11y is a RATCHET against a committed
 *     baseline: new violations fail, the recorded set may only shrink. Same
 *     shape as `check:negation`, same reasoning as #152.
 *
 * THE BASELINE IS KEYED PER STORY, NOT AS A TOTAL. A single number nets out —
 * fix ten violations, introduce ten elsewhere, and a total-only ratchet reports
 * green. The baseline records which rules each story violates, so the gate can
 * say "this story did not violate `button-name` before" rather than "the number
 * went up".
 *
 * WHY IT IS NOT PART OF `check:harness`. It needs `npm ci` and a Playwright
 * chromium download, and the run itself is ~130s against ~14s for the whole of
 * `check:harness` — 34–38s for that gate's job, including the one `npm ci` it
 * scopes to `agents/uno-bot`. That gate's own header says that number is what
 * keeps it switched on. This one runs as its own `pull_request` job
 * (`.github/workflows/storybook-gate.yml`), concurrently — so a PR still waits
 * one Storybook run, not a Storybook run *after* the fast gate. The decision is
 * recorded in `EXCLUDED` in `scripts/check-harness.mjs`, which is where
 * composition decisions live.
 *
 * Usage:
 *   npm run check:storybook              run the suite; block on play, ratchet a11y
 *   npm run check:storybook -- --update  re-record the a11y baseline from this run
 *   npm run check:storybook -- --json <f> read an existing vitest JSON report instead
 *                                         of running the suite (for triage; CI runs
 *                                         the suite itself)
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BASELINE = path.join(REPO_ROOT, 'docs/evals/a11y-baseline.json');
/** The same path as the reader sees it, so the verdict's messages need no root. */
const BASELINE_REL = path.relative(REPO_ROOT, BASELINE);

const argv = process.argv.slice(2);
const UPDATE = argv.includes('--update');
const JSON_ARG = argv.includes('--json') ? argv[argv.indexOf('--json') + 1] : null;

/**
 * The a11y matcher's message, from `@storybook/addon-a11y`'s vitest matcher.
 * Every violation message opens with this sentence, and no other failure in the
 * suite produces it — that is the whole of the classification.
 */
export const A11Y_MARKER = 'to have no violations';

/** Recorded when axe reported a violation without a helpUrl to name it. */
export const UNIDENTIFIED_RULE = '(unidentified-rule)';

/**
 * axe attaches a `helpUrl` per violation, and its last path segment is the rule
 * id. Reading the id from the URL rather than from the prose keeps the parse off
 * the human-readable half of the message, which is the half that changes between
 * axe releases.
 */
const RULE_FROM_HELP_URL = /dequeuniversity\.com\/rules\/axe\/[^/]+\/([a-z0-9-]+)/g;

/**
 * The setup file every browser test imports. Named here rather than inline so
 * `reoptimisationFailures` and its test agree on one string.
 */
const SETUP_FILE = '.storybook/vitest.setup.ts';

/** Runs the browser suite and returns the parsed vitest JSON report. */
function runSuite() {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sb-gate-')), 'report.json');
  const args = [
    'vitest',
    'run',
    '--project=storybook',
    '--reporter=default',
    '--reporter=json',
    `--outputFile=${out}`,
  ];
  console.log(`[storybook] npx ${args.join(' ')}\n`);
  const started = Date.now();
  const run = spawnSync('npx', args, { cwd: REPO_ROOT, stdio: 'inherit', env: process.env });
  const seconds = (Date.now() - started) / 1000;

  // A signal means the runner was killed — OOM, timeout, Ctrl-C. Vitest may still
  // have flushed a partial report, and a partial report is indistinguishable from
  // a clean one once it is parsed: fewer testResults simply look like fewer
  // stories, so every downstream check finds nothing wrong and this exits 0.
  if (run.signal) {
    console.error(
      `[storybook] vitest was killed by ${run.signal} — any JSON report it left is partial.\n` +
        '  -> This is a harness failure, not a story failure. Re-run it.',
    );
    process.exit(1);
  }

  if (!fs.existsSync(out)) {
    console.error(
      '[storybook] vitest produced no JSON report — the suite did not start.\n' +
        '  -> This is a harness failure, not a story failure. Read the vitest output above.',
    );
    process.exit(1);
  }
  // Left on disk deliberately: the report carries every violation's HTML, which
  // is what you want when triaging one story out of a hundred-odd. It lives in
  // the OS temp dir, so CI discards it with the runner.
  console.log(`\n[storybook] full JSON report: ${out}`);
  return { report: JSON.parse(fs.readFileSync(out, 'utf8')), seconds };
}

/**
 * Splits a vitest JSON report into the two populations. `a11y` is keyed by
 * `<story file>::<full test name>` so the ratchet can name the story; `blocking`
 * is everything else, flattened into printable diagnostics.
 *
 * Exported because this is the whole of the gate's judgment, and #191's lesson
 * is that a guard nobody has watched fail is a guard nobody knows works. Tested
 * against synthetic reports in `check-storybook.test.mjs`, which needs no
 * browser and therefore runs inside `check:harness`.
 *
 * @param {object} report a vitest `--reporter=json` report
 * @param {string} root paths in the report are relativised against this
 * @returns {{a11y: Record<string,string[]>, blocking: {where: string, message: string}[],
 *            totals: {files: number, tests: number, passed: number, failed: number}}}
 */
export function classify(report, root = REPO_ROOT) {
  const a11y = {};
  const blocking = [];

  for (const file of report.testResults ?? []) {
    const rel = path.relative(root, file.name ?? '(unknown file)');

    // A file that produced no assertions but failed anyway is a collection or
    // import error — the shape #157's flake took. It is not an a11y violation,
    // so it blocks rather than looking for a baseline entry it can never have.
    if (!file.assertionResults?.length && file.status === 'failed') {
      blocking.push({ where: rel, message: file.message || '(file failed with no message)' });
      continue;
    }

    for (const test of file.assertionResults ?? []) {
      if (test.status !== 'failed') continue;
      const key = `${rel}::${test.fullName ?? test.title}`;
      for (const message of test.failureMessages ?? []) {
        if (!message.includes(A11Y_MARKER)) {
          blocking.push({ where: key, message });
          continue;
        }
        const rules = new Set(a11y[key] ?? []);
        for (const m of message.matchAll(RULE_FROM_HELP_URL)) rules.add(m[1]);
        // A violation whose helpUrl axe omitted still has to be recorded, or the
        // ratchet would quietly stop counting a whole rule.
        if (!rules.size) rules.add(UNIDENTIFIED_RULE);
        a11y[key] = [...rules].sort();
      }
    }
  }

  return {
    a11y,
    blocking,
    totals: {
      files: (report.testResults ?? []).length,
      tests: report.numTotalTests ?? 0,
      passed: report.numPassedTests ?? 0,
      failed: report.numFailedTests ?? 0,
    },
  };
}

/**
 * The blocking failures that are the Vite re-optimisation flake, not a broken
 * story (#157, and again on 2026-08-29).
 *
 * When Vite discovers a dependency mid-run it re-optimises and reloads the page.
 * Any test file whose setup import is in flight when that lands aborts with
 * `Failed to import test file <the setup file>` — so the report blames a file
 * chosen by timing. Three PRs went red on one morning naming three different
 * innocent stories, and re-running picked a fourth.
 *
 * SEPARATED, NOT EXCUSED. These still block: a setup file that genuinely cannot
 * import is a real break and must not be swallowed, and the check has no way to
 * tell the two apart from the report alone. What changes is what the reader is
 * told — "this story is broken" sends someone to read a story that is fine.
 *
 * @param {{where: string, message: string}[]} blocking
 * @param {string} setupFile the setup file's path, matched as a suffix
 */
export function reoptimisationFailures(blocking, setupFile = SETUP_FILE) {
  return blocking.filter(
    (b) => b.message?.includes('Failed to import test file') && b.message.includes(setupFile),
  );
}

/** Rule -> number of stories violating it, heaviest first. */
export function ruleCounts(a11y) {
  const counts = {};
  for (const rules of Object.values(a11y)) for (const r of rules) counts[r] = (counts[r] ?? 0) + 1;
  return Object.fromEntries(
    Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  );
}

/**
 * The ratchet itself.
 *
 * A regression is a story violating a rule it did not violate at the baseline —
 * per story, not in total. A total-only comparison nets out: fix ten violations,
 * introduce ten elsewhere, and the gate reports green on a corpus that got no
 * more accessible. A story that disappears from the report, or stops violating,
 * is a `cleared` — never a failure, and the caller is told so the baseline can be
 * re-recorded and the gain locked in.
 *
 * @returns {{regressions: {story: string, added: string[], known: string[]}[], cleared: string[]}}
 */
export function ratchet(a11y, baselineStories) {
  const regressions = [];
  for (const [story, current] of Object.entries(a11y)) {
    const known = new Set(baselineStories[story] ?? []);
    const added = current.filter((r) => !known.has(r));
    if (added.length) regressions.push({ story, added, known: [...known] });
  }
  const cleared = Object.keys(baselineStories).filter((s) => !a11y[s]);
  return { regressions, cleared };
}

/** The committed baseline's serialised shape, in one place so the writer and the reader agree. */
export function baselineRecord({ a11y, totals }) {
  return {
    // What the numbers describe, so a reader does not have to re-derive them.
    measured: new Date().toISOString().slice(0, 10),
    suite: { storyFiles: totals.files, tests: totals.tests },
    violatingStories: Object.keys(a11y).length,
    rules: ruleCounts(a11y),
    stories: Object.fromEntries(Object.entries(a11y).sort(([a], [b]) => a.localeCompare(b))),
  };
}


/**
 * The gate's verdict: everything it decides once a report exists.
 *
 * WHY THIS IS A FUNCTION. The decision used to live inside `main()`, wrapped
 * around the spawn, the printing and the baseline write, which meant the only
 * way to exercise it was to run a browser suite — so none of it was exercised.
 * The exit code was therefore an assertion nobody had ever watched fail, which
 * is how a run that collected zero tests came to pass: every check below is over
 * what the report CONTAINS, and an empty report contains nothing wrong. Taking
 * the report and the baseline as arguments and returning the exit code, the lines
 * to print and what `--update` would record leaves `main()` with the I/O and
 * makes each of these floors a test case.
 *
 * Lines are tagged rather than printed so the caller keeps the choice of stream:
 * the summary and the green line are stdout, everything a reader must act on is
 * stderr, exactly as before.
 *
 * @param {object} report a vitest `--reporter=json` report
 * @param {object|null} baseline the parsed committed baseline, or null if absent
 * @param {{root?: string, update?: boolean, seconds?: number|null}} options
 * @returns {{status: 0|1, lines: {stream: 'out'|'err', text: string}[], record?: object}}
 */
export function verdict(report, baseline, { root = REPO_ROOT, update = false, seconds = null } = {}) {
  const lines = [];
  const out = (text) => lines.push({ stream: 'out', text });
  const err = (text) => lines.push({ stream: 'err', text });

  const { a11y, blocking, totals } = classify(report, root);
  const rules = ruleCounts(a11y);
  const violatingStories = Object.keys(a11y).length;

  out(
    `\n${'─'.repeat(72)}\n` +
      `[storybook] ${totals.files} story files · ${totals.tests} tests · ` +
      `${totals.passed} passed · ${totals.failed} failed` +
      (seconds === null ? '' : ` · ${seconds.toFixed(0)}s`) +
      `\n[storybook] ${blocking.length} blocking failure(s) · ` +
      `${violatingStories} stor${violatingStories === 1 ? 'y' : 'ies'} with a11y violations ` +
      `across ${Object.keys(rules).length} rule(s)`,
  );

  // A run that ran no tests at all is the emptiest version of the same defect the
  // floors below catch, and it needs no baseline to recognise: the suite either
  // matched no files or listed files and executed nothing in them. Checked before
  // --update as well, because recording a baseline from a run that did not happen
  // would set every floor to zero and disarm the gate permanently.
  if (!totals.tests) {
    err(
      '\n[storybook] the report contains 0 tests — the suite did not run.\n' +
        '  -> This is a harness failure, not a story failure. Read the vitest output above.',
    );
    return { status: 1, lines };
  }

  if (update) {
    const record = baselineRecord({ a11y, totals });
    out(
      `[storybook] a11y baseline recorded: ${violatingStories} stories, ` +
        `${Object.keys(rules).length} rules -> ${BASELINE_REL}`,
    );
    if (blocking.length) {
      err(
        `\n[storybook] ${blocking.length} NON-a11y failure(s) were present during --update.\n` +
          '  -> The baseline covers accessibility only, so these were not recorded and the\n' +
          '     gate will still fail on them. Fix them. Listed below.',
      );
      for (const b of blocking) err(`\n  ✗ ${b.where}\n${b.message}`);
      return { status: 1, lines, record };
    }
    return { status: 0, lines, record };
  }

  let failed = false;

  // 1. Play functions and render errors. No baseline, no grace.
  if (blocking.length) {
    failed = true;
    err(
      `\n${'─'.repeat(72)}\n` +
        `✗ ${blocking.length} story test(s) failed for a reason that is not an accessibility\n` +
        '  violation — a `play` function, or the story failing to render.\n',
    );
    for (const b of blocking) err(`  ✗ ${b.where}\n${b.message}\n`);
    err(
      '  -> These have no baseline. Reproduce one story on its own with:\n' +
        '       npx vitest run --project=storybook -t "<story name>"',
    );

    const reopt = reoptimisationFailures(blocking);
    if (reopt.length) {
      err(
        `\n  !! ${reopt.length} of those name ${SETUP_FILE} rather than a story.\n` +
          '     That is the Vite re-optimisation flake, and the story above is a bystander\n' +
          '     picked by timing — do not go and read it. Search this log for:\n' +
          '         new dependencies optimized:\n' +
          '     and add every name it lists to `optimizeDeps.include` in vite.config.js,\n' +
          '     where the mechanism is written down. Re-running WITHOUT that change will\n' +
          '     usually fail again, naming a different file.',
      );
    }
  }

  // 2. Accessibility. Ratchet against the committed baseline.
  if (!baseline) {
    err(
      `\n✗ no a11y baseline at ${BASELINE_REL}.\n` +
        '  -> Record it once: npm run check:storybook -- --update',
    );
    return { status: 1, lines };
  }

  const base = baseline;

  // A run that collects fewer files than the baseline recorded is not a pass, it is
  // a run that did not happen. Every assertion below is over what the report
  // contains, so a report missing half the corpus reports half the violations and
  // still clears the ratchet. The baseline already carries the size it was
  // measured at, so the floor is free.
  const expectedFiles = base.suite?.storyFiles;
  if (expectedFiles && totals.files < expectedFiles) {
    err(
      `\n[storybook] collected ${totals.files} story files, but the baseline was measured at ` +
        `${expectedFiles}. A short run cannot clear a ratchet — it just has less to find.\n` +
        '  -> If story files were deliberately removed, re-record with --update in the same PR.',
    );
    return { status: 1, lines };
  }

  // The same floor one step later. A run can list every story file and still
  // execute almost nothing in them — a project filter that matches the files but
  // no tests, a bail, a browser that died after the first file. The file count
  // then looks right while the ratchet is asked about a fraction of the corpus.
  const expectedTests = base.suite?.tests;
  if (expectedTests && totals.tests < expectedTests) {
    err(
      `\n[storybook] ran ${totals.tests} tests, but the baseline was measured at ` +
        `${expectedTests}. A short run cannot clear a ratchet — it just has less to find.\n` +
        '  -> If tests were deliberately removed, re-record with --update in the same PR.',
    );
    return { status: 1, lines };
  }
  const { regressions, cleared } = ratchet(a11y, base.stories ?? {});

  if (regressions.length) {
    failed = true;
    err(
      `\n${'─'.repeat(72)}\n` +
        `✗ ${regressions.length} stor${regressions.length === 1 ? 'y' : 'ies'} violate an ` +
        'accessibility rule they did not violate at the baseline.\n',
    );
    for (const r of regressions) {
      err(
        `  ✗ ${r.story}\n      new: ${r.added.join(', ')}` +
          (r.known.length ? `\n      already baselined: ${r.known.join(', ')}` : ''),
      );
    }
    err(
      '\n  -> Fix the violation. The baseline is a floor that may only fall: it exists so an\n' +
        '     inherited count too large to clear in one commit does not block unrelated work,\n' +
        '     and adding to it defeats the point. Where a rule genuinely does not apply to a\n' +
        "     story, set that story's own `parameters.a11y` and write the reason beside it —\n" +
        '     a reviewed decision in the story file, which re-baselining is not.',
    );
  }

  if (failed) {
    err(`\n${'─'.repeat(72)}\n✗ check:storybook FAILED`);
    return { status: 1, lines };
  }

  out(
    '✓ check:storybook — no play failures; no new a11y violations ' +
      `(baseline ${base.violatingStories} stories, measured ${base.measured})` +
      (cleared.length
        ? `\n  ${cleared.length} baselined stor${cleared.length === 1 ? 'y is' : 'ies are'} now clean` +
          ' — re-baseline with `npm run check:storybook -- --update` to lock the gain in.'
        : ''),
  );
  out(
    `  heaviest rules: ${Object.entries(rules)
      .slice(0, 4)
      .map(([r, n]) => `${r} (${n})`)
      .join(' · ')}`,
  );
  return { status: 0, lines };
}

function main() {
  const { report, seconds } = JSON_ARG
    ? { report: JSON.parse(fs.readFileSync(path.resolve(JSON_ARG), 'utf8')), seconds: null }
    : runSuite();

  const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : null;
  const { status, lines, record } = verdict(report, baseline, { update: UPDATE, seconds });

  // The record is written before the lines are printed because one of those lines
  // announces the write; printing first would announce something that had not
  // happened yet if the write threw.
  if (record) fs.writeFileSync(BASELINE, `${JSON.stringify(record, null, 2)}\n`);
  for (const line of lines) (line.stream === 'err' ? console.error : console.log)(line.text);

  return status;
}

// Importing this module for its exports must not run a browser suite.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
