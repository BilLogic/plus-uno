#!/usr/bin/env node
/**
 * check:text-contrast — every `color:` in the design system's stylesheets,
 * measured against the ground its own rule puts it on (#268).
 *
 * WHY IT IS NOT `check:button-contrast`. That check reads the Button theme MAP
 * — a generator — and sweeps everything it can produce. This reads arbitrary
 * `color:` declarations, which no generator produces and no story necessarily
 * renders. `--color-warning` is 3.52:1 on the page, below AA's 4.5:1, and was
 * the declared text colour in seven places: a form tag, two status icons, a
 * table cell, a select, a button-container message, and a `.color-warning`
 * utility class anyone could reach for. Nothing rendered any of them in a
 * story, so the a11y ratchet never measured one. `--color-warning-text`
 * (#5b4a00, 8.24:1) has been in the token file the whole time.
 *
 * WHY IT IS A RATCHET AND NOT A THRESHOLD. Because the first run proved it has
 * to be. Of 18 findings left after the seven fixes, the kinds are:
 *
 *   EXEMPT        eight inactive table sort arrows. WCAG 1.4.11 exempts
 *                 inactive components outright, and their `&--active` state is
 *                 `--color-secondary`. Not defects; unrecognisable as such from
 *                 a stylesheet.
 *   UNKNOWN       a snackbar header whose background is set by a child modifier
 *                 (`&--created`), and a carousel control on `--color-scrim`
 *                 over a photograph. Both real; neither measurable here.
 *   DECISION      `--color-on-warning` on `--color-warning` at 3.7:1 — already
 *                 recorded in `docs/evals/button-contrast-baseline.json` as an
 *                 open #268 token question. The same fact, reached twice.
 *   MARGINAL      `--color-primary` at 4.46:1 on its own 8% state layer, and
 *                 `--color-outline` at 4.26:1. Real, and a hair under.
 *
 * Failing the build on someone else's open question is how a check gets
 * switched off (`scripts/check-harness.mjs` § rule 2). So each is recorded with
 * its reason, the count may shrink and never grow, and a recorded entry that
 * stops failing is reported so a fix cannot leave its exemption behind.
 *
 * Re-baseline with `--update` after reading every line of the diff.
 *
 * Run: `npm run check:text-contrast`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { AA_TEXT, PAGE_TOKEN } from './button-contrast.mjs';
import { byRoot, main } from './lib/findings.mjs';
import {
  census,
  findings,
  keyOf,
  ratchetFailures,
  readValues,
  stylesheets,
  textDeclarations,
} from './text-contrast.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BASELINE = 'docs/evals/text-contrast-baseline.json';

/**
 * The paragraph `scripts/text-contrast.mjs` closed its own report with, kept
 * here because it is the remedy and the renderer prints remedies. The mistake it
 * heads off is the tempting one: moving a declaration until the check stops
 * seeing the ground, which changes nothing a reader can see.
 */
export const REMEDY =
  `  A ground is read from the declaration's OWN rule. One set by an ancestor is\n` +
  `  invisible here — if that is what happened, the check is wrong and should learn\n` +
  `  the ground; do not silence it by moving the declaration.`;

/**
 * The token values, the stylesheet sweep and the contrast maths over it — once
 * per repo root. 646 declarations across 158 stylesheets, and `run`, `summary`
 * and `--update` all want the same census of them.
 */
const inputs = byRoot((repoRoot) => {
  const values = readValues(repoRoot);
  const files = stylesheets(repoRoot);
  const uses = textDeclarations(files, repoRoot);
  const found = findings(uses, values);
  return { values, files, uses, found, counts: census(found) };
});

const baselineOf = (repoRoot) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, BASELINE), 'utf8')).findings;

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { counts } = inputs(repoRoot);
  const baseline = baselineOf(repoRoot);

  const found = ratchetFailures(counts, baseline).map((message) => ({ message }));

  // An entry recorded with the placeholder reason is a run where somebody
  // pressed `--update` and skipped the only step that mattered. It fails on its
  // own, separately from the ratchet, because nothing about the counts is wrong.
  const unreviewed = Object.entries(baseline).filter(([, entry]) => entry.why.startsWith('UNREVIEWED'));
  if (unreviewed.length) {
    found.push({
      message:
        `${unreviewed.length} baseline entr${unreviewed.length === 1 ? 'y has' : 'ies have'} ` +
        `no reason:\n${unreviewed.map(([k]) => `  ${k}`).join('\n')}\n` +
        '  --update records the finding; only a person can record why it is allowed to stand.',
    });
  }
  return found;
}

/** The green line: the size of the sweep, and how much of it is recorded. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { files, uses, found } = inputs(repoRoot);
  const distinct = new Set(uses.map((u) => u.token)).size;
  return (
    `${uses.length} color: declarations across ${files.length} stylesheets, ` +
    `${distinct} distinct tokens. ${found.length} below AA ${AA_TEXT}:1, all recorded with a reason ` +
    `(${Object.keys(baselineOf(repoRoot)).length} entries).`
  );
}

/** `--update` re-records the baseline. A write, so it stays out of `run`. */
function update(repoRoot = REPO_ROOT) {
  const { found, counts } = inputs(repoRoot);
  const existing = fs.existsSync(path.join(repoRoot, BASELINE))
    ? JSON.parse(fs.readFileSync(path.join(repoRoot, BASELINE), 'utf8')).findings
    : {};
  const next = {};
  for (const finding of found) {
    const key = keyOf(finding);
    next[key] = {
      count: counts[key],
      ratio: finding.ratio,
      // A reason is never invented by the tool. A new entry gets a placeholder
      // that says so, and a run whose baseline still contains one is a run
      // where somebody skipped the only step that matters.
      why: existing[key]?.why ?? 'UNREVIEWED — replace with the reason this is not a defect, or fix it.',
    };
  }
  fs.writeFileSync(
    path.join(repoRoot, BASELINE),
    `${JSON.stringify({ measured: `AA ${AA_TEXT}:1, ground from each rule, page fallback ${PAGE_TOKEN}`, findings: next }, null, 2)}\n`,
  );
  console.log(`[text-contrast] wrote ${Object.keys(next).length} entries to ${BASELINE}`);
}

// `--update` writes a file, so it belongs to the CLI and not to `run` — and it
// runs only when this module IS the process, never when the runner imports it.
// The CLI is one branch or the other. A side flag prints (or writes) instead of
// gating, so the gate does not also run; `main()` re-checks the entry guard for
// itself, which is what keeps an import of this module reaching neither.
if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url &&
  process.argv.includes('--update')
) {
  update();
} else {
  main(import.meta.url, 'check:text-contrast', { run, summary, remedy: REMEDY });
}
