/**
 * Who is in the bundled harness, asked of the bundler itself.
 *
 * Membership is a property of a document — each one declares
 * `embodiment: all | ide | uno-bot` and `agents/uno-bot/scripts/bundle-harness.mjs`
 * globs for it (#159). A guard that wants the bundled set therefore has exactly
 * two honest options: re-derive the glob, or ask the bundler. Re-deriving is a
 * second list that can disagree with the first, which is the failure #159
 * deleted; so this asks the bundler, and reads the answer off the artifact the
 * bundler actually produced.
 *
 * IT LIVES HERE BECAUSE TWO GUARDS NEED IT. `check:negation` (#155) asked this
 * question first and `check:skill-overlap` (#174) is the second to ask it. A
 * copy of the spawn-and-parse below in each script would be the same defect the
 * overlap guard exists to catch — one rule, two homes — one level down, in the
 * tooling instead of the prose.
 *
 * A STALE BUNDLE STOPS THE CALLER. `--check` exits non-zero when the committed
 * artifact is behind, a char budget is blown, or a doc declares no
 * `embodiment`. None of those is a finding of the calling guard, and reporting
 * them as one is what #204 fixed — so the failure path is a report that says
 * whose problem it is, not an exception.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');

const BUNDLER = path.join(REPO_ROOT, 'agents/uno-bot/scripts/bundle-harness.mjs');
const REBUNDLE = 'npm --prefix agents/uno-bot run bundle:harness';
const HARNESS_TS = path.join(REPO_ROOT, 'agents/uno-bot/src/generated/harness.ts');

/**
 * What the reader is owed when the bundler exits non-zero.
 *
 * This is not the calling guard's finding, and it used to read as one: the
 * child's non-zero exit escaped as an `execFileSync` throw, so `check:harness`
 * printed `✗ check:negation` over a Node stack trace while the bundler's own
 * diagnostic — which artifact is behind, by how many chars — went to
 * `stdio: ignore` and was never seen (#204). `scripts/generate-agent.js` fixed
 * the same shape in #191; this is that pattern, with the child's stderr relayed
 * because the callers silence it on the happy path.
 *
 * Pure so the message can be asserted without a stale bundle to hand — see
 * `check-negation-ratchet.test.mjs`.
 *
 * @param {{status: number|null, signal?: string|null, stderr?: string}} child
 * @param {{tag?: string, notThis?: string}} [caller] how the calling guard names
 *   itself in the log, and the name of ITS measurement — so the reassurance
 *   below ("nothing is wrong with X") points at the right number.
 * @returns {string} the whole report, ready for stderr.
 */
export function bundlerFailureReport({ status, signal, stderr }, caller = {}) {
  const { tag = 'negation', notThis = 'the prohibition count' } = caller;
  const said = (stderr ?? '').trimEnd();
  // `--check` exits non-zero for a STALE artifact, a blown char budget, or a doc
  // with no `embodiment:` — so the headline names the cause it usually is and
  // then gets out of the way. The bundler's own line below says which.
  const how = signal ? `was killed by ${signal}` : `exited ${status ?? 1}`;
  return (
    `[${tag}] the harness bundler failed, so this check could not read the bundled set\n` +
    `  — usually a STALE bundle. Its own diagnostic:\n\n` +
    (said || `  (the bundler ${how} without printing anything)`) +
    `\n\n  -> Nothing is wrong with ${notThis}: the bundler ${how}, so the list of\n` +
    `     bundled docs was never available and not one doc was counted. If the bundle is\n` +
    `     stale, regenerate it, commit it, and re-run this check:\n` +
    `       ${REBUNDLE}`
  );
}

/**
 * The bundled set, in load order, as repo-relative paths.
 *
 * `spawnSync` rather than `execFileSync`: the failure path is a report, not an
 * exception, and the child's stderr is the substance of it.
 *
 * @param {{tag?: string, notThis?: string}} [caller] see `bundlerFailureReport`.
 * @returns {string[]}
 */
export function bundledFiles(caller = {}) {
  const { tag = 'negation' } = caller;
  const child = spawnSync('node', [BUNDLER, '--check'], {
    cwd: path.join(REPO_ROOT, 'agents/uno-bot'),
    encoding: 'utf8',
    // the bundler's own warnings are its business on the happy path — but its
    // stderr is captured rather than discarded, because on failure it is the
    // only thing worth printing.
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (child.error) {
    // Its own branch, because a bundler that could not START says nothing about
    // whether the bundle is stale, and borrowing the staleness wording here
    // would trade one misleading diagnostic for another.
    console.error(
      `[${tag}] could not run the harness bundler, so this check could not read the\n` +
        `  bundled set: ${child.error.message}\n` +
        `  -> ${BUNDLER}`,
    );
    process.exit(1);
  }
  if (child.status !== 0) {
    console.error(bundlerFailureReport(child, caller));
    // The child's own code, as in #191 — this layer adds a diagnosis, not a
    // verdict of its own.
    process.exit(typeof child.status === 'number' ? child.status : 1);
  }
  if (!/--check OK/.test(child.stdout ?? '')) {
    // Belt and braces, kept from the throw this replaced: a zero exit with no OK
    // line means the bundler changed under us, and measuring against a set it
    // did not confirm is worse than stopping.
    console.error(
      `[${tag}] the harness bundler exited 0 without confirming the bundle, so this check\n` +
        `  is measuring against a set it cannot vouch for. Run it directly to see why:\n` +
        `    ${REBUNDLE} -- --check`,
    );
    process.exit(1);
  }

  const ts = fs.readFileSync(HARNESS_TS, 'utf8');
  const assembled = JSON.parse(ts.slice(ts.indexOf('= ') + 2, ts.lastIndexOf(';')));
  // AGENTS.md is member 0 and carries no path comment of its own.
  return ['AGENTS.md', ...[...assembled.matchAll(/<!-- ([\w/.-]+\.md) -->/g)].map((m) => m[1])];
}
