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
import { execFileSync } from 'child_process';

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

/** The bundled set, read from the bundler rather than restated here. */
function bundledFiles() {
  const out = execFileSync('node', [path.join(REPO_ROOT, 'agents/uno-bot/scripts/bundle-harness.mjs'), '--check'], {
    cwd: path.join(REPO_ROOT, 'agents/uno-bot'),
    encoding: 'utf8',
    // the bundler's own warnings are its business, not this check's output
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (!/--check OK/.test(out)) throw new Error('bundle is stale — run `npm run bundle:harness` first');

  const ts = fs.readFileSync(path.join(REPO_ROOT, 'agents/uno-bot/src/generated/harness.ts'), 'utf8');
  const assembled = JSON.parse(ts.slice(ts.indexOf('= ') + 2, ts.lastIndexOf(';')));
  // AGENTS.md is member 0 and carries no path comment of its own.
  return ['AGENTS.md', ...[...assembled.matchAll(/<!-- ([\w/.-]+\.md) -->/g)].map((m) => m[1])];
}

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
