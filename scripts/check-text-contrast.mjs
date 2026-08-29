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
import { fileURLToPath } from 'node:url';

import { AA_TEXT, PAGE_TOKEN } from './button-contrast.mjs';
import {
  census,
  findings,
  keyOf,
  ratchetFailures,
  readValues,
  report,
  stylesheets,
  textDeclarations,
} from './text-contrast.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BASELINE = 'docs/evals/text-contrast-baseline.json';

const values = readValues(REPO_ROOT);
const files = stylesheets(REPO_ROOT);
const uses = textDeclarations(files, REPO_ROOT);
const found = findings(uses, values);
const counts = census(found);

if (process.argv.includes('--update')) {
  const existing = fs.existsSync(path.join(REPO_ROOT, BASELINE))
    ? JSON.parse(fs.readFileSync(path.join(REPO_ROOT, BASELINE), 'utf8')).findings
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
    path.join(REPO_ROOT, BASELINE),
    `${JSON.stringify({ measured: `AA ${AA_TEXT}:1, ground from each rule, page fallback ${PAGE_TOKEN}`, findings: next }, null, 2)}\n`,
  );
  console.log(`[text-contrast] wrote ${Object.keys(next).length} entries to ${BASELINE}`);
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, BASELINE), 'utf8')).findings;
const failures = ratchetFailures(counts, baseline);
const unreviewed = Object.entries(baseline).filter(([, entry]) => entry.why.startsWith('UNREVIEWED'));

if (failures.length || unreviewed.length) {
  if (failures.length) {
    console.error(`[text-contrast] the baseline moved the wrong way:\n\n${failures.join('\n\n')}\n`);
  }
  if (unreviewed.length) {
    console.error(
      `[text-contrast] ${unreviewed.length} baseline entr${unreviewed.length === 1 ? 'y has' : 'ies have'} ` +
        `no reason:\n${unreviewed.map(([k]) => `  ${k}`).join('\n')}\n` +
        '  --update records the finding; only a person can record why it is allowed to stand.\n',
    );
  }
  console.error(report(found));
  process.exit(1);
}

const distinct = new Set(uses.map((u) => u.token)).size;
console.log(
  `[text-contrast] ${uses.length} color: declarations across ${files.length} stylesheets, ` +
    `${distinct} distinct tokens. ${found.length} below AA ${AA_TEXT}:1, all recorded with a reason ` +
    `(${Object.keys(baseline).length} entries).`,
);
