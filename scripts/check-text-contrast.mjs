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
import { AA_TEXT, PAGE_TOKEN } from './button-contrast.mjs';
import { REPO_ROOT } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import {
  census,
  findings,
  keyOf,
  ratchetFailures,
  readValues,
  stylesheets,
  textDeclarations,
} from './text-contrast.mjs';

/**
 * The record, named here because this is the check that reads it — and because
 * it is the key its shape is declared under in `scripts/lib/ratchet-shapes.mjs`
 * and the path `scripts/checks.registry.mjs` declares for this row. One
 * spelling, three readers.
 */
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

/**
 * What the run measured, in the record's own shape — one object, because
 * `failures`, `stale` and `--update` are three questions about the same
 * measurement and the ratchet reads both sides on the same declared form.
 */
const measured = byRoot((repoRoot) => {
  const { found, counts } = inputs(repoRoot);
  return Object.fromEntries(found.map((finding) => {
    const key = keyOf(finding);
    return [key, { count: counts[key], ratio: finding.ratio }];
  }));
});

const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const ratchet = ratchetFor(repoRoot);
  const found = measured(repoRoot);

  const reported = ratchetFailures(ratchet.failures(found), ratchet.stale(found))
    .map((message) => ({ message }));

  // An entry recorded with the placeholder reason is a run where somebody
  // pressed `--update` and skipped the only step that mattered. It fails on its
  // own, separately from the ratchet, because nothing about the counts is wrong.
  const unreviewed = ratchet.unreviewed();
  if (unreviewed.length) {
    reported.push({
      message:
        `${unreviewed.length} baseline entr${unreviewed.length === 1 ? 'y has' : 'ies have'} ` +
        `no reason:\n${unreviewed.map(({ key }) => `  ${key}`).join('\n')}\n` +
        '  --update records the finding; only a person can record why it is allowed to stand.',
    });
  }
  return reported;
}

/** The green line: the size of the sweep, and how much of it is recorded. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { files, uses, found } = inputs(repoRoot);
  const distinct = new Set(uses.map((u) => u.token)).size;
  return (
    `${uses.length} color: declarations across ${files.length} stylesheets, ` +
    `${distinct} distinct tokens. ${found.length} below AA ${AA_TEXT}:1, all recorded with a reason ` +
    `(${ratchetFor(repoRoot).entries.size} entries).`
  );
}

/**
 * `--update` re-records the baseline. A WRITE, so it stays out of `run` — and a
 * MERGE, so the record's envelope survives it: the ratchet replaces the
 * `findings` container and writes the rest of the record back untouched, and a
 * reason already recorded is carried across rather than restated.
 */
function update(repoRoot = REPO_ROOT) {
  const written = ratchetFor(repoRoot).update(measured(repoRoot), {
    seed: { measured: `AA ${AA_TEXT}:1, ground from each rule, page fallback ${PAGE_TOKEN}` },
  });
  console.log(`[text-contrast] wrote ${written.entries} entries to ${written.file}`);
}

// `--update` writes and stops, which is what makes it a TERMINAL flag and lets
// it sit in `main`'s flags slot (#609) rather than hand-rolling the entry-point
// comparison beside it. The gate never runs on the same invocation: the CLI is
// one branch or the other.
main(import.meta.url, 'check:text-contrast', {
  run,
  summary,
  remedy: REMEDY,
  flags: { '--update': () => update() },
});
