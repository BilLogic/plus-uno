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
 * WHETHER THAT SHOULD CHANGE, re-argued 2026-08-26 (#174). The original reason
 * to stop at the bundle was cost: an IDE doc is paid for only when loaded, so a
 * ratchet over it buys less. That reason is now weak — `check:harness` runs on
 * every PR, so an IDE-side ratchet costs a contributor nothing at authoring
 * time. Two BETTER reasons took its place, and both are about what a ratchet
 * can measure rather than what it is worth measuring:
 *
 *   - `docs/adr/` is append-only. An ADR is what a hard-to-reverse call leaves
 *     behind (`AGENTS.md` § Knowledge), and a new one that records "X is not
 *     reversible" ADDS prohibitions by doing its job. A ratchet over an
 *     append-only corpus goes up by construction, and a ratchet re-baselined on
 *     every append is a counter with extra steps. 25 ADRs carry 26 today.
 *   - The six `.claude/skills/<name>/SKILL.md` are generated from their sources
 *     (`scripts/generate-uno-skill-surfaces.mjs`), so their 14 prohibitions are
 *     copies of ones already counted. Counting both double-counts, and the fix
 *     would land in a file whose header says not to edit it.
 *
 * So the recommendation is YES, but narrowed: the 48 hand-authored IDE docs —
 * the six `SKILL.md` faces, `skills/<name>/references/`, `docs/conventions/`,
 * `docs/engineering/` — carrying 108 prohibitions, with `docs/adr/` and every
 * generated surface excluded by rule rather than by list. Shape it as this
 * script with a second scope and a second total in the same baseline file, the
 * way `check:skill-overlap` grew its bundle scope in #174 — one guard, two
 * corpora, so the two can never disagree about the corpus they share. Not built
 * here: #174 shipped the overlap extension and left this measured, not coded.
 *
 * Usage:
 *   node scripts/check-negation-ratchet.mjs           report, fail if the count rose
 *   node scripts/check-negation-ratchet.mjs --update  record the current count as the new baseline
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { bundlerFailureReport, bundledFiles as readBundledFiles } from './lib/bundled-set.mjs';

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

/**
 * The bundled set, and what to say when it cannot be read, both live in
 * `scripts/lib/bundled-set.mjs` — `check:skill-overlap` asks the same question
 * (#174) and one copy of the answer is the whole point of that guard.
 *
 * Re-exported so this module stays the import site its own tests already use.
 */
export { bundlerFailureReport };

const bundledFiles = () => readBundledFiles({ tag: 'negation', notThis: 'the prohibition count' });

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
