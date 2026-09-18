#!/usr/bin/env node
/**
 * check:button-contrast — every button the theme map generates is readable, and
 * no two styles render the same thing (#312).
 *
 * WHY THIS IS NOT COVERED BY `check:storybook`. The a11y ratchet measures what
 * the stories render. Nothing renders a filled `warning` button, so nothing has
 * ever measured one, and a 3.70:1 label has sat in the map for as long as the
 * map has existed. A theme map is a generator; the thing worth checking is
 * everything it generates, whether or not someone wrote a story for it.
 *
 * The duplicate assertion has no accessibility rule behind it at all. `info` is
 * `var(--color-tertiary)` — one line in the token file that makes two style
 * names render one appearance. No tool compares token values for equality,
 * because no tool knows they were meant to differ.
 *
 * WHY IT IS A RATCHET AND NOT A THRESHOLD. Both findings are colour-token
 * decisions (#268): does `--color-warning` need a darker filled variant, and
 * should `info` be re-pointed or merged? Neither is Button's to make, and
 * failing the build on someone else's open question would get the check turned
 * off. Recording them means the NEXT one fails loudly, which is the whole value.
 *
 * The baseline may shrink and must never grow. An entry that no longer fails is
 * reported, so a fix cannot be made and the entry quietly left behind.
 *
 * Run: `npm run check:button-contrast`.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { AA_TEXT, findings, measured, readRepo, sweep } from './button-contrast.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BASELINE = 'docs/evals/button-contrast-baseline.json';

export const REMEDY =
  '  -> A label under 4.5:1, or two styles that render the same ground. If the\n' +
  `     decision is not yours to make, record it in ${BASELINE}\n` +
  '     with the issue that owns it — and never as a way to make a new one quiet.';

// The token values and the theme map are the same read for both questions, so
// the sweep over them happens once per root.
const inputs = byRoot((repoRoot) => {
  const { values, themes } = readRepo(repoRoot);
  return { values, themes, rows: sweep(themes, values), side: measured(themes, values) };
});

/**
 * The record's two sets, on the shape `scripts/lib/ratchet-shapes.mjs` declares
 * (#600). Both keep their reasons in ONE sibling `notes` map, which is the
 * arrangement that makes a rebuilt record lose them — so the read and the sweep
 * over them are the module's and this file only words what they say.
 *
 * NO `--update`. The record's value IS the argument for each entry, and it is
 * maintained by hand for that reason: a flag that recorded a new finding and
 * stamped it UNREVIEWED would be exactly the way of making the next 3.70:1
 * label quiet that this check's remedy tells a reader not to take. That is why
 * its row declares `command: null`, and why the absent-record message it
 * inherits says "record it by hand, with a reason per entry".
 */
const gate = (repoRoot, set) => openRatchet({ file: BASELINE, set, repoRoot });

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { values, themes, side } = inputs(repoRoot);
  const contrast = gate(repoRoot, 'contrast');
  if (contrast.absent) return contrast.failures(side.contrast).map(({ message }) => ({ message }));
  const duplicates = gate(repoRoot, 'duplicates');

  // Presence-only sets, so every failure is NEW and the other direction that
  // matters is `stale()`.
  const verdict = (ratchet, found) => ({
    fresh: ratchet.failures(found).map((f) => f.key),
    stale: ratchet.stale(found).map((s) => s.key),
  });

  const found = findings(themes, values, {
    contrast: verdict(contrast, side.contrast),
    duplicates: verdict(duplicates, side.duplicates),
  }).map((message) => ({ message }));

  /*
   * A RECORDED ENTRY WITH NO REASON. Both findings here are somebody else's
   * open colour-token decision, and the `notes` entry is the whole of what makes
   * recording one honest rather than a way of turning the check off. An entry
   * with no note is a number nobody can argue with.
   */
  for (const { key } of [...contrast.unreviewed(), ...duplicates.unreviewed()]) {
    found.push({
      message:
        `baseline entry "${key}" carries no reason in \`notes\`. Say which decision owns it ` +
        'and who — an entry nobody argued for is a finding made quiet.',
    });
  }
  return found;
}

/** The green line, and the margin the next change has to beat. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { rows, themes } = inputs(repoRoot);
  const contrast = gate(repoRoot, 'contrast');
  const baselined = contrast.entries.size + gate(repoRoot, 'duplicates').entries.size;

  /*
   * The tightest combination that is NOT baselined — the margin the next change
   * has to beat. Including the baselined ones would print `warning/filled at 3.7`
   * under a line saying everything clears 4.5, which is a green check reporting a
   * red number.
   */
  const worst = rows
    .filter((row) => row.ratio !== null && !contrast.entries.has(`${row.style}/${row.fill}`))
    .sort((a, b) => a.ratio - b.ratio)[0];

  return (
    `${rows.length} combinations from ${themes.length} styles; ` +
    `every label clears ${AA_TEXT}:1 and every style renders its own ground ` +
    `(${baselined} baselined)\n` +
    `  tightest unbaselined: ${worst.style}/${worst.fill} at ${worst.ratio}:1`
  );
}

main(import.meta.url, 'check:button-contrast', { run, summary, remedy: REMEDY });
