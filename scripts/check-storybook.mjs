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
 * `check:harness`. That gate's own header says the ~20s is what keeps it
 * switched on. This one runs as its own `pull_request` job
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
  spawnSync('npx', args, { cwd: REPO_ROOT, stdio: 'inherit', env: process.env });
  const seconds = (Date.now() - started) / 1000;

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

function main() {
  const { report, seconds } = JSON_ARG
    ? { report: JSON.parse(fs.readFileSync(path.resolve(JSON_ARG), 'utf8')), seconds: null }
    : runSuite();

  const { a11y, blocking, totals } = classify(report);
  const rules = ruleCounts(a11y);
  const violatingStories = Object.keys(a11y).length;

  console.log(
    `\n${'─'.repeat(72)}\n` +
      `[storybook] ${totals.files} story files · ${totals.tests} tests · ` +
      `${totals.passed} passed · ${totals.failed} failed` +
      (seconds === null ? '' : ` · ${seconds.toFixed(0)}s`) +
      `\n[storybook] ${blocking.length} blocking failure(s) · ` +
      `${violatingStories} stor${violatingStories === 1 ? 'y' : 'ies'} with a11y violations ` +
      `across ${Object.keys(rules).length} rule(s)`,
  );

  if (UPDATE) {
    fs.writeFileSync(BASELINE, `${JSON.stringify(baselineRecord({ a11y, totals }), null, 2)}\n`);
    console.log(
      `[storybook] a11y baseline recorded: ${violatingStories} stories, ` +
        `${Object.keys(rules).length} rules -> ${path.relative(REPO_ROOT, BASELINE)}`,
    );
    if (blocking.length) {
      console.error(
        `\n[storybook] ${blocking.length} NON-a11y failure(s) were present during --update.\n` +
          '  -> The baseline covers accessibility only, so these were not recorded and the\n' +
          '     gate will still fail on them. Fix them. Listed below.',
      );
      for (const b of blocking) console.error(`\n  ✗ ${b.where}\n${b.message}`);
      return 1;
    }
    return 0;
  }

  let failed = false;

  // 1. Play functions and render errors. No baseline, no grace.
  if (blocking.length) {
    failed = true;
    console.error(
      `\n${'─'.repeat(72)}\n` +
        `✗ ${blocking.length} story test(s) failed for a reason that is not an accessibility\n` +
        '  violation — a `play` function, or the story failing to render.\n',
    );
    for (const b of blocking) console.error(`  ✗ ${b.where}\n${b.message}\n`);
    console.error(
      '  -> These have no baseline. Reproduce one story on its own with:\n' +
        '       npx vitest run --project=storybook -t "<story name>"',
    );
  }

  // 2. Accessibility. Ratchet against the committed baseline.
  if (!fs.existsSync(BASELINE)) {
    console.error(
      `\n✗ no a11y baseline at ${path.relative(REPO_ROOT, BASELINE)}.\n` +
        '  -> Record it once: npm run check:storybook -- --update',
    );
    return 1;
  }

  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const { regressions, cleared } = ratchet(a11y, base.stories ?? {});

  if (regressions.length) {
    failed = true;
    console.error(
      `\n${'─'.repeat(72)}\n` +
        `✗ ${regressions.length} stor${regressions.length === 1 ? 'y' : 'ies'} violate an ` +
        'accessibility rule they did not violate at the baseline.\n',
    );
    for (const r of regressions) {
      console.error(
        `  ✗ ${r.story}\n      new: ${r.added.join(', ')}` +
          (r.known.length ? `\n      already baselined: ${r.known.join(', ')}` : ''),
      );
    }
    console.error(
      '\n  -> Fix the violation. The baseline is a floor that may only fall: it exists so an\n' +
        '     inherited count too large to clear in one commit does not block unrelated work,\n' +
        '     and adding to it defeats the point. Where a rule genuinely does not apply to a\n' +
        "     story, set that story's own `parameters.a11y` and write the reason beside it —\n" +
        '     a reviewed decision in the story file, which re-baselining is not.',
    );
  }

  if (failed) {
    console.error(`\n${'─'.repeat(72)}\n✗ check:storybook FAILED`);
    return 1;
  }

  console.log(
    '✓ check:storybook — no play failures; no new a11y violations ' +
      `(baseline ${base.violatingStories} stories, measured ${base.measured})` +
      (cleared.length
        ? `\n  ${cleared.length} baselined stor${cleared.length === 1 ? 'y is' : 'ies are'} now clean` +
          ' — re-baseline with `npm run check:storybook -- --update` to lock the gain in.'
        : ''),
  );
  console.log(
    `  heaviest rules: ${Object.entries(rules)
      .slice(0, 4)
      .map(([r, n]) => `${r} (${n})`)
      .join(' · ')}`,
  );
  return 0;
}

// Importing this module for its exports must not run a browser suite.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
