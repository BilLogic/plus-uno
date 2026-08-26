/**
 * Negation ratchet over the bundled harness.
 *
 * Steering by prohibition drags the forbidden behaviour into context and makes
 * it MORE available, not less — "don't think of an elephant". The fix is to
 * prompt the positive: state the target behaviour so the banned one is never
 * spoken. A prohibition earns its place only as a hard guardrail that cannot be
 * phrased positively, and even then it should carry its positive twin.
 *
 * This is a RATCHET, not a threshold. A threshold invites arguing about the
 * number and gets switched off the day it blocks someone; a ratchet only asks
 * that the count go down. Same pattern as the a11y baseline (#152): a corpus
 * too large to fix at once still gets a binding direction.
 *
 * Scope is the bundled set only — those docs cost context on every single turn,
 * which is the load this is about. IDE-side docs load on demand and are not
 * counted.
 *
 * Usage:
 *   node scripts/check-negation-ratchet.mjs           report, fail if the count rose
 *   node scripts/check-negation-ratchet.mjs --update  record the current count as the new baseline
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BASELINE = path.join(REPO_ROOT, 'docs/evals/negation-baseline.json');
const UPDATE = process.argv.includes('--update');

/**
 * A prohibition is an imperative ban. Quoted speech is exempt: `Say "I don't
 * know"` is an instruction TO do something, and counting it would push authors
 * toward removing the honesty rule to satisfy the guard.
 */
const PROHIBITION = /\b(never|don't|do not|cannot|must not)\b/gi;
const stripQuoted = (text) => text.replace(/"[^"\n]*"/g, '""').replace(/`[^`\n]*`/g, '``');

const BUNDLER = path.join(REPO_ROOT, 'agents/uno-bot/scripts/bundle-harness.mjs');
const REBUNDLE = 'npm --prefix agents/uno-bot run bundle:harness';

/**
 * What the reader is owed when the bundler exits non-zero.
 *
 * This check cannot see the bundled set without the bundler, so a stale bundle
 * stops it before a single prohibition is counted. That is not a ratchet
 * failure, and it used to read as one: the child's non-zero exit escaped as an
 * `execFileSync` throw, so `check:harness` printed `✗ check:negation` over a
 * Node stack trace while the bundler's own diagnostic — which artifact is
 * behind, by how many chars — went to `stdio: ignore` and was never seen
 * (#204). `scripts/generate-agent.js` fixed the same shape in #191; this is
 * that pattern, with the child's stderr relayed because this check silences it
 * on the happy path.
 *
 * Pure so the message can be asserted without a stale bundle to hand — see
 * `check-negation-ratchet.test.mjs`.
 *
 * @param {{status: number|null, signal?: string|null, stderr?: string}} child
 * @returns {string} the whole report, ready for stderr.
 */
export function bundlerFailureReport({ status, signal, stderr }) {
  const said = (stderr ?? '').trimEnd();
  // `--check` exits non-zero for a STALE artifact, a blown char budget, or a doc
  // with no `embodiment:` — so the headline names the cause it usually is and
  // then gets out of the way. The bundler's own line below says which.
  const how = signal ? `was killed by ${signal}` : `exited ${status ?? 1}`;
  return (
    `[negation] the harness bundler failed, so this check could not read the bundled set\n` +
    `  — usually a STALE bundle. Its own diagnostic:\n\n` +
    (said || `  (the bundler ${how} without printing anything)`) +
    `\n\n  -> Nothing is wrong with the prohibition count: the bundler ${how}, so the list of\n` +
    `     bundled docs was never available and not one doc was counted. If the bundle is\n` +
    `     stale, regenerate it, commit it, and re-run this check:\n` +
    `       ${REBUNDLE}`
  );
}

/**
 * The bundled set, read from the bundler rather than restated here.
 *
 * `spawnSync` rather than `execFileSync`: the failure path is a report, not an
 * exception, and the child's stderr is the substance of it.
 */
function bundledFiles() {
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
      `[negation] could not run the harness bundler, so this check could not read the\n` +
        `  bundled set: ${child.error.message}\n` +
        `  -> ${BUNDLER}`,
    );
    process.exit(1);
  }
  if (child.status !== 0) {
    console.error(bundlerFailureReport(child));
    // The child's own code, as in #191 — this layer adds a diagnosis, not a
    // verdict of its own.
    process.exit(typeof child.status === 'number' ? child.status : 1);
  }
  if (!/--check OK/.test(child.stdout ?? '')) {
    // Belt and braces, kept from the throw this replaced: a zero exit with no OK
    // line means the bundler changed under us, and counting against a set it did
    // not confirm is worse than stopping.
    console.error(
      `[negation] the harness bundler exited 0 without confirming the bundle, so this check\n` +
        `  is counting against a set it cannot vouch for. Run it directly to see why:\n` +
        `    ${REBUNDLE} -- --check`,
    );
    process.exit(1);
  }

  const ts = fs.readFileSync(path.join(REPO_ROOT, 'agents/uno-bot/src/generated/harness.ts'), 'utf8');
  const assembled = JSON.parse(ts.slice(ts.indexOf('= ') + 2, ts.lastIndexOf(';')));
  // AGENTS.md is member 0 and carries no path comment of its own.
  return ['AGENTS.md', ...[...assembled.matchAll(/<!-- ([\w/.-]+\.md) -->/g)].map((m) => m[1])];
}

/**
 * The check itself.
 *
 * Wrapped so the module can be imported for `bundlerFailureReport` without
 * running a ratchet — and, more to the point, without a stale bundle taking the
 * test run down with a `process.exit` at import time. Same guard as
 * `check-storybook.mjs`.
 */
function main() {
  const counts = {};
  let total = 0;
  for (const rel of bundledFiles()) {
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const n = (stripQuoted(fs.readFileSync(abs, 'utf8')).match(PROHIBITION) || []).length;
    if (n) counts[rel] = n;
    total += n;
  }

  if (UPDATE) {
    fs.writeFileSync(BASELINE, `${JSON.stringify({ total, counts }, null, 2)}\n`);
    console.log(`[negation] baseline recorded: ${total} prohibitions across ${Object.keys(counts).length} bundled docs`);
    process.exit(0);
  }

  if (!fs.existsSync(BASELINE)) {
    console.error('[negation] no baseline — run `npm run check:negation -- --update` once to record it.');
    process.exit(1);
  }

  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const worst = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  if (total > base.total) {
    const risen = Object.entries(counts)
      .filter(([f, n]) => n > (base.counts[f] ?? 0))
      .map(([f, n]) => `  ${f}: ${base.counts[f] ?? 0} -> ${n}`);
    console.error(
      `[negation] prohibitions in the bundled harness rose ${base.total} -> ${total}.\n` +
        risen.join('\n') +
        '\n  -> state the target behaviour instead of banning its opposite. A ban that is a real\n' +
        '     guardrail keeps its place, but pair it with the positive so attention lands on\n' +
        '     what to do. If the rise is deliberate, re-baseline with `--update` and say why.',
    );
    process.exit(1);
  }

  console.log(
    `[negation] ${total} prohibitions in the bundled harness (baseline ${base.total})` +
      (total < base.total ? ` — down ${base.total - total}, re-baseline with --update` : '') +
      `\n  heaviest: ${worst.map(([f, n]) => `${f} (${n})`).join(' · ')}`,
  );
}

// Importing this module for its exports must not run the check.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
