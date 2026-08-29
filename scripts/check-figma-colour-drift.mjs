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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const RECORDING = 'design-system/figma/colour-values.json';

/** Half a year, matching check:figma-snapshots — this is refreshed the same way. */
const MAX_AGE_DAYS = 180;

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
  {
    token: '--color-scrim',
    figma: '#000000@0.32',
    css: '#000000@0.38',
    why:
      'The CSS scrim is 19% more opaque than the designed one. It sits behind every ' +
      'Modal and Drawer, so the difference is visible on every overlay in the product ' +
      'and changing it is a look decision rather than a token repair.',
  },
];

const recording = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, RECORDING), 'utf8'));
const result = compare(recording, cssColours(REPO_ROOT));

const age = Math.floor((Date.now() - Date.parse(recording.measuredAt)) / 86400000);
const found = failures(result, KNOWN);

if (Number.isNaN(age)) {
  found.push(`${RECORDING} has no readable measuredAt.`);
} else if (age > MAX_AGE_DAYS) {
  found.push(
    `${RECORDING} is ${age} days old (ceiling ${MAX_AGE_DAYS}). A colour that has not been ` +
      're-read from Figma this year cannot report drift.',
  );
}

/*
 * A recording that compares almost nothing would pass everything. This is the
 * same floor idea as check:figma-snapshots' MIN_VARIABLES, applied to the pairs
 * that actually got compared rather than to the file's length.
 */
const MIN_COMPARED = 90;
if (result.compared < MIN_COMPARED) {
  found.push(
    `only ${result.compared} variables mapped to a CSS token (floor ${MIN_COMPARED}). ` +
      'Either the recording shrank or the naming convention moved under the mapping.',
  );
}

if (found.length) {
  console.error(`\n[figma-colour-drift] ${found.length} finding(s):`);
  for (const f of found) console.error(`  ${f}`);
  console.error(`\n${'─'.repeat(72)}`);
  console.error(`✗ check:figma-colour-drift — ${result.compared} compared, ${age}d old\n`);
  console.error(
    '  -> A new divergence means one side moved and nothing followed. Decide which side\n' +
      '     is right; do NOT add it to KNOWN to get the run green. KNOWN is for differences\n' +
      '     somebody has looked at and chosen to leave, each with its reason.',
  );
  process.exit(1);
}

console.log(
  `✓ check:figma-colour-drift — ${result.compared} colours compared against Figma ` +
    `(${recording.measuredAt}, ${age}d), ${KNOWN.length} known divergence(s), ` +
    `${result.unmapped.length} Figma-only`,
);
