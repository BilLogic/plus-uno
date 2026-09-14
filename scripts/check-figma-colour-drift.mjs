#!/usr/bin/env node
/**
 * `npm run check:figma-colour-drift` — the CSS still paints what Figma says,
 * or the difference is written down and argued.
 *
 * See `scripts/figma-colour-drift.mjs` for what was unwatched: the variables
 * snapshot records every variable by NAME and by count and not one VALUE, so a
 * colour could move on either side and the names would still line up perfectly.
 * Two had, both found in the same sweep on 2026-08-29 and both listed below.
 *
 * WHY THE TWO ARE EXEMPTED RATHER THAN FIXED. Each is a decision, not a repair:
 * whichever side you change, a colour that ships today moves. They are recorded
 * with what each side says, and the ratchet is that this list may SHRINK and
 * never grow — a new divergence fails, and so does an entry that has stopped
 * diverging, because a stale exemption is how the next one gets waved through.
 *
 * Run: `npm run check:figma-colour-drift`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { cssColours, compare, failures } from './figma-colour-drift.mjs';
import { byRoot, main } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const RECORDING = 'design-system/figma/colour-values.json';

/** Half a year, matching check:figma-snapshots — this is refreshed the same way. */
const MAX_AGE_DAYS = 180;

/*
 * A recording that compares almost nothing would pass everything. This is the
 * same floor idea as check:figma-snapshots' MIN_VARIABLES, applied to the pairs
 * that actually got compared rather than to the file's length.
 */
const MIN_COMPARED = 90;

/**
 * The divergences that exist and are Bill's to resolve. Each says what both
 * sides hold, so a change on EITHER side fails rather than sliding under the
 * exemption.
 */
const KNOWN = [
  {
    token: '--color-success-container',
    figma: '#a1eb83',
    css: '#bdf292',
    why:
      'Both sides are internally consistent — the CSS state layers are built from ' +
      'rgba(189, 242, 146, …) and the Figma ones from #a1eb83 — so each looks right ' +
      'alone and only the comparison shows the split. Success containers ship in ' +
      'Badge, Alert and the lesson tables; whichever side moves, they move.',
  },
];

export const REMEDY =
  '  -> A new divergence means one side moved and nothing followed. Decide which side\n' +
  '     is right; do NOT add it to KNOWN to get the run green. KNOWN is for differences\n' +
  '     somebody has looked at and chosen to leave, each with its reason.';

/**
 * The recording, the comparison against the CSS, and how old the reading is.
 * Both halves ask the same question of the same tree, so it is read once.
 */
const inputs = byRoot((repoRoot) => {
  const recording = JSON.parse(fs.readFileSync(path.join(repoRoot, RECORDING), 'utf8'));
  const result = compare(recording, cssColours(repoRoot));
  const age = Math.floor((Date.now() - Date.parse(recording.measuredAt)) / 86400000);
  return { recording, result, age };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { result, age } = inputs(repoRoot);
  const found = failures(result, KNOWN);

  if (Number.isNaN(age)) {
    found.push(`${RECORDING} has no readable measuredAt.`);
  } else if (age > MAX_AGE_DAYS) {
    found.push(
      `${RECORDING} is ${age} days old (ceiling ${MAX_AGE_DAYS}). A colour that has not been ` +
        're-read from Figma this year cannot report drift.',
    );
  }

  if (result.compared < MIN_COMPARED) {
    found.push(
      `only ${result.compared} variables mapped to a CSS token (floor ${MIN_COMPARED}). ` +
        'Either the recording shrank or the naming convention moved under the mapping.',
    );
  }

  return found.map((message) => ({ message }));
}

/** The green line, which carries what was compared and how old the reading is. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { recording, result, age } = inputs(repoRoot);
  return (
    `${result.compared} colours compared against Figma ` +
    `(${recording.measuredAt}, ${age}d), ${KNOWN.length} known divergence(s), ` +
    `${result.unmapped.length} Figma-only`
  );
}

main(import.meta.url, 'check:figma-colour-drift', { run, summary, remedy: REMEDY });
