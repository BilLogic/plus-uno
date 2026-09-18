/**
 * The fall-through side flags, asserted on the real checks.
 *
 * WHY THIS IS SEPARATE FROM `findings.test.mjs`. That file asserts what the two
 * slots DO, over a pretend check in a temp directory. This one asserts which
 * slot each real flag is IN, which is the decision #609 warned about and #610
 * made: `--report` on the two fallback checks, `--table` and `--how` on the
 * benchmark and `--stats` on the identifier sweep all print and then FALL
 * THROUGH, so the exit code is still the findings'. Moved into the terminal
 * `flags` map each of them still prints, still exits 0 — and stops the check
 * gating, silently, for whoever typed the flag. Nothing about the printed
 * output would change, so only the exit code and the banner can catch it.
 *
 * So each case runs the check twice, by hand the way a person does: once plain
 * and once with the flag, and asserts that the flag added its own output and
 * changed NOTHING about the verdict — same banner, same exit code.
 *
 * `--update` on `check:glossary` is the fifth fall-through flag and is not here:
 * it WRITES the baseline, and a test that re-records a ratchet to prove it falls
 * through is a test that edits the repo it is checking.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * One by-hand run of a check, exit code and both streams, without throwing.
 *
 * Both streams go to a FILE rather than to a pipe. `report()` ends in
 * `process.exit`, and a write to a pipe is asynchronous: the 113 KB of JSON
 * `check:size-fallbacks -- --report` prints arrives truncated at the pipe
 * buffer, and the green line after it — the very thing this file asserts —
 * would be missing for a reason that has nothing to do with the flag. A file
 * descriptor is written synchronously, which is also why a terminal and a `>`
 * redirect both show the whole thing.
 */
function runCheck(script, argv = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'side-flags-'));
  const log = path.join(dir, 'out');
  const fd = fs.openSync(log, 'w');
  try {
    let code = 0;
    try {
      execFileSync(process.execPath, [path.join(REPO_ROOT, 'scripts', script), ...argv], {
        cwd: REPO_ROOT,
        stdio: ['ignore', fd, fd],
      });
    } catch (error) {
      code = error.status;
    }
    fs.closeSync(fd);
    return { code, out: fs.readFileSync(log, 'utf8') };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** The banner line the gate prints, whichever way it went. */
const bannerOf = (text, name) =>
  text.split('\n').find((line) => line.startsWith(`✓ ${name} —`) || line.startsWith(`✗ ${name} —`)) ?? null;

const CASES = [
  { name: 'check:colour-fallbacks', script: 'check-colour-fallbacks.mjs', flag: '--report', prints: /"disagreements"/ },
  { name: 'check:size-fallbacks', script: 'check-size-fallbacks.mjs', flag: '--report', prints: /"disagreements"/ },
  { name: 'check:atlassian-benchmark', script: 'check-atlassian-benchmark.mjs', flag: '--table', prints: /atlassian/ },
  { name: 'check:atlassian-benchmark', script: 'check-atlassian-benchmark.mjs', flag: '--how', prints: /Re-measuring/ },
  { name: 'check:doc-identifiers', script: 'check-doc-identifiers.mjs', flag: '--stats', prints: /^pages\s+\d+/m },
];

for (const { name, script, flag, prints } of CASES) {
  test(`${name} ${flag} prints, and then still gates`, () => {
    const plain = runCheck(script);
    const flagged = runCheck(script, [flag]);

    assert.match(flagged.out, prints, `${flag} printed nothing of its own`);
    assert.notEqual(bannerOf(flagged.out, name), null, `${flag} skipped the gate — it is in the terminal slot`);
    assert.equal(bannerOf(flagged.out, name), bannerOf(plain.out, name), 'the verdict must not depend on the flag');
    assert.equal(flagged.code, plain.code, 'nor the exit code');
  });
}
