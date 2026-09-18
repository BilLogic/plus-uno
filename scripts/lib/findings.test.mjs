/**
 * Tests for the findings interface — the module every check renders through.
 *
 * The exports that never exit are asserted directly: `renderFindings` (the
 * banner, and how errors and warnings group inside it), `exitCodeFor` (warnings
 * do not fail) and `isEntry` (the one comparison that tells "run as a script"
 * from "imported by the runner"). `main` is the entry point, so it is asserted
 * twice over: in-process for the decisions that return — not the entry, or a
 * side flag that prints instead of gating — and once in a child process for the
 * gating path, which ends in `process.exit` and cannot be observed from inside.
 *
 * The two flag slots are the part worth reading closely. A TERMINAL flag ends
 * the CLI; a FALL-THROUGH flag prints or writes and the gate still runs. The
 * pair of child-process tests at the bottom shows both, side by side, over the
 * same red tree: the same handler under `fallThrough` exits 1 and under `flags`
 * exits 0, which is the silent defect the two slots exist to keep apart.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { exitCodeFor, isEntry, isError, main, renderFindings } from './findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── the render ───────────────────────────────────────────────────────────────

test('renderFindings says nothing was found, and says it in green', () => {
  assert.equal(renderFindings('check:demo', []), '✓ check:demo — no findings');
});

test('renderFindings puts the summary where the green line is', () => {
  assert.equal(
    renderFindings('check:demo', [], { summary: '12 files, all sound' }),
    '✓ check:demo — 12 files, all sound',
  );
});

test('renderFindings carries the location into the column before the message', () => {
  assert.equal(
    renderFindings('check:demo', [{ file: 'a.css', line: 7, message: 'bad' }]),
    ['✗ check:demo — 1 finding(s)', '  a.css:7  bad'].join('\n'),
  );
  assert.equal(
    renderFindings('check:demo', [{ file: 'a.css', message: 'bad' }]),
    ['✗ check:demo — 1 finding(s)', '  a.css  bad'].join('\n'),
  );
  assert.equal(
    renderFindings('check:demo', [{ message: 'bad' }]),
    ['✗ check:demo — 1 finding(s)', '  bad'].join('\n'),
  );
});

test('renderFindings prints the remedy under a rule, and only on failure', () => {
  const failing = renderFindings('check:demo', [{ message: 'bad' }], { remedy: 'do this' });
  assert.equal(failing.endsWith(`\n\n${'─'.repeat(72)}\n\ndo this`), true);

  const warned = renderFindings('check:demo', [{ message: 'meh', severity: 'warning' }], {
    remedy: 'do this',
  });
  assert.equal(warned.includes('do this'), false, 'a warning is not an instruction to act');
});

// ── the grouping ─────────────────────────────────────────────────────────────

test('renderFindings counts errors and warnings apart, and marks the warnings', () => {
  assert.equal(
    renderFindings('check:demo', [
      { message: 'first' },
      { message: 'second', severity: 'warning' },
      { message: 'third', severity: 'error' },
    ]),
    [
      '✗ check:demo — 2 finding(s), 1 warning(s)',
      '  first',
      '  (warning) second',
      '  third',
    ].join('\n'),
  );
});

test('renderFindings heads an all-warning banner with a tick, not a cross', () => {
  assert.equal(
    renderFindings('check:demo', [{ message: 'meh', severity: 'warning' }]),
    ['✓ check:demo — 1 warning(s)', '  (warning) meh'].join('\n'),
  );
});

test('renderFindings keeps the findings in the order the check returned them', () => {
  const lines = renderFindings('check:demo', [
    { message: 'b', severity: 'warning' },
    { message: 'a' },
  ]).split('\n');
  assert.deepEqual(lines.slice(1), ['  (warning) b', '  a']);
});

// ── the exit code ────────────────────────────────────────────────────────────

test('exitCodeFor fails on an error and passes on a warning', () => {
  assert.equal(exitCodeFor([]), 0);
  assert.equal(exitCodeFor([{ message: 'meh', severity: 'warning' }]), 0);
  assert.equal(exitCodeFor([{ message: 'bad' }]), 1);
  assert.equal(exitCodeFor([{ message: 'bad', severity: 'error' }]), 1);
  assert.equal(exitCodeFor([{ message: 'meh', severity: 'warning' }, { message: 'bad' }]), 1);
});

test('isError treats an unstated severity as an error', () => {
  assert.equal(isError({ message: 'bad' }), true);
  assert.equal(isError({ message: 'bad', severity: 'error' }), true);
  assert.equal(isError({ message: 'meh', severity: 'warning' }), false);
});

// ── the entry point ──────────────────────────────────────────────────────────

/** Run `main` with an argv of our choosing, and put the real one back. */
function withArgv(argv, body) {
  const real = process.argv;
  process.argv = argv;
  try {
    return body();
  } finally {
    process.argv = real;
  }
}

