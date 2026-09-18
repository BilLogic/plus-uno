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
 * reported, so a fix cannot be made and the entry quietly left behind. Both
 * directions, the stale sweep and the empty-reason sweep are
 * `scripts/lib/ratchet.mjs` (#601); the record declares TWO sets and keeps one
 * `notes` map beside them, so each set is opened by name and its reasons come
 * out of that map. There is no `--update`: an entry here is a #268 decision and
 * the note is the decision, so the record is written by hand.
 *
 * Run: `npm run check:button-contrast`.
 */
import { AA_TEXT, findings, readRepo, sweep } from './button-contrast.mjs';
import { REPO_ROOT } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';

/**
 * The record, named here because this is the check that reads it — and because
 * it is the key its shape is declared under in `scripts/lib/ratchet-shapes.mjs`
 * and the path `scripts/checks.registry.mjs` declares for this row. One
 * spelling, three readers.
 */
const BASELINE = 'docs/evals/button-contrast-baseline.json';

export const REMEDY =
  '  -> A label under 4.5:1, or two styles that render the same ground. If the\n' +
  `     decision is not yours to make, record it in ${BASELINE}\n` +
  '     with the issue that owns it — and never as a way to make a new one quiet.';

// The token values and the theme map are the same read for both questions, so
// the sweep over them happens once per root.
const inputs = byRoot((repoRoot) => {
  const { values, themes } = readRepo(repoRoot);
  return { values, themes, rows: sweep(themes, values) };
});

/**
 * The record's two sets, by name. Opened per call rather than memoised, and
 * SEPARATELY, because one `notes` map sits beside both: the module keys each
 * entry's reason out of that map for the set it was asked for, which is what
 * keeps the other set's reasons out of it.
 */
const records = (repoRoot) => ({
  contrast: openRatchet({ file: BASELINE, set: 'contrast', repoRoot }),
  duplicates: openRatchet({ file: BASELINE, set: 'duplicates', repoRoot }),
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { values, themes } = inputs(repoRoot);
  const opened = records(repoRoot);
  const found = findings(themes, values, opened).map((message) => ({ message }));

  /*
   * An entry with no argument beside it is a finding of its own, and nothing
   * about the counts is wrong — so it is reported separately, the way
   * `check:text-contrast` reports it. This record is maintained by hand and both
   * of its notes are #268 decisions; an entry someone adds without one is an
   * exemption nobody can argue with. The reasons live in the sibling `notes`
   * map, so both sets are asked.
   */
  for (const [set, ratchet] of Object.entries(opened)) {
    for (const { key } of ratchet.unreviewed()) {
      found.push({
        message:
          `baseline entry "${key}" (${set}) has no reason in \`notes\`. ` +
          'Say which token decision owns it, with the issue that owns that.',
      });
    }
  }
  return found;
}

/** The green line, and the margin the next change has to beat. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { rows, themes } = inputs(repoRoot);
  const opened = records(repoRoot);

  /*
   * The tightest combination that is NOT baselined — the margin the next change
   * has to beat. Including the baselined ones would print `warning/filled at 3.7`
   * under a line saying everything clears 4.5, which is a green check reporting a
   * red number.
   */
  const worst = rows
    .filter((row) => row.ratio !== null && !opened.contrast.entries.has(`${row.style}/${row.fill}`))
    .sort((a, b) => a.ratio - b.ratio)[0];

  return (
    `${rows.length} combinations from ${themes.length} styles; ` +
    `every label clears ${AA_TEXT}:1 and every style renders its own ground ` +
    `(${opened.contrast.entries.size + opened.duplicates.entries.size} baselined)\n` +
    `  tightest unbaselined: ${worst.style}/${worst.fill} at ${worst.ratio}:1`
  );
}

main(import.meta.url, 'check:button-contrast', { run, summary, remedy: REMEDY });
