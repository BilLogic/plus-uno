#!/usr/bin/env node
/**
 * `npm run check:figma-snapshots` — the two Figma snapshots still describe the
 * library, or say plainly that they do not.
 *
 * See `scripts/figma-snapshots.mjs` for what they are and what #339 measured.
 * In short: both are read by something that decides, neither had anything
 * watching its date, and on 2026-08-29 the variables snapshot was five weeks
 * behind a library that had gained seven variables it had never seen.
 *
 * Run: `npm run check:figma-snapshots`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ages, failures } from './figma-snapshots.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const VARIABLES = 'scripts/figma-variables-snapshot.json';
const COMPONENTS = 'scripts/figma-component-snapshot.json';

/**
 * Half a year. Generous on purpose: a gate that fires as a chore is a gate
 * somebody switches off, and the age is printed on every run so the number is
 * visible long before it is reached. Raise it only with a reason, and never to
 * get past a run that has already gone red.
 */
const MAX_AGE_DAYS = 180;

/**
 * Floors, measured 2026-08-29. A snapshot that shrank without anyone deciding
 * to shrink it is the failure this pairs with the date: an old snapshot agrees
 * with everything, and so does an empty one.
 */
const MIN_VARIABLES = 341;
const MIN_COMPONENTS = 1311;

/** The library both snapshots are of. */
const FILE_KEY = 'zAecJNRdvJzAUOcjV32tRX';

const read = (p) => JSON.parse(fs.readFileSync(path.join(REPO_ROOT, p), 'utf8'));
const files = { variables: read(VARIABLES), components: read(COMPONENTS) };
const now = new Date();

const found = failures(files, {
  now,
  fileKey: FILE_KEY,
  maxAgeDays: MAX_AGE_DAYS,
  minVariables: MIN_VARIABLES,
  minComponents: MIN_COMPONENTS,
});

const clock = ages(files, now)
  .map((a) => `${a.name} ${a.stamp ?? '(no date)'} (${a.age === null ? '?' : `${a.age}d`})`)
  .join(' · ');

if (found.length) {
  console.error(`\n[figma-snapshots] ${found.length} finding(s):`);
  for (const f of found) console.error(`  ${f}`);
  console.error(`\n${'─'.repeat(72)}`);
  console.error(`✗ check:figma-snapshots — ${clock}\n`);
  console.error(
    '  -> Neither file can be refreshed from CI; both need Figma. `npm run\n' +
      '     audit:figma-variables` prints the script for one, and\n' +
      '     `node scripts/poll-figma-library.js` refreshes the other as it polls.',
  );
  process.exit(1);
}

console.log(`✓ check:figma-snapshots — ${clock}, both under the ${MAX_AGE_DAYS}-day ceiling`);