/**
 * The gate ends in `process.exit`, which would take this test file with it, so
 * in-process the gate is represented by a `run` that throws: reaching it is a
 * throw, and not reaching it is a return.
 */
const GATE = () => {
  throw new Error('the gate ran');
};

const AS_SCRIPT = path.join(__dirname, 'pretend-check.mjs');
const AS_URL = pathToFileURL(AS_SCRIPT).href;

test('main does nothing at all when the module was imported, flags and all', () => {
  const called = [];
  withArgv(['node', path.join(__dirname, 'harness-runner.mjs'), '--list'], () =>
    main(AS_URL, 'check:demo', {
      run: GATE,
      flags: { '--list': () => called.push('--list') },
    }),
  );
  assert.deepEqual(called, [], 'the runner imports a check and must reach neither branch');
});

test('main dispatches a side flag instead of the gate', () => {
  const called = [];
  withArgv(['node', AS_SCRIPT, '--list'], () =>
    main(AS_URL, 'check:demo', {
      run: GATE,
      flags: { '--list': () => called.push('--list') },
    }),
  );
  assert.deepEqual(called, ['--list'], 'one branch or the other — the gate does not also run');
});

test('main dispatches the first declared flag when two are typed', () => {
  const called = [];
  withArgv(['node', AS_SCRIPT, '--report', '--update'], () =>
    main(AS_URL, 'check:demo', {
      run: GATE,
      flags: {
        '--update': () => called.push('--update'),
        '--report': () => called.push('--report'),
      },
    }),
  );
  assert.deepEqual(called, ['--update'], 'declaration order decides, so the file reads as the rule');
});

test('main runs the gate when the flag typed is not one this check offers', () => {
  assert.throws(
    () =>
      withArgv(['node', AS_SCRIPT, '--other'], () =>
        main(AS_URL, 'check:demo', { run: GATE, flags: { '--list': () => {} } }),
      ),
    /the gate ran/,
    'an unknown flag is not a side door',
  );
});

// ── the fall-through slot ────────────────────────────────────────────────────
//
// The distinction the whole slot exists for: a fall-through flag prints or
// writes and the GATE STILL RUNS, so the exit code is still the findings'.
// Dropping one of those into `flags` makes it terminal and stops the check
// gating — green, quietly, for whoever typed it (#609's warning, #610's slot).

test('main runs a fall-through flag AND THEN the gate', () => {
  const called = [];
  assert.throws(
    () =>
      withArgv(['node', AS_SCRIPT, '--report'], () =>
        main(AS_URL, 'check:demo', {
          run: GATE,
          fallThrough: { '--report': () => called.push('--report') },
        }),
      ),
    /the gate ran/,
    'a fall-through flag is not a side door out of the gate',
  );
  assert.deepEqual(called, ['--report']);
});

test('main runs every fall-through flag that was typed, in declaration order', () => {
  const called = [];
  assert.throws(
    () =>
      withArgv(['node', AS_SCRIPT, '--how', '--table'], () =>
        main(AS_URL, 'check:demo', {
          run: GATE,
          fallThrough: {
            '--table': () => called.push('--table'),
            '--how': () => called.push('--how'),
          },
        }),
      ),
    /the gate ran/,
  );
  assert.deepEqual(called, ['--table', '--how'], 'both ran, and the file order is the rule');
});

test('main runs the fall-through flags before a terminal one', () => {
  const called = [];
  withArgv(['node', AS_SCRIPT, '--report', '--update'], () =>
    main(AS_URL, 'check:demo', {
      run: GATE,
      fallThrough: { '--report': () => called.push('--report') },
      flags: { '--update': () => called.push('--update') },
    }),
  );
  assert.deepEqual(called, ['--report', '--update'], 'print, then write — the order its reader has');
});

test('main reaches no flag of either kind when the module was imported', () => {
  const called = [];
  withArgv(['node', path.join(__dirname, 'harness-runner.mjs'), '--report'], () =>
    main(AS_URL, 'check:demo', {
      run: GATE,
      fallThrough: { '--report': () => called.push('--report') },
    }),
  );
  assert.deepEqual(called, [], 'the runner imports a check and must reach nothing');
});

// ── the entry comparison ─────────────────────────────────────────────────────

test('isEntry says yes only for the module that is the process', () => {
  assert.equal(withArgv(['node', AS_SCRIPT], () => isEntry(AS_URL)), true);
  assert.equal(
    withArgv(['node', path.join(__dirname, 'harness-runner.mjs')], () => isEntry(AS_URL)),
    false,
  );
  assert.equal(withArgv(['node'], () => isEntry(AS_URL)), false, 'no argv[1] is not an entry');
});

test('isEntry matches a path holding a space, which the string form never did', () => {
  const dir = path.join(os.tmpdir(), 'a dir with spaces');
  const file = path.join(dir, 'pretend-check.mjs');
  assert.equal(
    withArgv(['node', file], () => isEntry(pathToFileURL(file).href)),
    true,
    'the URL form percent-encodes the space, so both sides must be URLs',
  );
  assert.notEqual(pathToFileURL(file).href, `file://${file}`, 'which is why `file://${argv[1]}` failed');
});

test('main takes the script path itself for a flag name from no one', () => {
  assert.throws(
    () =>
      withArgv(['node', AS_SCRIPT], () =>
        main(AS_URL, 'check:demo', { run: GATE, flags: { [AS_SCRIPT]: () => {} } }),
      ),
    /the gate ran/,
    'the flags are read from argv[2] on, not from the whole line',
  );
});

/**
 * The gating path ends in `process.exit`, so it is asserted from outside: a
 * throwaway check in a temp directory, run as the process, the way CI runs one.
 */
function runPretendCheck(source, argv = []) {
  // realpath, because macOS hands out /var/folders/… for a temp dir and Node
  // resolves `import.meta.url` through the symlink to /private/var/… — the two
  // spellings of the same file would not compare equal.
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'findings-')));
  const file = path.join(dir, 'pretend-check.mjs');
  fs.writeFileSync(file, source.replace('FINDINGS_MODULE', pathToFileURL(path.join(__dirname, 'findings.mjs')).href));
  try {
    const stdout = execFileSync(process.execPath, [file, ...argv], { encoding: 'utf8' });
    return { code: 0, stdout, stderr: '' };
  } catch (error) {
    return { code: error.status, stdout: error.stdout, stderr: error.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const PRETEND = `
import { main } from 'FINDINGS_MODULE';
const bad = process.argv.includes('--fail');
main(import.meta.url, 'check:demo', {
  run: () => (bad ? [{ file: 'a.css', line: 3, message: 'bad' }] : []),
  summary: () => 'nothing to see',
  remedy: 'do this',
  flags: { '--list': () => console.log('listed') },
  fallThrough: { '--report': () => console.log('reported') },
});
`;

test('main as the process: a clean run prints the summary to stdout and exits 0', () => {
  const { code, stdout, stderr } = runPretendCheck(PRETEND);
  assert.equal(code, 0);
  assert.equal(stdout, '✓ check:demo — nothing to see\n');
  assert.equal(stderr, '');
});

test('main as the process: findings go to stderr, with the remedy, and exit 1', () => {
  const { code, stdout, stderr } = runPretendCheck(PRETEND, ['--fail']);
  assert.equal(code, 1);
  assert.equal(stdout, '');
  assert.match(stderr, /^✗ check:demo — 1 finding\(s\)\n {2}a\.css:3 {2}bad\n/);
  assert.match(stderr, /do this\n$/);
});

test('main as the process: a side flag prints its own thing and exits 0', () => {
  const { code, stdout } = runPretendCheck(PRETEND, ['--list', '--fail']);
  assert.equal(code, 0, 'a flag that prints gates nothing, even over a failing tree');
  assert.equal(stdout, 'listed\n');
});

test('main as the process: a fall-through flag prints and STILL FAILS on a red tree', () => {
  const { code, stdout, stderr } = runPretendCheck(PRETEND, ['--report', '--fail']);
  assert.equal(code, 1, 'a flag that prints and falls through must not turn a red check green');
  assert.equal(stdout, 'reported\n');
  assert.match(stderr, /✗ check:demo — 1 finding\(s\)/);
});

test('main as the process: the same flag in the terminal slot would have gone green', () => {
  const { code } = runPretendCheck(
    `
    import { main } from 'FINDINGS_MODULE';
    main(import.meta.url, 'check:demo', {
      run: () => [{ message: 'bad' }],
      flags: { '--report': () => console.log('reported') },
    });
    `,
    ['--report'],
  );
  assert.equal(code, 0, 'which is exactly the defect the two slots exist to keep apart');
});

test('main as the process: the summary thunk is not called on the failing path', () => {
  const { code, stderr } = runPretendCheck(
    `
    import { main } from 'FINDINGS_MODULE';
    main(import.meta.url, 'check:demo', {
      run: () => [{ message: 'bad' }],
      summary: () => { throw new Error('the green line was computed on a red run'); },
    });
    `,
    [],
  );
  assert.equal(code, 1);
  assert.match(stderr, /✗ check:demo — 1 finding\(s\)/);
});
